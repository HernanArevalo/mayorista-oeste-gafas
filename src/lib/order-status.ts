import type { OrderStatus } from "@prisma/client";

export const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDIENTE_PAGO: "Pendiente de pago",
  CONFIRMADO: "Confirmado",
  PREPARADO: "Preparado",
  ENVIADO: "Enviado",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};