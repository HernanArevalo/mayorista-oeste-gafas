"use client";

import { ShoppingBag } from "lucide-react";
import { useCart } from "@/components/shop/cart";

export function CartButton() {
  const { totalUnits, setOpen } = useCart();
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="flex h-10 items-center gap-2 border border-foreground px-3 text-sm font-medium hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      aria-label={`Abrir carrito, ${totalUnits} gafas acumuladas`}
    >
      <ShoppingBag className="h-4 w-4" />
      Carrito
      <span className="min-w-6 bg-foreground px-1.5 py-0.5 text-center text-xs tabular-nums text-background">
        {totalUnits}
      </span>
    </button>
  );
}
