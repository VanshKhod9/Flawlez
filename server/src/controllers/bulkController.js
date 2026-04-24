import nodemailer from "nodemailer";

const BULK_EMAIL_CONFIG_ERROR =
  "Bulk inquiry email is not configured. Add SMTP credentials and BULK_LEADS_TO_EMAIL on the backend.";

let transporter;

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const getTransporter = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, BULK_LEADS_TO_EMAIL } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !BULK_LEADS_TO_EMAIL) {
    throw new Error(BULK_EMAIL_CONFIG_ERROR);
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: String(process.env.SMTP_SECURE || "").toLowerCase() === "true",
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  }

  return transporter;
};

const normalizeValue = (value) => String(value || "").trim();

const validateEmail = (value) => /\S+@\S+\.\S+/.test(String(value || "").trim());

const buildMailHtml = ({
  company,
  contactPerson,
  email,
  phone,
  orderType,
  monthlyVolume,
  message,
}) => {
  const rows = [
    ["Company / Brand", company],
    ["Contact Person", contactPerson],
    ["Email", email],
    ["Phone / WhatsApp", phone],
    ["Business Type", orderType],
    ["Monthly Volume (kg)", monthlyVolume],
  ]
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:10px 12px;border:1px solid #e8ddd0;font-weight:700;color:#2f241c;background:#faf4ee;">${escapeHtml(label)}</td>
          <td style="padding:10px 12px;border:1px solid #e8ddd0;color:#3b2d23;">${escapeHtml(value)}</td>
        </tr>
      `
    )
    .join("");

  return `
    <div style="font-family:Arial,sans-serif;background:#f7f1ea;padding:24px;color:#2f241c;">
      <div style="max-width:720px;margin:0 auto;background:#fffaf5;border-radius:20px;overflow:hidden;border:1px solid #eadfd3;">
        <div style="padding:24px 28px;background:linear-gradient(135deg,#5d2d1b,#8b5438);color:#fff7f1;">
          <p style="margin:0 0 8px;font-size:12px;letter-spacing:.16em;text-transform:uppercase;opacity:.8;">Flawlez Wholesale</p>
          <h1 style="margin:0;font-size:28px;line-height:1.1;">New bulk inquiry received</h1>
        </div>
        <div style="padding:24px 28px;">
          <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
            ${rows}
          </table>
          <div style="padding:18px 20px;border-radius:16px;background:#f5ede5;border:1px solid #eadfd3;">
            <p style="margin:0 0 8px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#7b6349;font-weight:700;">Coffee program notes</p>
            <p style="margin:0;white-space:pre-wrap;line-height:1.7;color:#3b2d23;">${escapeHtml(
              message || "No additional notes were provided."
            )}</p>
          </div>
        </div>
      </div>
    </div>
  `;
};

const buildMailText = ({
  company,
  contactPerson,
  email,
  phone,
  orderType,
  monthlyVolume,
  message,
}) => `
New Flawlez bulk inquiry

Company / Brand: ${company}
Contact Person: ${contactPerson}
Email: ${email}
Phone / WhatsApp: ${phone}
Business Type: ${orderType}
Monthly Volume (kg): ${monthlyVolume}

Coffee program notes:
${message || "No additional notes were provided."}
`.trim();

export const submitBulkInquiry = async (req, res) => {
  const company = normalizeValue(req.body.company);
  const contactPerson = normalizeValue(req.body.contactPerson);
  const email = normalizeValue(req.body.email).toLowerCase();
  const phone = normalizeValue(req.body.phone);
  const orderType = normalizeValue(req.body.orderType);
  const monthlyVolume = normalizeValue(req.body.monthlyVolume);
  const message = normalizeValue(req.body.message);

  if (!company || !contactPerson || !email || !phone || !orderType || !monthlyVolume) {
    return res.status(400).json({
      success: false,
      message: "Please fill in all required bulk inquiry fields.",
    });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({
      success: false,
      message: "Please enter a valid email address.",
    });
  }

  try {
    const mailer = getTransporter();
    const to = process.env.BULK_LEADS_TO_EMAIL;
    const from = process.env.BULK_LEADS_FROM_EMAIL || process.env.SMTP_USER;
    const subject = `New bulk inquiry from ${company}`;

    await mailer.sendMail({
      from,
      to,
      replyTo: email,
      subject,
      text: buildMailText({
        company,
        contactPerson,
        email,
        phone,
        orderType,
        monthlyVolume,
        message,
      }),
      html: buildMailHtml({
        company,
        contactPerson,
        email,
        phone,
        orderType,
        monthlyVolume,
        message,
      }),
    });

    return res.json({
      success: true,
      message: "Bulk inquiry sent successfully. We’ll get back to you within one business day.",
    });
  } catch (error) {
    console.error("Bulk inquiry email error:", error);

    const message =
      error.message === BULK_EMAIL_CONFIG_ERROR
        ? BULK_EMAIL_CONFIG_ERROR
        : "Unable to send your bulk inquiry right now. Please try again shortly.";

    return res.status(500).json({
      success: false,
      message,
    });
  }
};
