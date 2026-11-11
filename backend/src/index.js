const fs = require("node:fs");
const path = require("node:path");
const express = require("express");
const cors = require("cors");
const { createSeedDatabase } = require("../data/seed");
const { connectMongo, loadDb, persist } = require("./db");

const PORT = Number(process.env.PORT) || 5000;
const UPLOADS_DIR = path.join(__dirname, "..", "uploads");
const CLIENT_DIST = path.join(__dirname, "..", "..", "frontend", "dist");
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

let db = null;
let writing = Promise.resolve();

function saveDb() {
  writing = writing.then(() => persist(db)).catch((err) => {
    console.error("Mongo save failed:", err);
  });
  return writing;
}

function formatIstTimestamp() {
  try {
    const parts = new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    }).format(new Date());
    return `${parts} IST`;
  } catch (e) {
    return new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";
  }
}

function generateNextAuditCode() {
  db.accessLogs = db.accessLogs || [];
  const nums = db.accessLogs.map((l) => parseInt(String(l.auditCode || "").replace(/\D+/g, "").slice(-4), 10) || 1000);
  const next = (nums.length ? Math.max(...nums) : 1000) + 1;
  return `SEC-2026-${next}`;
}

function resolveRequestAuth(req) {
  const adminPinHdr = String(req.headers["x-admin-pin"] || "").trim();
  if (adminPinHdr && adminPinHdr === String(db.settings.adminPin || "1234")) {
    return { isAdmin: true, isMember: false, canAccessSigned: true, actorType: "admin", member: null };
  }
  const memIdHdr = String(req.headers["x-member-id"] || "").trim();
  let memPassHdr = "";
  try {
    memPassHdr = decodeURIComponent(String(req.headers["x-member-pass"] || "")).trim();
  } catch (e) {
    memPassHdr = String(req.headers["x-member-pass"] || "").trim();
  }
  if (memIdHdr && memPassHdr) {
    const found = db.members.find((m) => m.id === memIdHdr);
    if (found && String(found.password || "123456") === memPassHdr) {
      return {
        isAdmin: false,
        isMember: true,
        canAccessSigned: found.status === "active",
        actorType: "member",
        member: found
      };
    }
  }
  return { isAdmin: false, isMember: false, canAccessSigned: false, actorType: "visitor", member: null };
}

function appendAccessLogEntry(req, entry) {
  db.accessLogs = db.accessLogs || [];
  const ip = String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "").split(",")[0].trim();
  const ua = String(req.headers["user-agent"] || "").slice(0, 65);
  const logItem = {
    id: "log-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
    auditCode: generateNextAuditCode(),
    timestamp: formatIstTimestamp(),
    actorType: entry.actorType || "member",
    memberId: entry.memberId || "",
    memberCode: entry.memberCode || "ADMIN",
    memberNameHi: entry.memberNameHi || "प्रांतीय एडमिन पैनल",
    memberNameEn: entry.memberNameEn || "State Admin Panel",
    designationHi: entry.designationHi || "",
    designationEn: entry.designationEn || "",
    mobile: entry.mobile || "",
    district: entry.district || "",
    actionType: entry.actionType || "view_signed",
    actionLabelHi: entry.actionLabelHi || "हस्ताक्षर/मुहर युक्त प्रपत्र देखा",
    actionLabelEn: entry.actionLabelEn || "Accessed Signed & Stamped Document",
    targetTitleHi: entry.targetTitleHi || "",
    targetTitleEn: entry.targetTitleEn || "",
    signatoriesUsedHi: entry.signatoriesUsedHi || "",
    signatoriesUsedEn: entry.signatoriesUsedEn || "",
    clientInfo: [ip, ua].filter(Boolean).join(" • ") || "Web Session"
  };
  db.accessLogs.unshift(logItem);
  if (db.accessLogs.length > 500) db.accessLogs = db.accessLogs.slice(0, 500);
  return logItem;
}

function generateNextMemberCode(isCore) {
  if (isCore) {
    const coreNums = db.members
      .filter((m) => m.memberCode && m.memberCode.startsWith("UPBMS-CORE-"))
      .map((m) => parseInt(m.memberCode.replace("UPBMS-CORE-", ""), 10) || 0);
    const next = (coreNums.length ? Math.max(...coreNums) : 0) + 1;
    return `UPBMS-CORE-${String(next).padStart(3, "0")}`;
  }
  const genNums = db.members
    .filter((m) => m.memberCode && m.memberCode.startsWith("UPBMS-2026-"))
    .map((m) => parseInt(m.memberCode.replace("UPBMS-2026-", ""), 10) || 100);
  const next = (genNums.length ? Math.max(...genNums) : 100) + 1;
  return `UPBMS-2026-${String(next).padStart(4, "0")}`;
}

function generateNextReceiptNo() {
  const nums = db.payments.map((p) => parseInt(String(p.receiptNo || "").replace(/\D+/g, "").slice(-4), 10) || 1000);
  const next = (nums.length ? Math.max(...nums) : 1000) + 1;
  return `UPBMS-RCP-2026-${next}`;
}

function generateNextTicketNo() {
  const nums = db.grievances.map((g) => parseInt(String(g.ticketNo || "").replace("GRV-2026-", ""), 10) || 100);
  const next = (nums.length ? Math.max(...nums) : 100) + 1;
  return `GRV-2026-${next}`;
}

function escapeCsvCell(val) {
  const s = String(val ?? "").replace(/"/g, '""');
  return `"${s}"`;
}

function sanitizeMemberPublic(m) {
  const copy = { ...m };
  copy.hasPassword = Boolean(copy.password);
  delete copy.password;
  return copy;
}

function sanitizeUploadedItemForVisitor(item, canAccessSigned) {
  if (canAccessSigned || !item.requiresMemberLogin) {
    return { ...item, isLockedForVisitor: false };
  }
  return { ...item, fileUrl: "", isLockedForVisitor: true };
}

function computeStats() {
  const activeMembers = db.members.filter((m) => m.status === "active");
  const coreMembers = activeMembers.filter((m) => m.isCoreMember);
  const pendingMembers = db.members.filter((m) => m.status === "pending");
  const districtsCovered = new Set(activeMembers.map((m) => m.district).filter(Boolean)).size;
  const verifiedPayments = db.payments.filter((p) => p.status === "verified");
  const totalCollection = verifiedPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  return {
    totalActiveMembers: activeMembers.length,
    totalCoreMembers: coreMembers.length,
    pendingMembersCount: pendingMembers.length,
    districtsCovered: Math.max(districtsCovered, 12),
    totalCollection,
    pendingPaymentsCount: db.payments.filter((p) => p.status === "pending").length,
    resolvedGrievances: db.grievances.filter((g) => g.status === "resolved").length,
    openGrievances: db.grievances.filter((g) => g.status !== "resolved").length,
    totalGrievances: db.grievances.length,
    totalExternalPortals: db.externalLinks.filter((l) => l.active !== false).length,
    totalDocuments: db.documents.length,
    totalCirculars: (db.circulars || []).length,
    totalCertificates: (db.certificates || []).length,
    totalAccessLogs: (db.accessLogs || []).length
  };
}

function buildBootstrap(auth) {
  const publicSettings = { ...db.settings };
  delete publicSettings.adminPin;
  if (!auth.canAccessSigned) {
    publicSettings.sealImageUrl = "";
    publicSettings.signatories = (publicSettings.signatories || []).map((s) => ({
      ...s,
      signatureUrl: "",
      combinedStampSigUrl: ""
    }));
  }
  return {
    ok: true,
    signedAssetsUnlocked: auth.canAccessSigned,
    settings: publicSettings,
    slides: [...db.slides].sort((a, b) => (a.order || 99) - (b.order || 99)),
    certificates: (db.certificates || []).map((c) => sanitizeUploadedItemForVisitor(c, auth.canAccessSigned)),
    demands: [...db.demands].sort((a, b) => (a.number || 99) - (b.number || 99)),
    members: [...db.members].map(sanitizeMemberPublic).sort((a, b) => (a.displayOrder || 999) - (b.displayOrder || 999)),
    circulars: [...(db.circulars || [])]
      .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")))
      .map((c) => sanitizeUploadedItemForVisitor(c, auth.canAccessSigned)),
    externalLinks: [...db.externalLinks].sort((a, b) => (a.order || 99) - (b.order || 99)),
    documents: [...db.documents],
    payments: [...db.payments].sort((a, b) => String(b.date).localeCompare(String(a.date))),
    grievances: [...db.grievances].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))),
    news: [...db.news].sort((a, b) => String(b.date).localeCompare(String(a.date))),
    accessLogs: auth.isAdmin ? [...db.accessLogs] : [],
    meta: db.meta,
    stats: computeStats()
  };
}

function requireAdmin(req, res, next) {
  const auth = resolveRequestAuth(req);
  if (!auth.isAdmin) return res.status(403).json({ ok: false, error: "Admin login required" });
  req.auth = auth;
  next();
}

function csvResponse(res, filename, headers, rows) {
  const csv = "\uFEFF" + [headers, ...rows].map((r) => r.map(escapeCsvCell).join(",")).join("\r\n");
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(csv);
}

const app = express();
app.use(cors({ origin: true, allowedHeaders: ["Content-Type", "Authorization", "X-Admin-Pin", "X-Member-Id", "X-Member-Pass"] }));
app.use(express.json({ limit: "20mb" }));
app.use("/uploads", express.static(UPLOADS_DIR));

app.use((req, res, next) => {
  req.auth = resolveRequestAuth(req);
  next();
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, stack: "MERN", database: "mongodb" });
});

app.get("/api/bootstrap", (req, res) => {
  res.json(buildBootstrap(req.auth));
});

app.post("/api/admin/login", (req, res) => {
  const pin = String(req.body.pin || "").trim();
  if (pin === String(db.settings.adminPin || "1234")) {
    return res.json({ ok: true, message: "Admin login successful" });
  }
  return res.status(401).json({ ok: false, error: "गलत एडमिन पिन! डेमो पिन 1234 है। / Incorrect Admin PIN (Demo: 1234)" });
});

app.post("/api/member/login", async (req, res) => {
  const q = String(req.body.query || "").trim().toLowerCase();
  const pwd = String(req.body.password || "").trim();
  const found = db.members.find(
    (m) => String(m.memberCode || "").toLowerCase() === q || String(m.mobile || "").toLowerCase() === q
  );
  if (!found) {
    return res.status(404).json({ ok: false, error: "सदस्य आईडी या मोबाइल नंबर नहीं मिला। / Member ID or Mobile not found." });
  }
  if (pwd !== String(found.password || "123456")) {
    return res.status(401).json({ ok: false, error: "गलत पासवर्ड! यदि भूल गए हैं तो एडमिन से रीसेट कराएं। / Incorrect password!" });
  }
  const receipts = db.payments.filter(
    (p) => p.memberId === found.id || p.memberCode === found.memberCode || p.mobile === found.mobile
  );
  appendAccessLogEntry(req, {
    actorType: "member",
    memberId: found.id,
    memberCode: found.memberCode,
    memberNameHi: found.nameHi,
    memberNameEn: found.nameEn,
    designationHi: found.designationHi,
    designationEn: found.designationEn,
    mobile: found.mobile,
    district: found.district,
    actionType: "member_login",
    actionLabelHi: "सदस्य पोर्टल लॉगिन किया (सुरक्षित सत्र प्रारंभ)",
    actionLabelEn: "Logged into Member Portal (Secure Session Started)",
    targetTitleHi: "सदस्य लॉगिन सत्यापन",
    targetTitleEn: "Member Login Authentication",
    signatoriesUsedHi: found.status === "active" ? "हस्ताक्षर/मुहर एक्सेस अनलॉक" : "लंबित सदस्यता (हस्ताक्षर लॉक)",
    signatoriesUsedEn: found.status === "active" ? "Signed Assets Access Unlocked" : "Pending Membership (Signatures Locked)"
  });
  await saveDb();
  res.json({ ok: true, member: sanitizeMemberPublic(found), receipts });
});

app.post("/api/access-logs", async (req, res) => {
  if (!req.auth.canAccessSigned) return res.status(403).json({ ok: false, error: "Member or Admin login required" });
  const body = req.body || {};
  const actorMember = req.auth.member;
  const logItem = appendAccessLogEntry(req, {
    actorType: req.auth.isAdmin ? "admin" : "member",
    memberId: actorMember ? actorMember.id : (body.memberId || ""),
    memberCode: actorMember ? actorMember.memberCode : "ADMIN",
    memberNameHi: actorMember ? actorMember.nameHi : "प्रांतीय एडमिन (नियंत्रण कक्ष)",
    memberNameEn: actorMember ? actorMember.nameEn : "State Admin (Control Panel)",
    designationHi: actorMember ? actorMember.designationHi : "प्रशासक",
    designationEn: actorMember ? actorMember.designationEn : "Administrator",
    mobile: actorMember ? actorMember.mobile : (db.settings.helpline || ""),
    district: actorMember ? actorMember.district : "लखनऊ मुख्यालय (HQ)",
    actionType: body.actionType || "view_signed",
    actionLabelHi: body.actionLabelHi || "हस्ताक्षर एवं मुहर युक्त दस्तावेज़ का उपयोग किया",
    actionLabelEn: body.actionLabelEn || "Used Signed & Stamped Document",
    targetTitleHi: body.targetTitleHi || "",
    targetTitleEn: body.targetTitleEn || "",
    signatoriesUsedHi: body.signatoriesUsedHi || "",
    signatoriesUsedEn: body.signatoriesUsedEn || ""
  });
  await saveDb();
  res.status(201).json({ ok: true, logItem });
});

app.delete("/api/access-logs", requireAdmin, async (_req, res) => {
  db.accessLogs = [];
  await saveDb();
  res.json({ ok: true });
});

app.delete("/api/access-logs/:id", requireAdmin, async (req, res) => {
  db.accessLogs = (db.accessLogs || []).filter((l) => l.id !== req.params.id);
  await saveDb();
  res.json({ ok: true });
});

app.post("/api/members/:id/reset-password", requireAdmin, async (req, res) => {
  const idx = db.members.findIndex((m) => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ ok: false, error: "Member not found" });
  const newPassword = String(req.body.newPassword || "").trim();
  if (newPassword.length < 4) {
    return res.status(400).json({ ok: false, error: "पासवर्ड कम से कम 4 अक्षरों का होना चाहिए। / Minimum 4 characters required." });
  }
  db.members[idx].password = newPassword;
  await saveDb();
  res.json({ ok: true });
});

app.put("/api/settings", requireAdmin, async (req, res) => {
  const body = req.body || {};
  const currentPin = db.settings.adminPin || "1234";
  const prev = db.settings;
  const mergedBg = body.templateBackgrounds
    ? {
        letter: { ...(prev.templateBackgrounds?.letter || {}), ...(body.templateBackgrounds.letter || {}) },
        idcard: { ...(prev.templateBackgrounds?.idcard || {}), ...(body.templateBackgrounds.idcard || {}) },
        receipt: { ...(prev.templateBackgrounds?.receipt || {}), ...(body.templateBackgrounds.receipt || {}) }
      }
    : prev.templateBackgrounds;
  db.settings = {
    ...prev,
    ...body,
    socialLinks: { ...(prev.socialLinks || {}), ...(body.socialLinks || {}) },
    headerButtons: { ...(prev.headerButtons || {}), ...(body.headerButtons || {}) },
    sectionTexts: { ...(prev.sectionTexts || {}), ...(body.sectionTexts || {}) },
    aboutVisionMission: { ...(prev.aboutVisionMission || {}), ...(body.aboutVisionMission || {}) },
    termsAndConditions: { ...(prev.termsAndConditions || {}), ...(body.termsAndConditions || {}) },
    letterTemplateText: { ...(prev.letterTemplateText || {}), ...(body.letterTemplateText || {}) },
    campaignBlock: { ...(prev.campaignBlock || {}), ...(body.campaignBlock || {}) },
    templateBackgrounds: mergedBg,
    adminPin: body.newAdminPin ? String(body.newAdminPin).trim() : currentPin
  };
  delete db.settings.newAdminPin;
  delete db.settings._id;
  await saveDb();
  const safeSettings = { ...db.settings };
  delete safeSettings.adminPin;
  res.json({ ok: true, settings: safeSettings });
});

app.put("/api/meta", requireAdmin, async (req, res) => {
  const body = req.body || {};
  db.meta = {
    ...db.meta,
    ...(Array.isArray(body.districts) ? { districts: body.districts } : {}),
    ...(Array.isArray(body.banks) ? { banks: body.banks } : {}),
    ...(Array.isArray(body.bcCompanies) ? { bcCompanies: body.bcCompanies } : {})
  };
  await saveDb();
  res.json({ ok: true, meta: db.meta });
});

app.post("/api/upload", (req, res) => {
  const { filename, dataUrl } = req.body || {};
  if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) {
    return res.status(400).json({ ok: false, error: "Valid file dataUrl required" });
  }
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return res.status(400).json({ ok: false, error: "Malformed base64 dataUrl" });
  const mime = match[1];
  const buffer = Buffer.from(match[2], "base64");
  const extFromName = path.extname(filename || "").toLowerCase();
  const allowedExts = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".pdf"];
  let ext = allowedExts.includes(extFromName) ? extFromName : ".png";
  if (mime.includes("pdf")) ext = ".pdf";
  else if (mime.includes("jpeg") || mime.includes("jpg")) ext = ".jpg";
  else if (mime.includes("svg")) ext = ".svg";
  else if (mime.includes("webp")) ext = ".webp";
  const safeBase = path.basename(filename || "upload", path.extname(filename || "")).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 40);
  const finalName = `${Date.now()}-${safeBase}${ext}`;
  fs.writeFileSync(path.join(UPLOADS_DIR, finalName), buffer);
  res.json({ ok: true, url: `/uploads/${finalName}`, size: buffer.length });
});

app.get("/api/verify/:query", (req, res) => {
  const q = decodeURIComponent(req.params.query).trim().toLowerCase();
  const found = db.members.find(
    (m) =>
      String(m.memberCode || "").toLowerCase() === q ||
      String(m.mobile || "").toLowerCase() === q ||
      String(m.koCode || "").toLowerCase() === q
  );
  if (!found) {
    return res.status(404).json({ ok: false, error: "इस सदस्य संख्या / मोबाइल से कोई रिकॉर्ड नहीं मिला। / Record not found." });
  }
  const receipts = db.payments.filter(
    (p) => p.memberId === found.id || p.memberCode === found.memberCode || p.mobile === found.mobile
  );
  res.json({ ok: true, member: sanitizeMemberPublic(found), receipts });
});

app.post("/api/members", async (req, res) => {
  const body = req.body || {};
  const isCore = Boolean(body.isCoreMember);
  const status = body.fromAdmin ? (body.status || "active") : (body.instantDemoVerify ? "active" : "pending");
  const today = new Date().toISOString().slice(0, 10);
  const validDate = new Date();
  validDate.setFullYear(validDate.getFullYear() + 1);
  const newMember = {
    id: "mem-" + Date.now(),
    memberCode: body.memberCode || generateNextMemberCode(isCore),
    nameHi: body.nameHi || body.nameEn || "नवीन सदस्य",
    nameEn: body.nameEn || body.nameHi || "New Member",
    fatherName: body.fatherName || "",
    fatherNameEn: body.fatherNameEn || body.fatherName || "",
    isCoreMember: isCore,
    memberCategory: isCore ? "Core Committee (प्रदेश मुख्य कार्यकारिणी)" : (body.memberCategory || "General Member (सक्रिय सदस्य)"),
    designationHi: body.designationHi || (isCore ? "प्रदेश पदाधिकारी" : "सक्रिय बैंक मित्र सदस्य"),
    designationEn: body.designationEn || (isCore ? "State Executive Member" : "Active Bank Mitra Member"),
    displayOrder: Number(body.displayOrder) || (isCore ? db.members.filter((m) => m.isCoreMember).length + 1 : 100),
    district: body.district || "कानपुर नगर (Kanpur Nagar)",
    block: body.block || "",
    blockEn: body.blockEn || body.block || "",
    bankName: body.bankName || "State Bank of India (SBI)",
    bcCompany: body.bcCompany || "CSC e-Governance Services India Ltd.",
    koCode: body.koCode || "",
    mobile: String(body.mobile || "").trim(),
    whatsapp: String(body.whatsapp || body.mobile || "").trim(),
    email: body.email || "",
    websiteUrl: String(body.websiteUrl || body.website || "").trim(),
    bloodGroup: body.bloodGroup || "O+",
    photoUrl: body.photoUrl || "",
    messageHi: body.messageHi || "",
    messageEn: body.messageEn || "",
    password: String(body.password || "123456").trim(),
    signatoryId: body.signatoryId || db.settings.defaultSignatoryId || "sig-gs",
    letterSignatoryIds: Array.isArray(body.letterSignatoryIds) && body.letterSignatoryIds.length
      ? body.letterSignatoryIds
      : (db.settings.defaultSignatoryIds || [body.signatoryId || db.settings.defaultSignatoryId || "sig-gs"]),
    status,
    joinedDate: body.joinedDate || today,
    validUntil: body.validUntil || validDate.toISOString().slice(0, 10),
    feePaid: Number(body.feePaid) || 0
  };
  db.members.push(newMember);
  let createdPayment = null;
  if (Number(body.feePaid) > 0) {
    createdPayment = {
      id: "pay-" + Date.now(),
      receiptNo: generateNextReceiptNo(),
      paymentCategory: "membership",
      memberId: newMember.id,
      memberCode: newMember.memberCode,
      payerName: newMember.nameHi,
      payerNameEn: newMember.nameEn,
      mobile: newMember.mobile,
      district: newMember.district,
      purposeHi: isCore ? "प्रदेश मुख्य कार्यकारिणी सदस्यता शुल्क" : "वार्षिक सदस्यता पंजीकरण शुल्क",
      purposeEn: isCore ? "State Core Committee Membership Fee" : "Annual Membership Registration Fee",
      purpose: isCore ? "प्रदेश मुख्य कार्यकारिणी सदस्यता शुल्क" : "वार्षिक सदस्यता पंजीकरण शुल्क",
      amount: Number(body.feePaid),
      mode: body.paymentMode || "UPI",
      utrNumber: body.utrNumber || ("DEMO" + String(Date.now()).slice(-8)),
      signatoryIds: newMember.letterSignatoryIds || db.settings.defaultSignatoryIds || [db.settings.defaultSignatoryId || "sig-gs"],
      status: status === "active" ? "verified" : "pending",
      date: today
    };
    db.payments.unshift(createdPayment);
  }
  await saveDb();
  res.status(201).json({ ok: true, member: sanitizeMemberPublic(newMember), payment: createdPayment });
});

app.put("/api/members/:id", requireAdmin, async (req, res) => {
  const idx = db.members.findIndex((m) => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ ok: false, error: "Member not found" });
  const body = req.body || {};
  const prev = db.members[idx];
  const nextIsCore = body.isCoreMember !== undefined ? Boolean(body.isCoreMember) : prev.isCoreMember;
  let memberCode = body.memberCode || prev.memberCode;
  if (!prev.isCoreMember && nextIsCore && String(memberCode).startsWith("UPBMS-2026-")) {
    memberCode = generateNextMemberCode(true);
  }
  const updated = {
    ...prev,
    ...body,
    websiteUrl: body.websiteUrl !== undefined ? String(body.websiteUrl || "").trim() : (prev.websiteUrl || prev.website || ""),
    password: body.password ? String(body.password).trim() : (prev.password || "123456"),
    isCoreMember: nextIsCore,
    memberCode,
    displayOrder: body.displayOrder !== undefined ? Number(body.displayOrder) : prev.displayOrder
  };
  delete updated._id;
  db.members[idx] = updated;
  if (prev.status !== "active" && updated.status === "active") {
    db.payments.forEach((p) => {
      if ((p.memberId === updated.id || p.memberCode === prev.memberCode) && p.status === "pending") {
        p.status = "verified";
        p.memberCode = updated.memberCode;
      }
    });
  }
  if (Array.isArray(body.letterSignatoryIds) && body.letterSignatoryIds.length) {
    db.payments.forEach((p) => {
      if (p.memberId === updated.id || p.memberCode === updated.memberCode || p.memberCode === prev.memberCode) {
        p.signatoryIds = body.letterSignatoryIds;
      }
    });
  }
  await saveDb();
  res.json({ ok: true, member: sanitizeMemberPublic(updated) });
});

app.delete("/api/members/:id", requireAdmin, async (req, res) => {
  const idx = db.members.findIndex((m) => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ ok: false, error: "Member not found" });
  db.members.splice(idx, 1);
  await saveDb();
  res.json({ ok: true });
});

const collectionsMap = {
  slides: { prefix: "slide" },
  certificates: { prefix: "cert" },
  demands: { prefix: "dem" },
  circulars: { prefix: "cir" },
  "external-links": { key: "externalLinks", prefix: "ext" },
  documents: { prefix: "doc" },
  news: { prefix: "news" }
};

for (const [route, cfg] of Object.entries(collectionsMap)) {
  const key = cfg.key || route;
  app.post(`/api/${route}`, requireAdmin, async (req, res) => {
    const item = { id: `${cfg.prefix}-${Date.now()}`, ...req.body };
    if (key === "circulars" || key === "news" || key === "certificates") db[key].unshift(item);
    else db[key].push(item);
    await saveDb();
    res.status(201).json({ ok: true, item });
  });
  app.put(`/api/${route}/:id`, requireAdmin, async (req, res) => {
    const idx = db[key].findIndex((x) => x.id === req.params.id);
    if (idx === -1) return res.status(404).json({ ok: false, error: "Item not found" });
    db[key][idx] = { ...db[key][idx], ...req.body, id: req.params.id };
    await saveDb();
    res.json({ ok: true, item: db[key][idx] });
  });
  app.delete(`/api/${route}/:id`, requireAdmin, async (req, res) => {
    const idx = db[key].findIndex((x) => x.id === req.params.id);
    if (idx === -1) return res.status(404).json({ ok: false, error: "Item not found" });
    db[key].splice(idx, 1);
    await saveDb();
    res.json({ ok: true });
  });
}

app.post("/api/payments", async (req, res) => {
  const body = req.body || {};
  const item = {
    id: "pay-" + Date.now(),
    receiptNo: generateNextReceiptNo(),
    paymentCategory: body.paymentCategory || "donation",
    memberId: body.memberId || "",
    memberCode: body.memberCode || "DONOR",
    payerName: body.payerName || "सहयोगकर्ता",
    payerNameEn: body.payerNameEn || body.payerName || "Contributor",
    mobile: body.mobile || "",
    district: body.district || "",
    purposeHi: body.purposeHi || body.purpose || "बैंक मित्र संघर्ष एवं कल्याण कोष सहयोग राशि",
    purposeEn: body.purposeEn || "Bank Mitra Struggle & Welfare Fund Contribution",
    purpose: body.purpose || "बैंक मित्र संघर्ष एवं कल्याण कोष सहयोग राशि",
    amount: Number(body.amount) || 0,
    mode: body.mode || "UPI",
    utrNumber: body.utrNumber || ("DEMO" + String(Date.now()).slice(-8)),
    signatoryIds: body.signatoryIds || db.settings.defaultSignatoryIds || [db.settings.defaultSignatoryId || "sig-gs"],
    status: body.status || (body.instantDemoVerify ? "verified" : "pending"),
    date: body.date || new Date().toISOString().slice(0, 10)
  };
  db.payments.unshift(item);
  await saveDb();
  res.status(201).json({ ok: true, payment: item });
});

app.put("/api/payments/:id", requireAdmin, async (req, res) => {
  const idx = db.payments.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ ok: false, error: "Payment not found" });
  db.payments[idx] = { ...db.payments[idx], ...req.body, id: req.params.id };
  await saveDb();
  res.json({ ok: true, payment: db.payments[idx] });
});

app.delete("/api/payments/:id", requireAdmin, async (req, res) => {
  const idx = db.payments.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ ok: false, error: "Payment not found" });
  db.payments.splice(idx, 1);
  await saveDb();
  res.json({ ok: true });
});

app.get("/api/grievances/track/:query", (req, res) => {
  const q = decodeURIComponent(req.params.query).trim().toLowerCase();
  const matches = db.grievances.filter(
    (g) =>
      String(g.ticketNo || "").toLowerCase() === q ||
      String(g.mobile || "").toLowerCase() === q ||
      String(g.koCode || "").toLowerCase() === q
  );
  res.json({ ok: true, grievances: matches });
});

app.post("/api/grievances", async (req, res) => {
  const body = req.body || {};
  const ticket = {
    id: "grv-" + Date.now(),
    ticketNo: generateNextTicketNo(),
    applicantName: body.applicantName || "",
    applicantNameEn: body.applicantNameEn || body.applicantName || "",
    memberCode: body.memberCode || "",
    mobile: body.mobile || "",
    district: body.district || "",
    bankName: body.bankName || "",
    bcCompany: body.bcCompany || "",
    koCode: body.koCode || "",
    issueType: body.issueType || "अन्य समस्या",
    issueTypeEn: body.issueTypeEn || body.issueType || "Other Issue",
    subject: body.subject || "",
    subjectEn: body.subjectEn || body.subject || "",
    description: body.description || "",
    descriptionEn: body.descriptionEn || body.description || "",
    status: "pending",
    adminRemark: "शिकायत सफलतापूर्वक पंजीकृत हो गई है। प्रांतीय शिकायत निवारण प्रकोष्ठ द्वारा शीघ्र कार्यवाही की जाएगी।",
    adminRemarkEn: "Your grievance has been registered. The State Grievance Redressal Cell will take prompt action.",
    createdAt: new Date().toISOString().slice(0, 10)
  };
  db.grievances.unshift(ticket);
  await saveDb();
  res.status(201).json({ ok: true, grievance: ticket });
});

app.put("/api/grievances/:id", requireAdmin, async (req, res) => {
  const idx = db.grievances.findIndex((g) => g.id === req.params.id);
  if (idx === -1) return res.status(404).json({ ok: false, error: "Grievance not found" });
  db.grievances[idx] = { ...db.grievances[idx], ...req.body, id: req.params.id };
  await saveDb();
  res.json({ ok: true, grievance: db.grievances[idx] });
});

app.delete("/api/grievances/:id", requireAdmin, async (req, res) => {
  const idx = db.grievances.findIndex((g) => g.id === req.params.id);
  if (idx === -1) return res.status(404).json({ ok: false, error: "Grievance not found" });
  db.grievances.splice(idx, 1);
  await saveDb();
  res.json({ ok: true });
});

app.get("/api/export/members.csv", requireAdmin, (_req, res) => {
  csvResponse(res, "UPBMS_Members_List.csv",
    ["Member ID", "Type", "Name (Hindi)", "Name (English)", "Designation (Hi)", "Designation (En)", "District", "Block", "Bank Name", "BC Company", "KO/CSP Code", "Mobile", "Email", "Status", "Joined Date", "Valid Until", "Fee Paid"],
    db.members.map((m) => [m.memberCode, m.isCoreMember ? "CORE MEMBER" : m.memberCategory, m.nameHi, m.nameEn, m.designationHi, m.designationEn, m.district, m.block, m.bankName, m.bcCompany, m.koCode, m.mobile, m.email || "", m.status, m.joinedDate, m.validUntil, m.feePaid])
  );
});

app.get("/api/export/payments.csv", requireAdmin, (_req, res) => {
  csvResponse(res, "UPBMS_Payments_Ledger.csv",
    ["Receipt No", "Date", "Category", "Payer Name", "Member ID", "District", "Mobile", "Purpose", "Amount (INR)", "Mode", "UTR Number", "Status"],
    db.payments.map((p) => [p.receiptNo, p.date, p.paymentCategory || "membership", p.payerName, p.memberCode, p.district, p.mobile, p.purposeHi || p.purpose, p.amount, p.mode, p.utrNumber, p.status])
  );
});

app.get("/api/export/access-logs.csv", requireAdmin, (_req, res) => {
  csvResponse(res, "UPBMS_Signature_Usage_Audit_Logs.csv",
    ["Audit Code", "Date & Time (IST)", "Actor Type", "Member ID", "Member Name (Hi)", "Member Name (En)", "Designation", "Mobile", "District", "Action", "Document / Target", "Signatories & Seal Used", "Session Info"],
    (db.accessLogs || []).map((l) => [l.auditCode, l.timestamp, l.actorType, l.memberCode, l.memberNameHi, l.memberNameEn, l.designationHi, l.mobile, l.district, l.actionLabelHi, l.targetTitleHi, l.signatoriesUsedHi, l.clientInfo])
  );
});

app.get("/api/admin/backup", requireAdmin, (_req, res) => {
  res.setHeader("Content-Disposition", 'attachment; filename="UPBMS_Full_Backup.json"');
  res.json(db);
});

app.post("/api/admin/restore", requireAdmin, async (req, res) => {
  const body = req.body || {};
  if (!body.settings || !Array.isArray(body.members)) {
    return res.status(400).json({ ok: false, error: "Invalid backup JSON format" });
  }
  db = body;
  db.accessLogs = db.accessLogs || [];
  db.circulars = db.circulars || [];
  db.certificates = db.certificates || [];
  await saveDb();
  res.json({ ok: true });
});

app.post("/api/admin/reset", requireAdmin, async (_req, res) => {
  db = createSeedDatabase();
  await saveDb();
  res.json({ ok: true });
});

if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
  app.get(/^(?!\/api|\/uploads).*/, (_req, res) => {
    res.sendFile(path.join(CLIENT_DIST, "index.html"));
  });
}

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ ok: false, error: err.message || "Internal server error" });
});

connectMongo()
  .then(() => loadDb())
  .then((loaded) => {
    db = loaded;
    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`UPBMS MERN API running at http://127.0.0.1:${PORT}`);
    });
    server.on("error", (err) => {
      console.error("API failed to listen:", err.message);
      process.exit(1);
    });
  })
  .catch((err) => {
    console.error("Failed to start:", err);
    process.exit(1);
  });
