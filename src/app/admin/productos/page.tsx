import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deleteProduct, toggleProductVisibility } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    include: { variants: { orderBy: { sortOrder: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Productos</h1>
        <Button asChild>
          <Link href="/admin/productos/nuevo">Nuevo producto</Link>
        </Button>
      </div>

      {products.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">Todavía no cargaste productos.</p>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {products.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-4 py-4">
              <div className="relative h-16 w-16 shrink-0 bg-muted">
                {p.images[0] && <Image src={p.images[0]} alt="" fill sizes="64px" className="object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{p.name}</p>
                <p className="text-sm text-muted-foreground">
                  {p.variants
                    .map((v) => `${v.name} · ${formatPrice(v.price)} · stock ${v.stock}${v.isVisible ? "" : " (oculta)"}`)
                    .join("  |  ")}
                </p>
              </div>
              <span className="border border-foreground px-2 py-0.5 text-xs">
                {p.isVisible ? "Visible" : "Oculto"}
              </span>
              <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/admin/productos/${p.id}`}>Editar</Link>
                </Button>
                <form action={toggleProductVisibility.bind(null, p.id)}>
                  <Button type="submit" variant="outline" size="sm">
                    {p.isVisible ? "Ocultar" : "Mostrar"}
                  </Button>
                </form>
                <form action={deleteProduct.bind(null, p.id)}>
                  <ConfirmButton
                    message={`¿Eliminar “${p.name}”? Esta acción no se puede deshacer.`}
                    className="inline-flex h-9 items-center border border-foreground px-3 text-sm font-medium hover:bg-foreground hover:text-background"
                  >
                    Eliminar
                  </ConfirmButton>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
