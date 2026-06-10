export const runtime = "nodejs";

import { z } from "zod";
import { Resend } from "resend";

const SubmissionSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(200),
  affiliation: z.string().max(200).optional(),
  submission_type: z.enum(["new", "correction", "missing", "other"]),
  compound_name: z.string().min(1).max(200),
  dst_id: z.string().max(20).optional(),
  doi: z.string().max(500).refine(
    (val) => {
      if (!val) return true;
      try {
        new URL(val);
        return true;
      } catch {
        return val.startsWith("10.");
      }
    },
    { message: "Must be a valid URL or DOI (starting with 10.)" }
  ),
  species_model: z.string().max(200).optional(),
  description: z.string().min(20).max(5000),
  missing_or_incorrect: z.string().max(5000).optional(),
  honeypot: z.string().optional(),
});

const TYPE_LABELS: Record<string, string> = {
  new: "New Intervention",
  correction: "Data Correction",
  missing: "Missing Data",
  other: "Other",
};

function buildEmailHtml(data: z.infer<typeof SubmissionSchema>): string {
  const timestamp = new Date().toISOString();
  const typeLabel = TYPE_LABELS[data.submission_type] || data.submission_type;

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    h1 { color: #059669; font-size: 24px; margin-bottom: 20px; }
    .badge { display: inline-block; background: #059669; color: white; padding: 4px 12px; border-radius: 4px; font-size: 14px; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { text-align: left; padding: 12px; border-bottom: 1px solid #e5e7eb; }
    th { background: #f9fafb; font-weight: 600; width: 30%; }
    td { background: white; }
    .description { white-space: pre-wrap; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <h1>DS Explorer Contribution</h1>
    <span class="badge">${typeLabel}</span>

    <table>
      <tr><th>Submitted</th><td>${timestamp}</td></tr>
      <tr><th>Name</th><td>${escapeHtml(data.name)}</td></tr>
      <tr><th>Email</th><td>${escapeHtml(data.email)}</td></tr>
      ${data.affiliation ? `<tr><th>Affiliation</th><td>${escapeHtml(data.affiliation)}</td></tr>` : ""}
      <tr><th>Type</th><td>${typeLabel}</td></tr>
      <tr><th>Compound</th><td>${escapeHtml(data.compound_name)}</td></tr>
      ${data.dst_id ? `<tr><th>DST ID</th><td>${escapeHtml(data.dst_id)}</td></tr>` : ""}
      <tr><th>DOI/Reference</th><td>${escapeHtml(data.doi)}</td></tr>
      ${data.species_model ? `<tr><th>Species/Model</th><td>${escapeHtml(data.species_model)}</td></tr>` : ""}
      <tr><th>Description</th><td class="description">${escapeHtml(data.description)}</td></tr>
      ${data.missing_or_incorrect ? `<tr><th>Missing/Incorrect</th><td class="description">${escapeHtml(data.missing_or_incorrect)}</td></tr>` : ""}
    </table>

    <div class="footer">
      This submission was sent from the DS Preclinical Therapeutics Explorer contribute form.
    </div>
  </div>
</body>
</html>`;
}

function buildEmailText(data: z.infer<typeof SubmissionSchema>): string {
  const timestamp = new Date().toISOString();
  const typeLabel = TYPE_LABELS[data.submission_type] || data.submission_type;

  const lines = [
    "DS Explorer Contribution",
    "========================",
    "",
    `Type: ${typeLabel}`,
    `Submitted: ${timestamp}`,
    "",
    "--- Submitter ---",
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    data.affiliation ? `Affiliation: ${data.affiliation}` : null,
    "",
    "--- Intervention ---",
    `Compound: ${data.compound_name}`,
    data.dst_id ? `DST ID: ${data.dst_id}` : null,
    `DOI/Reference: ${data.doi}`,
    data.species_model ? `Species/Model: ${data.species_model}` : null,
    "",
    "--- Description ---",
    data.description,
    "",
    data.missing_or_incorrect ? "--- Missing/Incorrect ---" : null,
    data.missing_or_incorrect || null,
  ];

  return lines.filter((l) => l !== null).join("\n");
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = SubmissionSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { ok: false, error: "Invalid submission", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    if (data.honeypot && data.honeypot.length > 0) {
      console.log("[/api/contribute] Honeypot triggered, ignoring submission");
      return Response.json({ ok: true });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const notifyTo = process.env.CONTRIBUTE_NOTIFY_TO;

    if (!apiKey || !notifyTo) {
      console.error("[/api/contribute] Missing RESEND_API_KEY or CONTRIBUTE_NOTIFY_TO");
      return Response.json({ ok: false, error: "Email service not configured" }, { status: 500 });
    }

    const recipients = notifyTo.split(",").map((e) => e.trim()).filter(Boolean);
    if (recipients.length === 0) {
      console.error("[/api/contribute] No valid recipients in CONTRIBUTE_NOTIFY_TO");
      return Response.json({ ok: false, error: "No recipients configured" }, { status: 500 });
    }

    const resend = new Resend(apiKey);
    const typeLabel = TYPE_LABELS[data.submission_type] || data.submission_type;

    const { error } = await resend.emails.send({
      from: "DS Explorer Contributions <onboarding@resend.dev>",
      to: recipients,
      replyTo: data.email,
      subject: `[DS Explorer] ${typeLabel}: ${data.compound_name}`,
      html: buildEmailHtml(data),
      text: buildEmailText(data),
    });

    if (error) {
      console.error("[/api/contribute] Resend error:", JSON.stringify(error, null, 2));
      return Response.json({ ok: false, error: "Failed to send email", details: error.message }, { status: 500 });
    }

    console.log("[/api/contribute] Submission sent:", {
      type: data.submission_type,
      compound: data.compound_name,
      from: data.email,
    });

    return Response.json({ ok: true });
  } catch (err) {
    console.error("[/api/contribute] Error:", err);
    return Response.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
