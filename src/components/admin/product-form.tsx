"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Plus, Trash2, X } from "lucide-react";
import { saveProduct } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type VariantState = {
  id?: string;
  name: string;
  price: string;
  stock: string;
  unitsPerPack: string;
  isVisible: boolean;
};

export type ProductFormProps = {
  product?: {
    id: string;
    name: string;
    description: string | null;
    images: string[];
    isVisible: boolean;
    variants: { id: string; name: string; price: number; stock: number; unitsPerPack: number; isVisible: boolean }[];
  };
};

const EMPTY_VARIANT: VariantState = { name: "Único", price: "", stock: "0", unitsPerPack: "1", isVisible: true };

async function uploadToCloudinary(file: File): Promise<string> {
  const sigRes = await fetch("/api/cloudinary/sign", { method: "POST" });
  if (!sigRes.ok) throw new Error("No se pudo firmar la subida.");
  const sig = await sigRes.json();
  const body = new FormData();
  body.append("file", file);
  body.append("api_key", sig.apiKey);
  body.append("timestamp", String(sig.timestamp));
  body.append("signature", sig.signature);
  body.append("folder", sig.folder);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, { method: "POST", body });
  const json = await res.json();
  if (!res.ok || !json.secure_url) throw new Error(json?.error?.message ?? "Falló la subida a Cloudinary.");
  return json.secure_url as string;
}

export function ProductForm({ product }: ProductFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [isVisible, setIsVisible] = useState(product?.isVisible ?? true);
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [variants, setVariants] = useState<VariantState[]>(
    product?.variants.map((v) => ({
      id: v.id,
      name: v.name,
      price: String(v.price),
      stock: String(v.stock),
      unitsPerPack: String(v.unitsPerPack),
      isVisible: v.isVisible,
    })) ?? [{ ...EMPTY_VARIANT }]
  );

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setError(null);
    try {
      const urls: string[] = [];
      for (const f of Array.from(files)) urls.push(await uploadToCloudinary(f));
      setImages((prev) => [...prev, ...urls]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falló la subida.");
    } finally {
      setUploading(false);
    }
  };

  const moveImage = (i: number, dir: -1 | 1) =>
    setImages((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const updateVariant = (i: number, patch: Partial<VariantState>) =>
    setVariants((prev) => prev.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const res = await saveProduct({
        id: product?.id,
        name,
        description,
        images,
        isVisible,
        variants: variants.map((v) => ({
          id: v.id,
          name: v.name,
          price: Number(v.price),
          stock: Number(v.stock),
          unitsPerPack: Number(v.unitsPerPack),
          isVisible: v.isVisible,
        })),
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push("/admin/productos");
      router.refresh();
    });
  };

  return (
    <div className="grid max-w-3xl gap-8">
      <div className="grid gap-4">
        <label className="grid gap-1.5 text-sm font-medium">
          Nombre del modelo
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ovaladas 2" />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Descripción (opcional)
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="border border-input bg-background p-3 text-sm focus-visible:border-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4 accent-black"
            checked={isVisible}
            onChange={(e) => setIsVisible(e.target.checked)}
          />
          Visible en la tienda
        </label>
      </div>

      <section className="grid gap-3">
        <div>
          <h2 className="text-base font-semibold">Imágenes</h2>
          <p className="text-sm text-muted-foreground">
            Mínimo 2. La primera se ve por defecto y la segunda aparece al pasar el cursor.
          </p>
        </div>
        {images.length > 0 && (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {images.map((url, i) => (
              <li key={url} className="grid gap-1">
                <div className="relative aspect-square bg-muted">
                  <Image src={url} alt={`Imagen ${i + 1}`} fill sizes="160px" className="object-cover" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {i === 0 ? "Principal" : i === 1 ? "Hover" : `Extra ${i + 1}`}
                  </span>
                  <div className="flex">
                    <button type="button" aria-label="Mover a la izquierda" disabled={i === 0} onClick={() => moveImage(i, -1)} className="p-1 hover:bg-muted disabled:opacity-30">
                      <ArrowLeft className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" aria-label="Mover a la derecha" disabled={i === images.length - 1} onClick={() => moveImage(i, 1)} className="p-1 hover:bg-muted disabled:opacity-30">
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" aria-label="Quitar imagen" onClick={() => setImages((p) => p.filter((_, idx) => idx !== i))} className="p-1 hover:bg-muted">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        <label className="inline-flex h-11 w-fit cursor-pointer items-center border border-foreground px-5 text-sm font-medium hover:bg-foreground hover:text-background">
          {uploading ? "Subiendo…" : "Subir imágenes"}
          <input
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            disabled={uploading}
            onChange={(e) => {
              onFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      </section>

      <section className="grid gap-3">
        <div>
          <h2 className="text-base font-semibold">Variantes</h2>
          <p className="text-sm text-muted-foreground">
            “Gafas por unidad” indica cuántas gafas físicas aporta una unidad (ej. un PACK de 6 = 6) y se usa para el
            mínimo mayorista.
          </p>
        </div>
        <div className="grid gap-3">
          {variants.map((v, i) => (
            <div key={v.id ?? i} className="grid gap-3 border border-border p-4 sm:grid-cols-[1.5fr_1fr_1fr_1fr_auto]">
              <label className="grid gap-1 text-xs font-medium">
                Nombre
                <Input value={v.name} onChange={(e) => updateVariant(i, { name: e.target.value })} />
              </label>
              <label className="grid gap-1 text-xs font-medium">
                Precio ($)
                <Input type="number" min={0} step="any" value={v.price} onChange={(e) => updateVariant(i, { price: e.target.value })} />
              </label>
              <label className="grid gap-1 text-xs font-medium">
                Stock
                <Input type="number" min={0} step={1} value={v.stock} onChange={(e) => updateVariant(i, { stock: e.target.value })} />
              </label>
              <label className="grid gap-1 text-xs font-medium">
                Gafas por unidad
                <Input type="number" min={1} step={1} value={v.unitsPerPack} onChange={(e) => updateVariant(i, { unitsPerPack: e.target.value })} />
              </label>
              <div className="flex items-end gap-3 pb-2.5">
                <label className="flex items-center gap-1.5 text-xs">
                  <input type="checkbox" className="h-4 w-4 accent-black" checked={v.isVisible} onChange={(e) => updateVariant(i, { isVisible: e.target.checked })} />
                  Visible
                </label>
                <button
                  type="button"
                  aria-label="Quitar variante"
                  disabled={variants.length === 1}
                  onClick={() => setVariants((p) => p.filter((_, idx) => idx !== i))}
                  className="p-1 hover:bg-muted disabled:opacity-30"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" className="w-fit" onClick={() => setVariants((p) => [...p, { ...EMPTY_VARIANT, name: "" }])}>
          <Plus className="h-4 w-4" /> Agregar variante
        </Button>
      </section>

      {error && (
        <p role="alert" className="border border-foreground p-3 text-sm">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="button" disabled={pending || uploading} onClick={submit}>
          {pending ? "Guardando…" : "Guardar producto"}
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/productos">Cancelar</Link>
        </Button>
      </div>
    </div>
  );
}
