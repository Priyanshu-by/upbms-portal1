const fs = require("node:fs");
const path = require("node:path");
const mongoose = require("mongoose");
const { createSeedDatabase } = require("../data/seed");

const itemSchema = new mongoose.Schema(
  { id: { type: String, required: true, unique: true } },
  { strict: false, versionKey: false }
);

const singletonSchema = new mongoose.Schema(
  { _singleton: { type: String, default: "main", unique: true } },
  { strict: false, versionKey: false }
);

const Setting = mongoose.model("Setting", singletonSchema);
const Meta = mongoose.model("Meta", singletonSchema);

const COLLECTIONS = {
  slides: mongoose.model("Slide", itemSchema),
  certificates: mongoose.model("Certificate", itemSchema),
  demands: mongoose.model("Demand", itemSchema),
  members: mongoose.model("Member", itemSchema),
  circulars: mongoose.model("Circular", itemSchema),
  externalLinks: mongoose.model("ExternalLink", itemSchema),
  documents: mongoose.model("Document", itemSchema),
  payments: mongoose.model("Payment", itemSchema),
  grievances: mongoose.model("Grievance", itemSchema),
  news: mongoose.model("News", itemSchema),
  accessLogs: mongoose.model("AccessLog", itemSchema)
};

function clean(doc) {
  if (!doc) return doc;
  const copy = { ...doc };
  delete copy._id;
  delete copy.__v;
  delete copy._singleton;
  return copy;
}

async function persist(db) {
  db.meta = db.meta || {};
  db.meta.lastUpdated = new Date().toISOString();

  await Setting.findOneAndUpdate(
    { _singleton: "main" },
    { ...db.settings, _singleton: "main" },
    { upsert: true, new: true }
  );
  await Meta.findOneAndUpdate(
    { _singleton: "main" },
    { ...db.meta, _singleton: "main" },
    { upsert: true, new: true }
  );

  for (const [key, Model] of Object.entries(COLLECTIONS)) {
    const rows = Array.isArray(db[key]) ? db[key] : [];
    await Model.deleteMany({});
    if (rows.length) {
      await Model.insertMany(rows.map((row) => ({ ...row })), { ordered: true });
    }
  }
}

async function loadDb() {
  const settings = await Setting.findOne({ _singleton: "main" }).lean();
  if (!settings) {
    const seeded = createSeedDatabase();
    await persist(seeded);
    return seeded;
  }
  const meta = await Meta.findOne({ _singleton: "main" }).lean();
  const db = {
    settings: clean(settings),
    meta: clean(meta) || {}
  };
  for (const [key, Model] of Object.entries(COLLECTIONS)) {
    const rows = await Model.find().lean();
    db[key] = rows.map(clean);
  }
  db.circulars = db.circulars || [];
  db.certificates = db.certificates || [];
  db.accessLogs = db.accessLogs || [];
  db.members = db.members || [];

  // Ensure exactly one Level 1 Super Admin account exists
  let superAdmin = db.members.find(
    (m) => m.level === 1 || m.role === "superadmin" || m.memberCode === "UPBMS-ADMIN-01" || m.id === "mem-superadmin-1"
  );

  if (!superAdmin) {
    superAdmin = {
      id: "mem-superadmin-1",
      memberCode: "UPBMS-ADMIN-01",
      username: "admin",
      nameHi: "प्रांतीय मुख्य प्रशासक (सुपर एडमिन)",
      nameEn: "State Chief Administrator (Super Admin)",
      fatherName: "श्री सत्य प्रकाश",
      fatherNameEn: "Shri Satya Prakash",
      isCoreMember: true,
      memberCategory: "Super Admin (मुख्य प्रशासक)",
      designationHi: "मुख्य प्रशासक (Level 1)",
      designationEn: "Chief Administrator (Level 1)",
      displayOrder: 0,
      district: "लखनऊ (Lucknow)",
      block: "हज़रतगंज",
      blockEn: "Hazratganj",
      bankName: "State Bank of India (SBI)",
      bcCompany: "CSC e-Governance Services India Ltd.",
      koCode: "ADMIN-01",
      mobile: "9450011223",
      whatsapp: "919450011223",
      email: "admin@upbms.org.in",
      websiteUrl: "",
      bloodGroup: "O+",
      photoUrl: "/images/leader-president.jpg",
      messageHi: "उत्तर प्रदेश बैंक मित्र संघ के प्रांतीय डिजिटल नियंत्रण कक्ष में आपका स्वागत है।",
      messageEn: "Welcome to the State Digital Control Room of Uttar Pradesh Bank Mitra Sangh.",
      signatoryId: "sig-gs",
      password: "admin123",
      status: "active",
      level: 1,
      role: "superadmin",
      joinedDate: "2024-01-01",
      validUntil: "2030-12-31",
      feePaid: 0
    };
    db.members.unshift(superAdmin);
  } else {
    superAdmin.level = 1;
    if (!superAdmin.username) superAdmin.username = "admin";
  }

  // Ensure every other member has a valid level (2, 3, or 4) and strictly only one Level 1
  let foundSuperAdmin = false;
  db.members.forEach((m) => {
    if (m.id === superAdmin.id || (!foundSuperAdmin && (m.level === 1 || m.role === "superadmin"))) {
      m.level = 1;
      foundSuperAdmin = true;
    } else {
      if (m.level === 1) {
        m.level = 2; // only one Level 1 allowed
      } else if (!m.level) {
        m.level = m.isCoreMember ? 2 : 3;
      } else {
        m.level = Number(m.level);
      }
    }
  });

  return db;
}

async function connectMongo() {
  const uri = process.env.MONGO_URI;
  if (uri) {
    await mongoose.connect(uri);
    console.log("MongoDB: connected using MONGO_URI");
    return;
  }

  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/upbms", {
      serverSelectionTimeoutMS: 1800
    });
    console.log("MongoDB: connected to mongodb://127.0.0.1:27017/upbms");
    return;
  } catch (err) {
    console.log("MongoDB: no local server. Starting an embedded MongoDB for this MERN app.");
  }

  const { MongoMemoryServer } = require("mongodb-memory-server");
  const dbPath = path.join(__dirname, "..", "data", "mongodata");
  fs.mkdirSync(dbPath, { recursive: true });
  let memory;
  try {
    memory = await MongoMemoryServer.create({
      instance: { dbName: "upbms", dbPath, storageEngine: "wiredTiger" }
    });
  } catch (err) {
    console.log("Persistent embedded MongoDB unavailable, using in-memory MongoDB:", err.message);
    memory = await MongoMemoryServer.create({ instance: { dbName: "upbms" } });
  }
  const memoryUri = memory.getUri("upbms");
  await mongoose.connect(memoryUri);
  console.log("MongoDB: embedded instance ready");
}

module.exports = { connectMongo, loadDb, persist };
