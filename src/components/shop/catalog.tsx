"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { normalizeText } from "@/lib/utils";
import { ProductCard, type CatalogProduct } from "@/components/shop/product-card";

export function Catalog({ products }: { products: CatalogProduct[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = normalizeText(query);
    return q ? products.filter((p) => normalizeText(p.name).includes(q)) : products;
  }, [products, query]);

  return (
    <div>
      <div className="relative border-b border-foreground">
        <Search className="pointer-events-none absolute left-0 top-1/2 h-5 w-5 -translate-y-1/2" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar modelo"
          aria-label="Buscar modelo por nombre"
          className="h-14 w-full bg-transparent pl-8 text-lg placeholder:text-neutral-400 focus-visible:outline-none"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="py-20 text-center text-muted-foreground">
          {products.length === 0
            ? "Todavía no hay modelos publicados."
            : `No hay modelos que coincidan con “${query}”. Probá con otro nombre.`}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-x-6 gap-y-14 pt-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
