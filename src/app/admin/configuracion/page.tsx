import { getStoreConfig } from "@/lib/config";
import { saveConfig } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";

export default async function ConfigPage({ searchParams }: { searchParams: { saved?: string } }) {
  const cfg = await getStoreConfig();

  return (
    <div className="grid max-w-xl gap-6">
      <h1 className="text-2xl font-semibold">Configuración</h1>
      {searchParams.saved && (
        <p role="status" className="border border-foreground p-3 text-sm">
          Configuración guardada.
        </p>
      )}
      <form action={saveConfig} className="grid gap-4">
        <label className="grid gap-1.5 text-sm font-medium">
          Mínimo de gafas por pedido
          <Input name="minUnits" type="number" min={1} step={1} defaultValue={cfg.minUnits} required />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          WhatsApp que recibe los pedidos (con código de país, sin + ni espacios)
          <Input name="whatsappNumber" defaultValue={cfg.whatsappNumber} placeholder="5493510000000" inputMode="numeric" />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Titular de la cuenta
          <Input name="bankHolder" defaultValue={cfg.bankHolder} />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Banco
          <Input name="bankName" defaultValue={cfg.bankName} />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Alias
          <Input name="bankAlias" defaultValue={cfg.bankAlias} />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          CBU
          <Input name="bankCbu" defaultValue={cfg.bankCbu} inputMode="numeric" />
        </label>
        <Button type="submit" className="w-fit">
          Guardar configuración
        </Button>
      </form>
    </div>
  );
}
