"use server";

import {revalidatePath} from "next/cache";
import {z} from "zod";
import {prisma} from "@/lib/prisma";
import {getCurrentUser} from "@/lib/auth";

// === CONFIGURABLE VALUES ===
// Promotion management server actions. Create with code/label/discount/dates/
// active; toggle active. Validated with zod. All DB access at request time.

const promotionSchema = z.object({
  code: z
    .string()
    .min(2, "code-too-short")
    .max(40)
    .regex(/^[A-Za-z0-9_-]+$/, "code-invalid"),
  label: z.string().min(2, "label-too-short").max(160),
  discountPercent: z.coerce.number().int().min(0).max(100),
  startDate: z.string().min(1, "start-required"),
  endDate: z.string().min(1, "end-required"),
  active: z.boolean().default(true),
});

export type PromotionFormState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

function parseForm(formData: FormData) {
  return promotionSchema.safeParse({
    code: formData.get("code"),
    label: formData.get("label"),
    discountPercent: formData.get("discountPercent"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    active: formData.get("active") === "on" || formData.get("active") === "true",
  });
}

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") throw new Error("unauthorized");
}

function toDate(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

export async function createPromotionAction(
  _prev: PromotionFormState,
  formData: FormData
): Promise<PromotionFormState> {
  try {
    await requireAdmin();
  } catch {
    return {ok: false, error: "unauthorized"};
  }

  const parsed = parseForm(formData);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }
    return {ok: false, fieldErrors};
  }

  try {
    await prisma.promotion.create({
      data: {
        code: parsed.data.code,
        label: parsed.data.label,
        discountPercent: parsed.data.discountPercent,
        startDate: toDate(parsed.data.startDate),
        endDate: toDate(parsed.data.endDate),
        active: parsed.data.active,
      },
    });
    revalidatePath("/admin/promotions");
    return {ok: true};
  } catch {
    // Likely a duplicate unique code.
    return {ok: false, error: "create-failed"};
  }
}

export async function togglePromotionAction(formData: FormData): Promise<void> {
  try {
    await requireAdmin();
  } catch {
    return;
  }
  const id = String(formData.get("id") || "");
  if (!id) return;
  try {
    const promo = await prisma.promotion.findUnique({where: {id}});
    if (!promo) return;
    await prisma.promotion.update({
      where: {id},
      data: {active: !promo.active},
    });
    revalidatePath("/admin/promotions");
  } catch {
    // ignore
  }
}

export async function deletePromotionAction(formData: FormData): Promise<void> {
  try {
    await requireAdmin();
  } catch {
    return;
  }
  const id = String(formData.get("id") || "");
  if (!id) return;
  try {
    await prisma.promotion.delete({where: {id}});
    revalidatePath("/admin/promotions");
  } catch {
    // ignore
  }
}
