import { getStoreConfig } from "@/lib/config";
import { ShopProviders } from "@/components/shop/shop-providers";
import { CartButton } from "@/components/shop/cart-button";
import { AdminLink } from "@/components/shop/admin-link";
import { PICKUP_ADDRESS } from "@/lib/delivery";

export const dynamic = "force-dynamic";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const cfg = await getStoreConfig();

  return (
    <ShopProviders
      minUnits={cfg.minUnits}
      bank={{
        bankHolder: cfg.bankHolder,
        bankName: cfg.bankName,
        bankCbu: cfg.bankCbu,
        bankAlias: cfg.bankAlias,
      }}
    >
      <div className="flex min-h-screen flex-col">
        <div className="sticky top-0 z-40">
          <div className="bg-black px-4 py-2 text-center text-xs font-medium tracking-wide text-white">
            OESTE GAFAS MAYORISTA — Compra mínima: {cfg.minUnits} unidades
          </div>
          <header className="border-b border-foreground bg-background">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
              <div className="flex items-center gap-3">
                <span className="text-lg font-semibold tracking-[0.2em]">OESTE GAFAS</span>
                <span className="border border-foreground px-2 py-0.5 text-[11px] font-medium tracking-[0.18em]">
                  MAYORISTA
                </span>
              </div>
              <CartButton />
            </div>
          </header>
        </div>

        <main className="flex-1">{children}</main>

        <footer className="mt-20 border-t border-foreground">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 text-sm sm:grid-cols-3 sm:px-6">
            <p className="font-semibold">Oeste Gafas Mayorista</p>
            <ul className="grid gap-1 text-muted-foreground">
              <li>Compra mínima de {cfg.minUnits} unidades</li>
              <li>Pago por transferencia bancaria</li>
            </ul>
            <ul className="grid gap-1 text-muted-foreground">
              <li>Retiro a coordinar en {PICKUP_ADDRESS}</li>
              <li>Envíos a todo el país por Correo Argentino</li>
            </ul>
          </div>
          <div className="border-t border-border">
            <div className="mx-auto flex max-w-7xl justify-end px-4 py-4 sm:px-6">
              <AdminLink />
            </div>
          </div>
        </footer>
      </div>
    </ShopProviders>
  );
}
