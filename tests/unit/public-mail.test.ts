import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ create: vi.fn(), send: vi.fn(), revalidate: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { lead: { create: mocks.create } } }));
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: vi.fn().mockResolvedValue(true) }));
vi.mock("@/lib/logger", () => ({ logError: vi.fn(), logWarn: vi.fn() }));
vi.mock("@/lib/mail", () => ({ COMPANY_RECEIVER_EMAIL: "info@sqa.uz", sendCompanyEmail: mocks.send }));

import { submitApplication } from "../../src/lib/leads";
import { submitComplaint } from "../../src/lib/complaints";

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.create.mockResolvedValue({ id: "test-lead" });
  mocks.send.mockResolvedValue({ sent: true, skipped: false });
});

describe("public form notifications", () => {
  it("keeps an application in the admin inbox when mail delivery fails", async () => {
    mocks.send.mockRejectedValue(new Error("SMTP unavailable"));
    const result = await submitApplication(undefined, form({ name: "Website test", phone: "test", email: "test@example.com", serviceType: "testing", message: "Test application", locale: "uz" }));
    expect(result).toEqual({ ok: true });
    expect(mocks.create).toHaveBeenCalledOnce();
    expect(mocks.send).toHaveBeenCalledOnce();
    expect(mocks.create.mock.invocationCallOrder[0]).toBeLessThan(mocks.send.mock.invocationCallOrder[0]);
  });

  it.each(["complaint", "appeal"])("emails a %s with its completed DOCX attachment", async (submissionType) => {
    const result = await submitComplaint(undefined, form({ submissionType, applicantName: "Website test", phone: "test", email: "test@example.com", subject: "Test request", details: "Testing delivery", signatureName: "Website test", locale: "uz" }));
    expect(result).toEqual({ ok: true });
    const mail = mocks.send.mock.calls[0][0];
    expect(mail.text).toContain("Test request");
    expect(mail.attachments[0].filename).toMatch(new RegExp(`^${submissionType}-.*\\.docx$`));
    expect(mail.attachments[0].content.subarray(0, 2).toString()).toBe("PK");
  });

  it("shows a delivery error for a complaint if email is not configured", async () => {
    mocks.send.mockResolvedValue({ sent: false, skipped: true });
    const result = await submitComplaint(undefined, form({ submissionType: "complaint", applicantName: "Website test", phone: "test", email: "test@example.com", subject: "Test request", details: "Testing delivery", signatureName: "Website test" }));
    expect(result).toEqual({ error: "delivery" });
  });
});
