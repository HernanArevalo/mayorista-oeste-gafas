"use client";

import { useState } from "react";
import Image from "next/image";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatPrice } from "@/lib/utils";
import { useCart } from "@/components/shop/cart";

export type CatalogProduct = {
  id: string;
  name: string;
  description: string | null;
  images: string[];
  variants: { id: string; name: string; price: number; stock: number; unitsPerPack: number }[];
};

export function ProductCard({ product }: { product: CatalogProduct }) {
  const { add, qtyInCart } = useCart();
  const initial = product.variants.find((v) => v.stock > 0) ?? product.variants[0];
  const [variantId, setVariantId] = useState(initial.id);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const variant = product.variants.find((v) => v.id === variantId) ?? initial;
  const available = Math.max(0, variant.stock - qtyInCart(variant.id));
  const q = Math.min(Math.max(1, qty), Math.max(1, available));
  const soldOut = variant.stock === 0;

  const handleAdd = () => {
    add(
      {
        variantId: variant.id,
        productId: product.id,
        productName: product.name,
        variantName: variant.name,
        image: product.images[0] ?? "",
        price: variant.price,
        unitsPerPack: variant.unitsPerPack,
        stock: variant.stock,
      },
      q
    );
    setQty(1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <article className="group flex flex-col">
      <div className="relative aspect-square overflow-hidden bg-muted">
        {product.images[0] && (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="(min-width:1280px) 25vw, (min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
            className="object-cover"
          />
        )}
        {product.images[1] && (
          <Image
            src={product.images[1]}
            alt=""
            aria-hidden
            fill
            sizes="(min-width:1280px) 25vw, (min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
            className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100 motion-reduce:transition-none"
          />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 pt-4">
        <div>
          <h2 className="text-base font-semibold leading-tight">{product.name}</h2>
          {product.description && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
          )}
        </div>

        {product.variants.length > 1 && (
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={`Variantes de ${product.name}`}>
            {product.variants.map((v) => {
              const out = v.stock === 0;
              const selected = v.id === variant.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => {
                    setVariantId(v.id);
                    setQty(1);
                  }}
                  className={cn(
                    "border px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    selected ? "border-foreground bg-foreground text-background" : "border-input hover:border-foreground",
                    out && !selected && "text-neutral-400"
                  )}
                >
                  {v.name}
                  {out && <span className="ml-1.5 text-xs">Sin stock</span>}
                </button>
              );
            })}
          </div>
        )}

        <div>
          <p className="text-xl font-semibold tabular-nums">{formatPrice(variant.price)}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {variant.unitsPerPack > 1 && <span>Incluye {variant.unitsPerPack} gafas. </span>}
            {soldOut ? "Sin stock" : `${variant.stock} disponibles`}
          </p>
        </div>

        <div className="mt-auto flex gap-2">
          <div className="flex h-11 items-center border border-input">
            <button
              type="button"
              aria-label="Restar una unidad"
              disabled={soldOut || q <= 1}
              onClick={() => setQty(q - 1)}
              className="flex h-full w-9 items-center justify-center hover:bg-muted disabled:opacity-30"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-8 text-center text-sm tabular-nums" aria-live="polite">
              {q}
            </span>
            <button
              type="button"
              aria-label="Sumar una unidad"
              disabled={soldOut || q >= available}
              onClick={() => setQty(q + 1)}
              className="flex h-full w-9 items-center justify-center hover:bg-muted disabled:opacity-30"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <Button className="flex-1" disabled={soldOut || available <= 0} onClick={handleAdd}>
            {soldOut ? "Sin stock" : available <= 0 ? "Todo el stock en el carrito" : added ? "Agregado" : "Agregar al carrito"}
          </Button>
        </div>
      </div>
    </article>
  );
}
