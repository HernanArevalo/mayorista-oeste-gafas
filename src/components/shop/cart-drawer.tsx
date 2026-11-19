"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { ArrowLeft, Minus, Plus, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CopyButton } from "@/components/shop/copy-button";
import { useCart } from "@/components/shop/cart";
import { createOrder } from "@/app/actions/orders";
import { PROVINCES, deliveryOptionLabel, deliveryOptions, isCordobaCapital, type DeliveryMethod } from "@/lib/delivery";
import { formatPrice } from "@/lib/utils";

export type BankInfo = { bankHolder: string; bankName: string; bankCbu: string; bankAlias: string };

type Form = {
  name: string;
  phone: string;
  province: string;
  city: string;
  cordobaCapital: boolean;
  delivery: DeliveryMethod;
  address: string;
  postalCode: string;
  reference: string;
};

const INITIAL: Form = {
  name: "",
  phone: "",
  province: "",
  city: "",
  cordobaCapital: false,
  delivery: "CORREO_ARGENTINO",
  address: "",
  postalCode: "",
  reference: "",
};

const STEP_TITLES = ["Datos de contacto", "Método de entrega", "Pago por transferencia"];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium">
      {label}
      {children}
    </label>
  );
}

export function CartDrawer({ bank }: { bank: BankInfo }) {
  const { items, open, setOpen, totalUnits, subtotal, minUnits, setQuantity, remove, clear } = useCart();
  const [view, setView] = useState<"cart" | "checkout" | "done">("cart");
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<Form>(INITIAL);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ waUrl: string; orderNumber: number; orderCode: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const capital = isCordobaCapital(form.province, form.city, form.cordobaCapital);
  const options = deliveryOptions(capital);
  const method = options.includes(form.delivery) ? form.delivery : options[0];
  const needsAddress = method !== "RETIRO_LOCAL";

  const missing = Math.max(0, minUnits - totalUnits);
  const progress = Math.min(100, (totalUnits / minUnits) * 100);
  const activeView = items.length === 0 && view !== "done" ? "cart" : view;

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));

  const onOpenChange = (v: boolean) => {
    setOpen(v);
    if (!v) {
      setError(null);
      if (view === "done") {
        setView("cart");
        setDone(null);
      }
    }
  };

  const validate = (s: number): string | null => {
    if (s === 1) {
      if (form.name.trim().length < 3) return "Ingresá tu nombre y apellido.";
      if (form.phone.replace(/\D/g, "").length < 8) return "Ingresá un teléfono de WhatsApp válido.";
      if (!form.province) return "Elegí tu provincia.";
      if (!form.city.trim()) return "Ingresá tu localidad o ciudad.";
    }
    if (s === 2 && needsAddress) {
      if (!form.address.trim()) return "Ingresá tu dirección completa.";
      if (!form.postalCode.trim()) return "Ingresá tu código postal.";
      if (!form.reference.trim()) return "Ingresá una referencia para la entrega.";
    }
    return null;
  };

  const next = () => {
    const err = validate(step);
    setError(err);
    if (!err) setStep(step + 1);
  };

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const res = await createOrder({
        items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
        customerName: form.name,
        customerPhone: form.phone,
        province: form.province,
        city: form.city,
        cordobaCapital: form.cordobaCapital,
        deliveryMethod: method,
        address: form.address,
        postalCode: form.postalCode,
        reference: form.reference,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      clear();
      setDone(res);
      setView("done");
      const w = window.open(res.waUrl, "_blank");
      if (!w) window.location.href = res.waUrl;
    });
  };

  const title =
    activeView === "cart" ? "Carrito" : activeView === "done" ? "Pedido creado" : "Finalizar pedido";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>
            {activeView === "checkout"
              ? `Paso ${step} de 3: ${STEP_TITLES[step - 1]}`
              : activeView === "done"
                ? "Tu pedido quedó registrado."
                : `Compra mínima: ${minUnits} unidades`}
          </SheetDescription>
        </SheetHeader>

        {activeView === "cart" && (
          <>
            <div className="flex-1 overflow-y-auto px-6">
              {items.length === 0 ? (
                <p className="py-16 text-center text-muted-foreground">Todavía no agregaste modelos.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {items.map((i) => (
                    <li key={i.variantId} className="flex gap-4 py-5">
                      <div className="relative h-20 w-20 shrink-0 bg-muted">
                        {i.image && <Image src={i.image} alt="" fill sizes="80px" className="object-cover" />}
                      </div>
                      <div className="flex flex-1 flex-col gap-2">
                        <div className="flex justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold leading-tight">{i.productName}</p>
                            <p className="text-sm text-muted-foreground">
                              {i.variantName}
                              {i.unitsPerPack > 1 && ` · Incluye ${i.unitsPerPack} gafas`}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => remove(i.variantId)}
                            aria-label={`Quitar ${i.productName} del carrito`}
                            className="h-fit p-1 hover:bg-muted"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex h-9 items-center border border-input">
                            <button
                              type="button"
                              aria-label="Restar una unidad"
                              disabled={i.quantity <= 1}
                              onClick={() => setQuantity(i.variantId, i.quantity - 1)}
                              className="flex h-full w-8 items-center justify-center hover:bg-muted disabled:opacity-30"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-8 text-center text-sm tabular-nums">{i.quantity}</span>
                            <button
                              type="button"
                              aria-label="Sumar una unidad"
                              disabled={i.quantity >= i.stock}
                              onClick={() => setQuantity(i.variantId, i.quantity + 1)}
                              className="flex h-full w-8 items-center justify-center hover:bg-muted disabled:opacity-30"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <p className="text-sm font-semibold tabular-nums">{formatPrice(i.price * i.quantity)}</p>
                        </div>
                        {i.quantity >= i.stock && <p className="text-xs text-muted-foreground">Máximo disponible</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <div className="grid gap-4 border-t border-foreground px-6 py-5">
                <div>
                  <div
                    className="h-1.5 w-full bg-muted"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={minUnits}
                    aria-valuenow={Math.min(totalUnits, minUnits)}
                  >
                    <div className="h-full bg-foreground transition-all" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="mt-2 text-sm" role="status">
                    {missing > 0
                      ? `Faltan ${missing} ${missing === 1 ? "gafa" : "gafas"} para alcanzar el mínimo mayorista de ${minUnits} unidades.`
                      : `Mínimo mayorista alcanzado (${minUnits} unidades).`}
                  </p>
                </div>
                <dl className="grid gap-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Gafas acumuladas</dt>
                    <dd className="font-medium tabular-nums">{totalUnits}</dd>
                  </div>
                  <div className="flex justify-between text-base">
                    <dt className="font-semibold">Subtotal</dt>
                    <dd className="font-semibold tabular-nums">{formatPrice(subtotal)}</dd>
                  </div>
                </dl>
                <Button
                  disabled={missing > 0}
                  onClick={() => {
                    setStep(1);
                    setError(null);
                    setView("checkout");
                  }}
                >
                  Continuar con el pedido
                </Button>
              </div>
            )}
          </>
        )}

        {activeView === "checkout" && (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {step === 1 && (
                <div className="grid gap-4">
                  <Field label="Nombre y apellido">
                    <Input value={form.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" />
                  </Field>
                  <Field label="Teléfono (WhatsApp)">
                    <Input
                      type="tel"
                      inputMode="tel"
                      value={form.phone}
                      onChange={(e) => set("phone", e.target.value)}
                      autoComplete="tel"
                    />
                  </Field>
                  <Field label="Provincia">
                    <Select
                      value={form.province}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          province: e.target.value,
                          cordobaCapital: e.target.value === "Córdoba" ? f.cordobaCapital : false,
                          city: e.target.value !== "Córdoba" && f.city === "Córdoba Capital" ? "" : f.city,
                        }))
                      }
                    >
                      <option value="">Elegí tu provincia</option>
                      {PROVINCES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  {form.province === "Córdoba" && (
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-black"
                        checked={form.cordobaCapital}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            cordobaCapital: e.target.checked,
                            city: e.target.checked ? "Córdoba Capital" : f.city === "Córdoba Capital" ? "" : f.city,
                          }))
                        }
                      />
                      Soy de Córdoba Capital
                    </label>
                  )}
                  <Field label="Localidad / Ciudad">
                    <Input
                      value={form.city}
                      disabled={form.cordobaCapital}
                      onChange={(e) => set("city", e.target.value)}
                      autoComplete="address-level2"
                    />
                  </Field>
                </div>
              )}

              {step === 2 && (
                <div className="grid gap-4">
                  <fieldset className="grid gap-2">
                    <legend className="sr-only">Método de entrega</legend>
                    {options.map((o) => (
                      <label
                        key={o}
                        className={`flex cursor-pointer items-start gap-3 border p-3 text-sm ${
                          method === o ? "border-foreground" : "border-input"
                        }`}
                      >
                        <input
                          type="radio"
                          name="delivery"
                          className="mt-0.5 accent-black"
                          checked={method === o}
                          onChange={() => set("delivery", o)}
                        />
                        {deliveryOptionLabel(o, capital)}
                      </label>
                    ))}
                  </fieldset>
                  {needsAddress && (
                    <>
                      <Field label="Dirección completa">
                        <Input
                          value={form.address}
                          onChange={(e) => set("address", e.target.value)}
                          autoComplete="street-address"
                        />
                      </Field>
                      <Field label="Código postal">
                        <Input
                          value={form.postalCode}
                          onChange={(e) => set("postalCode", e.target.value)}
                          autoComplete="postal-code"
                        />
                      </Field>
                      <Field label="Referencias">
                        <Input
                          value={form.reference}
                          onChange={(e) => set("reference", e.target.value)}
                          placeholder="Entre calles, timbre, horario"
                        />
                      </Field>
                    </>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="grid gap-5">
                  <div className="border-2 border-foreground p-4 text-sm">
                    <p className="font-semibold">El pago es exclusivamente por transferencia bancaria.</p>
                    <p className="mt-1 text-muted-foreground">
                      El costo de envío, si corresponde, se coordina y se abona después por WhatsApp.
                    </p>
                  </div>

                  <div className="grid gap-3 text-sm">
                    {[
                      ["Titular", bank.bankHolder, false],
                      ["Banco", bank.bankName, false],
                      ["Alias", bank.bankAlias, true],
                      ["CBU", bank.bankCbu, true],
                    ].map(([label, value, copy]) =>
                      value ? (
                        <div key={label as string} className="flex items-center justify-between gap-3 border-b border-border pb-3">
                          <div>
                            <p className="text-muted-foreground">{label as string}</p>
                            <p className="break-all font-medium">{value as string}</p>
                          </div>
                          {copy && <CopyButton value={value as string} label={label as string} />}
                        </div>
                      ) : null
                    )}
                    {!bank.bankCbu && !bank.bankAlias && (
                      <p className="text-muted-foreground">Te pasamos los datos bancarios por WhatsApp al confirmar.</p>
                    )}
                  </div>

                  <div className="flex items-baseline justify-between border-t border-foreground pt-4">
                    <span className="text-sm font-medium">Monto de los productos a transferir</span>
                    <span className="text-xl font-semibold tabular-nums">{formatPrice(subtotal)}</span>
                  </div>
                </div>
              )}

              {error && (
                <p role="alert" className="mt-4 border border-foreground p-3 text-sm">
                  {error}
                </p>
              )}
            </div>

            <div className="flex gap-2 border-t border-foreground px-6 py-5">
              <Button
                variant="outline"
                aria-label="Volver"
                disabled={pending}
                onClick={() => {
                  setError(null);
                  if (step === 1) setView("cart");
                  else setStep(step - 1);
                }}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              {step < 3 ? (
                <Button className="flex-1" onClick={next}>
                  Continuar
                </Button>
              ) : (
                <Button className="flex-1" disabled={pending} onClick={submit}>
                  {pending ? "Creando pedido…" : "Finalizar y enviar pedido por WhatsApp"}
                </Button>
              )}
            </div>
          </>
        )}

        {activeView === "done" && done && (
          <div className="flex flex-1 flex-col justify-between px-6 py-8">
            <div className="grid gap-3">
              <p className="text-2xl font-semibold">Pedido #{done.orderNumber}</p>
              <p className="text-sm text-muted-foreground">Código: {done.orderCode}</p>
              <p className="text-sm">
                Se abrió WhatsApp con el resumen. Enviá el mensaje para que confirmemos el pedido y coordinemos el
                pago y el envío. Si no se abrió, usá el botón de abajo.
              </p>
            </div>
            <div className="grid gap-2">
              <Button asChild>
                <a href={done.waUrl} target="_blank" rel="noreferrer">
                  Abrir WhatsApp
                </a>
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
