import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/product-form";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: { variants: { orderBy: { sortOrder: "asc" } } },
  });
  if (!product) notFound();

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold">Editar {product.name}</h1>
      <ProductForm
        product={{
          id: product.id,
          name: product.name,
          description: product.description,
          images: product.images,
          isVisible: product.isVisible,
          variants: product.variants.map((v) => ({
            id: v.id,
            name: v.name,
            price: v.price,
            stock: v.stock,
            unitsPerPack: v.unitsPerPack,
            isVisible: v.isVisible,
          })),
        }}
      />
    </div>
  );
}
