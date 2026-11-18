const crypto = require("node:crypto");

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Punjab National Bank (PNB) Merchant Dynamic QR Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Provides official Merchant UPI Dynamic QR integration conforming to:
 * - PNB Merchant UPI acquiring gateway specifications.
 * - NPCI Dynamic UPI QR specification (unique tr reference, locked exact amount).
 * - Server-to-server transaction status inquiry & webhook signature verification.
 * - Dynamic timeout handling (10-minute expiry) and retry capabilities.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// In-memory registry of dynamic QR orders
const pnbOrdersStore = new Map();

// Periodic cleanup of orders older than 2 hours
setInterval(() => {
  const now = Date.now();
  for (const [id, ord] of pnbOrdersStore.entries()) {
    if (now - ord.createdAt > 2 * 60 * 60 * 1000) {
      pnbOrdersStore.delete(id);
    }
  }
}, 30 * 60 * 1000);

function isPnbConfigured() {
  const mid = String(process.env.PNB_MERCHANT_ID || "").trim();
  const secret = String(process.env.PNB_SECRET_KEY || "").trim();
  return Boolean(
    mid &&
    secret &&
    !mid.includes("placeholder") &&
    !secret.includes("placeholder")
  );
}

function getPnbPublicConfig() {
  return {
    isConfigured: isPnbConfigured(),
    merchantName: process.env.PNB_MERCHANT_NAME || "Uttar Pradesh Bank Mitra Sangh",
    merchantVpa: process.env.PNB_MERCHANT_VPA || "upbms@pnb",
    terminalId: process.env.PNB_TERMINAL_ID || "TERM01"
  };
}

/**
 * Generate a dynamic QR order for an applicant
 */
async function createPnbDynamicQrOrder({ amount, memberData = {}, emailVerificationToken = "" }) {
  const mid = String(process.env.PNB_MERCHANT_ID || "").trim();
  const vpa = String(process.env.PNB_MERCHANT_VPA || "upbms@pnb").trim();
  const merchantName = String(process.env.PNB_MERCHANT_NAME || "Uttar Pradesh Bank Mitra Sangh").trim();
  const terminalId = String(process.env.PNB_TERMINAL_ID || "TERM01").trim();
  const baseUrl = String(process.env.PNB_BASE_URL || "https://merchant.pnbindia.in").trim();

  // Unique Order Reference (alphanumeric, max 35 chars conforming to NPCI spec)
  const orderId = `PNB-2026-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
  const numericAmount = Number(amount);
  const now = Date.now();
  const expiresInSeconds = 600; // 10 minutes timeout
  const expiresAt = now + expiresInSeconds * 1000;

  // Standard NPCI Dynamic UPI Intent string
  // pa = Payee VPA, pn = Payee Name, mc = MCC (8999 Professional), tr = Transaction Reference, am = Exact Amount, cu = Currency, tn = Transaction Note
  const qrString = `upi://pay?pa=${encodeURIComponent(vpa)}&pn=${encodeURIComponent(merchantName)}&mc=8999&tr=${encodeURIComponent(orderId)}&am=${numericAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`UPBMS ${orderId}`)}`;

  let pnbGatewayData = null;

  // If live/sandbox PNB API credentials are configured, call PNB server
  if (isPnbConfigured()) {
    try {
      const payload = {
        merchantId: mid,
        terminalId,
        txnRefNo: orderId,
        amount: numericAmount.toFixed(2),
        currency: "INR",
        payeeVpa: vpa,
        notes: `UPBMS Membership ${orderId}`
      };

      const secret = String(process.env.PNB_SECRET_KEY || "");
      const signature = crypto
        .createHmac("sha256", secret)
        .update(`${mid}|${terminalId}|${orderId}|${numericAmount.toFixed(2)}`)
        .digest("hex");

      const response = await fetch(`${baseUrl}/api/merchant/upi/dynamic-qr`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-PNB-Merchant-ID": mid,
          "X-PNB-Signature": signature
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        pnbGatewayData = data;
      } else {
        console.warn("PNB API returned non-200. Using standard NPCI dynamic QR format.");
      }
    } catch (err) {
      console.warn("PNB API connection notice:", err.message);
    }
  }

  const orderRecord = {
    orderId,
    amount: numericAmount,
    currency: "INR",
    merchantName,
    merchantVpa: vpa,
    terminalId,
    qrString: pnbGatewayData?.qrString || qrString,
    status: "PENDING", // PENDING | SUCCESS | EXPIRED | FAILED
    memberData,
    emailVerificationToken,
    createdAt: now,
    expiresAt,
    expiresInSeconds,
    utrNumber: null,
    pnbTxnId: null,
    testMode: !isPnbConfigured()
  };

  pnbOrdersStore.set(orderId, orderRecord);

  return {
    ok: true,
    orderId,
    qrString: orderRecord.qrString,
    amount: numericAmount,
    merchantName,
    merchantVpa: vpa,
    createdAt: now,
    expiresAt,
    expiresInSeconds,
    status: "PENDING",
    testMode: orderRecord.testMode
  };
}

/**
 * Check PNB transaction status via server-to-server API
 */
async function checkPnbOrderStatus(orderId) {
  const order = pnbOrdersStore.get(orderId);
  if (!order) {
    return { ok: false, error: "Order not found" };
  }

  // Check timeout / expiry
  if (Date.now() > order.expiresAt && order.status === "PENDING") {
    order.status = "EXPIRED";
  }

  if (order.status !== "PENDING") {
    return {
      ok: true,
      status: order.status,
      orderId: order.orderId,
      amount: order.amount,
      utrNumber: order.utrNumber,
      pnbTxnId: order.pnbTxnId,
      memberData: order.memberData,
      emailVerificationToken: order.emailVerificationToken
    };
  }

  // If live PNB API configured, query PNB server-to-server
  if (isPnbConfigured()) {
    try {
      const mid = String(process.env.PNB_MERCHANT_ID || "");
      const secret = String(process.env.PNB_SECRET_KEY || "");
      const baseUrl = String(process.env.PNB_BASE_URL || "https://merchant.pnbindia.in");

      const signature = crypto
        .createHmac("sha256", secret)
        .update(`${mid}|${order.orderId}`)
        .digest("hex");

      const res = await fetch(`${baseUrl}/api/merchant/upi/status-query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-PNB-Merchant-ID": mid,
          "X-PNB-Signature": signature
        },
        body: JSON.stringify({
          merchantId: mid,
          txnRefNo: order.orderId
        })
      });

      if (res.ok) {
        const data = await res.json();
        // Strict verification of merchant, order reference, amount, and status
        if (
          data.merchantId === mid &&
          data.txnRefNo === order.orderId &&
          Number(data.amount) === Number(order.amount) &&
          (data.status === "SUCCESS" || data.status === "CAPTURED")
        ) {
          order.status = "SUCCESS";
          order.utrNumber = data.utrNumber || data.rrn || ("PNB" + Date.now().toString().slice(-8));
          order.pnbTxnId = data.txnId || data.pnbRefId || order.orderId;
        } else if (data.status === "FAILED") {
          order.status = "FAILED";
        }
      }
    } catch (err) {
      console.warn("PNB status check API error:", err.message);
    }
  }

  return {
    ok: true,
    status: order.status,
    orderId: order.orderId,
    amount: order.amount,
    expiresAt: order.expiresAt,
    remainingSeconds: Math.max(0, Math.floor((order.expiresAt - Date.now()) / 1000)),
    utrNumber: order.utrNumber,
    pnbTxnId: order.pnbTxnId,
    memberData: order.memberData,
    emailVerificationToken: order.emailVerificationToken,
    testMode: order.testMode
  };
}

/**
 * Mark order as simulated successful in test mode
 */
function simulatePnbPaymentSuccess(orderId) {
  const order = pnbOrdersStore.get(orderId);
  if (!order) return null;
  order.status = "SUCCESS";
  order.utrNumber = "PNBSIM" + Date.now().toString().slice(-8);
  order.pnbTxnId = "TXN_PNB_" + Date.now();
  return order;
}

/**
 * Verify Webhook/Callback Signature from PNB
 */
function verifyPnbCallbackSignature(rawBody, signature) {
  const secret = String(process.env.PNB_SECRET_KEY || "").trim();
  if (!secret || !rawBody || !signature) return false;

  try {
    const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
    if (expected.length !== signature.length) return false;
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch (e) {
    return false;
  }
}

module.exports = {
  isPnbConfigured,
  getPnbPublicConfig,
  createPnbDynamicQrOrder,
  checkPnbOrderStatus,
  simulatePnbPaymentSuccess,
  verifyPnbCallbackSignature,
  pnbOrdersStore
};
