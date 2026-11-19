"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

type Result = { ok: true } | { ok: false; error: string };
const fail = (error: string): Result => ({ ok: false, error });

export type ProductInput = {
  id?: string;
  name: string;
  description: string;
  images: string[];
  isVisible: boolean;
  variants: {
    id?: string;
    name: string;
    price: number;
    stock: number;
    unitsPerPack: number;
    isVisible: boolean;
  }[];
};

export async function saveProduct(input: ProductInput): Promise<Result> {
  try {
    await requireAdmin();
  } catch {
    return fail("No autorizado.");
  }

  const name = input.name.trim();
  const images = input.images.filter(Boolean);
  if (!name) return fail("Ingresá el nombre del modelo.");
  if (images.length < 2 || images.some((u) => !u.startsWith("https://res.cloudinary.com/"))) {
    return fail("Subí al menos 2 imágenes (la segunda se muestra al pasar el cursor).");
  }
  if (input.variants.length === 0) return fail("Agregá al menos una variante.");
  for (const v of input.variants) {
    if (!v.name.trim()) return fail("Todas las variantes necesitan un nombre.");
    if (!Number.isFinite(v.price) || v.price < 0) return fail(`Precio inválido en la variante “${v.name}”.`);
    if (!Number.isInteger(v.stock) || v.stock < 0) return fail(`Stock inválido en la variante “${v.name}”.`);
    if (!Number.isInteger(v.unitsPerPack) || v.unitsPerPack < 1) {
      return fail(`“Gafas por unidad” debe ser 1 o más en la variante “${v.name}”.`);
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      let productId: string;
      const data = { name, description: input.description.trim() || null, images, isVisible: input.isVisible };
      if (input.id) {
        await tx.product.update({ where: { id: input.id }, data });
        productId = input.id;
      } else {
        productId = (await tx.product.create({ data })).id;
      }

      const keep = input.variants.filter((v) => v.id).map((v) => v.id as string);
      await tx.productVariant.deleteMany({ where: { productId, id: { notIn: keep } } });

      for (let i = 0; i < input.variants.length; i++) {
        const v = input.variants[i];
        const vData = {
          name: v.name.trim(),
          price: v.price,
          stock: v.stock,
          unitsPerPack: v.unitsPerPack,
          isVisible: v.isVisible,
          sortOrder: i,
        };
        if (v.id) await tx.productVariant.updateMany({ where: { id: v.id, productId }, data: vData });
        else await tx.productVariant.create({ data: { ...vData, productId } });
      }
    });
  } catch (e) {
    console.error("saveProduct", e);
    return fail("No se pudo guardar el producto.");
  }

  revalidatePath("/");
  revalidatePath("/admin/productos");
  return { ok: true };
}

export async function toggleProductVisibility(id: string) {
  await requireAdmin();
  const p = await prisma.product.findUnique({ where: { id }, select: { isVisible: true } });
  if (!p) return;
  await prisma.product.update({ where: { id }, data: { isVisible: !p.isVisible } });
  revalidatePath("/");
  revalidatePath("/admin/productos");
}

export async function deleteProduct(id: string) {
  await requireAdmin();
  await prisma.product.delete({ where: { id } }).catch(() => null);
  revalidatePath("/");
  revalidatePath("/admin/productos");
}

export async function updateOrder(
  id: string,
  patch: { status?: OrderStatus; isPaid?: boolean }
): Promise<Result> {
  try {
    await requireAdmin();
  } catch {
    return fail("No autorizado.");
  }

  try {
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id }, include: { items: true } });
      if (!order) throw new Error("Pedido no encontrado.");

      if (patch.status && patch.status !== order.status) {
        if (order.status === "CANCELADO") throw new Error("Un pedido cancelado no se puede reabrir.");
        if (patch.status === "CANCELADO") {
          // devuelve el stock descontado al crear el pedido
          for (const it of order.items) {
            await tx.productVariant.updateMany({
              where: { id: it.variantId },
              data: { stock: { increment: it.quantity } },
            });
          }
        }
      }

      await tx.order.update({
        where: { id },
        data: {
          ...(patch.status ? { status: patch.status } : {}),
          ...(patch.isPaid !== undefined ? { isPaid: patch.isPaid } : {}),
        },
      });
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "No se pudo actualizar el pedido.");
  }

  revalidatePath("/");
  revalidatePath("/admin/pedidos");
  return { ok: true };
}

export async function saveConfig(formData: FormData) {
  await requireAdmin();
  const text = (k: string) => String(formData.get(k) ?? "").trim();
  const minUnits = Math.max(1, Math.floor(Number(formData.get("minUnits")) || 10));

  const data = {
    minUnits,
    whatsappNumber: text("whatsappNumber").replace(/\D/g, ""),
    bankHolder: text("bankHolder"),
    bankName: text("bankName"),
    bankCbu: text("bankCbu").replace(/\s/g, ""),
    bankAlias: text("bankAlias"),
  };
  await prisma.storeConfig.upsert({
    where: { id: "singleton" },
    update: data,
    create: { id: "singleton", ...data },
  });

  revalidatePath("/", "layout");
  redirect("/admin/configuracion?saved=1");
}
