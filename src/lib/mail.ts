import nodemailer from "nodemailer";
import { logWarn } from "@/lib/logger";

type Attachment = {
  filename: string;
  content: Buffer;
  contentType: string;
};

type CompanyMail = {
  subject: string;
  text: string;
  html: string;
  attachments?: Attachment[];
};

export const COMPANY_RECEIVER_EMAIL = process.env.COMPANY_RECEIVER_EMAIL ?? "info@sqa.uz";

export async function sendCompanyEmail({ subject, text, html, attachments = [] }: CompanyMail) {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;
  const from = process.env.SMTP_FROM || user;

  if (!host || !user || !password || !from) {
    logWarn("mail.not_configured");
    return { sent: false, skipped: true };
  }

  const port = Number(process.env.SMTP_PORT || "465");
  if (port !== 465 && port !== 587) throw new Error("SMTP requires TLS on port 465 or 587");

  const transport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    requireTLS: port === 587,
    auth: { user, pass: password },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
    disableFileAccess: true,
    disableUrlAccess: true,
  });

  let result;
  try {
    result = await transport.sendMail({
      from,
      to: COMPANY_RECEIVER_EMAIL,
      subject: subject.replace(/[\r\n]+/g, " "),
      text,
      html,
      attachments,
    });
  } catch (error) {
    // SMTP responses can contain addresses or other account details. Log only
    // the transport error code through the public form's existing logger.
    const code = error && typeof error === "object" && "code" in error ? String(error.code) : "unknown";
    throw new Error(`SMTP delivery failed: ${/^[A-Z_]+$/.test(code) ? code : "unknown"}`);
  }

  if (!result.accepted.some((address) =>
    (typeof address === "string" ? address : address.address).toLowerCase() === COMPANY_RECEIVER_EMAIL.toLowerCase()
  )) {
    throw new Error("SMTP did not accept the company recipient");
  }

  return { sent: true, skipped: false, id: result.messageId };
}
