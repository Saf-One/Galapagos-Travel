"use server";

import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {z} from "zod";
import {prisma} from "@/lib/prisma";
import {getCurrentUser} from "@/lib/auth";

// === CONFIGURABLE VALUES ===
// Package CRUD server actions, validated with zod. All DB access at request
// time. Images and price updates have their own focused actions.

const packageSchema = z.object({
  title: z.string().min(2, "title-too-short").max(160),
  slug: z
    .string()
    .min(2, "slug-too-short")
    .max(160)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug-invalid"),
  summary: z.string().min(2, "summary-too-short").max(280),
  description: z.string().min(2, "description-too-short"),
  priceInCents: z.coerce.number().int().min(0, "price-invalid"),
  currency: z.string().length(3, "currency-invalid").default("USD"),
  durationDays: z.coerce.number().int().min(1, "duration-invalid"),
  location: z.string().min(2, "location-too-short").max(160),
  maxGuests: z.coerce.number().int().min(1, "guests-invalid"),
  featured: z.boolean().default(false),
});

export type PackageFormState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

function parseForm(formData: FormData) {
  return packageSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    summary: formData.get("summary"),
    description: formData.get("description"),
    priceInCents: formData.get("priceInCents"),
    currency: formData.get("currency") || "USD",
    durationDays: formData.get("durationDays"),
    location: formData.get("location"),
    maxGuests: formData.get("maxGuests"),
    featured: formData.get("featured") === "on" || formData.get("featured") === "true",
  });
}

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") throw new Error("unauthorized");
}

export async function createPackageAction(
  _prev: PackageFormState,
  formData: FormData
): Promise<PackageFormState> {
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
    await prisma.package.create({data: parsed.data});
    revalidatePath("/admin/packages");
    revalidatePath("/packages");
    redirect("/admin/packages");
  } catch {
    return {ok: false, error: "create-failed"};
  }
}

export async function updatePackageAction(
  id: string,
  _prev: PackageFormState,
  formData: FormData
): Promise<PackageFormState> {
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
    await prisma.package.update({where: {id}, data: parsed.data});
    revalidatePath("/admin/packages");
    revalidatePath("/admin/packages/" + id);
    revalidatePath("/packages");
    return {ok: true};
  } catch {
    return {ok: false, error: "update-failed"};
  }
}

const priceSchema = z.object({
  priceInCents: z.coerce.number().int().min(0, "price-invalid"),
});

export async function updatePriceAction(
  id: string,
  formData: FormData
): Promise<PackageFormState> {
  try {
    await requireAdmin();
  } catch {
    return {ok: false, error: "unauthorized"};
  }

  const parsed = priceSchema.safeParse({
    priceInCents: formData.get("priceInCents"),
  });
  if (!parsed.success) return {ok: false, error: "price-invalid"};

  try {
    await prisma.package.update({
      where: {id},
      data: {priceInCents: parsed.data.priceInCents},
    });
    revalidatePath("/admin/packages");
    revalidatePath("/packages");
    return {ok: true};
  } catch {
    return {ok: false, error: "update-failed"};
  }
}

export async function deletePackageAction(formData: FormData): Promise<void> {
  try {
    await requireAdmin();
  } catch {
    return;
  }
  const id = String(formData.get("id") || "");
  if (!id) return;
  try {
    await prisma.package.delete({where: {id}});
    revalidatePath("/admin/packages");
    revalidatePath("/packages");
  } catch {
    // ignore delete errors (e.g. FK constraints handled by cascade)
  }
}

const imageSchema = z.object({
  url: z.string().url("url-invalid").max(2000),
  alt: z.string().max(200).default(""),
});

export type ImageFormState = {ok: boolean; error?: string};

export async function addPackageImageAction(
  packageId: string,
  _prev: ImageFormState,
  formData: FormData
): Promise<ImageFormState> {
  try {
    await requireAdmin();
  } catch {
    return {ok: false, error: "unauthorized"};
  }

  const parsed = imageSchema.safeParse({
    url: formData.get("url"),
    alt: formData.get("alt") || "",
  });
  if (!parsed.success) return {ok: false, error: "url-invalid"};

  try {
    const count = await prisma.packageImage.count({where: {packageId}});
    await prisma.packageImage.create({
      data: {
        packageId,
        url: parsed.data.url,
        alt: parsed.data.alt,
        sortOrder: count,
      },
    });
    revalidatePath("/admin/packages/" + packageId);
    revalidatePath("/packages");
    return {ok: true};
  } catch {
    return {ok: false, error: "create-failed"};
  }
}
