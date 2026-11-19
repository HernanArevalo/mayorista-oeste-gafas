import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";

// Primera barrera. La verificación real contra la base se hace en admin/layout.tsx y en cada Server Action.
export async function middleware(req: NextRequest) {
  const token = await getToken({ req });
  if (!token || token.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*"] };
