"use server";

import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { COMPANY_RECEIVER_EMAIL, sendCompanyEmail } from "@/lib/mail";
import { logError, logWarn } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";

export type ComplaintState = { ok?: boolean; error?: string };

const SUBMISSION_TYPE_UZ: Record<string, string> = {
  complaint: "Shikoyat",
  appeal: "Apellyatsiya",
};

const RELATED_ACTIVITY_UZ: Record<string, string> = {
  certification: "Sertifikatlashtirish ishlari",
  testing: "Sinov laboratoriyasi ishlari",
  surveillance: "Inspeksiya nazorati",
  decision: "Sertifikatlashtirish organi qarori",
  other: "Boshqa",
};

export async function submitComplaint(
  _prev: ComplaintState | undefined,
  formData: FormData
): Promise<ComplaintState> {
  if (String(formData.get("website") ?? "") !== "") return { ok: true };
  if (!(await checkRateLimit("complaint-form", 3, 10 * 60 * 1000))) {
    return { error: "rate-limit" };
  }

  const data = {
    submissionType: clean(formData.get("submissionType"), 40),
    applicantName: clean(formData.get("applicantName"), 200),
    organization: clean(formData.get("organization"), 200),
    applicantRole: clean(formData.get("applicantRole"), 160),
    phone: clean(formData.get("phone"), 50),
    email: clean(formData.get("email"), 200),
    postalAddress: clean(formData.get("postalAddress"), 400),
    relatedActivity: clean(formData.get("relatedActivity"), 80),
    referenceNumber: clean(formData.get("referenceNumber"), 160),
    decisionDate: clean(formData.get("decisionDate"), 40),
    eventDate: clean(formData.get("eventDate"), 40),
    subject: clean(formData.get("subject"), 240),
    details: clean(formData.get("details"), 5000),
    grounds: clean(formData.get("grounds"), 3000),
    requestedOutcome: clean(formData.get("requestedOutcome"), 2000),
    attachmentsDescription: clean(formData.get("attachmentsDescription"), 2000),
    signatureName: clean(formData.get("signatureName"), 200),
    locale: clean(formData.get("locale"), 5) || "uz",
  };

  if (
    !["complaint", "appeal"].includes(data.submissionType) ||
    !data.applicantName ||
    !data.phone ||
    !data.email ||
    !data.subject ||
    !data.details ||
    !data.signatureName
  ) {
    return { error: "validation" };
  }

  const typeLabel = SUBMISSION_TYPE_UZ[data.submissionType] ?? data.submissionType;
  const documentBuffer = await buildComplaintDocx(data);
  const subject = `Yangi ${typeLabel.toLowerCase()}: ${data.subject} - ${data.applicantName}`;

  try {
    const mail = await sendCompanyEmail({
      subject,
      text: [
      `Sayt orqali yangi ${typeLabel.toLowerCase()} yuborildi.`,
      "",
      `Murojaat turi: ${typeLabel}`,
      `Murojaatchi: ${data.applicantName}`,
      `Tashkilot: ${data.organization || "Ko'rsatilmagan"}`,
      `Maqomi: ${data.applicantRole || "Ko'rsatilmagan"}`,
      `Telefon: ${data.phone}`,
      `Email: ${data.email}`,
      `Pochta manzili: ${data.postalAddress || "Ko'rsatilmagan"}`,
      `Bog'liq faoliyat: ${relatedActivityLabel(data.relatedActivity)}`,
      `Hujjat/qaror/sertifikat raqami: ${data.referenceNumber || "Ko'rsatilmagan"}`,
      `Qaror sanasi: ${data.decisionDate || "Ko'rsatilmagan"}`,
      `Voqea sanasi: ${data.eventDate || "Ko'rsatilmagan"}`,
      "",
      `Mavzu: ${data.subject}`,
      "",
      "Murojaat mazmuni:",
      data.details,
      "",
      "Asoslar:",
      data.grounds || "Ko'rsatilmagan",
      "",
      "So'ralayotgan natija:",
      data.requestedOutcome || "Ko'rsatilmagan",
      "",
      "Ilovalar:",
      data.attachmentsDescription || "Ko'rsatilmagan",
      "",
      `Imzo uchun F.I.Sh.: ${data.signatureName}`,
      `Qabul qiluvchi: ${COMPANY_RECEIVER_EMAIL}`,
      "",
      "To'ldirilgan DOCX shakli ushbu xatga ilova qilingan.",
      ].join("\n"),
      html: buildComplaintHtml(data, typeLabel),
      attachments: [
        {
          filename: `${data.submissionType}-${Date.now()}.docx`,
          content: documentBuffer,
          contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        },
      ],
    });
    if (mail.skipped) {
      logWarn("complaint.email_skipped", { submission_type: data.submissionType });
      return { error: "delivery" };
    }
  } catch (error) {
    logError("complaint.email_failed", error, { submission_type: data.submissionType });
    return { error: "delivery" };
  }

  return { ok: true };
}

function clean(value: FormDataEntryValue | null, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

async function buildComplaintDocx(data: Record<string, string>) {
  const typeLabel = SUBMISSION_TYPE_UZ[data.submissionType] ?? data.submissionType;
  const rows: Array<[string, string]> = [
    ["Murojaat turi", typeLabel],
    ["F.I.Sh.", data.applicantName],
    ["Tashkilot", data.organization || "Ko'rsatilmagan"],
    ["Murojaatchi maqomi", data.applicantRole || "Ko'rsatilmagan"],
    ["Telefon", data.phone],
    ["Email", data.email],
    ["Pochta manzili", data.postalAddress || "Ko'rsatilmagan"],
    ["Bog'liq faoliyat", relatedActivityLabel(data.relatedActivity)],
    ["Hujjat/qaror/sertifikat raqami", data.referenceNumber || "Ko'rsatilmagan"],
    ["Qaror sanasi", data.decisionDate || "Ko'rsatilmagan"],
    ["Voqea sanasi", data.eventDate || "Ko'rsatilmagan"],
    ["Mavzu", data.subject],
  ];

  const doc = new Document({
    creator: "SQA Group website",
    title: `${typeLabel} - ${data.applicantName}`,
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 160 },
            children: [new TextRun({ text: "Standart and Quality Assessment Group MChJ", bold: true })],
          }),
          new Paragraph({
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 },
            children: [new TextRun({ text: typeLabel.toUpperCase(), bold: true })],
          }),
          new Paragraph({
            spacing: { after: 240 },
            children: [
              new TextRun(
                "Ushbu hujjat sayt orqali yuborilgan yozma murojaat asosida avtomatik shakllantirildi."
              ),
            ],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: rows.map(
              ([label, value]) =>
                new TableRow({
                  children: [
                    new TableCell({
                      width: { size: 32, type: WidthType.PERCENTAGE },
                      shading: { fill: "F4F6FB" },
                      borders: cellBorders(),
                      children: [new Paragraph({ children: [new TextRun({ text: label, bold: true })] })],
                    }),
                    new TableCell({
                      width: { size: 68, type: WidthType.PERCENTAGE },
                      borders: cellBorders(),
                      children: [new Paragraph(value)],
                    }),
                  ],
                })
            ),
          }),
          sectionHeading("Murojaat mazmuni"),
          bodyParagraph(data.details),
          sectionHeading("Apellyatsiya/shikoyat asoslari"),
          bodyParagraph(data.grounds || "Ko'rsatilmagan"),
          sectionHeading("So'ralayotgan natija"),
          bodyParagraph(data.requestedOutcome || "Ko'rsatilmagan"),
          sectionHeading("Ilovalar yoki asoslovchi hujjatlar"),
          bodyParagraph(data.attachmentsDescription || "Ko'rsatilmagan"),
          new Paragraph({ spacing: { before: 360 }, children: [new TextRun(`Sana: ${new Date().toLocaleDateString("uz-UZ")}`)] }),
          new Paragraph({ spacing: { before: 160 }, children: [new TextRun(`Imzo uchun F.I.Sh.: ${data.signatureName}`)] }),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}

function sectionHeading(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 100 },
    children: [new TextRun({ text, bold: true, color: "2003BD" })],
  });
}

function bodyParagraph(text: string) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun(text)],
  });
}

function cellBorders() {
  return {
    top: { style: BorderStyle.SINGLE, size: 1, color: "D9DFEA" },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: "D9DFEA" },
    left: { style: BorderStyle.SINGLE, size: 1, color: "D9DFEA" },
    right: { style: BorderStyle.SINGLE, size: 1, color: "D9DFEA" },
  };
}

function buildComplaintHtml(data: Record<string, string>, typeLabel: string) {
  const rows: Array<[string, string]> = [
    ["Murojaat turi", typeLabel],
    ["F.I.Sh.", data.applicantName],
    ["Tashkilot", data.organization || "Ko'rsatilmagan"],
    ["Maqomi", data.applicantRole || "Ko'rsatilmagan"],
    ["Telefon", data.phone],
    ["Email", data.email],
    ["Pochta manzili", data.postalAddress || "Ko'rsatilmagan"],
    ["Bog'liq faoliyat", relatedActivityLabel(data.relatedActivity)],
    ["Raqam", data.referenceNumber || "Ko'rsatilmagan"],
    ["Qaror sanasi", data.decisionDate || "Ko'rsatilmagan"],
    ["Voqea sanasi", data.eventDate || "Ko'rsatilmagan"],
  ];

  return `
    <div style="font-family:Arial,sans-serif;line-height:1.55;color:#1f2937">
      <h2 style="margin:0 0 12px;color:#2003bd">Sayt orqali yangi ${escapeHtml(typeLabel.toLowerCase())} qabul qilindi</h2>
      <p>To'ldirilgan DOCX shakli ushbu xatga ilova qilingan.</p>
      <table style="border-collapse:collapse;width:100%;max-width:760px">
        <tbody>
          ${rows
            .map(
              ([label, value]) =>
                `<tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:700">${escapeHtml(label)}</td><td style="padding:8px;border:1px solid #e5e7eb">${escapeHtml(value)}</td></tr>`
            )
            .join("")}
        </tbody>
      </table>
      <h3 style="margin:18px 0 8px">Mavzu</h3>
      <p>${escapeHtml(data.subject)}</p>
      <h3 style="margin:18px 0 8px">Murojaat mazmuni</h3>
      <div style="white-space:pre-wrap;border:1px solid #e5e7eb;background:#f8fafc;padding:12px">${escapeHtml(data.details)}</div>
      <h3 style="margin:18px 0 8px">Asoslar</h3>
      <div style="white-space:pre-wrap;border:1px solid #e5e7eb;background:#f8fafc;padding:12px">${escapeHtml(data.grounds || "Ko'rsatilmagan")}</div>
      <h3 style="margin:18px 0 8px">So'ralayotgan natija</h3>
      <div style="white-space:pre-wrap;border:1px solid #e5e7eb;background:#f8fafc;padding:12px">${escapeHtml(data.requestedOutcome || "Ko'rsatilmagan")}</div>
      <h3 style="margin:18px 0 8px">Ilovalar</h3>
      <div style="white-space:pre-wrap;border:1px solid #e5e7eb;background:#f8fafc;padding:12px">${escapeHtml(data.attachmentsDescription || "Ko'rsatilmagan")}</div>
    </div>
  `;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function relatedActivityLabel(value: string) {
  return RELATED_ACTIVITY_UZ[value] ?? (value || "Ko'rsatilmagan");
}
