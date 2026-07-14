import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import {PrismaAdapter} from "@auth/prisma-adapter";
import {prisma} from "./prisma";
import {CONFIG} from "./config";

// === CONFIGURABLE VALUES ===
// NextAuth (Auth.js v5) config using the Prisma adapter + a Credentials
// provider (email + password, bcrypt compare). Session strategy is "jwt"
// so we do not need a persistent session table lookup on every request.
export const {handlers, auth, signIn, signOut} = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {strategy: "jwt"},
  // trustHost lets Auth.js trust the Host header. Safe and required when the
  // app is served behind a proxy / in containers; defaults to true in v5.
  trustHost: true,
  secret: CONFIG.authSecret,
  pages: {
    signIn: "/en/account/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: {label: "Email", type: "email"},
        password: {label: "Password", type: "password"},
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({where: {email}});
        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt: async ({token, user}) => {
      if (user) {
        token.id = (user as {id: string}).id;
        token.role = (user as {role?: string}).role ?? "CUSTOMER";
      }
      return token;
    },
    session: async ({session, token}) => {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as "CUSTOMER" | "ADMIN") ?? "CUSTOMER";
      }
      return session;
    },
  },
});

// Helper to fetch the current session user, or null if unauthenticated.
export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

// Guard: returns the user or throws (use in server actions / protected routes).
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Authentication required.");
  return user;
}
