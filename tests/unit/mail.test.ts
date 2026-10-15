import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ createTransport: vi.fn(), sendMail: vi.fn(), logWarn: vi.fn() }));
vi.mock("nodemailer", () => ({ default: { createTransport: mocks.createTransport } }));
vi.mock("@/lib/logger", () => ({ logWarn: mocks.logWarn }));

import { sendCompanyEmail } from "../../src/lib/mail";

const message = { subject: "Website request\r\nTest", text: "Request details", html: "<p>Request details</p>" };

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("SMTP_HOST", "smtp.mail.ru");
  vi.stubEnv("SMTP_PORT", "465");
  vi.stubEnv("SMTP_USER", "info@sqa.uz");
  vi.stubEnv("SMTP_PASSWORD", "test-app-password");
  vi.stubEnv("SMTP_FROM", "SQA Group <info@sqa.uz>");
  mocks.createTransport.mockReturnValue({ sendMail: mocks.sendMail });
  mocks.sendMail.mockResolvedValue({ accepted: ["info@sqa.uz"], messageId: "test-message" });
});
afterEach(() => vi.unstubAllEnvs());

describe("company mailbox delivery", () => {
  it("sends text, HTML, and generated DOCX attachments to the company over TLS", async () => {
    const attachment = { filename: "complaint.docx", content: Buffer.from("test document"), contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" };
    await expect(sendCompanyEmail({ ...message, attachments: [attachment] })).resolves.toEqual({ sent: true, skipped: false, id: "test-message" });
    expect(mocks.createTransport).toHaveBeenCalledWith(expect.objectContaining({ host: "smtp.mail.ru", port: 465, secure: true, disableFileAccess: true, disableUrlAccess: true }));
    expect(mocks.sendMail).toHaveBeenCalledWith({ ...message, subject: "Website request Test", from: "SQA Group <info@sqa.uz>", to: "info@sqa.uz", attachments: [attachment] });
  });

  it("requires STARTTLS when using port 587", async () => {
    vi.stubEnv("SMTP_PORT", "587");
    await sendCompanyEmail(message);
    expect(mocks.createTransport).toHaveBeenCalledWith(expect.objectContaining({ port: 587, secure: false, requireTLS: true }));
  });

  it("does not attempt delivery without the app password", async () => {
    vi.stubEnv("SMTP_PASSWORD", "");
    await expect(sendCompanyEmail(message)).resolves.toEqual({ sent: false, skipped: true });
    expect(mocks.createTransport).not.toHaveBeenCalled();
  });

  it("refuses a configuration that could send without TLS", async () => {
    vi.stubEnv("SMTP_PORT", "25");
    await expect(sendCompanyEmail(message)).rejects.toThrow("SMTP requires TLS");
    expect(mocks.sendMail).not.toHaveBeenCalled();
  });

  it("does not report success when the company recipient was rejected", async () => {
    mocks.sendMail.mockResolvedValue({ accepted: [], rejected: ["info@sqa.uz"], messageId: "test" });
    await expect(sendCompanyEmail(message)).rejects.toThrow("SMTP did not accept the company recipient");
  });

  it("keeps server responses and credentials out of logged errors", async () => {
    mocks.sendMail.mockRejectedValue(Object.assign(new Error("sensitive SMTP response"), { code: "EAUTH" }));
    await expect(sendCompanyEmail(message)).rejects.toThrow(/^SMTP delivery failed: EAUTH$/);
  });
});
