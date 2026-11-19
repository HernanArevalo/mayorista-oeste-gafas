import { DELIVERY_SHORT_LABEL, type DeliveryMethod } from "@/lib/delivery";
import { formatPrice } from "@/lib/utils";

function formatArDate(d: Date) {
  const parts = new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Cordoba",
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  const hour = get("hour") === "24" ? "00" : get("hour");
  return `${get("day")}/${get("month")}/${get("year")} - ${hour}:${get("minute")}`;
}

export type OrderMessageInput = {
  orderNumber: number;
  orderCode: string;
  createdAt: Date;
  customerName: string;
  customerPhone: string;
  subtotal: number;
  totalUnits: number;
  deliveryMethod: DeliveryMethod;
  addressLine: string;
  reference?: string | null;
  items: { quantity: number; productName: string; variantName: string; unitsPerPack: number; subtotal: number }[];
};

export function buildOrderMessage(o: OrderMessageInput) {
  const items = o.items
    .map((i) => {
      let line = `${i.quantity}x ${i.productName} (${i.variantName}): ${formatPrice(i.subtotal)}`;
      if (i.unitsPerPack > 1) line += `\n- Incluye ${i.quantity * i.unitsPerPack} gafas`;
      return line;
    })
    .join("\n");

  return [
    "¡Hola! Te paso el resumen de mi pedido",
    "",
    `Pedido: #${o.orderNumber} / ${o.orderCode}`,
    "Tienda: mayorista.oestegafas.com.ar",
    `Fecha: ${formatArDate(o.createdAt)}hs`,
    `Nombre: ${o.customerName}`,
    `Teléfono: ${o.customerPhone}`,
    "",
    "Forma de pago: Transferencia bancaria",
    `Total productos: ${formatPrice(o.subtotal)}`,
    "",
    `Entrega: ${DELIVERY_SHORT_LABEL[o.deliveryMethod]}`,
    `Dirección: ${o.addressLine}`,
    `Referencia: ${o.reference?.trim() ? o.reference.trim() : "-"}`,
    "",
    "Mi pedido es",
    "",
    items,
    "",
    `Unidades totales: ${o.totalUnits} gafas`,
    "Envío: A coordinar por WhatsApp",
    `TOTAL PRODUCTOS: ${formatPrice(o.subtotal)}`,
    "",
    "Espero tu respuesta para confirmar mi pedido y coordinar el pago/envío",
  ].join("\n");
}
