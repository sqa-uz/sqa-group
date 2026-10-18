import { describe, it, expect, vi } from "vitest";

// The helpers live next to the Prisma-backed report; the client is never touched in these tests.
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

const { isBot, deviceFrom, splitPath, referrerHost, visitorId } = await import("../../src/lib/analytics");

const CHROME = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36";
const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1";
const IPAD = "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1";
const ANDROID_TAB = "Mozilla/5.0 (Linux; Android 13; SM-X700) AppleWebKit/537.36 Chrome/128.0 Safari/537.36";

describe("isBot", () => {
  it("drops crawlers, tools and empty user agents", () => {
    expect(isBot("Googlebot/2.1 (+http://www.google.com/bot.html)")).toBe(true);
    expect(isBot("curl/8.4.0")).toBe(true);
    expect(isBot("")).toBe(true);
    expect(isBot(null)).toBe(true);
  });
  it("keeps real browsers", () => {
    expect(isBot(CHROME)).toBe(false);
    expect(isBot(IPHONE)).toBe(false);
  });
});

describe("deviceFrom", () => {
  it("tells phones, tablets and desktops apart", () => {
    expect(deviceFrom(IPHONE)).toBe("mobile");
    expect(deviceFrom(IPAD)).toBe("tablet");
    expect(deviceFrom(ANDROID_TAB)).toBe("tablet");
    expect(deviceFrom(CHROME)).toBe("desktop");
  });
});

describe("splitPath", () => {
  it("separates the locale and drops query strings and trailing slashes", () => {
    expect(splitPath("/ru/what-we-certify?q=3917")).toEqual({ locale: "ru", path: "/what-we-certify" });
    expect(splitPath("/uz")).toEqual({ locale: "uz", path: "/" });
    expect(splitPath("/en/news/some-post/")).toEqual({ locale: "en", path: "/news/some-post" });
  });
  it("rejects anything that is not a public page", () => {
    expect(splitPath("/admin")).toBeNull();
    expect(splitPath("/de/about")).toBeNull();
    expect(splitPath("https://evil.example/ru")).toBeNull();
    expect(splitPath("/ru/<script>")).toBeNull();
    expect(splitPath("/ru/" + "a".repeat(400))).toBeNull();
  });
});

describe("referrerHost", () => {
  it("keeps the external host only", () => {
    expect(referrerHost("https://www.google.com/search?q=sqa", "www.sqa.uz")).toBe("google.com");
    expect(referrerHost("https://t.me/somechannel", "www.sqa.uz")).toBe("t.me");
  });
  it("ignores own pages, previews and junk", () => {
    expect(referrerHost("https://www.sqa.uz/ru/about", "www.sqa.uz")).toBeNull();
    expect(referrerHost("https://sqa.uz/ru", "www.sqa.uz")).toBeNull();
    expect(referrerHost("https://sqa-group-git-x.vercel.app/ru", "www.sqa.uz")).toBeNull();
    expect(referrerHost("not a url", "www.sqa.uz")).toBeNull();
    expect(referrerHost("", "www.sqa.uz")).toBeNull();
  });
});

describe("visitorId", () => {
  it("is stable within a day and changes the next day", () => {
    const a = visitorId("1.2.3.4", CHROME, "2026-10-19", "s");
    expect(visitorId("1.2.3.4", CHROME, "2026-10-19", "s")).toBe(a);
    expect(visitorId("1.2.3.4", CHROME, "2026-10-20", "s")).not.toBe(a);
    expect(visitorId("5.6.7.8", CHROME, "2026-10-19", "s")).not.toBe(a);
    expect(a).not.toContain("1.2.3.4");
  });
});
