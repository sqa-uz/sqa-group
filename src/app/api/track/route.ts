import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deviceFrom, ensurePageViewTable, isBot, referrerHost, splitPath, visitorId } from "@/lib/analytics";

export const runtime = "nodejs";

const NO_CONTENT = () => new NextResponse(null, { status: 204 });

/** Records one public page view. Always answers 204 so tracking can never break a page. */
export async function POST(request: Request) {
  // Previews share the production database; only the live site is counted.
  if (process.env.VERCEL_ENV === "preview") return NO_CONTENT();

  const ua = request.headers.get("user-agent") ?? "";
  if (isBot(ua)) return NO_CONTENT();

  let body: { path?: unknown; referrer?: unknown };
  try {
    const text = await request.text();
    if (text.length > 1000) return NO_CONTENT();
    body = JSON.parse(text);
  } catch {
    return NO_CONTENT();
  }

  const page = splitPath(String(body.path ?? ""));
  if (!page) return NO_CONTENT();

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "0";
  const country = (request.headers.get("x-vercel-ip-country") ?? "").toUpperCase();
  const day = new Date().toISOString().slice(0, 10);

  try {
    await ensurePageViewTable();
    await prisma.pageView.create({
      data: {
        path: page.path,
        locale: page.locale,
        referrer: referrerHost(typeof body.referrer === "string" ? body.referrer : null, request.headers.get("host")),
        country: /^[A-Z]{2}$/.test(country) ? country : null,
        device: deviceFrom(ua),
        visitor: visitorId(ip, ua, day, process.env.AUTH_SECRET ?? "sqa"),
      },
    });
  } catch (err) {
    console.error("[analytics] could not record a page view", err);
  }
  return NO_CONTENT();
}
