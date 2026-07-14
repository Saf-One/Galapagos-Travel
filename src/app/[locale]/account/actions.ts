"use server";

// Server actions for customer authentication: login, register, logout.
// Uses Auth.js v5 signIn/signOut (exported from @/lib/auth) plus Prisma +
// bcryptjs for account creation. Validation is done manually (no zod dep)
// so the build stays offline and dependency-light.

import {redirect} from "next/navigation";
import bcrypt from "bcryptjs";
import {signIn, signOut} from "@/lib/auth";
import {prisma} from "@/lib/prisma";

// === CONFIGURABLE VALUES ===
// Minimum password length enforced at registration.
const MIN_PASSWORD_LENGTH = 8;

// Allowed error keys (must exist under the "account" i18n namespace).
export type AuthError =
  | "loginError"
  | "registerError"
  | "invalidEmail"
  | "passwordTooShort"
  | "passwordMismatch";

export type LoginState = {error?: AuthError};
export type RegisterState = {error?: AuthError};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const locale = String(formData.get("locale") || "en");

  const res = await signIn("credentials", {
    email,
    password,
    redirect: false,
  });

  if (!res?.ok || res.error) {
    return {error: "loginError"};
  }

  redirect(`/${locale}/account`);
}

export async function registerAction(
  _prev: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirm") || "");
  const locale = String(formData.get("locale") || "en");

  if (!EMAIL_RE.test(email)) {
    return {error: "invalidEmail"};
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return {error: "passwordTooShort"};
  }
  if (password !== confirm) {
    return {error: "passwordMismatch"};
  }

  const existing = await prisma.user.findUnique({where: {email}});
  if (existing) {
    return {error: "registerError"};
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {name, email, passwordHash, role: "CUSTOMER"},
  });

  const res = await signIn("credentials", {
    email,
    password,
    redirect: false,
  });

  if (!res?.ok || res.error) {
    return {error: "loginError"};
  }

  redirect(`/${locale}/account`);
}

export async function logoutAction(formData: FormData): Promise<void> {
  const locale = String(formData.get("locale") || "en");
  await signOut({redirectTo: `/${locale}/account/login`});
}
