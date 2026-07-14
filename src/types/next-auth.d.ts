import type {DefaultSession} from "next-auth";
import type {Role} from "@prisma/client";

// Augments NextAuth types so session.user.role and token.role are known.
// Without this, `token.role` / `session.user.role` are type errors.
declare module "next-auth" {
  interface User {
    role?: Role;
  }
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
  }
}
