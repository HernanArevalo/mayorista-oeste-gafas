"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";

export function AdminLink() {
  const { data, status } = useSession();
  const router = useRouter();
  const [denied, setDenied] = useState(false);

  const onClick = () => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      signIn("google", { callbackUrl: "/admin" });
      return;
    }
    if (data?.user?.role === "ADMIN") router.push("/admin");
    else setDenied(true);
  };

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onClick}
        className="text-xs text-neutral-500 underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        ADMIN
      </button>
      {denied && (
        <span role="status" className="text-xs text-neutral-500">
          Esta cuenta no tiene acceso al panel.
        </span>
      )}
    </div>
  );
}
