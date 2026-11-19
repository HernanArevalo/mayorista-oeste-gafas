"use client";

import { CartProvider } from "@/components/shop/cart";
import { CartDrawer, type BankInfo } from "@/components/shop/cart-drawer";

export function ShopProviders({
  minUnits,
  bank,
  children,
}: {
  minUnits: number;
  bank: BankInfo;
  children: React.ReactNode;
}) {
  return (
    <CartProvider minUnits={minUnits}>
      {children}
      <CartDrawer bank={bank} />
    </CartProvider>
  );
}
