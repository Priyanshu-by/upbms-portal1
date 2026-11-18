const crypto = require("node:crypto");

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * UPBMS Dynamic Membership Pricing Logic (Calendar-Year System)
 * ─────────────────────────────────────────────────────────────────────────────
 * Fixed price of ₹50 per remaining month of the current calendar year.
 *
 * Formula: price = (13 - currentMonth) * 50
 * Validity: Always expires on December 31st of the current year (YYYY-12-31).
 *
 * Month       Remaining Months   Price     Validity
 * January     12                 ₹600      Jan 1 – Dec 31
 * February    11                 ₹550      Feb 1 – Dec 31
 * March       10                 ₹500      Mar 1 – Dec 31
 * April       9                  ₹450      Apr 1 – Dec 31
 * May         8                  ₹400      May 1 – Dec 31
 * June        7                  ₹350      Jun 1 – Dec 31
 * July        6                  ₹300      Jul 1 – Dec 31
 * August      5                  ₹250      Aug 1 – Dec 31
 * September   4                  ₹200      Sep 1 – Dec 31
 * October     3                  ₹150      Oct 1 – Dec 31
 * November    2                  ₹100      Nov 1 – Dec 31
 * December    1                  ₹50       Dec 1 – Dec 31
 * ─────────────────────────────────────────────────────────────────────────────
 */
function calculateMembershipFee(date = new Date()) {
  const now = new Date(date);
  const currentYear = now.getFullYear();
  // getMonth() returns 0 for Jan, 11 for Dec -> add 1 to get 1..12
  const currentMonth = now.getMonth() + 1;

  // Formula specified in requirements: price = (13 - currentMonth) * 50
  const remainingMonths = Math.max(1, 13 - currentMonth);
  const ratePerMonth = 50;
  const price = remainingMonths * ratePerMonth;
  const amountPaise = price * 100; // Razorpay operates in smallest currency unit (Paise)
  const validUntil = `${currentYear}-12-31`;

  const monthNamesEn = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const monthNamesHi = [
    "जनवरी", "फ़रवरी", "मार्च", "अप्रैल", "मई", "जून",
    "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"
  ];

  const monthNameEn = monthNamesEn[currentMonth - 1] || "Current Month";
  const monthNameHi = monthNamesHi[currentMonth - 1] || "वर्तमान माह";

  return {
    year: currentYear,
    currentMonth,
    monthNameEn,
    monthNameHi,
    remainingMonths,
    ratePerMonth,
    price, // Amount in ₹ INR
    amountPaise, // Amount in paise for Razorpay
    validUntil, // Standard ISO format YYYY-12-31
    validityDisplayEn: `${monthNameEn} 1 – Dec 31, ${currentYear}`,
    validityDisplayHi: `1 ${monthNameHi} – 31 दिसंबर ${currentYear}`,
    purposeEn: `Annual Membership Fee (${monthNameEn}–Dec ${currentYear})`,
    purposeHi: `वार्षिक सदस्यता पंजीकरण शुल्क (${monthNameHi}–दिसंबर ${currentYear})`,
    descriptionEn: `Calendar Year Membership (${remainingMonths} months @ ₹50/month = ₹${price})`,
    descriptionHi: `कैलेंडर वर्ष सदस्यता शुल्क (${remainingMonths} माह @ ₹50/माह = ₹${price})`
  };
}

/**
 * Check if Razorpay API keys are configured in environment
 */
function isRazorpayConfigured() {
  const keyId = String(process.env.RAZORPAY_KEY_ID || "").trim();
  const keySecret = String(process.env.RAZORPAY_KEY_SECRET || "").trim();
  return Boolean(
    keyId &&
    keySecret &&
    !keyId.includes("placeholder") &&
    !keySecret.includes("placeholder") &&
    keyId !== "rzp_test_placeholder"
  );
}

function getRazorpayKeyId() {
  return String(process.env.RAZORPAY_KEY_ID || "").trim();
}

/**
 * Create a new Razorpay Order via Razorpay REST API
 */
async function createRazorpayOrder({ amountPaise, receipt, notes = {}, currency = "INR" }) {
  const keyId = getRazorpayKeyId();
  const keySecret = String(process.env.RAZORPAY_KEY_SECRET || "").trim();

  // If Razorpay live/test credentials are fully configured
  if (isRazorpayConfigured()) {
    const authHeader = "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const payload = {
      amount: Math.round(amountPaise),
      currency: currency || "INR",
      receipt: String(receipt || `rcp_${Date.now()}`).slice(0, 40),
      notes: {
        platform: "UPBMS Official Portal",
        ...notes
      },
      payment_capture: 1
    };

    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("Razorpay order creation error:", data);
      throw new Error(data.error?.description || data.error?.message || "Failed to create Razorpay order");
    }

    return {
      id: data.id,
      amount: data.amount,
      currency: data.currency,
      receipt: data.receipt,
      status: data.status,
      created_at: data.created_at,
      testMode: false
    };
  }

  // Graceful Simulated Dev/Test Mode (when Razorpay API keys are not yet configured in .env)
  const simulatedOrderId = "order_sim_" + Date.now() + "_" + Math.floor(1000 + Math.random() * 9000);
  console.log("ℹ️ Razorpay running in Sandbox/Simulation mode. Simulated Order ID:", simulatedOrderId);
  return {
    id: simulatedOrderId,
    amount: Math.round(amountPaise),
    currency: currency || "INR",
    receipt: String(receipt || `rcp_${Date.now()}`).slice(0, 40),
    status: "created",
    created_at: Math.floor(Date.now() / 1000),
    testMode: true,
    warning: "RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are not set in .env. Running in simulation mode."
  };
}

/**
 * Fetch Payment details from Razorpay to verify status
 */
async function fetchRazorpayPayment(paymentId) {
  if (!paymentId) return null;

  // Handle simulated payment IDs in dev/test mode
  if (paymentId.startsWith("pay_sim_") || paymentId.startsWith("pay_test_")) {
    return {
      id: paymentId,
      status: "captured",
      amount: 5000,
      currency: "INR",
      method: "upi",
      captured: true,
      testMode: true
    };
  }

  if (!isRazorpayConfigured()) {
    return {
      id: paymentId,
      status: "captured",
      testMode: true
    };
  }

  const keyId = getRazorpayKeyId();
  const keySecret = String(process.env.RAZORPAY_KEY_SECRET || "").trim();
  const authHeader = "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  const res = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
    method: "GET",
    headers: {
      "Authorization": authHeader,
      "Content-Type": "application/json"
    }
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("Razorpay fetch payment error:", data);
    throw new Error(data.error?.description || data.error?.message || "Failed to fetch Razorpay payment details");
  }

  return data;
}

/**
 * Verify Razorpay Payment Signature using HMAC-SHA256
 */
function verifyPaymentSignature({ orderId, paymentId, signature }) {
  if (!orderId || !paymentId) return false;

  // In simulated test mode
  if (orderId.startsWith("order_sim_") || paymentId.startsWith("pay_sim_")) {
    return true;
  }

  const keySecret = String(process.env.RAZORPAY_KEY_SECRET || "").trim();
  if (!keySecret) {
    console.warn("RAZORPAY_KEY_SECRET is not configured for signature verification.");
    return false;
  }

  try {
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    if (!signature || expectedSignature.length !== signature.length) {
      return false;
    }

    return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));
  } catch (err) {
    console.error("Payment signature verification exception:", err.message);
    return false;
  }
}

/**
 * Verify Razorpay Webhook Signature using HMAC-SHA256
 */
function verifyWebhookSignature({ rawBody, signature, webhookSecret }) {
  const secret = webhookSecret || String(process.env.RAZORPAY_WEBHOOK_SECRET || "").trim();
  if (!secret || !rawBody || !signature) {
    return false;
  }

  try {
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature.length !== signature.length) {
      return false;
    }

    return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));
  } catch (err) {
    console.error("Webhook signature verification exception:", err.message);
    return false;
  }
}

module.exports = {
  calculateMembershipFee,
  isRazorpayConfigured,
  getRazorpayKeyId,
  createRazorpayOrder,
  fetchRazorpayPayment,
  verifyPaymentSignature,
  verifyWebhookSignature
};
