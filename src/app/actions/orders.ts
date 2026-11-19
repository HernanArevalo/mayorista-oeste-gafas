"use server";

import { randomInt } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  PICKUP_ADDRESS,
  PROVINCES,
  deliveryOptions,
  isCordobaCapital,
  type DeliveryMethod,
} from "@/lib/delivery";
import { buildOrderMessage } from "@/lib/order-message";

export type CreateOrderInput = {
  items: { variantId: string; quantity: number }[];
  customerName: string;
  customerPhone: string;
  province: string;
  city: string;
  cordobaCapital: boolean;
  deliveryMethod: DeliveryMethod;
  address?: string;
  postalCode?: string;
  reference?: string;
};

export type CreateOrderResult =
  | { ok: true; waUrl: string; orderNumber: number; orderCode: string }
  | { ok: false; error: string };

class OrderError extends Error {}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const pick = (n: number) =>
  Array.from({ length: n }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
const genCode = () => `OG-${pick(4)}-${pick(4)}`;

export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  try {
    const name = input.customerName?.trim();
    const phone = input.customerPhone?.trim();
    const province = input.province;
    const city = input.city?.trim();

    if (!name || !phone || phone.replace(/\D/g, "").length < 8) throw new OrderError("Revisá tus datos de contacto.");
    if (!PROVINCES.includes(province) || !city) throw new OrderError("Completá provincia y localidad.");

    const capital = isCordobaCapital(province, city, input.cordobaCapital);
    const method = input.deliveryMethod;
    if (!deliveryOptions(capital).includes(method)) {
      throw new OrderError("El método de entrega no está disponible para tu ubicación.");
    }

    const needsAddress = method !== "RETIRO_LOCAL";
    const address = input.address?.trim() ?? "";
    const postalCode = input.postalCode?.trim() ?? "";
    const reference = input.reference?.trim() ?? "";
    if (needsAddress && (!address || !postalCode || !reference)) {
      throw new OrderError("Completá dirección, código postal y referencias.");
    }

    // Unifica variantes repetidas y valida cantidades
    const wanted = new Map<string, number>();
    for (const it of input.items ?? []) {
      if (!Number.isInteger(it.quantity) || it.quantity < 1 || it.quantity > 100000) {
        throw new OrderError("Cantidad inválida en el carrito.");
      }
      wanted.set(it.variantId, (wanted.get(it.variantId) ?? 0) + it.quantity);
    }
    if (wanted.size === 0) throw new OrderError("El carrito está vacío.");

    let created: Awaited<ReturnType<typeof runTransaction>> | null = null;
    for (let attempt = 0; attempt < 3 && !created; attempt++) {
      try {
        created = await runTransaction();
      } catch (e) {
        const isCodeCollision = e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
        if (!isCodeCollision || attempt === 2) throw e;
      }
    }
    if (!created) throw new OrderError("No pudimos crear el pedido. Probá de nuevo.");

    const { order, whatsappNumber } = created;
    const addressLine =
      method === "RETIRO_LOCAL"
        ? `Retiro en ${PICKUP_ADDRESS}`
        : `${address}, ${city}, ${province} (CP ${postalCode})`;

    const message = buildOrderMessage({
      orderNumber: order.orderNumber,
      orderCode: order.orderCode,
      createdAt: order.createdAt,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      subtotal: order.subtotal,
      totalUnits: order.totalUnits,
      deliveryMethod: method,
      addressLine,
      reference: reference || null,
      items: order.items,
    });

    return {
      ok: true,
      orderNumber: order.orderNumber,
      orderCode: order.orderCode,
      waUrl: `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`,
    };

    async function runTransaction() {
      return prisma.$transaction(
        async (tx) => {
          const cfg = await tx.storeConfig.upsert({
            where: { id: "singleton" },
            update: {},
            create: { id: "singleton" },
          });
          const whatsappNumber = cfg.whatsappNumber.replace(/\D/g, "");
          if (!whatsappNumber) throw new OrderError("La tienda todavía no configuró su WhatsApp. Escribinos por otro medio.");

          const variants = await tx.productVariant.findMany({
            where: { id: { in: [...wanted.keys()] }, isVisible: true, product: { isVisible: true } },
            include: { product: true },
          });
          if (variants.length !== wanted.size) {
            throw new OrderError("Algún producto de tu carrito ya no está disponible. Actualizá el carrito.");
          }

          let subtotal = 0;
          let totalUnits = 0;
          const items = variants.map((v) => {
            const quantity = wanted.get(v.id)!;
            const lineSubtotal = v.price * quantity;
            subtotal += lineSubtotal;
            totalUnits += quantity * v.unitsPerPack;
            return {
              productId: v.productId,
              variantId: v.id,
              productName: v.product.name,
              variantName: v.name,
              quantity,
              unitsPerPack: v.unitsPerPack,
              unitPrice: v.price,
              subtotal: lineSubtotal,
            };
          });

          if (totalUnits < cfg.minUnits) {
            throw new OrderError(`El pedido mínimo es de ${cfg.minUnits} gafas.`);
          }

          // Descuenta stock validando que siga habiendo
          for (const it of items) {
            const res = await tx.productVariant.updateMany({
              where: { id: it.variantId, stock: { gte: it.quantity } },
              data: { stock: { decrement: it.quantity } },
            });
            if (res.count === 0) {
              throw new OrderError(`No hay stock suficiente de ${it.productName} (${it.variantName}).`);
            }
          }

          const order = await tx.order.create({
            data: {
              orderCode: genCode(),
              customerName: name,
              customerPhone: phone,
              province,
              city,
              address: needsAddress ? address : null,
              postalCode: needsAddress ? postalCode : null,
              reference: needsAddress ? reference : null,
              deliveryMethod: method,
              subtotal,
              totalUnits,
              items: { create: items },
            },
            include: { items: true },
          });
          return { order, whatsappNumber };
        },
        { timeout: 15000 }
      );
    }
  } catch (e) {
    if (e instanceof OrderError) return { ok: false, error: e.message };
    console.error("createOrder", e);
    return { ok: false, error: "No pudimos crear el pedido. Probá de nuevo en unos minutos." };
  }
}
