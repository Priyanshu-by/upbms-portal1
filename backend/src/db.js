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
