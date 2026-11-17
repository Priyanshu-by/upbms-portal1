const path = require("node:path");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");

/**
 * Dynamically resolves Gmail credentials, reloading .env if needed
 * so runtime edits to .env take effect immediately without requiring manual server restart.
 */
function getCredentials() {
  let user = "";
  let pass = "";

  // 1. First try reading from backend/.env (canonical source)
  try {
    dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });
    dotenv.config({ path: path.join(__dirname, "..", ".env"), override: true });
    user = process.env.GMAIL_USER;
    pass = process.env.GMAIL_APP_PASSWORD;
  } catch {
    // fallback
  }

  // If pass still empty, inspect backend/.env directly
  if (!pass || !pass.trim()) {
    try {
      const fs = require("node:fs");
      const envPath = path.join(__dirname, "..", ".env");
      if (fs.existsSync(envPath)) {
        const text = fs.readFileSync(envPath, "utf-8");
        const matchUser = text.match(/^\s*GMAIL_USER\s*=\s*(.+)$/m);
        const matchPass = text.match(/^\s*GMAIL_APP_PASSWORD\s*=\s*(.+)$/m);
        if (matchUser && matchUser[1]) user = matchUser[1].trim();
        if (matchPass && matchPass[1]) pass = matchPass[1].trim();
      }
    } catch { }
  }

  return {
    user: (user || "upbmsofficial@gmail.com").trim(),
    pass: (pass || "").trim().replace(/\s+/g, ""),
  };
}

/**
 * Checks if Gmail SMTP credentials are configured.
 */
function isGmailConfigured() {
  const { user, pass } = getCredentials();
  return Boolean(user && pass && pass.length >= 8);
}

/**
 * Create Gmail SMTP transporter using official Gmail configuration.
 */
function createTransporter() {
  const { user, pass } = getCredentials();

  if (!pass) {
    throw new Error(
      "Official Gmail sender is waiting for configuration. Please set GMAIL_APP_PASSWORD in backend/.env to deliver OTPs."
    );
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass,
    },
  });
}

/**
 * Sends a 6-digit OTP email using official UPBMS template.
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.otp - 6-digit verification code
 * @param {number} [options.expiresMinutes=5] - Expiration time in minutes
 */
async function sendEmail({ to, otp, expiresMinutes = 5 }) {
  const senderEmail = process.env.GMAIL_USER || "upbmsofficial@gmail.com";
  const transporter = createTransporter();

  const mailOptions = {
    from: `"उत्तर प्रदेश बैंक मित्र संघ (UPBMS)" <${senderEmail}>`,
    to: to.trim().toLowerCase(),
    subject: `🔐 आपका UPBMS लॉगिन OTP कोड: ${otp}`,
    text: `उत्तर प्रदेश बैंक मित्र संघ (UPBMS) में आपका स्वागत है।\n\nआपका 6-अंकीय लॉगिन सत्यापन कोड है: ${otp}\n\nयह कोड ${expiresMinutes} मिनट के लिए मान्य है। कृपया इसे किसी के साथ साझा न करें।\n\nयदि आपने यह अनुरोध नहीं किया था, तो कृपया इस ईमेल को अनदेखा करें।\n\nआधिकारिक पोर्टल: UPBMS Digital Portal`,
    html: `
      <!DOCTYPE html>
      <html lang="hi">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>UPBMS Verification Code</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 24px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" style="max-width: 540px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
                <!-- Header Banner -->
                <tr>
                  <td style="background: linear-gradient(135deg, #0a1f44 0%, #1e3a8a 100%); padding: 28px 24px; text-align: center;">
                    <div style="font-size: 32px; line-height: 1; margin-bottom: 8px;">🏛️</div>
                    <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px;">उत्तर प्रदेश बैंक मित्र संघ</h1>
                    <p style="color: #93c5fd; margin: 4px 0 0 0; font-size: 13px;">Uttar Pradesh Bank Mitra Sangh • Digital Portal</p>
                  </td>
                </tr>

                <!-- Content Body -->
                <tr>
                  <td style="padding: 32px 28px;">
                    <h2 style="color: #0f172a; font-size: 18px; margin: 0 0 12px 0; font-weight: 600;">
                      पोर्टल लॉगिन सत्यापन कोड (One-Time Password)
                    </h2>
                    <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
                      नमस्ते, आपने <b>UPBMS डिजिटल पोर्टल</b> में ईमेल द्वारा लॉगिन करने का अनुरोध किया है। अपना सत्र सत्यापित करने के लिए कृपया नीचे दिया गया 6-अंकीय कोड दर्ज करें:
                    </p>

                    <!-- OTP Code Display Card -->
                    <div style="background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%); border: 2px dashed #3b82f6; border-radius: 10px; padding: 20px; text-align: center; margin: 0 0 24px 0;">
                      <div style="font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">
                        आपका 6-अंकीय सत्यापन कोड (OTP)
                      </div>
                      <div style="font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #1e3a8a; font-family: 'Courier New', Courier, monospace;">
                        ${otp}
                      </div>
                      <div style="margin-top: 8px; font-size: 12px; color: #ef4444; font-weight: 500;">
                        ⏱️ यह कोड केवल ${expiresMinutes} मिनट के लिए वैध है
                      </div>
                    </div>

                    <!-- Security Alert -->
                    <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 4px; margin-bottom: 24px;">
                      <p style="margin: 0; font-size: 12px; color: #92400e; line-height: 1.5;">
                        <b>सुरक्षा चेतावनी:</b> यह कोड किसी के साथ साझा न करें। UPBMS की कोई भी टीम या प्रतिनिधि आपसे कभी भी आपका OTP नहीं मांगते।
                      </p>
                    </div>

                    <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 0;">
                      यदि आपने इस लॉगिन के लिए अनुरोध नहीं किया है, तो आप इस ईमेल को सुरक्षित रूप से अनदेखा कर सकते हैं।
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 24px; text-align: center;">
                    <p style="color: #94a3b8; font-size: 12px; margin: 0 0 4px 0;">
                      उत्तर प्रदेश बैंक मित्र संघ (पंजीकृत) • डिजिटल नियंत्रण कक्ष
                    </p>
                    <p style="color: #94a3b8; font-size: 11px; margin: 0;">
                      आधिकारिक ईमेल: <a href="mailto:${senderEmail}" style="color: #3b82f6; text-decoration: none;">${senderEmail}</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  return { success: true, messageId: info.messageId };
}

module.exports = {
  sendEmail,
  isGmailConfigured,
};
