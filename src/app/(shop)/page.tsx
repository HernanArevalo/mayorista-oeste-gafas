import { prisma } from "@/lib/prisma";
import { Catalog } from "@/components/shop/catalog";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const products = await prisma.product.findMany({
    where: { isVisible: true, variants: { some: { isVisible: true } } },
    include: { variants: { where: { isVisible: true }, orderBy: { sortOrder: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  const data = products.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    images: p.images,
    variants: p.variants.map((v) => ({
      id: v.id,
      name: v.name,
      price: v.price,
      stock: v.stock,
      unitsPerPack: v.unitsPerPack,
    })),
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="sr-only">Catálogo mayorista de gafas</h1>
      <Catalog products={data} />
    </div>
  );
}
