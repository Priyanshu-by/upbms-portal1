const nodemailer = require("nodemailer");
const crypto = require("crypto");
const path = require("node:path");
const dotenv = require("dotenv");

function getSmtpCredentials() {
  try {
    dotenv.config({ path: path.join(__dirname, "..", "..", ".env"), override: true });
  } catch {}
  return {
    user: String(process.env.GMAIL_USER || process.env.SMTP_USER || "upbmsofficial@gmail.com").trim(),
    pass: String(process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASSWORD || process.env.SMTP_PASS || "").trim().replace(/\s+/g, ""),
  };
}

const smtpHost = String(process.env.SMTP_HOST || "smtp.gmail.com").trim();
const smtpPort = Number(process.env.SMTP_PORT) || 465;

// In-memory OTP storage: key = email.toLowerCase(), value = { otp, expiresAt, attempts }
const otpStore = new Map();

const TOKEN_SECRET = process.env.JWT_SECRET || process.env.ADMIN_PIN || "upbms_secure_reg_secret_key_2026";

/**
 * Issues a cryptographically signed registration token upon successful email OTP verification.
 * Stateless and persistent across server reloads.
 * @param {string} toEmail
 * @returns {string} token
 */
function generateRegistrationToken(toEmail) {
  const email = String(toEmail || "").trim().toLowerCase();
  const timestamp = Date.now();
  const signature = crypto
    .createHmac("sha256", TOKEN_SECRET)
    .update(`${email}:${timestamp}`)
    .digest("hex");
  return `reg_${timestamp}.${signature}`;
}

/**
 * Validates the cryptographically signed registration token.
 * Valid for 60 minutes. Does not get lost on server restarts.
 * @param {string} toEmail
 * @param {string} submittedToken
 * @returns {boolean}
 */
function verifyRegistrationToken(toEmail, submittedToken) {
  const email = String(toEmail || "").trim().toLowerCase();
  const token = String(submittedToken || "").trim();
  if (!email || !token || !token.startsWith("reg_")) return false;

  const raw = token.slice(4);
  const parts = raw.split(".");
  if (parts.length !== 2) return false;

  const [timeStr, signature] = parts;
  const timestamp = parseInt(timeStr, 10);
  if (isNaN(timestamp)) return false;

  // Valid for 60 minutes
  if (Date.now() - timestamp > 60 * 60 * 1000 || timestamp > Date.now() + 60000) {
    return false;
  }

  const expectedSig = crypto
    .createHmac("sha256", TOKEN_SECRET)
    .update(`${email}:${timestamp}`)
    .digest("hex");

  try {
    const sigBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expectedBuf.length) return false;
    return crypto.timingSafeEqual(sigBuf, expectedBuf);
  } catch {
    return false;
  }
}

function isGmailConfigured() {
  const { user, pass } = getSmtpCredentials();
  return Boolean(
    user &&
    pass &&
    user !== "your_email@gmail.com" &&
    pass !== "your_app_password" &&
    pass.length >= 8
  );
}

function isEmailServiceConfigured() {
  return Boolean(
    process.env.BREVO_API_KEY ||
    process.env.RESEND_API_KEY ||
    isGmailConfigured()
  );
}

async function sendViaBrevo(toEmail, subject, html) {
  const apiKey = String(process.env.BREVO_API_KEY || "").trim();
  if (!apiKey) return null;
  const senderEmail = String(process.env.BREVO_SENDER_EMAIL || process.env.GMAIL_USER || "upbmsofficial@gmail.com").trim();
  const senderName = "उत्तर प्रदेश बैंक मित्र संघ";
  const resp = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "accept": "application/json",
      "api-key": apiKey,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email: toEmail }],
      subject,
      htmlContent: html
    })
  });
  if (!resp.ok) {
    const errData = await resp.json().catch(() => ({}));
    throw new Error(errData.message || `Brevo HTTP ${resp.status}`);
  }
  return true;
}

async function sendViaResend(toEmail, subject, html) {
  const apiKey = String(process.env.RESEND_API_KEY || "").trim();
  if (!apiKey) return null;
  const fromEmail = String(process.env.RESEND_FROM || "UPBMS <onboarding@resend.dev>").trim();
  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [toEmail],
      subject,
      html
    })
  });
  if (!resp.ok) {
    const errData = await resp.json().catch(() => ({}));
    throw new Error(errData.message || `Resend HTTP ${resp.status}`);
  }
  return true;
}

function createTransporter() {
  if (!isGmailConfigured()) return null;
  const { user, pass } = getSmtpCredentials();
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user,
      pass,
    },
    connectionTimeout: 5000, // 5s timeout to prevent long hangs on cloud free tiers
    greetingTimeout: 5000,
    socketTimeout: 7000
  });
}

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Sends a 6-digit verification code to the target email
 * @param {string} toEmail
 * @param {Object} options - { otp, memberName }
 */
async function sendOtpEmail(toEmail, options = {}) {
  const email = String(toEmail || "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    throw new Error("A valid email address is required to send verification code.");
  }

  const otp = options.otp || generateOtp();
  const memberName = options.memberName || "सम्मानित सदस्य";
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  // Save in store
  otpStore.set(email, {
    otp,
    expiresAt,
    attempts: 0
  });

  const isRegistration = options.purpose === "registration";
  const isReset = options.purpose === "password_reset";

  let emailHeadlineHi = "उत्तर प्रदेश बैंक मित्र संघ पोर्टल पर लॉगिन सत्यापन हेतु आपका 6-अंकीय ओटीपी (One-Time Password) नीचे दिया गया है:";
  let emailSubject = `[UPBMS] सदस्यता सत्यापन कोड (OTP): ${otp}`;

  if (isRegistration) {
    emailHeadlineHi = "उत्तर प्रदेश बैंक मित्र संघ में सदस्यता पंजीकरण सत्यापन हेतु आपका 6-अंकीय ओटीपी (One-Time Password) नीचे दिया गया है:";
    emailSubject = `[UPBMS] सदस्यता पंजीकरण सत्यापन कोड (Registration OTP): ${otp}`;
  } else if (isReset) {
    emailHeadlineHi = "उत्तर प्रदेश बैंक मित्र संघ पोर्टल पर अपना पासवर्ड रीसेट करने हेतु आपका 6-अंकीय सुरक्षा सत्यापन कोड (OTP) नीचे दिया गया है:";
    emailSubject = `[UPBMS] पासवर्ड रीसेट सत्यापन कोड (Password Reset OTP): ${otp}`;
  }

  // Build email HTML template once so Resend, Brevo, and SMTP share the exact same layout
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; border: 1.5px solid #0a2252; border-radius: 14px; overflow: hidden; background: #ffffff;">
      <div style="background: linear-gradient(135deg, #051331 0%, #0a2252 100%); color: #ffffff; padding: 24px; text-align: center;">
        <h2 style="margin: 0; color: #ffd166; font-size: 1.35rem;">उत्तर प्रदेश बैंक मित्र संघ (UPBMS)</h2>
        <p style="margin: 6px 0 0; font-size: 0.85rem; color: #f1f5f9;">Official Online Member Verification & Registration Portal</p>
      </div>
      <div style="padding: 28px 24px;">
        <p style="font-size: 1rem; color: #0a2252; font-weight: 700; margin-top: 0;">
          नमस्ते ${memberName},
        </p>
        <p style="font-size: 0.95rem; color: #334155; line-height: 1.5;">
          ${emailHeadlineHi}
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <div style="display: inline-block; background: #f8fafc; border: 2.5px dashed #0a2252; border-radius: 12px; padding: 14px 32px; font-size: 2rem; font-weight: 900; letter-spacing: 8px; color: #0a2252; font-family: monospace;">
            ${otp}
          </div>
        </div>
        <p style="font-size: 0.85rem; color: #64748b; text-align: center; margin-bottom: 20px;">
          ⚠️ यह कोड अगले <b>10 मिनट</b> के लिए मान्य है। कृपया यह कोड किसी के साथ साझा न करें।
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 0.8rem; color: #94a3b8; line-height: 1.4; margin: 0; text-align: center;">
          This is an automated security verification email from Uttar Pradesh Bank Mitra Sangh. If you did not request this code, please ignore this email.
        </p>
      </div>
    </div>
  `;

  // 1. PRIMARY: Resend REST API over HTTPS (Port 443 - works on Render Free Tier & locally)
  const resendKey = String(process.env.RESEND_API_KEY || "").trim();
  if (resendKey && !resendKey.includes("your_resend")) {
    try {
      await sendViaResend(email, emailSubject, html);
      console.log(`[EMAIL OTP (Resend HTTPS)] Successfully dispatched OTP to ${email}`);
      return { ok: true, provider: "resend" };
    } catch (err) {
      console.error("[EMAIL OTP (Resend HTTPS)] Error:", err.message);
      throw new Error(`ईमेल भेजने में विफल (Resend): ${err.message}`);
    }
  }

  // 2. SECONDARY: Brevo HTTP API over HTTPS
  const brevoKey = String(process.env.BREVO_API_KEY || "").trim();
  if (brevoKey) {
    try {
      await sendViaBrevo(email, emailSubject, html);
      console.log(`[EMAIL OTP (Brevo HTTPS)] Successfully dispatched OTP to ${email}`);
      return { ok: true, provider: "brevo" };
    } catch (err) {
      console.error("[EMAIL OTP (Brevo HTTPS)] Error:", err.message);
    }
  }

  // 3. FALLBACK: Gmail Nodemailer SMTP (local dev / paid servers)
  const transporter = createTransporter();
  if (transporter) {
    const { user } = getSmtpCredentials();
    try {
      await transporter.sendMail({
        from: `"उत्तर प्रदेश बैंक मित्र संघ" <${user}>`,
        to: email,
        subject: emailSubject,
        html
      });
      console.log(`[EMAIL OTP (SMTP)] Successfully dispatched OTP to ${email}`);
      return { ok: true, provider: "smtp" };
    } catch (err) {
      console.error("[EMAIL OTP] Transporter error:", err.message);
      throw new Error(`ईमेल भेजने में विफल (SMTP): ${err.message}`);
    }
  }

  throw new Error("ईमेल सेवा कॉन्फ़िगर नहीं है (RESEND_API_KEY सेट करें)। / Email service is not configured.");
}

/**
 * Validates a submitted OTP for a given email
 * @param {string} toEmail
 * @param {string} enteredOtp
 * @returns {boolean}
 */
function verifyOtp(toEmail, enteredOtp) {
  const email = String(toEmail || "").trim().toLowerCase();
  const record = otpStore.get(email);
  if (!record) {
    return { ok: false, error: "ओटीपी एक्सपायर हो चुका है या दोबारा अनुरोध करें। / OTP expired or not found." };
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(email);
    return { ok: false, error: "ओटीपी की समय सीमा (10 मिनट) समाप्त हो चुकी है। नया ओटीपी मंगाएं। / OTP expired." };
  }

  record.attempts = (record.attempts || 0) + 1;
  if (record.attempts > 5) {
    otpStore.delete(email);
    return { ok: false, error: "अधिकतम प्रयास सीमा समाप्त। कृपया नया ओटीपी प्राप्त करें। / Max attempts exceeded." };
  }

  const cleanEntered = String(enteredOtp || "").trim();
  if (cleanEntered === String(record.otp).trim()) {
    otpStore.delete(email);
    return { ok: true };
  }

  return { ok: false, error: "गलत ओटीपी कोड! कृपया सही 6-अंकीय कोड दर्ज करें। / Invalid OTP code." };
}

module.exports = {
  sendOtpEmail,
  verifyOtp,
  generateRegistrationToken,
  verifyRegistrationToken,
  isGmailConfigured,
  isEmailServiceConfigured,
  generateOtp
};
