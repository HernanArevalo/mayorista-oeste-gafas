import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = "oeste-gafas-mayorista";
  const signature = createHash("sha1")
    .update(`folder=${folder}&timestamp=${timestamp}${process.env.CLOUDINARY_API_SECRET}`)
    .digest("hex");

  return NextResponse.json({
    signature,
    timestamp,
    folder,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  });
}
