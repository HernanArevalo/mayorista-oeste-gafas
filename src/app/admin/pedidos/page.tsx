import { prisma } from "@/lib/prisma";
import { OrderControls } from "@/components/admin/order-controls";
import { STATUS_LABELS } from "@/lib/order-status";
import { DELIVERY_SHORT_LABEL } from "@/lib/delivery";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Argentina/Cordoba",
});

export default async function OrdersPage() {
  const orders = await prisma.order.findMany({
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold">Pedidos</h1>

      {orders.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">Todavía no hay pedidos.</p>
      ) : (
        <ul className="grid gap-4">
          {orders.map((o) => (
            <li key={o.id} className="border border-border">
              <details>
                <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3 p-4">
                  <span className="font-semibold">
                    #{o.orderNumber} <span className="font-normal text-muted-foreground">{o.orderCode}</span>
                  </span>
                  <span className="text-sm">{o.customerName}</span>
                  <span className="text-sm text-muted-foreground">{dateFmt.format(o.createdAt)}</span>
                  <span className="text-sm tabular-nums">{formatPrice(o.subtotal)}</span>
                  <span className="border border-foreground px-2 py-0.5 text-xs">{STATUS_LABELS[o.status]}</span>
                  <span className="text-xs">{o.isPaid ? "Pagado" : "Sin pagar"}</span>
                </summary>

                <div className="grid gap-5 border-t border-border p-4 text-sm">
                  <OrderControls id={o.id} status={o.status} isPaid={o.isPaid} />

                  <div className="grid gap-1">
                    <p>
                      <span className="text-muted-foreground">Teléfono: </span>
                      <a
                        className="underline"
                        href={`https://wa.me/${o.customerPhone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {o.customerPhone}
                      </a>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Entrega: </span>
                      {DELIVERY_SHORT_LABEL[o.deliveryMethod]}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Destino: </span>
                      {[o.address, o.city, o.province, o.postalCode && `CP ${o.postalCode}`].filter(Boolean).join(", ")}
                    </p>
                    {o.reference && (
                      <p>
                        <span className="text-muted-foreground">Referencia: </span>
                        {o.reference}
                      </p>
                    )}
                  </div>

                  <table className="w-full text-left">
                    <thead className="border-b border-border text-xs text-muted-foreground">
                      <tr>
                        <th className="py-2 font-medium">Producto</th>
                        <th className="py-2 font-medium">Cant.</th>
                        <th className="py-2 font-medium">Gafas</th>
                        <th className="py-2 text-right font-medium">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {o.items.map((i) => (
                        <tr key={i.id} className="border-b border-border">
                          <td className="py-2">
                            {i.productName} <span className="text-muted-foreground">({i.variantName})</span>
                          </td>
                          <td className="py-2 tabular-nums">{i.quantity}</td>
                          <td className="py-2 tabular-nums">{i.quantity * i.unitsPerPack}</td>
                          <td className="py-2 text-right tabular-nums">{formatPrice(i.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td className="pt-3 font-semibold">Total productos</td>
                        <td />
                        <td className="pt-3 font-semibold tabular-nums">{o.totalUnits}</td>
                        <td className="pt-3 text-right font-semibold tabular-nums">{formatPrice(o.subtotal)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
