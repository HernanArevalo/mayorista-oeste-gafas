import { ProductForm } from "@/components/admin/product-form";

export default function NewProductPage() {
  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold">Nuevo producto</h1>
      <ProductForm />
    </div>
  );
}
