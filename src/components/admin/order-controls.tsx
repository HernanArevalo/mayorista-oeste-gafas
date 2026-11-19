"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { OrderStatus } from "@prisma/client";
import { updateOrder } from "@/app/actions/admin";
import { Select } from "@/components/ui/select";

export const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDIENTE_PAGO: "Pendiente de pago",
  CONFIRMADO: "Confirmado",
  PREPARADO: "Preparado",
  ENVIADO: "Enviado",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};

export function OrderControls({ id, status, isPaid }: { id: string; status: OrderStatus; isPaid: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const apply = (patch: { status?: OrderStatus; isPaid?: boolean }) => {
    setError(null);
    startTransition(async () => {
      const res = await updateOrder(id, patch);
      if (!res.ok) setError(res.error);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      <Select
        className="h-9 w-auto"
        value={status}
        disabled={pending || status === "CANCELADO"}
        aria-label="Estado del pedido"
        onChange={(e) => {
          const next = e.target.value as OrderStatus;
          if (next === "CANCELADO" && !confirm("¿Cancelar el pedido? El stock se devuelve a los productos.")) return;
          apply({ status: next });
        }}
      >
        {(Object.keys(STATUS_LABELS) as OrderStatus[]).map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </Select>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="h-4 w-4 accent-black"
          checked={isPaid}
          disabled={pending}
          onChange={(e) => apply({ isPaid: e.target.checked })}
        />
        Pagado
      </label>
      {error && (
        <span role="alert" className="text-sm">
          {error}
        </span>
      )}
    </div>
  );
}
