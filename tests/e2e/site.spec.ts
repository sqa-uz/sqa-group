import { test, expect } from "@playwright/test";
import {
  ensureE2eAdmin,
  E2E_ADMIN_EMAIL,
  E2E_ADMIN_PASSWORD,
  removeE2eAdmin,
} from "./admin-test-helpers";

test.describe("homepage", () => {
  test("renders all key sections on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/uz");
    await expect(page.locator("h1")).toContainText("ishonchli hamkoringiz");
    await expect(page.getByText("O'ZAKK.MS.0052").first()).toBeVisible();
    await expect(page.getByText("O'ZAKK.SL.0162").first()).toBeVisible();
    await expect(page.locator(".marquee-track--left")).toHaveCount(1);
    await expect(page.locator(".marquee-track--right")).toHaveCount(1);
  });

  test("renders on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/uz");
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.getByRole("button", { name: "Menyuni ochish" })).toBeVisible();
  });

  test("carousel rows animate in opposite directions", async ({ page }) => {
    await page.goto("/uz");
    const left = page.locator(".marquee-track--left");
    const right = page.locator(".marquee-track--right");
    // Note: don't use scrollIntoViewIfNeeded here — the track animates
    // continuously, so Playwright's stability wait would time out.
    const dirLeft = await left.evaluate((el) => getComputedStyle(el).animationName);
    const dirRight = await right.evaluate((el) => getComputedStyle(el).animationName);
    expect(dirLeft).toContain("marquee-left");
    expect(dirRight).toContain("marquee-right");
  });
});

test.describe("navigation to detail pages", () => {
  test("staff card opens the detail page", async ({ page }) => {
    await page.goto("/uz/team");
    await page.locator('a[href*="/team/"]').first().click();
    await expect(page).toHaveURL(/\/uz\/team\/[a-z0-9-]+/);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("news card opens the article page", async ({ page }) => {
    await page.goto("/uz/news");
    await page.locator('a[href*="/news/"]').first().click();
    await expect(page).toHaveURL(/\/uz\/news\/[a-z0-9-]+/);
    await expect(page.locator("article h1")).toBeVisible();
  });
});

test.describe("language switcher", () => {
  test("preserves the equivalent page across locales", async ({ page }) => {
    await page.goto("/uz/team");
    await page.getByRole("button", { name: "Рус" }).click();
    await expect(page).toHaveURL(/\/ru\/team/);
    await expect(page.locator("h1")).toContainText("Наша команда");
    await page.getByRole("button", { name: "Eng" }).click();
    await expect(page).toHaveURL(/\/en\/team/);
    await expect(page.locator("h1")).toContainText("Our team");
  });

  test("preserves detail pages across locales", async ({ page }) => {
    await page.goto("/uz/team/valiev-xojiakbar");
    await page.getByRole("button", { name: "Eng" }).click();
    await expect(page).toHaveURL(/\/en\/team\/valiev-xojiakbar/);
    await expect(page.getByText("Head of certification body")).toBeVisible();
  });
});

test.describe("admin protection", () => {
  test.beforeAll(ensureE2eAdmin);
  test.afterAll(removeE2eAdmin);

  test("redirects to login when logged out", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(page.getByRole("button", { name: /Kirish|Sign in/ })).toBeVisible();
  });

  test("admin login works with seeded credentials", async ({ page }) => {
    await page.goto("/admin/login");
    await page.fill('input[name="email"]', E2E_ADMIN_EMAIL);
    await page.fill('input[name="password"]', E2E_ADMIN_PASSWORD);
    await page.getByRole("button", { name: /Kirish|Sign in/ }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole("heading", { name: /Boshqaruv paneli|Dashboard/ })).toBeVisible();
  });
});
