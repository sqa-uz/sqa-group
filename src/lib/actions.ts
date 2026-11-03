"use server";

import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth, signIn, signOut } from "@/lib/auth";
import { logError, logInfo } from "@/lib/logger";
import { PAGE_KEYS } from "@/lib/pages";
import { prisma } from "@/lib/prisma";
import { missingTranslations } from "@/lib/publish";
import { checkRateLimit } from "@/lib/rate-limit";
import { slugify } from "@/lib/slug";
import { ensureStaffDepartmentCheck, STAFF_DEPARTMENTS } from "@/lib/staffDepartments";
import {
  deleteStoredMedia,
  isManagedMediaUrl,
  storeImage,
  StorageError,
  type MediaKind,
} from "@/lib/storage";
import { adminHref, adminMessages, getAdminLocale, type AdminLocale } from "@/i18n/admin";
import { locales } from "@/i18n/routing";

export type AdminActionState = {
  error?: string;
  formKey?: string;
  success?: string;
  values?: Record<string, string>;
};

type Translation = { locale: string } & Record<string, string>;

const STAFF_REQUIRED = ["name", "position"] as const;
const NEWS_REQUIRED = ["title", "body"] as const;
const PARTNER_REQUIRED = ["name"] as const;

const staffInput = z.object({
  department: z.enum(STAFF_DEPARTMENTS),
  email: z.string().trim().max(320).refine((value) => !value || z.email().safeParse(value).success, "Invalid email"),
  linkedin: z.string().trim().max(2_048).refine(isOptionalHttpUrl, "Invalid LinkedIn URL"),
  order: z.coerce.number().int().min(0).max(10_000),
  phone: z.string().trim().max(50),
});

const partnerInput = z.object({
  order: z.coerce.number().int().min(0).max(10_000),
  websiteUrl: z.string().trim().max(2_048).refine(isOptionalHttpUrl, "Invalid website URL"),
});

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
  return session;
}

function revalidatePublic() {
  // Public pages use ISR; the root layout invalidation covers every locale route.
  revalidatePath("/", "layout");
}

function adminLocaleFromForm(formData: FormData): AdminLocale {
  return getAdminLocale({ lang: String(formData.get("adminLang") ?? "") });
}

function formFailure(formData: FormData, error: string): AdminActionState {
  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    // File controls cannot be restored by browsers. Preserve all text and checkbox values.
    if (typeof value === "string" && key !== "password") values[key] = value;
  }
  return { error, formKey: randomUUID(), values };
}

function translationFields(formData: FormData, fields: readonly string[]): Translation[] {
  return locales.map((locale) => {
    const entry: Translation = { locale };
    for (const field of fields) entry[field] = String(formData.get(`${locale}_${field}`) ?? "").trim();
    return entry;
  });
}

function nonEmptyTranslations(translations: Translation[], fields: readonly string[]) {
  return translations.filter((translation) => fields.some((field) => translation[field]?.trim()));
}

function localizedPublishError(problems: string[], locale: AdminLocale) {
  const t = adminMessages[locale];
  const localized = problems.map((problem) =>
    problem
      .replace("missing translation", t.common.missingTranslation)
      .replace(/: ([a-zA-Z]+) is empty$/, (_, field: string) => `: ${field} ${t.common.emptyField}`)
  );
  return `${t.common.fixBeforePublish}: ${localized.join("; ")}`;
}

function localizedStorageError(error: unknown, locale: AdminLocale) {
  const t = adminMessages[locale];
  if (!(error instanceof StorageError)) return t.common.uploadFailed;
  if (error.code === "image_too_large") return t.common.imageTooLarge;
  if (error.code === "invalid_image") return t.common.invalidImage;
  if (error.code === "not_configured") return t.common.mediaStorageUnavailable;
  return t.common.uploadFailed;
}

function invalidFormError(locale: AdminLocale) {
  return adminMessages[locale].common.invalidForm;
}

async function maybeUpload(formData: FormData, field: string, kind: MediaKind): Promise<string | undefined> {
  const file = formData.get(field);
  if (file instanceof File && file.size > 0) return storeImage(file, kind);
  return undefined;
}

async function cleanupFailedUpload(url: string | undefined) {
  if (!url) return;
  try {
    await deleteStoredMedia(url);
  } catch (error) {
    logError("admin.media.cleanup_failed", error, { uploaded: true });
  }
}

async function cleanupUnreferencedMedia(url: string | null | undefined) {
  if (!url || !isManagedMediaUrl(url)) return;

  const [staffReferences, newsReferences, partnerReferences] = await Promise.all([
    prisma.staff.count({ where: { photoUrl: url } }),
    prisma.news.count({ where: { imageUrl: url } }),
    prisma.partner.count({ where: { logoUrl: url } }),
  ]);
  if (staffReferences + newsReferences + partnerReferences > 0) return;

  try {
    await deleteStoredMedia(url);
  } catch (error) {
    // A failed cleanup should never undo an already successful content save.
    logError("admin.media.orphan_cleanup_failed", error);
  }
}

async function uniqueSlug(
  tx: Prisma.TransactionClient,
  entity: "news" | "staff",
  source: string
): Promise<string> {
  const base = slugify(source);
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const existing =
      entity === "staff"
        ? await tx.staff.findUnique({ where: { slug: candidate }, select: { id: true } })
        : await tx.news.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!existing) return candidate;
  }
  throw new Error("Unable to create a unique slug");
}

function isOptionalHttpUrl(value: string): boolean {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/* ---------------- auth ---------------- */

export async function loginAction(_prev: AdminActionState | undefined, formData: FormData): Promise<AdminActionState> {
  const adminLocale = adminLocaleFromForm(formData);
  const t = adminMessages[adminLocale];

  // Best-effort instance-level protection. Production should additionally use
  // Vercel Firewall or a shared rate-limit provider for cross-instance limits.
  if (!(await checkRateLimit("admin-login", 10, 15 * 60 * 1000))) {
    logInfo("admin.login.rate_limited");
    return { error: t.auth.tooManyAttempts };
  }

  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });
  } catch (error) {
    logWarnInvalidLogin(error);
    return { error: t.auth.invalid };
  }
  redirect(adminHref("/admin", adminLocale));
}

export async function logoutAction(formData: FormData) {
  const adminLocale = adminLocaleFromForm(formData);
  await signOut({ redirect: false });
  redirect(adminHref("/admin/login", adminLocale));
}

/* ---------------- staff ---------------- */

export async function saveStaff(
  _prev: AdminActionState | undefined,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin();
  const adminLocale = adminLocaleFromForm(formData);
  const id = String(formData.get("id") ?? "").trim();
  const wantPublish = formData.get("published") === "on";
  const parsed = staffInput.safeParse({
    department: formData.get("department"),
    email: String(formData.get("email") ?? ""),
    linkedin: String(formData.get("linkedin") ?? ""),
    order: formData.get("order"),
    phone: String(formData.get("phone") ?? ""),
  });
  if (!parsed.success) return formFailure(formData, invalidFormError(adminLocale));

  const translations = translationFields(formData, ["name", "position", "intro", "bio", "expertise"]);
  if (wantPublish) {
    const problems = missingTranslations(translations, [...STAFF_REQUIRED]);
    if (problems.length) return formFailure(formData, localizedPublishError(problems, adminLocale));
  }

  const existing = id
    ? await prisma.staff.findUnique({ where: { id }, select: { id: true, photoUrl: true } })
    : null;
  if (id && !existing) {
    return formFailure(formData, adminMessages[adminLocale].common.recordNotFound);
  }

  let photoUrl: string | undefined;
  try {
    photoUrl = await maybeUpload(formData, "photo", "staff");
  } catch (error) {
    logError("admin.staff.upload_failed", error, { is_new: !id });
    return formFailure(formData, localizedStorageError(error, adminLocale));
  }

  const storedTranslations = nonEmptyTranslations(translations, ["name", "position", "intro", "bio", "expertise"]);
  try {
    // older databases only allow certification | laboratory | management
    if (parsed.data.department === "slab") await ensureStaffDepartmentCheck();
    await prisma.$transaction(async (tx) => {
      const data = {
        department: parsed.data.department,
        email: parsed.data.email || null,
        linkedin: parsed.data.linkedin || null,
        order: parsed.data.order,
        phone: parsed.data.phone || null,
        published: wantPublish,
        ...(photoUrl ? { photoUrl } : {}),
      };
      const translationData = storedTranslations.map((translation) => ({
        locale: translation.locale,
        name: translation.name,
        position: translation.position,
        intro: translation.intro || null,
        bio: translation.bio || null,
        expertise: translation.expertise || null,
      }));

      if (id) {
        await tx.staff.update({
          where: { id },
          data: { ...data, translations: { deleteMany: {}, create: translationData } },
        });
        return;
      }

      const en = translations.find((translation) => translation.locale === "en");
      const uz = translations.find((translation) => translation.locale === "uz");
      await tx.staff.create({
        data: {
          ...data,
          slug: await uniqueSlug(tx, "staff", en?.name || uz?.name || "staff"),
          translations: { create: translationData },
        },
      });
    });
  } catch (error) {
    await cleanupFailedUpload(photoUrl);
    logError("admin.staff.save_failed", error, { is_new: !id });
    return formFailure(formData, adminMessages[adminLocale].common.saveFailed);
  }

  logInfo("admin.staff.saved", { is_new: !id, published: wantPublish });
  if (photoUrl && existing?.photoUrl !== photoUrl) await cleanupUnreferencedMedia(existing?.photoUrl);
  revalidatePublic();
  redirect(adminHref("/admin/staff", adminLocale));
}

export async function deleteStaff(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const staff = id ? await prisma.staff.findUnique({ where: { id }, select: { photoUrl: true } }) : null;
  if (id) await prisma.staff.deleteMany({ where: { id } });
  await cleanupUnreferencedMedia(staff?.photoUrl);
  revalidatePublic();
  revalidatePath("/admin/staff");
}

/* ---------------- news ---------------- */

export async function saveNews(
  _prev: AdminActionState | undefined,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin();
  const adminLocale = adminLocaleFromForm(formData);
  const id = String(formData.get("id") ?? "").trim();
  const wantPublish = formData.get("publish") === "on";
  const translations = translationFields(formData, ["title", "summary", "body"]);
  if (wantPublish) {
    const problems = missingTranslations(translations, [...NEWS_REQUIRED]);
    if (problems.length) return formFailure(formData, localizedPublishError(problems, adminLocale));
  }

  const existing = id
    ? await prisma.news.findUnique({ where: { id }, select: { id: true, imageUrl: true, publishedAt: true } })
    : null;
  if (id && !existing) return formFailure(formData, adminMessages[adminLocale].common.recordNotFound);

  let imageUrl: string | undefined;
  try {
    imageUrl = await maybeUpload(formData, "image", "news");
  } catch (error) {
    logError("admin.news.upload_failed", error, { is_new: !id });
    return formFailure(formData, localizedStorageError(error, adminLocale));
  }

  const storedTranslations = nonEmptyTranslations(translations, ["title", "summary", "body"]);
  try {
    await prisma.$transaction(async (tx) => {
      const data = {
        status: wantPublish ? "published" : "draft",
        ...(imageUrl ? { imageUrl } : {}),
      };
      const translationData = storedTranslations.map((translation) => ({
        locale: translation.locale,
        title: translation.title,
        summary: translation.summary || null,
        body: translation.body,
      }));

      if (id) {
        await tx.news.update({
          where: { id },
          data: {
            ...data,
            publishedAt: wantPublish ? existing?.publishedAt ?? new Date() : existing?.publishedAt,
            translations: { deleteMany: {}, create: translationData },
          },
        });
        return;
      }

      const en = translations.find((translation) => translation.locale === "en");
      const uz = translations.find((translation) => translation.locale === "uz");
      await tx.news.create({
        data: {
          ...data,
          slug: await uniqueSlug(tx, "news", en?.title || uz?.title || "news"),
          publishedAt: wantPublish ? new Date() : null,
          translations: { create: translationData },
        },
      });
    });
  } catch (error) {
    await cleanupFailedUpload(imageUrl);
    logError("admin.news.save_failed", error, { is_new: !id });
    return formFailure(formData, adminMessages[adminLocale].common.saveFailed);
  }

  logInfo("admin.news.saved", { is_new: !id, published: wantPublish });
  if (imageUrl && existing?.imageUrl !== imageUrl) await cleanupUnreferencedMedia(existing?.imageUrl);
  revalidatePublic();
  redirect(adminHref("/admin/news", adminLocale));
}

export async function deleteNews(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const news = id ? await prisma.news.findUnique({ where: { id }, select: { imageUrl: true } }) : null;
  if (id) await prisma.news.deleteMany({ where: { id } });
  await cleanupUnreferencedMedia(news?.imageUrl);
  revalidatePublic();
  revalidatePath("/admin/news");
}

/* ---------------- partners ---------------- */

export async function savePartner(
  _prev: AdminActionState | undefined,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin();
  const adminLocale = adminLocaleFromForm(formData);
  const id = String(formData.get("id") ?? "").trim();
  const wantPublish = formData.get("published") === "on";
  const parsed = partnerInput.safeParse({
    order: formData.get("order"),
    websiteUrl: String(formData.get("websiteUrl") ?? ""),
  });
  if (!parsed.success) return formFailure(formData, invalidFormError(adminLocale));

  const translations = translationFields(formData, ["name"]);
  if (wantPublish) {
    const problems = missingTranslations(translations, [...PARTNER_REQUIRED]);
    if (problems.length) return formFailure(formData, localizedPublishError(problems, adminLocale));
  }

  const existing = id
    ? await prisma.partner.findUnique({ where: { id }, select: { id: true, logoUrl: true } })
    : null;
  if (id && !existing) {
    return formFailure(formData, adminMessages[adminLocale].common.recordNotFound);
  }

  let logoUrl: string | undefined;
  try {
    logoUrl = await maybeUpload(formData, "logo", "partner");
  } catch (error) {
    logError("admin.partner.upload_failed", error, { is_new: !id });
    return formFailure(formData, localizedStorageError(error, adminLocale));
  }
  if (!id && !logoUrl) return formFailure(formData, adminMessages[adminLocale].partners.logoRequired);

  const storedTranslations = nonEmptyTranslations(translations, ["name"]);
  try {
    await prisma.$transaction(async (tx) => {
      const data = {
        order: parsed.data.order,
        published: wantPublish,
        websiteUrl: parsed.data.websiteUrl || null,
        ...(logoUrl ? { logoUrl } : {}),
      };
      const translationData = storedTranslations.map((translation) => ({
        locale: translation.locale,
        name: translation.name,
      }));

      if (id) {
        await tx.partner.update({
          where: { id },
          data: { ...data, translations: { deleteMany: {}, create: translationData } },
        });
        return;
      }

      await tx.partner.create({
        data: {
          ...data,
          logoUrl: logoUrl!,
          translations: { create: translationData },
        },
      });
    });
  } catch (error) {
    await cleanupFailedUpload(logoUrl);
    logError("admin.partner.save_failed", error, { is_new: !id });
    return formFailure(formData, adminMessages[adminLocale].common.saveFailed);
  }

  logInfo("admin.partner.saved", { is_new: !id, published: wantPublish });
  if (logoUrl && existing?.logoUrl !== logoUrl) await cleanupUnreferencedMedia(existing?.logoUrl);
  revalidatePublic();
  redirect(adminHref("/admin/partners", adminLocale));
}

export async function deletePartner(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const partner = id ? await prisma.partner.findUnique({ where: { id }, select: { logoUrl: true } }) : null;
  if (id) await prisma.partner.deleteMany({ where: { id } });
  await cleanupUnreferencedMedia(partner?.logoUrl);
  revalidatePublic();
  revalidatePath("/admin/partners");
}

/* ---------------- media ---------------- */

export async function deleteMedia(
  _prev: AdminActionState | undefined,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin();
  const adminLocale = adminLocaleFromForm(formData);
  const url = String(formData.get("url") ?? "");
  if (!url || !isManagedMediaUrl(url)) return { error: adminMessages[adminLocale].common.invalidForm };

  const [staffReferences, newsReferences, partnerReferences] = await Promise.all([
    prisma.staff.count({ where: { photoUrl: url } }),
    prisma.news.count({ where: { imageUrl: url } }),
    prisma.partner.count({ where: { logoUrl: url } }),
  ]);
  if (staffReferences + newsReferences + partnerReferences > 0) {
    return { error: adminMessages[adminLocale].common.mediaInUse };
  }

  try {
    await deleteStoredMedia(url);
  } catch (error) {
    logError("admin.media.delete_failed", error);
    return { error: localizedStorageError(error, adminLocale) };
  }

  logInfo("admin.media.deleted");
  revalidatePath("/admin/media");
  return { success: adminMessages[adminLocale].media.deleted };
}

/* ---------------- page visibility ---------------- */

export async function setPageEnabled(formData: FormData) {
  await requireAdmin();
  const adminLocale = adminLocaleFromForm(formData);
  const key = String(formData.get("key") ?? "");
  const enabled = String(formData.get("enabled") ?? "") === "true";
  if (!key || !PAGE_KEYS.has(key)) redirect(adminHref("/admin/pages", adminLocale));
  await prisma.pageSetting.upsert({
    where: { key },
    update: { enabled },
    create: { key, enabled },
  });
  revalidatePublic();
  revalidatePath("/admin/pages");
  redirect(adminHref("/admin/pages", adminLocale));
}

function logWarnInvalidLogin(error: unknown) {
  // Auth.js intentionally returns generic errors. Keep runtime logs useful
  // without emitting submitted credentials or other form values.
  logInfo("admin.login.failed", { reason: error instanceof Error ? error.name : "authorization_failed" });
}
