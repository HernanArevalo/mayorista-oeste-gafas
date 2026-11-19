import { getServerSession, type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

const isInitialAdmin = (email: string) =>
  !!process.env.INITIAL_ADMIN_EMAIL &&
  email.toLowerCase() === process.env.INITIAL_ADMIN_EMAIL.trim().toLowerCase();

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      const email = user.email.toLowerCase();
      const existing = await prisma.user.findUnique({ where: { email } });
      if (!existing) {
        await prisma.user.create({
          data: { email, name: user.name, image: user.image, role: isInitialAdmin(email) ? "ADMIN" : "USER" },
        });
      } else {
        await prisma.user.update({
          where: { email },
          data: {
            name: user.name,
            image: user.image,
            // evita bloqueos iniciales si el usuario ya existía como USER
            ...(isInitialAdmin(email) && existing.role !== "ADMIN" ? { role: "ADMIN" as const } : {}),
          },
        });
      }
      return true;
    },
    async jwt({ token }) {
      if (token.email) {
        const u = await prisma.user.findUnique({
          where: { email: token.email.toLowerCase() },
          select: { id: true, role: true },
        });
        token.role = u?.role ?? "USER";
        token.uid = u?.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role ?? "USER";
        session.user.id = token.uid ?? "";
      }
      return session;
    },
  },
};

/** Verifica contra la base (no solo contra el token) que el usuario actual sea ADMIN. */
export async function isAdmin() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase();
  if (!email) return false;
  const u = await prisma.user.findUnique({ where: { email }, select: { role: true } });
  return u?.role === "ADMIN";
}

export async function requireAdmin() {
  if (!(await isAdmin())) throw new Error("No autorizado");
}
