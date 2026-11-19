import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { SignOutButton } from "@/components/admin/sign-out-button";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) redirect("/");

  return (
    <div className="min-h-screen">
      <header className="border-b border-foreground">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-8">
            <span className="font-semibold tracking-[0.2em]">OESTE GAFAS</span>
            <nav className="flex gap-5 text-sm">
              <Link href="/admin/pedidos" className="hover:underline">Pedidos</Link>
              <Link href="/admin/productos" className="hover:underline">Productos</Link>
              <Link href="/admin/configuracion" className="hover:underline">Configuración</Link>
            </nav>
          </div>
          <div className="flex items-center gap-5 text-sm">
            <Link href="/" className="hover:underline">Ver tienda</Link>
            <SignOutButton />
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</div>
    </div>
  );
}
