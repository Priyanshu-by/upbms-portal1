import { useEffect, useState } from "react";
import { api, uploadFile } from "../api";
import { usePortal } from "../context";
import { t, localizeDual } from "../utils";

const TABS = [
  ["dashboard", "📊 डैशबोर्ड", "📊 Dashboard"],
  ["users", "👥 उपयोगकर्ता प्रबंधन", "👥 User Management"],
  ["signs", "✍️ हस्ताक्षर एवं मुहर", "✍️ Signature & Seal"],
  ["menus", "🧭 मेनू व सेक्शन", "🧭 Menus & Sections"],
  ["about", "🏛️ परिचय व प्रमाण-पत्र", "🏛️ About & Certificates"],
  ["templates", "🎨 बैकग्राउंड व शर्तें", "🎨 Backgrounds & Terms"],
  ["hero", "🖼️ स्लाइडर व अभियान", "🖼️ Slider & Campaign"],
  ["members", "👥 सदस्य", "👥 Members"],
  ["circulars", "📑 सर्कुलर", "📑 Circulars"],
  ["documents", "📂 दस्तावेज़ व मांगें", "📂 Documents & Demands"],
  ["portals", "🌐 पोर्टल", "🌐 Portals"],
  ["payments", "💳 शुल्क व रसीद", "💳 Fees & Receipts"],
  ["grievance", "⚖️ शिकायत व समाचार", "⚖️ Grievance & News"],
  ["branding", "⚙️ संस्था व ब्रांडिंग", "⚙️ Org & Branding"]
];

function lines(text) {
  return String(text || "").split("\n").map((s) => s.trim()).filter(Boolean);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function AdminPage() {
  const portal = usePortal();
  const { state, session, persistSession, logout, refresh, showToast, setRoute, lang, isSuperAdmin, userLevel } = portal;
  const [tab, setTab] = useState("dashboard");
  const [loginMode, setLoginMode] = useState("pin");
  const [pin, setPin] = useState("");
  const [query, setQuery] = useState("");
  const [password, setPassword] = useState("");

  async function login(e) {
    e.preventDefault();
    try {
      const payload = loginMode === "pin" ? { pin } : { query, password };
      const data = await api("/api/admin/login", { method: "POST", body: payload });
      const next = {
        adminPin: data.adminPin || (loginMode === "pin" ? pin : ""),
        memberId: data.memberId || data.member?.id,
        memberPass: data.memberPass || password,
        member: data.member,
        level: data.level || (loginMode === "pin" ? 1 : 2),
        isAdmin: true
      };
      persistSession(next);
      await refresh(next);
      showToast(t(lang, `एडमिन लॉगिन सफल (Level ${next.level})`, `Admin login successful (Level ${next.level})`));
    } catch (err) {
      showToast(err.message);
    }
  }

  if (!session?.isAdmin) {
    return (
      <section className="section-block">
        <div className="container" style={{ maxWidth: 500, margin: "30px auto" }}>
          <div className="card-panel" style={{ padding: "32px 28px", borderRadius: 16, boxShadow: "0 10px 25px rgba(0,0,0,0.08)" }}>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize: "2.8rem", marginBottom: 8 }}>⚙️</div>
              <h2 style={{ color: "var(--primary)", fontSize: "1.5rem", fontWeight: 900, margin: 0 }}>
                {t(lang, "प्रशासनिक नियंत्रण कक्ष", "Admin Control Panel")}
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginTop: 6 }}>
                {t(lang, "केवल अधिकृत Level 1 एवं Level 2 प्रशासक खातों हेतु", "For authorized Level 1 & Level 2 administrators only")}
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 18, background: "#f1f5f9", padding: 4, borderRadius: 8 }}>
              <button
                type="button"
                className={`btn btn-sm ${loginMode === "pin" ? "btn-primary" : "btn-outline"}`}
                style={{ fontWeight: 800, border: "none" }}
                onClick={() => setLoginMode("pin")}
              >
                🔑 {t(lang, "एडमिन पिन", "Admin PIN")}
              </button>
              <button
                type="button"
                className={`btn btn-sm ${loginMode === "account" ? "btn-primary" : "btn-outline"}`}
                style={{ fontWeight: 800, border: "none" }}
                onClick={() => setLoginMode("account")}
              >
                👤 {t(lang, "खाता / पासवर्ड", "Account / Pass")}
              </button>
            </div>

            <form onSubmit={login}>
              {loginMode === "pin" ? (
                <div>
                  <label className="form-group">
                    {t(lang, "एडमिन पिन दर्ज करें (Admin PIN)", "Enter Admin PIN")}
                    <input
                      className="form-control"
                      type="password"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      placeholder="e.g. 1234"
                      required
                      autoFocus
                    />
                  </label>
                  <div style={{ fontSize: "0.8rem", color: "#166534", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "8px 12px", borderRadius: 6, margin: "10px 0 16px" }}>
                    💡 <b>{t(lang, "डेमो पिन:", "Demo PIN:")}</b> <code>1234</code> (Level 1 Super Admin)
                  </div>
                </div>
              ) : (
                <div>
                  <label className="form-group">
                    {t(lang, "यूज़रनेम / सदस्य कोड / मोबाइल", "Username / Member ID / Mobile")}
                    <input
                      className="form-control"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="e.g. admin or UPBMS-CORE-002"
                      required
                      autoFocus
                    />
                  </label>
                  <label className="form-group" style={{ marginTop: 10 }}>
                    {t(lang, "पासवर्ड", "Password")}
                    <input
                      className="form-control"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="e.g. admin123 or 123456"
                      required
                    />
                  </label>
                  <div style={{ fontSize: "0.78rem", color: "#15803d", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "8px 12px", borderRadius: 6, margin: "10px 0 16px", lineHeight: 1.5 }}>
                    <div>👑 <b>Level 1 (Super Admin):</b> <code>admin</code> / <code>admin123</code></div>
                    <div>⭐ <b>Level 2 (Admin):</b> <code>UPBMS-CORE-002</code> / <code>123456</code></div>
                  </div>
                </div>
              )}

              <button className="btn btn-accent btn-lg" style={{ width: "100%", marginTop: 8 }}>
                🚀 {t(lang, "एडमिन पैनल में प्रवेश करें", "Enter Admin Panel")}
              </button>
            </form>
          </div>
        </div>
      </section>
    );
  }

  async function run(path, options, okMsg) {
    try {
      await api(path, { session, ...options });
      await refresh();
      if (okMsg) showToast(okMsg);
      return true;
    } catch (err) {
      showToast(err.message);
      return false;
    }
  }

  const saveSettings = (patch, msg) => run("/api/settings", { method: "PUT", body: patch }, msg);

  // Filter tabs: Level 2 admins cannot see or access User Management!
  const visibleTabs = TABS.filter(([id]) => id !== "users" || isSuperAdmin);

  return (
    <div className="container" style={{ padding: "18px 0 40px" }}>
      <div className="admin-shell">
        <aside className="admin-sidebar no-print">
          <div style={{ padding: "8px 10px 14px" }}>
            <div style={{ color: "#ffd166", fontWeight: 900, fontSize: "0.74rem" }}>
              {isSuperAdmin ? "👑 LEVEL 1 (SUPER ADMIN)" : "⭐ LEVEL 2 (ADMIN)"}
            </div>
            <div style={{ fontWeight: 900 }}>{t(lang, "सुपर एडमिन कंट्रोल पैनल", "Super Admin Control Panel")}</div>
          </div>
          {visibleTabs.map(([id, labelHi, labelEn]) => (
            <button key={id} className={`admin-menu-btn ${tab === id ? "active" : ""}`} onClick={() => setTab(id)}>
              <span>{t(lang, labelHi, labelEn)}</span>
            </button>
          ))}
          <div style={{ marginTop: 14, display: "grid", gap: 8 }}>
            <button className="btn btn-white btn-sm" onClick={() => setRoute("home")}>🌐 {t(lang, "वेबसाइट प्रीव्यू", "Website Preview")}</button>
            <button className="btn btn-danger btn-sm" onClick={logout}>🔒 {t(lang, "लॉगआउट (Level 4 मोड)", "Logout (Level 4)")}</button>
          </div>
        </aside>
        <section style={{ minWidth: 0 }}>
          {tab === "dashboard" && <Dashboard portal={portal} run={run} setTab={setTab} />}
          {tab === "users" && (
            isSuperAdmin ? (
              <UsersManagement portal={portal} run={run} />
            ) : (
              <div className="card-panel">
                <h3 style={{ color: "var(--danger)" }}>🔒 {t(lang, "पहुंच प्रतिबंधित (Access Restricted)", "Access Restricted")}</h3>
                <p>{t(lang, "उपयोगकर्ता प्रबंधन केवल Level 1 (सुपर एडमिन) के लिए आरक्षित है। Level 2 प्रशासक इसे एक्सेस नहीं कर सकते।", "User Management is strictly restricted to Level 1 Super Admin. Level 2 Admins cannot access this section.")}</p>
              </div>
            )
          )}
          {(tab === "signs" || tab === "logs") && <Signs state={state} saveSettings={saveSettings} session={session} showToast={showToast} run={run} />}
          {tab === "menus" && <Menus state={state} saveSettings={saveSettings} />}
          {tab === "about" && <About state={state} saveSettings={saveSettings} run={run} session={session} showToast={showToast} />}
          {tab === "templates" && <Templates state={state} saveSettings={saveSettings} session={session} showToast={showToast} />}
          {tab === "hero" && <Hero state={state} saveSettings={saveSettings} run={run} session={session} showToast={showToast} />}
          {tab === "members" && <Members portal={portal} run={run} />}
          {tab === "circulars" && <Circulars state={state} run={run} session={session} showToast={showToast} saveSettings={saveSettings} />}
          {tab === "documents" && <Documents state={state} run={run} saveSettings={saveSettings} />}
          {tab === "portals" && <Portals state={state} run={run} session={session} showToast={showToast} saveSettings={saveSettings} />}
          {tab === "payments" && <Payments state={state} saveSettings={saveSettings} run={run} />}
          {tab === "grievance" && <GrievanceNews state={state} saveSettings={saveSettings} run={run} session={session} showToast={showToast} />}
          {tab === "branding" && <Branding state={state} saveSettings={saveSettings} session={session} showToast={showToast} persistSession={persistSession} refresh={refresh} />}
        </section>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return <label className="form-group"><span className="form-label">{label}</span>{children}</label>;
}
function Inp(props) { return <input className="form-control" {...props} />; }
function Area(props) { return <textarea className="form-control" rows={4} {...props} />; }

async function download(path, filename, session) {
  const res = await api(path, { session, raw: true });
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function UsersManagement({ portal, run }) {
  const { state, session, showToast, lang, refresh } = portal;
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState(null);
  const [editL1, setEditL1] = useState(false);
  const [l1Form, setL1Form] = useState({
    username: "",
    password: "",
    nameHi: "",
    nameEn: "",
    mobile: ""
  });

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await api("/api/users", { session });
      if (res.ok && res.users) {
        setUsers(res.users);
        const l1 = res.users.find((u) => u.level === 1);
        if (l1) {
          setL1Form({
            username: l1.username || "admin",
            password: "",
            nameHi: l1.nameHi || "",
            nameEn: l1.nameEn || "",
            mobile: l1.mobile || ""
          });
        }
      }
    } catch (err) {
      showToast(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const changeLevel = async (userId, newLevel) => {
    try {
      setUpdatingId(userId);
      await api(`/api/users/${userId}/level`, {
        method: "PUT",
        session,
        body: { level: Number(newLevel), activateMember: true }
      });
      showToast(t(lang, `उपयोगकर्ता स्तर सफलतापूर्वक Level ${newLevel} में बदला गया`, `User level updated to Level ${newLevel}`));
      await loadUsers();
      await refresh();
    } catch (err) {
      showToast(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleL1Submit = async (e) => {
    e.preventDefault();
    try {
      await api("/api/users/level1-credentials", {
        method: "PUT",
        session,
        body: l1Form
      });
      showToast(t(lang, "लेवल 1 सुपर एडमिन क्रेडेंशियल सफलतापूर्वक अपडेट किए गए", "Level 1 Super Admin credentials updated"));
      setEditL1(false);
      await loadUsers();
      await refresh();
    } catch (err) {
      showToast(err.message);
    }
  };

  const superAdminUser = users.find((u) => u.level === 1) || (state.members || []).find((m) => m.level === 1);
  const levelCounts = {
    1: users.filter((u) => u.level === 1).length,
    2: users.filter((u) => u.level === 2).length,
    3: users.filter((u) => u.level === 3).length,
    4: users.filter((u) => u.level === 4).length
  };

  const filteredUsers = users.filter((u) => {
    if (levelFilter !== "all" && String(u.level) !== String(levelFilter)) return false;
    if (search) {
      const q = search.toLowerCase();
      const combined = `${u.nameHi} ${u.nameEn} ${u.memberCode} ${u.username} ${u.mobile} ${u.district} ${u.designationHi}`.toLowerCase();
      if (!combined.includes(q)) return false;
    }
    return true;
  });

  return (
    <div style={{ display: "grid", gap: 20 }}>
      {/* 1. Header Banner */}
      <div className="card-panel" style={{ borderLeft: "5px solid #eab308", background: "linear-gradient(135deg, #0b1a30 0%, #162a45 100%)", color: "#fff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ color: "#ffd166", fontWeight: 800, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 4 }}>
              👑 ACCESS CONTROL & ROLES (LEVEL 1 EXCLUSIVE)
            </div>
            <h2 style={{ margin: "0 0 6px", fontSize: "1.5rem", fontWeight: 900, color: "#fff" }}>
              {t(lang, "👥 उपयोगकर्ता एवं अनुमति स्तर प्रबंधन", "👥 User Access Levels & Permissions")}
            </h2>
            <p style={{ margin: 0, color: "#cbd5e1", fontSize: "0.92rem", lineHeight: 1.5, maxWidth: 750 }}>
              {t(
                lang,
                "यहाँ से आप प्रत्येक पंजीकृत उपयोगकर्ता के अधिकार स्तर (Level 1, 2, 3, 4) देख और अपग्रेड कर सकते हैं। केवल Level 1 सुपर एडमिन को उपयोगकर्ता स्तर बदलने का पूर्ण अधिकार है।",
                "View and manage access levels (Levels 1, 2, 3, 4) for all users. Only Level 1 Super Admin has authority to upgrade or modify user access levels."
              )}
            </p>
          </div>
          <button className="btn btn-white btn-sm" onClick={loadUsers} disabled={loading} style={{ alignSelf: "center" }}>
            🔄 {t(lang, "रीफ्रेश करें", "Refresh Users")}
          </button>
        </div>
      </div>

      {/* 2. 4 Levels Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 14 }}>
        {/* Level 1 Card */}
        <div className="card-panel" style={{ borderTop: "4px solid #f59e0b", padding: "16px 18px", background: "#fffdf5" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span className="badge badge-level1">👑 LEVEL 1</span>
            <span style={{ fontSize: "1.3rem", fontWeight: 900, color: "#b45309" }}>{levelCounts[1]} {t(lang, "खाता", "Account")}</span>
          </div>
          <div style={{ fontWeight: 800, color: "#92400e", fontSize: "0.95rem" }}>
            {t(lang, "सुपर एडमिन (केवल 1 खाता)", "Super Admin (Only 1 Account)")}
          </div>
          <p style={{ fontSize: "0.82rem", color: "#78350f", margin: "6px 0 0", lineHeight: 1.4 }}>
            {t(lang, "सर्वोच्च अधिकार: संपूर्ण वेबसाइट, सभी एडमिन पैनल संपादन तथा उपयोगकर्ता प्रबंधन।", "Supreme Access: All website features, all admin tabs, and User Management.")}
          </p>
        </div>

        {/* Level 2 Card */}
        <div className="card-panel" style={{ borderTop: "4px solid #2563eb", padding: "16px 18px", background: "#f8faff" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span className="badge badge-level2">⭐ LEVEL 2</span>
            <span style={{ fontSize: "1.3rem", fontWeight: 900, color: "#1d4ed8" }}>{levelCounts[2]}</span>
          </div>
          <div style={{ fontWeight: 800, color: "#1e40af", fontSize: "0.95rem" }}>
            {t(lang, "प्रशासक / सब-एडमिन", "Admin / Sub-Admin")}
          </div>
          <p style={{ fontSize: "0.82rem", color: "#1e3a8a", margin: "6px 0 0", lineHeight: 1.4 }}>
            {t(lang, "वेबसाइट, सदस्य सूची व एडमिन पैनल। (User Management छोड़कर सभी संपादन अधिकार)।", "Website, Members & Admin Panel (All edit rights EXCEPT User Management).")}
          </p>
        </div>

        {/* Level 3 Card */}
        <div className="card-panel" style={{ borderTop: "4px solid #10b981", padding: "16px 18px", background: "#f6fef9" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span className="badge badge-level3">🎖️ LEVEL 3</span>
            <span style={{ fontSize: "1.3rem", fontWeight: 900, color: "#047857" }}>{levelCounts[3]}</span>
          </div>
          <div style={{ fontWeight: 800, color: "#065f46", fontSize: "0.95rem" }}>
            {t(lang, "सत्यापित सदस्य", "Verified Member")}
          </div>
          <p style={{ fontSize: "0.82rem", color: "#064e3b", margin: "6px 0 0", lineHeight: 1.4 }}>
            {t(lang, "सार्वजनिक वेबसाइट + सदस्य सूची (Members Page) + डिजिटल पहचान पत्र एवं नियुक्ति पत्र।", "Full website + Members Directory + Digital ID Card & Appointment Letter.")}
          </p>
        </div>

        {/* Level 4 Card */}
        <div className="card-panel" style={{ borderTop: "4px solid #64748b", padding: "16px 18px", background: "#f8fafc" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span className="badge badge-level4">👤 LEVEL 4</span>
            <span style={{ fontSize: "1.3rem", fontWeight: 900, color: "#475569" }}>{levelCounts[4]}</span>
          </div>
          <div style={{ fontWeight: 800, color: "#334155", fontSize: "0.95rem" }}>
            {t(lang, "सामान्य आगंतुक / गेस्ट", "Guest / Visitor")}
          </div>
          <p style={{ fontSize: "0.82rem", color: "#475569", margin: "6px 0 0", lineHeight: 1.4 }}>
            {t(lang, "केवल सार्वजनिक वेबसाइट। सदस्य सूची व एडमिन पूर्ण वर्जित। सदस्यता लेकर Level 3 बन सकते हैं।", "Public website only. No Members page, No Admin. Can join to become Level 3.")}
          </p>
        </div>
      </div>

      {/* 3. Level 1 Account Details Card */}
      <div className="card-panel" style={{ border: "1.5px solid #fde68a", background: "#fffbeb" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="badge badge-level1" style={{ fontSize: "0.85rem", padding: "3px 10px" }}>👑 LEVEL 1 SUPER ADMIN</span>
              <span style={{ color: "#b45309", fontWeight: 800, fontSize: "0.88rem" }}>
                ({t(lang, "नियम: संपूर्ण प्रणाली में केवल 1 खाता मान्य", "Rule: Exactly One Account Permitted")})
              </span>
            </div>
            <h3 style={{ margin: "6px 0 0", color: "#78350f", fontSize: "1.2rem", fontWeight: 900 }}>
              {superAdminUser ? t(lang, superAdminUser.nameHi, superAdminUser.nameEn) : "Super Admin"}
            </h3>
          </div>
          <button
            type="button"
            className="btn btn-sm"
            style={{ background: editL1 ? "#e2e8f0" : "#d97706", color: editL1 ? "#0f172a" : "#fff", fontWeight: 800, border: "none" }}
            onClick={() => setEditL1(!editL1)}
          >
            {editL1 ? t(lang, "✕ बंद करें", "✕ Close") : t(lang, "✏️ क्रेडेंशियल व पासवर्ड बदलें", "✏️ Change Credentials & Password")}
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, fontSize: "0.9rem", color: "#92400e" }}>
          <div><b>{t(lang, "यूज़रनेम (Username):", "Username:")}</b> <code>{superAdminUser?.username || "admin"}</code></div>
          <div><b>{t(lang, "सदस्य कोड (Member Code):", "Member Code:")}</b> <code>{superAdminUser?.memberCode || "UPBMS-ADMIN-01"}</code></div>
          <div><b>{t(lang, "मोबाइल नंबर (Mobile):", "Mobile:")}</b> {superAdminUser?.mobile || "9450011223"}</div>
          <div><b>{t(lang, "स्थिति (Status):", "Status:")}</b> <span className="badge badge-verified">{t(lang, "सक्रिय (Active)", "Active")}</span></div>
        </div>

        {editL1 && (
          <form onSubmit={handleL1Submit} style={{ marginTop: 18, paddingTop: 16, borderTop: "1px dashed #fcd34d", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            <label className="form-group">
              {t(lang, "सुपर एडमिन यूज़रनेम (Username)", "Username")}
              <input className="form-control" value={l1Form.username} onChange={(e) => setL1Form({ ...l1Form, username: e.target.value })} required />
            </label>
            <label className="form-group">
              {t(lang, "नाम (हिंदी में)", "Name (Hindi)")}
              <input className="form-control" value={l1Form.nameHi} onChange={(e) => setL1Form({ ...l1Form, nameHi: e.target.value })} required />
            </label>
            <label className="form-group">
              {t(lang, "नाम (अंग्रेज़ी में)", "Name (English)")}
              <input className="form-control" value={l1Form.nameEn} onChange={(e) => setL1Form({ ...l1Form, nameEn: e.target.value })} />
            </label>
            <label className="form-group">
              {t(lang, "मोबाइल नंबर", "Mobile Number")}
              <input className="form-control" value={l1Form.mobile} onChange={(e) => setL1Form({ ...l1Form, mobile: e.target.value })} required />
            </label>
            <label className="form-group">
              {t(lang, "नया पासवर्ड (New Password)", "New Password")}
              <input className="form-control" type="password" value={l1Form.password} onChange={(e) => setL1Form({ ...l1Form, password: e.target.value })} placeholder={t(lang, "नया पासवर्ड लिखें (न्यूनतम 4 अक्षर)", "Leave blank to keep current")} />
            </label>
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <button className="btn btn-accent" style={{ height: 42, width: "100%" }}>
                💾 {t(lang, "क्रेडेंशियल सहेजें", "Save Credentials")}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 4. Users Table & Level Upgrade Controls */}
      <div className="card-panel">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14, marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 900, color: "var(--primary)" }}>
            📋 {t(lang, "समस्त पंजीकृत उपयोगकर्ता एवं स्तर अपग्रेड", "All Users & Level Upgrade")} ({filteredUsers.length})
          </h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)" }}>{t(lang, "फ़िल्टर:", "Filter:")}</span>
            {["all", "1", "2", "3", "4"].map((lvl) => (
              <button
                key={lvl}
                type="button"
                className={`btn btn-sm ${levelFilter === lvl ? "btn-primary" : "btn-outline"}`}
                style={{ padding: "4px 10px", fontSize: "0.8rem", fontWeight: 800 }}
                onClick={() => setLevelFilter(lvl)}
              >
                {lvl === "all" ? t(lang, "सभी (All)", "All") : `Level ${lvl}`}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <input
            className="form-control"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t(lang, "नाम, यूज़रनेम, सदस्य आईडी, मोबाइल या जनपद खोजें...", "Search by name, username, member ID, mobile or district...")}
          />
        </div>

        {loading ? (
          <div style={{ padding: 30, textAlign: "center", color: "var(--text-muted)" }}>{t(lang, "उपयोगकर्ता लोड हो रहे हैं...", "Loading users...")}</div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ padding: 30, textAlign: "center", color: "var(--text-muted)" }}>{t(lang, "कोई उपयोगकर्ता नहीं मिला।", "No users found matching criteria.")}</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t(lang, "यूज़र / सदस्य कोड", "User / Member Code")}</th>
                  <th>{t(lang, "नाम एवं पद", "Name & Designation")}</th>
                  <th>{t(lang, "मोबाइल व जनपद", "Mobile & District")}</th>
                  <th>{t(lang, "वर्तमान स्तर", "Current Level")}</th>
                  <th style={{ minWidth: 190 }}>{t(lang, "स्तर अपग्रेड / परिवर्तन", "Upgrade / Change Level")}</th>
                  <th>{t(lang, "स्थिति", "Status")}</th>
                  <th>{t(lang, "कार्रवाई", "Action")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const isL1 = u.level === 1;
                  return (
                    <tr key={u.id} style={{ background: isL1 ? "#fffbeb" : undefined }}>
                      <td>
                        <div style={{ fontWeight: 800 }}>{u.memberCode}</div>
                        {u.username && <div style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>@{u.username}</div>}
                      </td>
                      <td>
                        <div style={{ fontWeight: 700 }}>{t(lang, u.nameHi, u.nameEn)}</div>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{t(lang, u.designationHi, u.designationEn)}</div>
                      </td>
                      <td>
                        <div>{u.mobile}</div>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{u.district}</div>
                      </td>
                      <td>
                        <span className={`badge badge-level${u.level}`}>
                          {u.level === 1 && "👑 Level 1"}
                          {u.level === 2 && "⭐ Level 2"}
                          {u.level === 3 && "🎖️ Level 3"}
                          {u.level === 4 && "👤 Level 4"}
                        </span>
                      </td>
                      <td>
                        {isL1 ? (
                          <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "#b45309" }}>
                            🔒 {t(lang, "स्थायी सुपर एडमिन (1 खाता केवल)", "Fixed Super Admin (1 Only)")}
                          </span>
                        ) : (
                          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            <select
                              className="form-control form-control-sm"
                              value={u.level}
                              disabled={updatingId === u.id}
                              onChange={(e) => changeLevel(u.id, e.target.value)}
                              style={{ fontWeight: 800, fontSize: "0.82rem", padding: "4px 8px", width: "auto" }}
                            >
                              <option value={2}>⭐ Level 2 (Admin)</option>
                              <option value={3}>🎖️ Level 3 (Member)</option>
                              <option value={4}>👤 Level 4 (Guest)</option>
                            </select>
                            {updatingId === u.id && <span style={{ fontSize: "0.75rem", color: "var(--accent)" }}>⏳</span>}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`badge badge-${u.status === "active" ? "verified" : "pending"}`}>
                          {u.status === "active" ? t(lang, "सक्रिय", "Active") : t(lang, "लंबित", "Pending")}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: "0.78rem", padding: "4px 8px" }}
                          onClick={async () => {
                            const newPwd = prompt(t(lang, `${u.nameHi} का नया पासवर्ड दर्ज करें (न्यूनतम 4 अक्षर):`, `Enter new password for ${u.nameEn} (min 4 chars):`), "123456");
                            if (newPwd && newPwd.trim().length >= 4) {
                              try {
                                await api(`/api/members/${u.id}/reset-password`, { method: "POST", session, body: { newPassword: newPwd.trim() } });
                                showToast(t(lang, "पासवर्ड रीसेट सफल!", "Password reset successfully!"));
                              } catch (err) {
                                showToast(err.message);
                              }
                            }
                          }}
                        >
                          🔑 {t(lang, "पासवर्ड", "Password")}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Dashboard({ portal, run, setTab }) {
  const { state, session, showToast, lang } = portal;
  const s = state.settings || {};
  const st = state.stats || {};
  const pending = (state.members || []).filter((m) => m.status === "pending");
  const coreMembers = (state.members || []).filter((m) => m.isCoreMember);
  const activeMembers = (state.members || []).filter((m) => m.status === "active");
  const logs = state.accessLogs || [];
  const grvOn = s.enableGrievanceModule !== false;
  const [editMember, setEditMember] = useState(null);

  const saveSettings = (patch, msg) => run("/api/settings", { method: "PUT", body: patch }, msg);

  // Total verified fund calculation
  const totalVerifiedFund = (state.payments || [])
    .filter((p) => p.status === "verified")
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || st.totalCollection || 3701;

  return (
    <div style={{ display: "grid", gap: 18 }}>
      {/* 1. Top Welcome Banner per Screenshot 1 */}
      <div className="admin-banner-dark">
        <h2 style={{ color: "#ffd166", fontWeight: 900, fontSize: "1.55rem", margin: "0 0 8px" }}>
          {t(lang, "नमस्कार, सुपर एडमिन!", "Hello, Super Admin!")}
        </h2>
        <p style={{ color: "#cbd5e1", fontSize: "0.92rem", margin: "0 0 16px", lineHeight: 1.6 }}>
          {t(lang, "यहाँ से वेबसाइट का हर एक शब्द, मेनू नाम, सर्टिफिकेट, बैकग्राउंड, हस्ताक्षर, नियम-शर्तें व सदस्य पासवर्ड बिना कोडिंग बदला जा सकता है।", "From here, every word, menu name, certificate, background, signature, terms and member password can be modified without coding.")}
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <button
            type="button"
            className="btn btn-white btn-sm"
            style={{ fontWeight: 800, padding: "8px 16px", borderRadius: 8 }}
            onClick={() => download("/api/export/members.csv", "UPBMS_Members.csv", session)}
          >
            📥 {t(lang, "सदस्य CSV", "Members CSV")}
          </button>
          <button
            type="button"
            className="btn btn-white btn-sm"
            style={{ fontWeight: 800, padding: "8px 16px", borderRadius: 8 }}
            onClick={() => download("/api/export/payments.csv", "UPBMS_Payments.csv", session)}
          >
            📥 {t(lang, "भुगतान CSV", "Payments CSV")}
          </button>
          <button
            type="button"
            className="btn btn-sm"
            style={{ background: "#ea580c", color: "#ffffff", fontWeight: 800, padding: "8px 16px", borderRadius: 8, border: "none" }}
            onClick={() => download("/api/admin/backup", "UPBMS_Backup.json", session)}
          >
            💾 {t(lang, "JSON बैकअप", "JSON Backup")}
          </button>
          <button
            type="button"
            className="btn btn-sm"
            style={{ background: "#ffe4e6", color: "#e11d48", border: "1px solid #fecdd3", fontWeight: 800, padding: "8px 16px", borderRadius: 8 }}
            onClick={() => {
              if (confirm(t(lang, "चेतावनी: क्या आप डिफ़ॉल्ट डेटा रीसेट करना चाहते हैं? सभी परिवर्तन रीसेट हो जाएंगे।", "Warning: Are you sure you want to reset default data? All custom changes will be reset."))) {
                run("/api/admin/reset", { method: "POST" }, t(lang, "डिफ़ॉल्ट डेटा रीसेट हो गया", "Default data reset successfully"));
              }
            }}
          >
            🔄 {t(lang, "डिफ़ॉल्ट रीसेट", "Default Reset")}
          </button>
        </div>
      </div>

      {/* 2. 4 Stats Cards per Screenshot 1 */}
      <div className="admin-stats-grid">
        <div className="card-panel" style={{ padding: "18px 20px", borderRadius: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 800, color: "var(--text)", fontSize: "0.95rem" }}>
            👑 {t(lang, "मुख्य कार्यकारिणी:", "Core Committee:")}
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 900, color: "var(--primary)", marginTop: 6 }}>
            {coreMembers.length}
          </div>
        </div>

        <div className="card-panel" style={{ padding: "18px 20px", borderRadius: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 800, color: "var(--text)", fontSize: "0.95rem" }}>
            👥 {t(lang, "सक्रिय सदस्य:", "Active Members:")}
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 900, color: "var(--primary)", marginTop: 6 }}>
            {activeMembers.length}
          </div>
        </div>

        <div className="card-panel" style={{ padding: "18px 20px", borderRadius: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 800, color: "var(--text)", fontSize: "0.95rem" }}>
            💰 {t(lang, "सत्यापित कोष:", "Verified Fund:")}
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 900, color: "#16a34a", marginTop: 6 }}>
            ₹{totalVerifiedFund}
          </div>
        </div>

        <div className="card-panel" style={{ padding: "18px 20px", borderRadius: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 800, color: "var(--text)", fontSize: "0.95rem" }}>
            🛡️ {t(lang, "हस्ताक्षर/मुहर उपयोग लॉग:", "Signature/Seal Logs:")}
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 900, color: "#2563eb", marginTop: 6 }}>
            {logs.length}
          </div>
          <button
            type="button"
            onClick={() => setTab("signs")}
            style={{ background: "none", border: "none", color: "#2563eb", fontWeight: 700, fontSize: "0.84rem", cursor: "pointer", padding: 0, marginTop: 4, display: "inline-block" }}
          >
            {t(lang, "किसने उपयोग किया देखें →", "View who used →")}
          </button>
        </div>
      </div>

      {/* 3. Recent Signature & Seal Usage Records Card per Screenshot 1 */}
      <div className="card-panel" style={{ borderRadius: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, borderBottom: "1px solid #f1f5f9", paddingBottom: 14, marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 900, fontSize: "1.02rem", color: "var(--primary)" }}>
            {t(lang, "🛡️ हालिया हस्ताक्षर एवं मुहर उपयोग रिकॉर्ड (बिना सदस्य लॉगिन कोई भी विज़िटर हस्ताक्षर/मुहर नहीं देख सकता)", "🛡️ Recent Signature & Seal Usage Records (No visitor can view signature/seal without member login)")}
          </div>
          <button
            type="button"
            className="btn btn-sm"
            style={{ background: "#0b1a30", color: "#ffffff", fontWeight: 800, padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer" }}
            onClick={() => setTab("signs")}
          >
            {t(lang, "📖 संपूर्ण सुरक्षा लॉग खोलें →", "📖 Open Full Security Log →")}
          </button>
        </div>

        {logs.length === 0 ? (
          <div style={{ color: "#64748b", padding: "12px 0", fontSize: "0.9rem" }}>
            {t(lang, "कोई सुरक्षा लॉग रिकॉर्ड नहीं मिला।", "No security log records found.")}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {logs.slice(0, 4).map((l, idx) => (
              <div
                key={l.id || idx}
                style={{
                  padding: "12px 0",
                  borderBottom: idx < Math.min(logs.length, 4) - 1 ? "1px solid #f1f5f9" : "none"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                  <div style={{ fontSize: "0.92rem", color: "var(--text)" }}>
                    <b>{l.memberNameHi}</b> ({l.memberCode}) — {l.mobile ? `${l.mobile} • ` : ""}{l.district || "लखनऊ मुख्यालय (HQ)"}
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "#64748b", whiteSpace: "nowrap" }}>
                    ⏱️ {l.timestamp || l.date}
                  </div>
                </div>
                <div style={{ color: "#15803d", fontSize: "0.88rem", fontWeight: 700, marginTop: 4 }}>
                  {l.actionLabelHi} — {l.targetTitleHi || "आधिकारिक प्रपत्र"} {l.signatoriesUsedHi ? `(${l.signatoriesUsedHi})` : ""}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Grievance Redressal Module Status Banner per Screenshot 1 */}
      <div style={{ background: "#ecfdf5", border: "1.5px solid #a7f3d0", borderRadius: 14, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
        <div>
          <div style={{ fontWeight: 800, color: "#065f46", fontSize: "0.98rem" }}>
            ⚖️ {t(lang, "शिकायत निवारण (Grievance Redressal) मॉड्यूल स्थिति:", "Grievance Redressal Module Status:")} <span style={{ color: grvOn ? "#15803d" : "#dc2626", fontWeight: 900 }}>{grvOn ? t(lang, "चालू (वेबसाइट पर दिख रहा है)", "ACTIVE (Visible on site)") : t(lang, "बंद (वेबसाइट पर छिपा हुआ है)", "OFF (Hidden from site)")}</span>
          </div>
          <div style={{ fontSize: "0.84rem", color: "#047857", marginTop: 4 }}>
            {t(lang, "इसे बंद करते ही मेनू बार, होमपेज बटन व फुटर सभी जगह से शिकायत निवारण के विकल्प तुरंत छिप जाएंगे।", "Disabling this will immediately hide grievance options from the menu bar, homepage button, and footer.")}
          </div>
        </div>
        <div>
          {grvOn ? (
            <button
              type="button"
              className="btn btn-sm"
              style={{ background: "#fee2e2", color: "#b91c1c", border: "1px solid #fca5a5", fontWeight: 800, borderRadius: 8, padding: "8px 16px", cursor: "pointer" }}
              onClick={() => saveSettings({ enableGrievanceModule: false }, "शिकायत मॉड्यूल छिपाया गया")}
            >
              {t(lang, "🛑 शिकायत निवारण मेनू व विकल्प छिपाएँ (Hide)", "🛑 Hide Grievance Options (Hide)")}
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-sm btn-whatsapp"
              style={{ fontWeight: 800, borderRadius: 8, padding: "8px 16px", cursor: "pointer" }}
              onClick={() => saveSettings({ enableGrievanceModule: true }, "शिकायत मॉड्यूल चालू किया गया")}
            >
              {t(lang, "✅ शिकायत निवारण चालू करें (Show)", "✅ Enable Grievance Module (Show)")}
            </button>
          )}
        </div>
      </div>

      {/* 5. Pending Membership Applications Card per Screenshot 1 */}
      <div className="card-panel" style={{ borderRadius: 16 }}>
        <div style={{ fontWeight: 900, fontSize: "1.05rem", color: "var(--primary)", marginBottom: 14 }}>
          {t(lang, `⏳ लंबित सदस्यता आवेदन (${pending.length})`, `⏳ Pending Membership Applications (${pending.length})`)}
        </div>
        {pending.length === 0 ? (
          <div style={{ color: "#64748b", padding: "10px 0", fontSize: "0.9rem" }}>
            कोई लंबित सदस्यता आवेदन नहीं है। सभी आवेदन स्वीकृत हैं।
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {pending.map((m) => (
              <div
                key={m.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 12,
                  padding: "12px 16px",
                  background: "#fffbeb",
                  border: "1.5px solid #fef3c7",
                  borderRadius: 10
                }}
              >
                <div style={{ fontSize: "0.94rem" }}>
                  <b>{m.nameHi} ({m.nameEn})</b> — {m.district} • {m.mobile}
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button
                    type="button"
                    className="btn btn-whatsapp btn-sm"
                    style={{ fontWeight: 800, borderRadius: 8 }}
                    onClick={() => run(`/api/members/${m.id}`, { method: "PUT", body: { status: "active" } }, "सदस्य स्वीकृत")}
                  >
                    {t(lang, "✓ स्वीकृत करें", "✓ Approve")}
                  </button>
                  <button
                    type="button"
                    className="btn btn-white btn-sm"
                    style={{ fontWeight: 800, border: "1.5px solid #cbd5e1", borderRadius: 8 }}
                    onClick={() => setEditMember(m)}
                  >
                    {t(lang, "✏️ विवरण देखें/बदलें", "✏️ View/Edit Details")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Inline edit member form modal when clicking 'विवरण देखें/बदलें' */}
      {editMember && (
        <div style={{ marginTop: 12 }}>
          <MemberForm
            member={editMember}
            state={state}
            session={session}
            run={run}
            onClose={() => setEditMember(null)}
            showToast={showToast}
          />
        </div>
      )}
    </div>
  );
}

function Menus({ state, saveSettings }) {
  const { lang } = usePortal();
  const s = state.settings || {};
  const nav = [...(s.navItems || [])].sort((a, b) => (a.order || 99) - (b.order || 99));
  const hb = s.headerButtons || {};
  const stx = s.sectionTexts || {};
  const [activeTab, setActiveTab] = useState("nav"); // 'nav' | 'buttons' | 'sections'

  function saveNav(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const navItems = nav.map((it, i) => ({
      id: it.id,
      labelHi: fd.get(`hi_${i}`),
      labelEn: fd.get(`en_${i}`),
      order: Number(fd.get(`ord_${i}`)),
      visible: e.target.querySelector(`[name="vis_${i}"]`).checked
    }));
    const enableGrievanceModule = e.target.querySelector("[name=enableGrievanceModule]").checked;
    const grv = navItems.find((x) => x.id === "grievance");
    if (grv) grv.visible = enableGrievanceModule;
    saveSettings({ navItems, enableGrievanceModule }, t(lang, "मुख्य मेनू बार सफलतापूर्वक सेव हो गया", "Main navigation menu saved successfully"));
  }

  function saveButtons(e) {
    e.preventDefault();
    const raw = Object.fromEntries(new FormData(e.target).entries());
    ["idcardVisible", "donationVisible", "joinVisible", "memberLoginVisible", "adminVisible"].forEach((k) => {
      const el = e.target.querySelector(`[name="${k}"]`);
      if (el) raw[k] = el.checked;
    });
    saveSettings({ headerButtons: { ...hb, ...raw } }, t(lang, "हेडर एक्शन बटन सफलतापूर्वक सेव हो गए", "Header action buttons saved successfully"));
  }

  function saveTexts(e) {
    e.preventDefault();
    const raw = Object.fromEntries(new FormData(e.target).entries());
    saveSettings({ sectionTexts: { ...stx, ...raw } }, t(lang, "सेक्शन व फुटर शीर्षक सेव हो गए", "Section and footer titles saved successfully"));
  }

  return (
    <div style={{ display: "grid", gap: 18 }}>
      {/* Subtab Navigation Strip */}
      <div className="card-panel" style={{ padding: "12px 16px", borderRadius: 14 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <button
            type="button"
            className={`menus-subtab-btn ${activeTab === "nav" ? "active" : ""}`}
            onClick={() => setActiveTab("nav")}
          >
            🧭 {t(lang, "मुख्य नेविगेशन मेनू", "Main Navigation Menu")}
          </button>
          <button
            type="button"
            className={`menus-subtab-btn ${activeTab === "buttons" ? "active" : ""}`}
            onClick={() => setActiveTab("buttons")}
          >
            🔘 {t(lang, "शीर्ष हेडर एक्शन बटन", "Top Header Action Buttons")}
          </button>
          <button
            type="button"
            className={`menus-subtab-btn ${activeTab === "sections" ? "active" : ""}`}
            onClick={() => setActiveTab("sections")}
          >
            📌 {t(lang, "होमपेज सेक्शन व फुटर टेक्स्ट", "Homepage Sections & Footer Texts")}
          </button>
        </div>
      </div>

      {/* SUBTAB 1: Main Navigation Menu */}
      {activeTab === "nav" && (
        <form className="card-panel" onSubmit={saveNav} style={{ borderRadius: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
            <div>
              <h3 style={{ color: "var(--primary)", fontSize: "1.15rem", fontWeight: 900, margin: 0 }}>
                🧭 {t(lang, "मुख्य मेनू बार प्रबंधन", "Main Navigation Menu Management")}
              </h3>
              <p style={{ color: "#64748b", fontSize: "0.85rem", margin: "4px 0 0" }}>
                {t(lang, "यहाँ से मुख्य मेनू के नाम (हिंदी व अंग्रेज़ी), क्रम और दृश्यता (Visibility) नियंत्रित करें।", "Manage main navigation menu labels (Hindi & English), ordering and visibility.")}
              </p>
            </div>
            <button type="submit" className="btn btn-accent btn-sm" style={{ fontWeight: 800 }}>
              💾 {t(lang, "मेनू बार सेव करें", "Save Navigation Menu")}
            </button>
          </div>

          <div className="admin-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t(lang, "रूट ID", "Route ID")}</th>
                  <th>{t(lang, "हिंदी नाम (Hindi Label)", "Hindi Label")}</th>
                  <th>{t(lang, "English Label", "English Label")}</th>
                  <th style={{ width: 100 }}>{t(lang, "क्रम (Order)", "Order")}</th>
                  <th style={{ width: 110, textAlign: "center" }}>{t(lang, "दृश्यता (Visible)", "Visible")}</th>
                </tr>
              </thead>
              <tbody>
                {nav.map((it, i) => (
                  <tr key={it.id}>
                    <td>
                      <code style={{ background: "#f1f5f9", padding: "3px 8px", borderRadius: 6, fontWeight: 700, color: "var(--primary)" }}>
                        {it.id}
                      </code>
                    </td>
                    <td><Inp name={`hi_${i}`} defaultValue={it.labelHi} required /></td>
                    <td><Inp name={`en_${i}`} defaultValue={it.labelEn} required /></td>
                    <td><Inp name={`ord_${i}`} type="number" min="1" defaultValue={it.order || i + 1} /></td>
                    <td style={{ textAlign: "center" }}>
                      <label style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer", fontWeight: 700, fontSize: "0.85rem" }}>
                        <input type="checkbox" name={`vis_${i}`} defaultChecked={it.visible !== false} />
                        <span>{t(lang, "सक्रिय", "Active")}</span>
                      </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: "14px 18px", marginTop: 16 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontWeight: 800, color: "var(--primary)", fontSize: "0.92rem" }}>
              <input type="checkbox" name="enableGrievanceModule" defaultChecked={s.enableGrievanceModule !== false} />
              <span>⚖️ {t(lang, "शिकायत निवारण (Grievance Redressal) मॉड्यूल पूरी वेबसाइट पर चालू रखें", "Keep Grievance Redressal module active across the website")}</span>
            </label>
            <div style={{ color: "#64748b", fontSize: "0.82rem", marginLeft: 26, marginTop: 4 }}>
              {t(lang, "अनचेक करने पर मेनू बार, होमपेज बटन और फुटर से शिकायत निवारण का लिंक स्वतः छिप जाएगा।", "Unchecking this will automatically hide grievance redressal options from menu bar, homepage and footer.")}
            </div>
          </div>

          <div style={{ marginTop: 18, display: "flex", justifyContent: "flex-end" }}>
            <button type="submit" className="btn btn-accent" style={{ fontWeight: 800, padding: "10px 24px" }}>
              💾 {t(lang, "मेनू बार सेव करें", "Save Navigation Menu")}
            </button>
          </div>
        </form>
      )}

      {/* SUBTAB 2: Header Action Buttons */}
      {activeTab === "buttons" && (
        <form className="card-panel" onSubmit={saveButtons} style={{ borderRadius: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 18 }}>
            <div>
              <h3 style={{ color: "var(--primary)", fontSize: "1.15rem", fontWeight: 900, margin: 0 }}>
                🔘 {t(lang, "शीर्ष हेडर एक्शन बटन प्रबंधन", "Header Action Buttons Management")}
              </h3>
              <p style={{ color: "#64748b", fontSize: "0.85rem", margin: "4px 0 0" }}>
                {t(lang, "वेबसाइट के शीर्ष हेडर में प्रदर्शित होने वाले बटन्स के लेबल और दृश्यता प्रबंधित करें।", "Manage labels and visibility of top header action buttons.")}
              </p>
            </div>
            <button type="submit" className="btn btn-primary btn-sm" style={{ fontWeight: 800 }}>
              💾 {t(lang, "हेडर बटन सेव करें", "Save Header Buttons")}
            </button>
          </div>

          <div style={{ display: "grid", gap: 16 }}>
            {/* Button 1: ID Card */}
            <div className="header-btn-config-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontWeight: 900, color: "var(--primary)", fontSize: "0.98rem", display: "flex", alignItems: "center", gap: 8 }}>
                  🪪 {t(lang, "पहचान पत्र एवं नियुक्ति पत्र बटन", "ID Card & Appointment Letter Button")}
                </div>
                <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 800, fontSize: "0.85rem", cursor: "pointer" }}>
                  <input type="checkbox" name="idcardVisible" defaultChecked={hb.idcardVisible !== false} />
                  <span>{t(lang, "हेडर पर दिखाएँ (Show)", "Show on Header")}</span>
                </label>
              </div>
              <div className="form-grid">
                <Field label={t(lang, "हिंदी लेबल (Hindi Label)", "Hindi Label")}>
                  <Inp name="idcardLabelHi" defaultValue={hb.idcardLabelHi || "पहचान पत्र एवं नियुक्ति पत्र"} />
                </Field>
                <Field label={t(lang, "English Label", "English Label")}>
                  <Inp name="idcardLabelEn" defaultValue={hb.idcardLabelEn || "ID Card & Appointment Letter"} />
                </Field>
              </div>
            </div>

            {/* Button 2: Donation */}
            <div className="header-btn-config-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontWeight: 900, color: "var(--primary)", fontSize: "0.98rem", display: "flex", alignItems: "center", gap: 8 }}>
                  🤝 {t(lang, "सहयोग राशि / डोनेशन बटन", "Donation / Welfare Fund Button")}
                </div>
                <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 800, fontSize: "0.85rem", cursor: "pointer" }}>
                  <input type="checkbox" name="donationVisible" defaultChecked={hb.donationVisible !== false} />
                  <span>{t(lang, "हेडर पर दिखाएँ (Show)", "Show on Header")}</span>
                </label>
              </div>
              <div className="form-grid">
                <Field label={t(lang, "हिंदी लेबल (Hindi Label)", "Hindi Label")}>
                  <Inp name="donationLabelHi" defaultValue={hb.donationLabelHi || "सहयोग राशि / डोनेशन"} />
                </Field>
                <Field label={t(lang, "English Label", "English Label")}>
                  <Inp name="donationLabelEn" defaultValue={hb.donationLabelEn || "Contribute / Donate"} />
                </Field>
              </div>
            </div>

            {/* Button 3: Join */}
            <div className="header-btn-config-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontWeight: 900, color: "var(--primary)", fontSize: "0.98rem", display: "flex", alignItems: "center", gap: 8 }}>
                  ✍️ {t(lang, "सदस्यता पंजीकरण बटन (Join Button)", "Join Membership Button")}
                </div>
                <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 800, fontSize: "0.85rem", cursor: "pointer" }}>
                  <input type="checkbox" name="joinVisible" defaultChecked={hb.joinVisible !== false} />
                  <span>{t(lang, "हेडर पर दिखाएँ (Show)", "Show on Header")}</span>
                </label>
              </div>
              <div className="form-grid">
                <Field label={t(lang, "हिंदी लेबल (Hindi Label)", "Hindi Label")}>
                  <Inp name="joinLabelHi" defaultValue={hb.joinLabelHi || "सदस्य बनें"} />
                </Field>
                <Field label={t(lang, "English Label", "English Label")}>
                  <Inp name="joinLabelEn" defaultValue={hb.joinLabelEn || "Join Membership"} />
                </Field>
              </div>
            </div>

            {/* Button 4: Member Login */}
            <div className="header-btn-config-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontWeight: 900, color: "var(--primary)", fontSize: "0.98rem", display: "flex", alignItems: "center", gap: 8 }}>
                  🔑 {t(lang, "सदस्य लॉगिन बटन", "Member Login Button")}
                </div>
                <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 800, fontSize: "0.85rem", cursor: "pointer" }}>
                  <input type="checkbox" name="memberLoginVisible" defaultChecked={hb.memberLoginVisible !== false} />
                  <span>{t(lang, "हेडर पर दिखाएँ (Show)", "Show on Header")}</span>
                </label>
              </div>
              <div className="form-grid">
                <Field label={t(lang, "हिंदी लेबल (Hindi Label)", "Hindi Label")}>
                  <Inp name="memberLoginLabelHi" defaultValue={hb.memberLoginLabelHi || "सदस्य लॉगिन"} />
                </Field>
                <Field label={t(lang, "English Label", "English Label")}>
                  <Inp name="memberLoginLabelEn" defaultValue={hb.memberLoginLabelEn || "Member Login"} />
                </Field>
              </div>
            </div>

            {/* Button 5: Admin Panel Launch */}
            <div className="header-btn-config-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontWeight: 900, color: "var(--primary)", fontSize: "0.98rem", display: "flex", alignItems: "center", gap: 8 }}>
                  ⚙️ {t(lang, "एडमिन पैनल लॉन्च बटन", "Admin Panel Launch Button")}
                </div>
              </div>
              <div className="form-grid">
                <Field label={t(lang, "हिंदी लेबल (Hindi Label)", "Hindi Label")}>
                  <Inp name="adminLabelHi" defaultValue={hb.adminLabelHi || "एडमिन पैनल"} />
                </Field>
                <Field label={t(lang, "English Label", "English Label")}>
                  <Inp name="adminLabelEn" defaultValue={hb.adminLabelEn || "Admin Panel"} />
                </Field>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 18, display: "flex", justifyContent: "flex-end" }}>
            <button type="submit" className="btn btn-primary" style={{ fontWeight: 800, padding: "10px 24px" }}>
              💾 {t(lang, "हेडर बटन सेव करें", "Save Header Buttons")}
            </button>
          </div>
        </form>
      )}

      {/* SUBTAB 3: Homepage Sections & Footer Texts */}
      {activeTab === "sections" && (
        <form className="card-panel" onSubmit={saveTexts} style={{ borderRadius: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 18 }}>
            <div>
              <h3 style={{ color: "var(--primary)", fontSize: "1.15rem", fontWeight: 900, margin: 0 }}>
                📌 {t(lang, "होमपेज सेक्शन शीर्षक एवं फुटर प्रबंधन", "Homepage Sections & Footer Management")}
              </h3>
              <p style={{ color: "#64748b", fontSize: "0.85rem", margin: "4px 0 0" }}>
                {t(lang, "वेबसाइट के विभिन्न सेक्शन के शीर्षकों, उपशीर्षकों और फुटर कॉपीराइट को प्रबंधित करें।", "Manage headings, subtitles and footer texts across the website.")}
              </p>
            </div>
            <button type="submit" className="btn btn-primary btn-sm" style={{ fontWeight: 800 }}>
              💾 {t(lang, "शीर्षक सेव करें", "Save Section Texts")}
            </button>
          </div>

          <div style={{ display: "grid", gap: 16 }}>
            {/* Ticker */}
            <div className="header-btn-config-card">
              <div style={{ fontWeight: 900, color: "var(--primary)", marginBottom: 8, fontSize: "0.95rem" }}>
                📢 {t(lang, "ताज़ा सूचना टिकर बैज (Ticker Badge)", "Notice Ticker Badge")}
              </div>
              <div className="form-grid">
                <Field label={t(lang, "बैज हिंदी", "Badge Hindi")}>
                  <Inp name="tickerBadgeHi" defaultValue={stx.tickerBadgeHi || "ताज़ा सूचना"} />
                </Field>
                <Field label={t(lang, "Badge English", "Badge English")}>
                  <Inp name="tickerBadgeEn" defaultValue={stx.tickerBadgeEn || "LATEST UPDATE"} />
                </Field>
              </div>
            </div>

            {/* Circulars Section */}
            <div className="header-btn-config-card">
              <div style={{ fontWeight: 900, color: "var(--primary)", marginBottom: 8, fontSize: "0.95rem" }}>
                📑 {t(lang, "सर्कुलर व शासकीय आदेश सेक्शन शीर्षक", "Circulars Section Title")}
              </div>
              <div className="form-grid">
                <Field label={t(lang, "शीर्षक हिंदी", "Title Hindi")}>
                  <Inp name="homeCircularsTitleHi" defaultValue={stx.homeCircularsTitleHi || "शासकीय आदेश, सर्कुलर एवं विधिक सूचनाएँ"} />
                </Field>
                <Field label={t(lang, "Title English", "Title English")}>
                  <Inp name="homeCircularsTitleEn" defaultValue={stx.homeCircularsTitleEn || "Official Orders, Circulars & Legal Notices"} />
                </Field>
              </div>
            </div>

            {/* Portals Section */}
            <div className="header-btn-config-card">
              <div style={{ fontWeight: 900, color: "var(--primary)", marginBottom: 8, fontSize: "0.95rem" }}>
                🌐 {t(lang, "महत्वपूर्ण बैंकिंग पोर्टल सेक्शन शीर्षक", "Banking Portals Section Title")}
              </div>
              <div className="form-grid">
                <Field label={t(lang, "शीर्षक हिंदी", "Title Hindi")}>
                  <Inp name="homePortalsTitleHi" defaultValue={stx.homePortalsTitleHi || "महत्वपूर्ण बैंकिंग एवं सरकारी पोर्टल"} />
                </Field>
                <Field label={t(lang, "Title English", "Title English")}>
                  <Inp name="homePortalsTitleEn" defaultValue={stx.homePortalsTitleEn || "Essential Banking & Government Portals"} />
                </Field>
              </div>
            </div>

            {/* Demands Section */}
            <div className="header-btn-config-card">
              <div style={{ fontWeight: 900, color: "var(--primary)", marginBottom: 8, fontSize: "0.95rem" }}>
                📜 {t(lang, "10-सूत्री मांग-पत्र सेक्शन शीर्षक", "10-Point Charter of Demands Title")}
              </div>
              <div className="form-grid">
                <Field label={t(lang, "शीर्षक हिंदी", "Title Hindi")}>
                  <Inp name="homeDemandsTitleHi" defaultValue={stx.homeDemandsTitleHi || "उत्तर प्रदेश बैंक मित्र संघ — 10-सूत्री मांग-पत्र"} />
                </Field>
                <Field label={t(lang, "Title English", "Title English")}>
                  <Inp name="homeDemandsTitleEn" defaultValue={stx.homeDemandsTitleEn || "UPBMS 10-Point Charter of Demands"} />
                </Field>
              </div>
            </div>

            {/* Members Section */}
            <div className="header-btn-config-card">
              <div style={{ fontWeight: 900, color: "var(--primary)", marginBottom: 8, fontSize: "0.95rem" }}>
                👥 {t(lang, "कार्यकारिणी एवं सदस्य संजाल शीर्षक", "Executive & Members Directory Title")}
              </div>
              <div className="form-grid">
                <Field label={t(lang, "शीर्षक हिंदी", "Title Hindi")}>
                  <Inp name="homeMembersTitleHi" defaultValue={stx.homeMembersTitleHi || "प्रांतीय मुख्य कार्यकारिणी पदाधिकारी"} />
                </Field>
                <Field label={t(lang, "Title English", "Title English")}>
                  <Inp name="homeMembersTitleEn" defaultValue={stx.homeMembersTitleEn || "State Core Executive Committee"} />
                </Field>
              </div>
            </div>

            {/* News Section */}
            <div className="header-btn-config-card">
              <div style={{ fontWeight: 900, color: "var(--primary)", marginBottom: 8, fontSize: "0.95rem" }}>
                📰 {t(lang, "संगठनात्मक समाचार एवं प्रेस विज्ञप्ति शीर्षक", "News & Press Releases Title")}
              </div>
              <div className="form-grid">
                <Field label={t(lang, "शीर्षक हिंदी", "Title Hindi")}>
                  <Inp name="homeNewsTitleHi" defaultValue={stx.homeNewsTitleHi || "ताज़ा संगठनात्मक समाचार एवं प्रेस विज्ञप्ति"} />
                </Field>
                <Field label={t(lang, "Title English", "Title English")}>
                  <Inp name="homeNewsTitleEn" defaultValue={stx.homeNewsTitleEn || "Latest Organizational News & Press Releases"} />
                </Field>
              </div>
            </div>

            {/* Footer Copyright */}
            <div className="header-btn-config-card">
              <div style={{ fontWeight: 900, color: "var(--primary)", marginBottom: 8, fontSize: "0.95rem" }}>
                ⚖️ {t(lang, "फुटर कॉपीराइट संदेश", "Footer Copyright Text")}
              </div>
              <div className="form-grid">
                <Field label={t(lang, "कॉपीराइट हिंदी", "Copyright Hindi")}>
                  <Inp name="footerCopyrightHi" defaultValue={stx.footerCopyrightHi || "सर्वाधिकार सुरक्षित। बैंक मित्रों के विधिक, सामाजिक एवं आर्थिक अधिकारों के लिए समर्पित।"} />
                </Field>
                <Field label={t(lang, "Copyright English", "Copyright English")}>
                  <Inp name="footerCopyrightEn" defaultValue={stx.footerCopyrightEn || "All rights reserved. Dedicated to the legal, social and economic rights of Bank Mitras."} />
                </Field>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 18, display: "flex", justifyContent: "flex-end" }}>
            <button type="submit" className="btn btn-primary" style={{ fontWeight: 800, padding: "10px 24px" }}>
              💾 {t(lang, "शीर्षक सेव करें", "Save Section Texts")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function About({ state, saveSettings, run, session, showToast }) {
  const { lang, setModal } = usePortal();
  const avm = state.settings.aboutVisionMission || {};
  const [file, setFile] = useState({ url: "", type: "image" });
  const [uploading, setUploading] = useState(false);
  const [editingCert, setEditingCert] = useState(null);
  const [editFile, setEditFile] = useState({ url: "", type: "image" });
  const [editUploading, setEditUploading] = useState(false);

  function save(e) {
    e.preventDefault();
    const raw = Object.fromEntries(new FormData(e.target).entries());
    saveSettings({
      aboutVisionMission: {
        ...avm,
        ...raw,
        missionPointsHi: lines(raw.missionPointsHi),
        missionPointsEn: lines(raw.missionPointsEn)
      }
    }, t(lang, "परिचय व विज़न-मिशन सफलतापूर्वक सेव हो गया", "About and Vision-Mission saved successfully"));
  }

  async function addCert(e) {
    e.preventDefault();
    if (!file.url) return showToast(t(lang, "पहले प्रमाण-पत्र फाइल चुनें व अपलोड करें", "Please select and upload a certificate file first"));
    const raw = Object.fromEntries(new FormData(e.target).entries());
    raw.fileUrl = file.url;
    raw.fileType = file.type;
    raw.requiresMemberLogin = e.target.querySelector("[name=requiresMemberLogin]").checked;
    if (await run("/api/certificates", { method: "POST", body: raw }, t(lang, "प्रमाण-पत्र सफलतापूर्वक जोड़ा गया", "Certificate added successfully"))) {
      e.target.reset();
      setFile({ url: "", type: "image" });
    }
  }

  async function saveEditCert(e) {
    e.preventDefault();
    if (!editingCert) return;
    const raw = Object.fromEntries(new FormData(e.target).entries());
    raw.fileUrl = editFile.url || editingCert.fileUrl;
    raw.fileType = editFile.type || editingCert.fileType || "image";
    raw.requiresMemberLogin = e.target.querySelector("[name=requiresMemberLogin]").checked;

    const ok = await run(`/api/certificates/${editingCert.id}`, {
      method: "PUT",
      body: raw
    }, t(lang, "प्रमाण-पत्र विवरण सफलतापूर्वक अपडेट हो गया", "Certificate updated successfully"));

    if (ok) {
      setEditingCert(null);
      setEditFile({ url: "", type: "image" });
    }
  }

  const defaultMissionHi = [
    "प्रत्येक बैंक मित्र के लिए न्यूनतम ₹15,000 स्थायी मासिक मानदेय एवं पारदर्शी कमीशन संरचना लागू कराना।",
    "बिना कारण बताओ नोटिस के किसी भी KO / CSP कोड को एकतरफा ब्लॉक किए जाने की प्रथा पर पूर्ण रोक लगवाना।",
    "बैंक मित्रों व उनके परिवार के लिए ₹10 लाख का जीवन/दुर्घटना बीमा एवं कैश-इन-ट्रांजिट बीमा सुरक्षा सुनिश्चित कराना।",
    "राज्य स्तर पर बैंक मित्र कल्याण कोष की स्थापना व आकस्मिक संकट में तत्काल आर्थिक सहायता।",
    "विधिक एवं प्रशासनिक स्तर पर बैंक मित्रों के संवैधानिक अधिकारों की प्रभावी पैरवी।"
  ].join("\n");

  const defaultMissionEn = [
    "Secure a minimum assured monthly honorarium of ₹15,000 alongside transparent, timely commission payouts.",
    "Eliminate arbitrary blocking of KO / CSP codes without prior show-cause notice and fair hearing.",
    "Ensure ₹10 Lakh life/accident insurance cover, family medical security, and cash-in-transit protection.",
    "Establish a dedicated State Bank Mitra Welfare Fund for urgent contingency support.",
    "Provide resolute legal representation and institutional advocacy before state & central authorities."
  ].join("\n");

  const certs = state.certificates || [];

  return (
    <div style={{ display: "grid", gap: 24 }}>
      {/* 1. हमारे बारे में + विज़न एवं मिशन - EXACT MATCH TO USER IMAGE */}
      <form className="card-panel" onSubmit={save} style={{ borderRadius: 16, padding: "26px 28px" }}>
        <h3 style={{ color: "#1e3a8a", fontWeight: 800, fontSize: "1.2rem", margin: "0 0 20px", display: "flex", alignItems: "center", gap: 8 }}>
          🏛️ 1. {t(lang, "हमारे बारे में + विज़न एवं मिशन (हिंदी एवं English)", "About Us + Vision & Mission (Hindi & English)")}
        </h3>

        <div className="form-grid" style={{ rowGap: 18, columnGap: 24 }}>
          {/* Row 1: About Title */}
          <div>
            <label className="about-form-label">{t(lang, "परिचय शीर्षक (हिंदी)", "About Title (Hindi)")}</label>
            <Inp
              name="aboutTitleHi"
              defaultValue={avm.aboutTitleHi || "उत्तर प्रदेश बैंक मित्र संघ (UPBMS) — परिचय"}
              required
            />
          </div>
          <div>
            <label className="about-form-label">{t(lang, "About Title (English)", "About Title (English)")}</label>
            <Inp
              name="aboutTitleEn"
              defaultValue={avm.aboutTitleEn || "About Uttar Pradesh Bank Mitra Sangh (UPBMS)"}
              required
            />
          </div>

          {/* Row 2: About Description */}
          <div>
            <label className="about-form-label">{t(lang, "परिचय विवरण (हिंदी)", "About Description (Hindi)")}</label>
            <textarea
              className="form-control"
              rows={4}
              name="aboutBodyHi"
              defaultValue={avm.aboutBodyHi || "उत्तर प्रदेश बैंक मित्र संघ (UPBMS) राज्य के समस्त 75 जनपदों में कार्यरत भारतीय स्टेट बैंक, बैंक ऑफ बड़ौदा, पंजाब नेशनल बैंक, इंडियन बैंक, यूनियन बैंक तथा समस्त ग्रामीण बैंकों के ग्राहक सेवा केंद्र (CSP) संचालकों एवं बैंक मित्रों का सशक्त प्रांतीय संगठन है। हमारा संगठन प्रत्येक बैंक मित्र के मान-सम्मान, पारदर्शी कमीशन, सामाजिक सुरक्षा व विधिक अधिकारों की रक्षा हेतु निरंतर समर्पित है।"}
              required
            />
          </div>
          <div>
            <label className="about-form-label">{t(lang, "About Description (English)", "About Description (English)")}</label>
            <textarea
              className="form-control"
              rows={4}
              name="aboutBodyEn"
              defaultValue={avm.aboutBodyEn || "Uttar Pradesh Bank Mitra Sangh (UPBMS) is the united state-level association representing Bank Mitras and Customer Service Point (CSP) operators working across all 75 districts of Uttar Pradesh under SBI, Bank of Baroda, PNB, Indian Bank, Union Bank, and Regional Rural Banks. We are dedicated to ensuring fair compensation, institutional protection, and dignity for every banking agent."}
              required
            />
          </div>

          {/* Row 3: Vision Title */}
          <div>
            <label className="about-form-label">{t(lang, "विज़न शीर्षक (हिंदी)", "Vision Title (Hindi)")}</label>
            <Inp
              name="visionTitleHi"
              defaultValue={avm.visionTitleHi || "हमारी दूरदृष्टि (Our Vision)"}
            />
          </div>
          <div>
            <label className="about-form-label">{t(lang, "Vision Title (English)", "Vision Title (English)")}</label>
            <Inp
              name="visionTitleEn"
              defaultValue={avm.visionTitleEn || "Our Vision"}
            />
          </div>

          {/* Row 4: Vision Statement */}
          <div>
            <label className="about-form-label">{t(lang, "विज़न विवरण (हिंदी)", "Vision Statement (Hindi)")}</label>
            <textarea
              className="form-control"
              rows={3}
              name="visionBodyHi"
              defaultValue={avm.visionBodyHi || "ग्रामीण एवं अर्ध-शहरी भारत की बैंकिंग रीढ़ कहलाने वाले प्रत्येक बैंक मित्र को स्थायी मासिक मानदेय, पूर्ण बीमा सुरक्षा, सम्मानजनक कार्य-वातावरण और बैंकिंग व्यवस्था में न्यायोचित पहचान दिलाना।"}
            />
          </div>
          <div>
            <label className="about-form-label">{t(lang, "Vision Statement (English)", "Vision Statement (English)")}</label>
            <textarea
              className="form-control"
              rows={3}
              name="visionBodyEn"
              defaultValue={avm.visionBodyEn || "To secure assured monthly honorarium, comprehensive insurance protection, dignified working conditions, and rightful institutional recognition for every Bank Mitra serving as the backbone of last-mile banking."}
            />
          </div>

          {/* Row 5: Mission Title */}
          <div>
            <label className="about-form-label">{t(lang, "मिशन शीर्षक (हिंदी)", "Mission Title (Hindi)")}</label>
            <Inp
              name="missionTitleHi"
              defaultValue={avm.missionTitleHi || "हमारा ध्येय एवं संकल्प (Our Mission)"}
            />
          </div>
          <div>
            <label className="about-form-label">{t(lang, "Mission Title (English)", "Mission Title (English)")}</label>
            <Inp
              name="missionTitleEn"
              defaultValue={avm.missionTitleEn || "Our Mission"}
            />
          </div>

          {/* Row 6: Mission Points */}
          <div>
            <label className="about-form-label">{t(lang, "मिशन बिंदु — प्रति पंक्ति 1 बिंदु (हिंदी)", "Mission Points — One per line (Hindi)")}</label>
            <textarea
              className="form-control"
              rows={5}
              name="missionPointsHi"
              defaultValue={(avm.missionPointsHi && avm.missionPointsHi.length) ? avm.missionPointsHi.join("\n") : defaultMissionHi}
            />
          </div>
          <div>
            <label className="about-form-label">{t(lang, "Mission Points — One per line (English)", "Mission Points — One per line (English)")}</label>
            <textarea
              className="form-control"
              rows={5}
              name="missionPointsEn"
              defaultValue={(avm.missionPointsEn && avm.missionPointsEn.length) ? avm.missionPointsEn.join("\n") : defaultMissionEn}
            />
          </div>

          {/* Row 7: Certificates Section Title */}
          <div>
            <label className="about-form-label">{t(lang, "प्रमाण-पत्र सेक्शन शीर्षक (हिंदी)", "Certificates Section Title (Hindi)")}</label>
            <Inp
              name="certSectionTitleHi"
              defaultValue={avm.certSectionTitleHi || "संगठन पंजीकरण एवं प्राप्त प्रमाण-पत्र"}
            />
          </div>
          <div>
            <label className="about-form-label">{t(lang, "Certificates Section Title (English)", "Certificates Section Title (English)")}</label>
            <Inp
              name="certSectionTitleEn"
              defaultValue={avm.certSectionTitleEn || "Association Registrations & Certificates"}
            />
          </div>

          {/* Row 8: Core Committee Section Title */}
          <div>
            <label className="about-form-label">{t(lang, "मुख्य कार्यकारिणी सेक्शन शीर्षक (हिंदी)", "Core Committee Section Title (Hindi)")}</label>
            <Inp
              name="coreSectionTitleHi"
              defaultValue={avm.coreSectionTitleHi || "प्रदेश मुख्य कार्यकारिणी (Core Members)"}
            />
          </div>
          <div>
            <label className="about-form-label">{t(lang, "Core Committee Section Title (English)", "Core Committee Section Title (English)")}</label>
            <Inp
              name="coreSectionTitleEn"
              defaultValue={avm.coreSectionTitleEn || "State Core Executive Committee (Core Members)"}
            />
          </div>
        </div>

        <div style={{ marginTop: 22 }}>
          <button type="submit" className="btn-save-orange">
            💾 {t(lang, "परिचय व विज़न-मिशन सेव करें", "Save About & Vision-Mission")}
          </button>
        </div>
      </form>

      {/* 2. प्रमाण-पत्र एवं पंजीकरण प्रपत्र प्रबंधन - EXACT MATCH TO USER IMAGE 1 & 2 */}
      <div className="card-panel" style={{ borderRadius: 16, padding: "26px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
          <div>
            <h3 style={{ color: "#1e3a8a", fontWeight: 800, fontSize: "1.2rem", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              📜 2. {t(lang, "प्रमाण-पत्र एवं पंजीकरण दस्तावेज़ प्रबंधन", "Certificates & Registration Documents Management")}
            </h3>
            <p style={{ color: "#64748b", fontSize: "0.86rem", margin: "4px 0 0" }}>
              {t(lang, "यहाँ से संघ के पंजीकरण प्रमाण-पत्र, सोसायटी पंजीयन, प्रशस्ति-पत्र व आधिकारिक प्रपत्र प्रबंधित करें।", "Manage association registration certificates, society certificates and official documents.")}
            </p>
          </div>
          <span className="badge badge-active" style={{ fontSize: "0.85rem", padding: "6px 12px" }}>
            {certs.length} {t(lang, "कुल प्रमाण-पत्र", "Total Certificates")}
          </span>
        </div>

        {/* Existing Certificates Display - EXACT MATCH TO REFERENCE IMAGE 1 */}
        {certs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 20px", background: "#f8fafc", borderRadius: 12, border: "1.5px dashed #cbd5e1", color: "#64748b", marginBottom: 24 }}>
            {t(lang, "अभी कोई प्रमाण-पत्र अपलोड नहीं किया गया है। नीचे दिए गए फॉर्म से प्रमाण-पत्र जोड़ें।", "No certificates uploaded yet. Use the form below to add certificates.")}
          </div>
        ) : (
          <div className="cert-card-grid-match" style={{ marginBottom: 28 }}>
            {certs.map((c) => (
              <div key={c.id} className="cert-card-match">
                {/* Framed Thumbnail matching Image 1 */}
                <div
                  className="cert-preview-frame"
                  onClick={() => setModal({ kind: "file", item: c, locked: false })}
                  title={t(lang, "प्रमाण-पत्र देखने के लिए क्लिक करें", "Click to view certificate")}
                >
                  <img
                    src={c.fileUrl || "/images/cert-registration.svg"}
                    alt={c.titleHi}
                  />
                </div>

                {/* Titles matching Image 1 */}
                <div>
                  <h4 className="cert-card-title-hi">{c.titleHi}</h4>
                  <div className="cert-card-sub-en">{c.titleEn}</div>

                  {/* Status Indicator matching Image 1 */}
                  {c.requiresMemberLogin ? (
                    <div className="cert-status-line locked">
                      <span>🔒</span>
                      <span className="label-text">{t(lang, "सदस्य लॉगिन सुरक्षित", "Member Login Protected")}</span>
                    </div>
                  ) : (
                    <div className="cert-status-line public">
                      <span>🌐</span>
                      <span className="label-text">{t(lang, "सार्वजनिक दृश्य", "Public View")}</span>
                    </div>
                  )}
                </div>

                {/* Buttons matching Image 1 + Edit Option */}
                <div>
                  <div className="cert-btn-group-row">
                    {/* View Button -> Opens Image 2 Modal */}
                    <button
                      type="button"
                      className="cert-btn-action"
                      onClick={() => setModal({ kind: "file", item: c, locked: false })}
                    >
                      👁️ {t(lang, "देखें", "View")}
                    </button>

                    {/* Lock / Unlock Toggle */}
                    <button
                      type="button"
                      className="cert-btn-action"
                      onClick={() => run(`/api/certificates/${c.id}`, { method: "PUT", body: { requiresMemberLogin: !c.requiresMemberLogin } }, t(lang, "सुरक्षा स्थिति बदली गई", "Security status changed"))}
                    >
                      {c.requiresMemberLogin ? (
                        <>🔓 {t(lang, "अनलॉक करें", "Unlock")}</>
                      ) : (
                        <>🔒 {t(lang, "लॉगिन लॉक लगाएँ", "Set Login Lock")}</>
                      )}
                    </button>

                    {/* Edit Option requested by user */}
                    <button
                      type="button"
                      className="cert-btn-action"
                      onClick={() => {
                        setEditingCert(c);
                        setEditFile({ url: c.fileUrl || "", type: c.fileType || "image" });
                      }}
                    >
                      ✏️ {t(lang, "संपादित करें", "Edit")}
                    </button>
                  </div>

                  {/* Delete Button matching Image 1 */}
                  <button
                    type="button"
                    className="cert-btn-delete"
                    onClick={() => {
                      if (confirm(t(lang, "क्या आप यह प्रमाण-पत्र हटाना चाहते हैं?", "Are you sure you want to delete this certificate?"))) {
                        run(`/api/certificates/${c.id}`, { method: "DELETE" }, t(lang, "प्रमाण-पत्र हटाया गया", "Certificate deleted"));
                      }
                    }}
                  >
                    🗑️ {t(lang, "हटाएँ", "Delete")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload Form to Add New Certificate */}
        <form onSubmit={addCert} style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 14, padding: "22px 24px" }}>
          <h4 style={{ color: "var(--primary)", fontWeight: 800, fontSize: "1.0rem", margin: "0 0 16px" }}>
            ➕ {t(lang, "नया प्रमाण-पत्र / पंजीकरण दस्तावेज़ जोड़ें", "Add New Certificate / Registration Document")}
          </h4>
          <div className="form-grid" style={{ rowGap: 16, columnGap: 20 }}>
            <div>
              <label className="about-form-label">{t(lang, "प्रमाण-पत्र नाम (हिंदी) *", "Certificate Title (Hindi) *")}</label>
              <Inp name="titleHi" placeholder={t(lang, "उदा. उत्तर प्रदेश सोसायटी पंजीकरण प्रमाण-पत्र", "e.g. UP Society Registration Certificate")} required />
            </div>
            <div>
              <label className="about-form-label">{t(lang, "Certificate Title (English) *", "Certificate Title (English) *")}</label>
              <Inp name="titleEn" placeholder={t(lang, "e.g. UP Society Registration Certificate", "e.g. UP Society Registration Certificate")} required />
            </div>

            <div>
              <label className="about-form-label">{t(lang, "जारीकर्ता संस्था (हिंदी)", "Issuing Authority (Hindi)")}</label>
              <Inp name="issuerHi" placeholder={t(lang, "उदा. निबंधक कार्यालय, लखनऊ (उत्तर प्रदेश)", "e.g. Registrar Office, Lucknow (Uttar Pradesh)")} />
            </div>
            <div>
              <label className="about-form-label">{t(lang, "Issuing Authority (English)", "Issuing Authority (English)")}</label>
              <Inp name="issuerEn" placeholder={t(lang, "e.g. Registrar Office, Lucknow (Uttar Pradesh)", "e.g. Registrar Office, Lucknow (Uttar Pradesh)")} />
            </div>

            <div>
              <label className="about-form-label">{t(lang, "पंजीकरण / संदर्भ क्रमांक", "Registration / Ref Number")}</label>
              <Inp name="regRef" placeholder={t(lang, "उदा. UP-REG-LKO-2024-8841", "e.g. UP-REG-LKO-2024-8841")} />
            </div>
            <div>
              <label className="about-form-label">{t(lang, "जारी दिनांक", "Issue Date")}</label>
              <Inp name="date" type="date" defaultValue={today()} />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label className="about-form-label">{t(lang, "प्रमाण-पत्र फाइल (Image या PDF) *", "Certificate File (Image or PDF) *")}</label>
              <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    setUploading(true);
                    try {
                      const url = await uploadFile(f, session);
                      setFile({ url, type: f.type === "application/pdf" ? "pdf" : "image" });
                      showToast(t(lang, "फाइल सफलतापूर्वक अपलोड हो गई", "File uploaded successfully"));
                    } catch (err) {
                      showToast(err.message);
                    } finally {
                      setUploading(false);
                    }
                  }}
                />
                {uploading && <span style={{ color: "#ea580c", fontWeight: 700, fontSize: "0.85rem" }}>⏳ {t(lang, "अपलोड हो रहा है...", "Uploading...")}</span>}
                {file.url && (
                  <span style={{ color: "#16a34a", fontWeight: 800, fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: 4 }}>
                    ✓ {t(lang, "फाइल तैयार है", "File is ready")} ({file.type.toUpperCase()})
                  </span>
                )}
              </div>
            </div>

            <div style={{ gridColumn: "1 / -1", background: "#ffffff", border: "1px solid #e2e8f0", padding: "12px 16px", borderRadius: 10 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontWeight: 800, color: "var(--primary)", fontSize: "0.9rem" }}>
                <input type="checkbox" name="requiresMemberLogin" />
                <span>🔒 {t(lang, "केवल सदस्य लॉगिन के बाद दिखाएँ (Login Protected)", "Show only after member login (Login Protected)")}</span>
              </label>
              <div style={{ color: "#64748b", fontSize: "0.8rem", marginLeft: 24, marginTop: 2 }}>
                {t(lang, "यदि टिक किया जाता है, तो बिना सदस्य लॉगिन कोई भी बाहरी विज़िटर इस दस्तावेज़ को नहीं देख सकेगा।", "If checked, unauthenticated visitors cannot view or download this document.")}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <button type="submit" className="btn btn-primary" style={{ fontWeight: 800, padding: "9px 22px" }}>
              ➕ {t(lang, "प्रमाण-पत्र जोड़ें", "Add Certificate")}
            </button>
          </div>
        </form>
      </div>

      {/* 3. EDIT CERTIFICATE MODAL (REQUESTED EDITABLE OPTION) */}
      {editingCert && (
        <div className="modal-backdrop" onClick={() => setEditingCert(null)}>
          <div className="modal-box" style={{ maxWidth: 650, borderRadius: 14, overflow: "hidden" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, fontSize: "1.08rem" }}>
                <span>✏️ {t(lang, "प्रमाण-पत्र विवरण संपादित करें", "Edit Certificate Details")}</span>
              </div>
              <button
                type="button"
                className="btn btn-sm modal-btn-close"
                onClick={() => setEditingCert(null)}
              >
                ✕ {t(lang, "Close", "Close")}
              </button>
            </div>

            <form onSubmit={saveEditCert} style={{ padding: "24px 26px" }}>
              <div className="form-grid" style={{ rowGap: 16, columnGap: 20 }}>
                <div>
                  <label className="about-form-label">{t(lang, "प्रमाण-पत्र नाम (हिंदी) *", "Certificate Title (Hindi) *")}</label>
                  <Inp name="titleHi" defaultValue={editingCert.titleHi} required />
                </div>
                <div>
                  <label className="about-form-label">{t(lang, "Certificate Title (English) *", "Certificate Title (English) *")}</label>
                  <Inp name="titleEn" defaultValue={editingCert.titleEn} required />
                </div>

                <div>
                  <label className="about-form-label">{t(lang, "जारीकर्ता संस्था (हिंदी)", "Issuing Authority (Hindi)")}</label>
                  <Inp name="issuerHi" defaultValue={editingCert.issuerHi || ""} />
                </div>
                <div>
                  <label className="about-form-label">{t(lang, "Issuing Authority (English)", "Issuing Authority (English)")}</label>
                  <Inp name="issuerEn" defaultValue={editingCert.issuerEn || ""} />
                </div>

                <div>
                  <label className="about-form-label">{t(lang, "पंजीकरण / संदर्भ क्रमांक", "Registration / Ref Number")}</label>
                  <Inp name="regRef" defaultValue={editingCert.regRef || ""} />
                </div>
                <div>
                  <label className="about-form-label">{t(lang, "जारी दिनांक", "Issue Date")}</label>
                  <Inp name="date" type="date" defaultValue={editingCert.date || today()} />
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <label className="about-form-label">{t(lang, "प्रमाण-पत्र फाइल बदलें (Image या PDF)", "Replace Certificate File (Image or PDF)")}</label>
                  <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        setEditUploading(true);
                        try {
                          const url = await uploadFile(f, session);
                          setEditFile({ url, type: f.type === "application/pdf" ? "pdf" : "image" });
                          showToast(t(lang, "नई फाइल तैयार है", "New file is ready"));
                        } catch (err) {
                          showToast(err.message);
                        } finally {
                          setEditUploading(false);
                        }
                      }}
                    />
                    {editUploading && <span style={{ color: "#ea580c", fontWeight: 700, fontSize: "0.85rem" }}>⏳ {t(lang, "अपलोड हो रहा है...", "Uploading...")}</span>}
                    {editFile.url && (
                      <span style={{ color: "#16a34a", fontWeight: 800, fontSize: "0.85rem" }}>
                        ✓ {t(lang, "फाइल तैयार", "File Ready")} ({editFile.type.toUpperCase()})
                      </span>
                    )}
                  </div>
                  {editingCert.fileUrl && !editFile.url && (
                    <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 4 }}>
                      {t(lang, "वर्तमान फाइल:", "Current file:")} <a href={editingCert.fileUrl} target="_blank" rel="noreferrer">{editingCert.fileUrl}</a>
                    </div>
                  )}
                </div>

                <div style={{ gridColumn: "1 / -1", background: "#f8fafc", border: "1px solid #e2e8f0", padding: "12px 16px", borderRadius: 10 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontWeight: 800, color: "var(--primary)", fontSize: "0.9rem" }}>
                    <input type="checkbox" name="requiresMemberLogin" defaultChecked={editingCert.requiresMemberLogin} />
                    <span>🔒 {t(lang, "केवल सदस्य लॉगिन के बाद दिखाएँ (Login Protected)", "Show only after member login (Login Protected)")}</span>
                  </label>
                </div>
              </div>

              <div style={{ marginTop: 22, display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setEditingCert(null)}
                >
                  ✕ {t(lang, "रद्द करें", "Cancel")}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ fontWeight: 800, padding: "9px 24px" }}
                >
                  💾 {t(lang, "परिवर्तन सेव करें", "Save Changes")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Signs({ state, saveSettings, session, showToast, run }) {
  const { lang } = usePortal();
  const s = state.settings || {};
  const list = s.signatories || [];
  const defaults = s.defaultSignatoryIds || [];
  const [seal, setSeal] = useState(s.sealImageUrl || "/images/official-seal.svg");

  const logs = state.accessLogs || [];
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");

  // Audit Log Stats matching Screenshot 2
  const printCount = logs.filter((l) => String(l.actionType || "").startsWith("print_") || String(l.actionLabelHi || "").includes("प्रिंट")).length;
  const viewCount = logs.filter((l) => String(l.actionType || "").includes("view") || String(l.actionLabelHi || "").includes("खोला") || String(l.actionLabelHi || "").includes("देखा") || String(l.actionType || "").startsWith("print_")).length;
  const loginCount = logs.filter((l) => l.actionType === "member_login" || String(l.actionLabelHi || "").includes("लॉगिन")).length;
  const userCount = new Set(logs.map((l) => l.memberCode || l.memberId || l.mobile).filter(Boolean)).size;

  const filteredLogs = logs.filter((l) => {
    if (filter === "print" && !(String(l.actionType || "").startsWith("print_") || String(l.actionLabelHi || "").includes("प्रिंट"))) return false;
    if (filter === "idcard" && !(String(l.actionType || "").includes("idcard") || String(l.targetTitleHi || "").includes("पहचान पत्र") || String(l.actionLabelHi || "").includes("पहचान पत्र"))) return false;
    if (filter === "letter" && !(String(l.actionType || "").includes("letter") || String(l.targetTitleHi || "").includes("नियुक्ति") || String(l.actionLabelHi || "").includes("नियुक्ति"))) return false;
    if (filter === "doc" && !(String(l.actionType || "").includes("doc") || String(l.targetTitleHi || "").includes("दस्तावेज़") || String(l.actionLabelHi || "").includes("दस्तावेज़") || String(l.targetTitleHi || "").includes("मांग-पत्र"))) return false;
    if (filter === "receipt" && !(String(l.actionType || "").includes("receipt") || String(l.targetTitleHi || "").includes("रसीद") || String(l.actionLabelHi || "").includes("रसीद"))) return false;
    if (filter === "login" && l.actionType !== "member_login" && !String(l.actionLabelHi || "").includes("लॉगिन")) return false;
    if (q) {
      const hay = `${l.auditCode} ${l.memberNameHi} ${l.memberNameEn} ${l.memberCode} ${l.mobile} ${l.district} ${l.actionLabelHi} ${l.targetTitleHi} ${l.signatoriesUsedHi}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  function saveSeal(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const ids = [...e.target.querySelectorAll("[name=defaultSig]:checked")].map((el) => el.value);
    const defaultSignatoryIds = ids.length ? ids : [list[0]?.id || "sig-gs"];
    saveSettings({
      sealImageUrl: seal,
      sealLabelHi: fd.get("sealLabelHi"),
      sealLabelEn: fd.get("sealLabelEn"),
      defaultSignatoryIds,
      defaultSignatoryId: defaultSignatoryIds[0]
    }, "मुहर व हस्ताक्षरकर्ता सेव हो गए");
  }

  return (
    <div style={{ display: "grid", gap: 18 }}>
      {/* 1. Top Banner per Screenshot 2 */}
      <div className="admin-banner-blue">
        <h2 style={{ color: "#1e3a8a", fontWeight: 900, fontSize: "1.25rem", margin: "0 0 8px" }}>
          {t(lang, "🛡️ पदाधिकारी हस्ताक्षर एवं आधिकारिक मुहर उपयोग पंजिका (Security Audit Log)", "🛡️ Officer Signature & Official Seal Usage Register (Security Audit Log)")}
        </h2>
        <p style={{ color: "#334155", fontSize: "0.88rem", margin: "0 0 16px", lineHeight: 1.6 }}>
          {t(lang, "सुरक्षा नीति सक्रिय है: बिना सदस्य लॉगिन के किसी भी विज़िटर को हस्ताक्षर व मुहर युक्त प्रपत्र नहीं दिखते। जब भी कोई लॉगिन सदस्य पहचान-पत्र, नियुक्ति पत्र, संघ दस्तावेज़ या रसीद खोलता/प्रिंट करता है, उसका पूरा रिकॉर्ड यहाँ स्वतः दर्ज हो जाता है।", "Security policy is active: No visitor can access signed and stamped documents without member login. Whenever a logged-in member views or prints an ID card, appointment letter, association document, or receipt, the complete record is automatically logged here.")}
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <button
            type="button"
            className="btn btn-sm"
            style={{ background: "#0b1a30", color: "#ffffff", fontWeight: 800, padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer" }}
            onClick={() => download("/api/export/access-logs.csv", "UPBMS_Security_Audit_Logs.csv", session)}
          >
            📥 {t(lang, "सुरक्षा लॉग CSV डाउनलोड करें", "Download Security Log CSV")}
          </button>
          <button
            type="button"
            className="btn btn-sm"
            style={{ background: "#fee2e2", color: "#b91c1c", border: "1px solid #fecdd3", fontWeight: 800, padding: "8px 18px", borderRadius: 8, cursor: "pointer" }}
            onClick={() => {
              if (confirm(t(lang, "क्या आप सभी सुरक्षा ऑडिट लॉग प्रविष्टियाँ साफ़ करना चाहते हैं?", "Are you sure you want to clear all security audit logs?"))) {
                run("/api/access-logs", { method: "DELETE" }, t(lang, "सभी सुरक्षा लॉग साफ़ किए गए", "All security logs cleared"));
              }
            }}
          >
            🗑️ {t(lang, "पुराने लॉग साफ़ करें", "Clear Audit Logs")}
          </button>
        </div>
      </div>

      {/* 2. 4 Stats Cards per Screenshot 2 */}
      <div className="admin-stats-grid">
        <div className="card-panel" style={{ padding: "18px 20px", borderRadius: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 800, color: "var(--text)", fontSize: "0.95rem" }}>
            🖨️ {t(lang, "कुल प्रिंट / डाउनलोड:", "Total Print / Downloads:")}
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 900, color: "var(--primary)", marginTop: 6 }}>
            {printCount}
          </div>
        </div>

        <div className="card-panel" style={{ padding: "18px 20px", borderRadius: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 800, color: "var(--text)", fontSize: "0.95rem" }}>
            👁️ {t(lang, "हस्ताक्षर प्रपत्र देखे गए:", "Signed Docs Viewed:")}
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 900, color: "var(--primary)", marginTop: 6 }}>
            {viewCount}
          </div>
        </div>

        <div className="card-panel" style={{ padding: "18px 20px", borderRadius: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 800, color: "var(--text)", fontSize: "0.95rem" }}>
            🔑 {t(lang, "कुल सदस्य लॉगिन:", "Total Member Logins:")}
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 900, color: "#16a34a", marginTop: 6 }}>
            {loginCount}
          </div>
        </div>

        <div className="card-panel" style={{ padding: "18px 20px", borderRadius: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 800, color: "var(--text)", fontSize: "0.95rem" }}>
            👤 {t(lang, "उपयोगकर्ता सदस्य संख्या:", "Active Users Count:")}
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 900, color: "#2563eb", marginTop: 6 }}>
            {userCount}
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar and Table per Screenshot 2 */}
      <div className="card-panel" style={{ borderRadius: 16 }}>
        <div className="filter-bar" style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
          <input
            className="form-control"
            style={{ flex: 1, minWidth: 260 }}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t(lang, "सदस्य का नाम, ID, मोबाइल नंबर, जनपद या दस्तावेज़ नाम खोजें...", "Search member name, ID, mobile, district or document name...")}
          />
          <select
            className="form-control"
            style={{ maxWidth: 320, width: "100%", fontWeight: 700 }}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">{t(lang, `सभी रिकॉर्ड (${logs.length})`, `All Records (${logs.length})`)}</option>
            <option value="print">{t(lang, "🖨️ केवल प्रिंट / डाउनलोड किए गए", "🖨️ Only Printed / Downloaded")}</option>
            <option value="idcard">{t(lang, "🪪 पहचान पत्र उपयोग", "🪪 ID Card Usage")}</option>
            <option value="letter">{t(lang, "📜 नियुक्ति पत्र उपयोग", "📜 Appointment Letter Usage")}</option>
            <option value="doc">{t(lang, "📂 संघ दस्तावेज़ उपयोग", "📂 Association Document Usage")}</option>
            <option value="receipt">{t(lang, "🧾 रसीद उपयोग", "🧾 Receipt Usage")}</option>
            <option value="login">{t(lang, "🔑 सदस्य लॉगिन रिकॉर्ड", "🔑 Member Login Records")}</option>
          </select>
        </div>

        <div className="admin-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t(lang, "दिनांक व समय / लॉग ID", "Date & Time / Log ID")}</th>
                <th>{t(lang, "उपयोगकर्ता सदस्य (किसने उपयोग किया)", "User Member (Who Accessed)")}</th>
                <th>{t(lang, "मोबाइल व जनपद", "Mobile & District")}</th>
                <th>{t(lang, "किया गया कार्य", "Action Performed")}</th>
                <th>{t(lang, "दस्तावेज़", "Document / Target")}</th>
                <th style={{ width: 50, textAlign: "center" }}>{t(lang, "कार्य", "Action")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 24, color: "#64748b" }}>
                    कोई सुरक्षा लॉग रिकॉर्ड नहीं मिला।
                  </td>
                </tr>
              ) : (
                filteredLogs.map((l) => {
                  const isPrint = String(l.actionType || "").startsWith("print_") || String(l.actionLabelHi || "").includes("प्रिंट");
                  return (
                    <tr key={l.id}>
                      <td>
                        <b style={{ color: "var(--primary)" }}>{l.auditCode || l.id}</b>
                        <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: 2 }}>{l.timestamp || l.date}</div>
                      </td>
                      <td>
                        <b>{l.memberNameHi}</b>
                        <div style={{ fontSize: "0.78rem", color: "#2563eb", fontWeight: 800, marginTop: 2 }}>
                          {l.memberCode} • {l.designationHi}
                        </div>
                      </td>
                      <td>
                        <b>{l.mobile || "—"}</b>
                        <div style={{ fontSize: "0.8rem", color: "#475569", marginTop: 2 }}>
                          {l.district || "लखनऊ मुख्यालय (HQ)"}
                        </div>
                      </td>
                      <td>
                        {isPrint ? (
                          <span style={{ color: "#d97706", fontWeight: 800, fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: 5 }}>
                            🖨️ {l.actionLabelHi}
                          </span>
                        ) : (
                          <span style={{ color: "#16a34a", fontWeight: 800, fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: 5 }}>
                            🟢 {l.actionLabelHi}
                          </span>
                        )}
                      </td>
                      <td>
                        <b>{l.targetTitleHi || "आधिकारिक प्रपत्र"}</b>
                        <div style={{ color: "#b45309", fontSize: "0.8rem", fontWeight: 700, marginTop: 2 }}>
                          ✍️ {l.signatoriesUsedHi || "आधिकारिक संघ मुहर"}
                        </div>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          type="button"
                          className="btn btn-sm"
                          style={{ background: "#fee2e2", color: "#dc2626", border: "1px solid #fecaca", padding: "4px 10px", borderRadius: 6, fontWeight: 900, cursor: "pointer" }}
                          onClick={() => {
                            if (confirm("यह सुरक्षा लॉग प्रविष्टि हटाएँ?")) {
                              run(`/api/access-logs/${l.id}`, { method: "DELETE" }, "लॉग प्रविष्टि हटाई गई");
                            }
                          }}
                          title="हटाएँ"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Official Seal & Signatories Manager (Manageable through Admin Panel) */}
      <div className="card-panel" style={{ borderRadius: 16 }}>
        <h3 style={{ color: "var(--primary)", fontSize: "1.1rem", fontWeight: 800, marginBottom: 14 }}>
          ✍️ {t(lang, "केंद्रीय मुहर एवं आधिकारिक हस्ताक्षरकर्ता प्रबंधन", "Official Seal & Signatories Management")}
        </h3>
        <p style={{ color: "#64748b", fontSize: "0.86rem", marginBottom: 16 }}>
          {t(lang, "यहाँ से केंद्रीय मुहर, हस्ताक्षरकर्ता व उनके पद संपादित करें। यहाँ किए गए परिवर्तन फ्रंटएंड पर पहचान पत्र, नियुक्ति पत्र व रसीद पर तुरंत लागू होते हैं।", "Edit central seal, signatories and their designations. Changes reflect immediately on ID cards, appointment letters and receipts.")}
        </p>

        <form onSubmit={saveSeal}>
          <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", marginBottom: 14 }}>
            <img src={seal} alt="Seal" style={{ width: 76, height: 76, objectFit: "contain", background: "#fff", borderRadius: 10, border: "1.5px solid #cbd5e1", padding: 4 }} />
            <div>
              <div style={{ fontSize: "0.88rem", fontWeight: 700, marginBottom: 4 }}>{t(lang, "नई मुहर इमेज अपलोड करें:", "Upload New Official Seal Image:")}</div>
              <input type="file" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { setSeal(await uploadFile(f, session)); showToast("मुहर तैयार, सेव करें"); } }} />
            </div>
          </div>

          <div className="form-grid" style={{ marginBottom: 14 }}>
            <Inp name="sealLabelHi" defaultValue={s.sealLabelHi || "आधिकारिक संघ मुहर"} placeholder="मुहर लेबल (हिंदी)" />
            <Inp name="sealLabelEn" defaultValue={s.sealLabelEn || "Official Association Seal"} placeholder="Seal Label (English)" />
          </div>

          <div style={{ fontSize: "0.88rem", fontWeight: 700, marginBottom: 8 }}>{t(lang, "डिफ़ॉल्ट हस्ताक्षरकर्ता चुनें (प्रपत्रों पर मुहर के साथ दिखने वाले):", "Select Default Signatories (Displayed with seal on documents):")}</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
            {list.map((sig) => (
              <label key={sig.id} style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "6px 12px", background: "#f8fafc", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.88rem", fontWeight: 700 }}>
                <input type="checkbox" name="defaultSig" value={sig.id} defaultChecked={defaults.includes(sig.id)} /> {sig.nameHi} ({sig.designationHi})
              </label>
            ))}
          </div>

          <button className="btn btn-accent btn-sm">💾 {t(lang, "मुहर व डिफ़ॉल्ट हस्ताक्षरकर्ता सेव करें", "Save Official Seal & Signatories")}</button>
        </form>

        <div style={{ marginTop: 24, borderTop: "1.5px solid #e2e8f0", paddingTop: 18 }}>
          <h4 style={{ color: "var(--primary)", fontSize: "1.0rem", fontWeight: 800, marginBottom: 12 }}>
            📋 {t(lang, "व्यक्तिगत पदाधिकारी हस्ताक्षर सूची", "Individual Officer Signatures List")}
          </h4>
          <div style={{ display: "grid", gap: 14 }}>
            {list.map((sig, idx) => (
              <OfficerForm key={sig.id} sig={sig} list={list} idx={idx} saveSettings={saveSettings} session={session} showToast={showToast} />
            ))}
            <NewOfficer list={list} saveSettings={saveSettings} session={session} showToast={showToast} />
          </div>
        </div>
      </div>
    </div>
  );
}

function OfficerForm({ sig, list, idx, saveSettings, session, showToast }) {
  const { lang } = usePortal();
  const [sep, setSep] = useState(sig.signatureUrl || "");
  const [comb, setComb] = useState(sig.combinedStampSigUrl || "");
  function save(e) {
    e.preventDefault();
    const raw = Object.fromEntries(new FormData(e.target).entries());
    const next = [...list];
    next[idx] = { ...sig, ...raw, signatureUrl: sep, combinedStampSigUrl: comb };
    saveSettings({ signatories: next }, "पदाधिकारी अपडेट");
  }
  return (
    <form className="card-panel" onSubmit={save}>
      <div className="form-grid">
        <Inp name="nameHi" defaultValue={sig.nameHi} required />
        <Inp name="nameEn" defaultValue={sig.nameEn} required />
        <Inp name="designationHi" defaultValue={sig.designationHi} required />
        <Inp name="designationEn" defaultValue={sig.designationEn} required />
        <label className="form-group full">{t(lang, "मोड", "Signature Mode")}
          <select className="form-control" name="signatureMode" defaultValue={sig.signatureMode === "combined" ? "combined" : "separate"}>
            <option value="separate">{t(lang, "अलग मुहर + अलग हस्ताक्षर", "Separate Seal + Separate Signature")}</option>
            <option value="combined">{t(lang, "मुहर और हस्ताक्षर एक साथ", "Combined Seal & Signature")}</option>
          </select>
        </label>
        <label>हस्ताक्षर {sep && <img src={sep} alt="" style={{ height: 40 }} />}<input type="file" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { setSep(await uploadFile(f, session)); showToast("हस्ताक्षर अपलोड"); } }} /></label>
        <label>संयुक्त इमेज {comb && <img src={comb} alt="" style={{ height: 40 }} />}<input type="file" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { setComb(await uploadFile(f, session)); showToast("संयुक्त इमेज अपलोड"); } }} /></label>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button className="btn btn-primary btn-sm">💾 {t(lang, "अपडेट", "Update")}</button>
        {list.length > 1 && <button type="button" className="btn btn-danger btn-sm" onClick={() => saveSettings({ signatories: list.filter((_, i) => i !== idx) }, t(lang, "पदाधिकारी हटाया", "Signatory removed"))}>🗑️ {t(lang, "हटाएँ", "Remove")}</button>}
      </div>
    </form>
  );
}

function NewOfficer({ list, saveSettings, session, showToast }) {
  const { lang } = usePortal();
  const [sep, setSep] = useState("");
  const [comb, setComb] = useState("");
  function add(e) {
    e.preventDefault();
    const raw = Object.fromEntries(new FormData(e.target).entries());
    saveSettings({
      signatories: [...list, {
        id: "sig-" + Date.now(),
        ...raw,
        signatureMode: comb && !sep ? "combined" : "separate",
        signatureUrl: sep || "/images/sig-gs.svg",
        combinedStampSigUrl: comb
      }]
    }, "नया पदाधिकारी जुड़ा");
    e.target.reset();
    setSep("");
    setComb("");
  }
  return (
    <form className="card-panel" onSubmit={add} style={{ borderStyle: "dashed" }}>
      <h4>➕ {t(lang, "नया हस्ताक्षरकर्ता", "Add New Signatory")}</h4>
      <div className="form-grid">
        <Inp name="nameHi" placeholder="नाम हिंदी" required />
        <Inp name="nameEn" placeholder="Name" required />
        <Inp name="designationHi" placeholder="पद हिंदी" required />
        <Inp name="designationEn" placeholder="Designation" required />
        <label>हस्ताक्षर<input type="file" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setSep(await uploadFile(f, session)); }} /></label>
        <label>संयुक्त<input type="file" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { setComb(await uploadFile(f, session)); showToast("इमेज तैयार"); } }} /></label>
      </div>
      <button className="btn btn-accent btn-sm" style={{ marginTop: 10 }}>➕ {t(lang, "जोड़ें", "Add Signatory")}</button>
    </form>
  );
}

function Templates({ state, saveSettings, session, showToast }) {
  const { lang } = usePortal();
  const s = state.settings || {};
  const bg = s.templateBackgrounds || {};
  const letter = bg.letter || {};
  const idcard = bg.idcard || {};
  const receipt = bg.receipt || {};
  const tc = s.termsAndConditions || {};
  const lt = s.letterTemplateText || {};

  const [activeTab, setActiveTab] = useState("backgrounds"); // 'backgrounds' | 'terms' | 'wording' | 'all'

  // Letter image state
  const [letterImg, setLetterImg] = useState(letter.bgImageUrl || "");
  const [idImg, setIdImg] = useState(idcard.bgImageUrl || "");
  const [rcpImg, setRcpImg] = useState(receipt.bgImageUrl || "");

  function saveBg(e) {
    e.preventDefault();
    const r = Object.fromEntries(new FormData(e.target).entries());
    saveSettings({
      templateBackgrounds: {
        letter: {
          ...letter,
          bgColor: r.letter_bgColor,
          headerColor: r.letter_headerColor,
          borderColor: r.letter_borderColor,
          bgOpacity: Number(r.letter_bgOpacity),
          bgImageUrl: letterImg
        },
        idcard: {
          ...idcard,
          frontBgColor: r.id_frontBgColor,
          headerColor: r.id_headerColor,
          backBgColor: r.id_backBgColor,
          bgOpacity: Number(r.id_bgOpacity),
          bgImageUrl: idImg
        },
        receipt: {
          ...receipt,
          bgColor: r.receipt_bgColor,
          headerColor: r.receipt_headerColor,
          borderColor: r.receipt_borderColor || "#cbd5e1",
          bgOpacity: Number(r.receipt_bgOpacity),
          bgImageUrl: rcpImg
        }
      }
    }, t(lang, "तीनों बैकग्राउंड सेटिंग्स सफलतापूर्वक सेव हो गईं", "All 3 background settings saved successfully"));
  }

  function resetDefaultBackgrounds() {
    if (confirm(t(lang, "क्या आप बैकग्राउंड्स को डिफ़ॉल्ट पर रीसेट करना चाहते हैं?", "Are you sure you want to reset backgrounds to defaults?"))) {
      setLetterImg("");
      setIdImg("");
      setRcpImg("");
      saveSettings({
        templateBackgrounds: {
          letter: {
            bgColor: "#ffffff",
            headerColor: "#0a2252",
            borderColor: "#c59b27",
            bgOpacity: 0.14,
            bgImageUrl: ""
          },
          idcard: {
            frontBgColor: "#ffffff",
            headerColor: "#0a2252",
            backBgColor: "#ffffff",
            bgOpacity: 0.15,
            bgImageUrl: ""
          },
          receipt: {
            bgColor: "#ffffff",
            headerColor: "#0a2252",
            borderColor: "#cbd5e1",
            bgOpacity: 0.12,
            bgImageUrl: ""
          }
        }
      }, t(lang, "बैकग्राउंड सेटिंग्स डिफ़ॉल्ट पर रीसेट हो गईं", "Background settings reset to defaults"));
    }
  }

  function saveTerms(e) {
    e.preventDefault();
    const raw = Object.fromEntries(new FormData(e.target).entries());
    saveSettings({
      termsAndConditions: { ...tc, ...raw }
    }, t(lang, "सदस्यता नियम एवं शर्तें सफलतापूर्वक सेव हो गईं", "Terms & conditions saved successfully"));
  }

  function saveWording(e) {
    e.preventDefault();
    const raw = Object.fromEntries(new FormData(e.target).entries());
    saveSettings({
      letterTemplateText: { ...lt, ...raw }
    }, t(lang, "नियुक्ति पत्र व कार्ड शब्दावली सफलतापूर्वक सेव हो गई", "Letter and ID card wording saved successfully"));
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      {/* Subtab Navigation Strip (Matching UI/UX of Menus) */}
      <div className="card-panel" style={{ padding: "12px 16px", borderRadius: 14 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <button
            type="button"
            className={`menus-subtab-btn ${activeTab === "backgrounds" ? "active" : ""}`}
            onClick={() => setActiveTab("backgrounds")}
          >
            🎨 {t(lang, "1. दस्तावेज़ बैकग्राउंड्स", "1. Document Backgrounds")}
          </button>
          <button
            type="button"
            className={`menus-subtab-btn ${activeTab === "terms" ? "active" : ""}`}
            onClick={() => setActiveTab("terms")}
          >
            📜 {t(lang, "2. सदस्यता नियम एवं शर्तें", "2. Terms & Conditions")}
          </button>
          <button
            type="button"
            className={`menus-subtab-btn ${activeTab === "wording" ? "active" : ""}`}
            onClick={() => setActiveTab("wording")}
          >
            📄 {t(lang, "3. पत्र व कार्ड शब्दावली", "3. Certificate & Card Texts")}
          </button>
          <button
            type="button"
            className={`menus-subtab-btn ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            📑 {t(lang, "सभी एक साथ देखें", "View All Sections")}
          </button>
        </div>
      </div>

      {/* SECTION 1: BACKGROUNDS (EXACT MATCH TO REFERENCE IMAGE 1) */}
      {(activeTab === "backgrounds" || activeTab === "all") && (
        <form className="card-panel" onSubmit={saveBg} style={{ borderRadius: 16, padding: "26px 28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
            <div>
              <h3 style={{ color: "#1e3a8a", fontWeight: 800, fontSize: "1.2rem", margin: "0 0 6px", display: "flex", alignItems: "center", gap: 8 }}>
                🎨 1. {t(lang, "लेटर, पहचान पत्र (ID) एवं रसीद का बैकग्राउंड बदलें", "Customize Letter, ID Card & Receipt Backgrounds")}
              </h3>
              <p style={{ color: "#64748b", fontSize: "0.86rem", margin: 0, maxWidth: 760 }}>
                {t(lang, "डिफ़ॉल्ट डिज़ाइन सेट है: आप चाहें तो कस्टम बैकग्राउंड कलर या बैकग्राउंड इमेज अपलोड कर सकते हैं अथवा कभी भी डिफ़ॉल्ट पर रीसेट कर सकते हैं।", "Default designs are active. You can customize colors and background images, or reset anytime.")}
              </p>
            </div>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={resetDefaultBackgrounds}
              style={{ fontWeight: 800, padding: "6px 14px", display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              🔄 {t(lang, "डिफ़ॉल्ट बैकग्राउंड रीसेट करें", "Reset to Default Backgrounds")}
            </button>
          </div>

          {/* Sub-block A: Appointment Letter & Documents */}
          <div className="tpl-block-card">
            <h4 className="tpl-block-title">
              📄 A) {t(lang, "नियुक्ति पत्र एवं संघ दस्तावेज़ (Letter) बैकग्राउंड", "Appointment Letter & Association Documents Background")}
            </h4>
            <div className="form-grid" style={{ rowGap: 16, columnGap: 24 }}>
              <div>
                <label className="about-form-label">{t(lang, "पेज बैकग्राउंड रंग", "Page Background Color")}</label>
                <input type="color" className="form-control-color" name="letter_bgColor" defaultValue={letter.bgColor || "#ffffff"} />
              </div>
              <div>
                <label className="about-form-label">{t(lang, "हेडर व एक्सेंट रंग", "Header & Accent Color")}</label>
                <input type="color" className="form-control-color" name="letter_headerColor" defaultValue={letter.headerColor || "#0a2252"} />
              </div>
              <div>
                <label className="about-form-label">{t(lang, "बॉर्डर रंग", "Border Color")}</label>
                <input type="color" className="form-control-color" name="letter_borderColor" defaultValue={letter.borderColor || "#c59b27"} />
              </div>
              <div>
                <label className="about-form-label">{t(lang, "बैकग्राउंड इमेज पारदर्शिता (0.05 - 0.50)", "Background Image Opacity (0.05 - 0.50)")}</label>
                <Inp type="number" step="0.01" min="0.05" max="0.50" name="letter_bgOpacity" defaultValue={letter.bgOpacity ?? 0.14} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label className="about-form-label">{t(lang, "कस्टम लेटर बैकग्राउंड इमेज अपलोड करें (वैकल्पिक)", "Upload Custom Letter Background Image (Optional)")}</label>
                <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 12, alignItems: "center" }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const url = await uploadFile(f, session);
                      setLetterImg(url);
                      showToast(t(lang, "लेटर बैकग्राउंड इमेज तैयार, सेव करें", "Letter BG image ready, click save"));
                    }}
                  />
                  <Inp
                    value={letterImg}
                    onChange={(e) => setLetterImg(e.target.value)}
                    placeholder={t(lang, "खाली रखने पर डिफ़ॉल्ट क्लीन बैकग्राउंड रहेगा", "Leave blank for default clean background")}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sub-block B: ID Card Background */}
          <div className="tpl-block-card">
            <h4 className="tpl-block-title">
              💳 B) {t(lang, "पहचान पत्र (ID Card) बैकग्राउंड", "Identity Card (ID Card) Background")}
            </h4>
            <div className="form-grid" style={{ rowGap: 16, columnGap: 24 }}>
              <div>
                <label className="about-form-label">{t(lang, "फ्रंट कार्ड बैकग्राउंड रंग", "Front Card Background Color")}</label>
                <input type="color" className="form-control-color" name="id_frontBgColor" defaultValue={idcard.frontBgColor || "#ffffff"} />
              </div>
              <div>
                <label className="about-form-label">{t(lang, "कार्ड हेडर पट्टी रंग", "Card Header Band Color")}</label>
                <input type="color" className="form-control-color" name="id_headerColor" defaultValue={idcard.headerColor || "#0a2252"} />
              </div>
              <div>
                <label className="about-form-label">{t(lang, "बैक कार्ड बैकग्राउंड रंग", "Back Card Background Color")}</label>
                <input type="color" className="form-control-color" name="id_backBgColor" defaultValue={idcard.backBgColor || "#ffffff"} />
              </div>
              <div>
                <label className="about-form-label">{t(lang, "बैकग्राउंड इमेज पारदर्शिता", "Background Image Opacity")}</label>
                <Inp type="number" step="0.01" min="0.05" max="0.50" name="id_bgOpacity" defaultValue={idcard.bgOpacity ?? 0.15} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label className="about-form-label">{t(lang, "कस्टम ID कार्ड बैकग्राउंड इमेज (वैकल्पिक)", "Upload Custom ID Card Background Image (Optional)")}</label>
                <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 12, alignItems: "center" }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const url = await uploadFile(f, session);
                      setIdImg(url);
                      showToast(t(lang, "ID कार्ड बैकग्राउंड तैयार, सेव करें", "ID Card BG ready, click save"));
                    }}
                  />
                  <Inp
                    value={idImg}
                    onChange={(e) => setIdImg(e.target.value)}
                    placeholder={t(lang, "खाली रखने पर डिफ़ॉल्ट बैकग्राउंड रहेगा", "Leave blank for default background")}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sub-block C: Receipt Background */}
          <div className="tpl-block-card">
            <h4 className="tpl-block-title">
              🧾 C) {t(lang, "शुल्क व डोनेशन रसीद (Receipt) बैकग्राउंड", "Fee & Donation Receipt Background")}
            </h4>
            <div className="form-grid" style={{ rowGap: 16, columnGap: 24 }}>
              <div>
                <label className="about-form-label">{t(lang, "रसीद बैकग्राउंड रंग", "Receipt Background Color")}</label>
                <input type="color" className="form-control-color" name="receipt_bgColor" defaultValue={receipt.bgColor || "#ffffff"} />
              </div>
              <div>
                <label className="about-form-label">{t(lang, "रसीद हेडर रंग", "Receipt Header Color")}</label>
                <input type="color" className="form-control-color" name="receipt_headerColor" defaultValue={receipt.headerColor || "#0a2252"} />
              </div>
              <div>
                <label className="about-form-label">{t(lang, "रसीद बॉर्डर रंग", "Receipt Border Color")}</label>
                <input type="color" className="form-control-color" name="receipt_borderColor" defaultValue={receipt.borderColor || "#cbd5e1"} />
              </div>
              <div>
                <label className="about-form-label">{t(lang, "बैकग्राउंड इमेज पारदर्शिता", "Background Image Opacity")}</label>
                <Inp type="number" step="0.01" min="0.05" max="0.50" name="receipt_bgOpacity" defaultValue={receipt.bgOpacity ?? 0.12} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label className="about-form-label">{t(lang, "कस्टम रसीद बैकग्राउंड इमेज (वैकल्पिक)", "Upload Custom Receipt Background Image (Optional)")}</label>
                <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 12, alignItems: "center" }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const url = await uploadFile(f, session);
                      setRcpImg(url);
                      showToast(t(lang, "रसीद बैकग्राउंड तैयार, सेव करें", "Receipt BG ready, click save"));
                    }}
                  />
                  <Inp
                    value={rcpImg}
                    onChange={(e) => setRcpImg(e.target.value)}
                    placeholder={t(lang, "खाली रखने पर डिफ़ॉल्ट बैकग्राउंड रहेगा", "Leave blank for default background")}
                  />
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 22 }}>
            <button type="submit" className="btn-save-orange">
              💾 {t(lang, "तीनों बैकग्राउंड सेटिंग्स सेव करें", "Save All 3 Background Settings")}
            </button>
          </div>
        </form>
      )}

      {/* SECTION 2: TERMS & CONDITIONS (EXACT MATCH TO REFERENCE IMAGE 2) */}
      {(activeTab === "terms" || activeTab === "all") && (
        <form className="card-panel" onSubmit={saveTerms} style={{ borderRadius: 16, padding: "26px 28px" }}>
          <h3 style={{ color: "#1e3a8a", fontWeight: 800, fontSize: "1.2rem", margin: "0 0 6px", display: "flex", alignItems: "center", gap: 8 }}>
            📜 2. {t(lang, "सदस्यता पंजीकरण के नियम एवं शर्तें (Terms & Conditions)", "Membership Registration Terms & Conditions")}
          </h3>
          <p style={{ color: "#64748b", fontSize: "0.86rem", margin: "0 0 20px" }}>
            {t(lang, "सदस्यता लेते समय प्रत्येक आवेदक को इन शर्तों को टिक करना अनिवार्य है। इसे हिंदी व English दोनों में संपादित करें:", "Applicants must accept these terms during membership registration. Edit in both Hindi and English:")}
          </p>

          <div className="form-grid" style={{ rowGap: 18, columnGap: 24 }}>
            {/* Row 1: Headings */}
            <div>
              <label className="about-form-label">{t(lang, "शीर्षक (हिंदी)", "Terms Heading (Hindi)")}</label>
              <Inp name="titleHi" defaultValue={tc.titleHi || "सदस्यता नियम एवं शर्तें"} required />
            </div>
            <div>
              <label className="about-form-label">{t(lang, "Terms Heading (English)", "Terms Heading (English)")}</label>
              <Inp name="titleEn" defaultValue={tc.titleEn || "Membership Terms & Conditions"} required />
            </div>

            {/* Row 2: Content Bodies */}
            <div>
              <label className="about-form-label">{t(lang, "नियम एवं शर्तें विवरण (हिंदी)", "Terms & Conditions Body (Hindi)")}</label>
              <textarea
                className="form-control"
                rows={6}
                name="contentHi"
                defaultValue={tc.contentHi || "1. आवेदक उत्तर प्रदेश के किसी मान्यता प्राप्त बैंक अथवा कॉर्पोरेट बीसी संस्था के अंतर्गत कार्यरत बैंक मित्र / ग्राहक सेवा केंद्र (CSP) संचालक होना चाहिए।\n2. सदस्य द्वारा आवेदन पत्र में दी गई समस्त जानकारी एवं पहचान विवरण पूर्णतः सत्य व प्रामाणिक होने चाहिए।\n3. प्रत्येक सदस्य संगठन के संविधान, अनुशासन एवं गरिमा का पालन करेगा तथा किसी भी प्रकार की अनैतिक गतिविधि में संलिप्त नहीं होगा।\n4. संगठन की सदस्यता राशि संघ के संगठनात्मक संचालन एवं बैंक मित्र कल्याण कार्यों हेतु निर्धारित है, जो अहस्तांतरणीय एवं अप्रतिदेय (Non-refundable) है।\n5. संघ के नियमों के उल्लंघन की स्थिति में प्रदेश कार्यकारिणी को सदस्यता निलंबित या समाप्त करने का पूर्ण अधिकार सुरक्षित रहेगा।"}
                required
              />
            </div>
            <div>
              <label className="about-form-label">{t(lang, "Terms & Conditions Body (English)", "Terms & Conditions Body (English)")}</label>
              <textarea
                className="form-control"
                rows={6}
                name="contentEn"
                defaultValue={tc.contentEn || "1. The applicant must be an active Bank Mitra / Customer Service Point (CSP) operator working under a recognized bank or Corporate BC in Uttar Pradesh.\n2. All personal, banking, and KO/CSP details furnished in the application form must be true and verifiable.\n3. Every member pledges to uphold the constitution, discipline, and dignity of Uttar Pradesh Bank Mitra Sangh.\n4. Membership contribution supports organizational welfare and advocacy initiatives and is non-transferable and non-refundable.\n5. The State Executive Committee reserves the right to suspend or revoke membership in case of breach of association rules."}
                required
              />
            </div>

            {/* Row 3: Checkbox Labels */}
            <div>
              <label className="about-form-label">{t(lang, "अनिवार्य टिक-बॉक्स वाक्य (हिंदी)", "Mandatory Checkbox Label (Hindi)")}</label>
              <Inp
                name="checkboxLabelHi"
                defaultValue={tc.checkboxLabelHi || "मैंने उत्तर प्रदेश बैंक मित्र संघ के उपरोक्त सभी नियम एवं शर्तें ध्यानपूर्वक पढ़ ली हैं और मैं इनसे पूर्णतः सहमत हूँ।"}
                required
              />
            </div>
            <div>
              <label className="about-form-label">{t(lang, "Mandatory Checkbox Label (English)", "Mandatory Checkbox Label (English)")}</label>
              <Inp
                name="checkboxLabelEn"
                defaultValue={tc.checkboxLabelEn || "I have carefully read and agree to abide by all the Terms & Conditions of Uttar Pradesh Bank Mitra Sangh."}
                required
              />
            </div>
          </div>

          <div style={{ marginTop: 22 }}>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ background: "#0b1a30", color: "#ffffff", fontWeight: 800, padding: "10px 24px", borderRadius: 8, border: "none", cursor: "pointer" }}
            >
              💾 {t(lang, "नियम एवं शर्तें सेव करें", "Save Terms & Conditions")}
            </button>
          </div>
        </form>
      )}

      {/* SECTION 3: APPOINTMENT & ID CARD WORDING (EXACT MATCH TO REFERENCE IMAGE 3) */}
      {(activeTab === "wording" || activeTab === "all") && (
        <form className="card-panel" onSubmit={saveWording} style={{ borderRadius: 16, padding: "26px 28px" }}>
          <h3 style={{ color: "#1e3a8a", fontWeight: 800, fontSize: "1.2rem", margin: "0 0 18px", display: "flex", alignItems: "center", gap: 8 }}>
            📄 3. {t(lang, "नियुक्ति पत्र व पहचान पत्र के आंतरिक वाक्य (हिंदी व English)", "Appointment Letter & ID Card Inner Wording (Hindi & English)")}
          </h3>

          <div className="form-grid" style={{ rowGap: 18, columnGap: 24 }}>
            {/* Row 1: Certificate Heading */}
            <div>
              <label className="about-form-label">{t(lang, "नियुक्ति पत्र शीर्षक (हिंदी)", "Certificate Heading (Hindi)")}</label>
              <Inp name="docTitleHi" defaultValue={lt.docTitleHi || "आधिकारिक नियुक्ति एवं सदस्यता प्रमाण-पत्र"} required />
            </div>
            <div>
              <label className="about-form-label">{t(lang, "Certificate Heading (English)", "Certificate Heading (English)")}</label>
              <Inp name="docTitleEn" defaultValue={lt.docTitleEn || "OFFICIAL APPOINTMENT & MEMBERSHIP CERTIFICATE"} required />
            </div>

            {/* Row 2: Subject Line */}
            <div>
              <label className="about-form-label">{t(lang, "विषय पंक्ति (हिंदी)", "Subject Line (Hindi)")}</label>
              <Inp name="subjectHi" defaultValue={lt.subjectHi || "उत्तर प्रदेश बैंक मित्र संघ में मनोनयन / सक्रिय सदस्यता प्रमाणन के संबंध में।"} required />
            </div>
            <div>
              <label className="about-form-label">{t(lang, "Subject Line (English)", "Subject Line (English)")}</label>
              <Inp name="subjectEn" defaultValue={lt.subjectEn || "Regarding Appointment / Active Membership Certification in Uttar Pradesh Bank Mitra Sangh."} required />
            </div>

            {/* Row 3: Main Paragraph */}
            <div>
              <label className="about-form-label">{t(lang, "मुख्य अनुच्छेद (हिंदी)", "Main Paragraph (Hindi)")}</label>
              <textarea
                className="form-control"
                rows={4}
                name="bodyParaHi"
                defaultValue={lt.bodyParaHi || "हर्ष के साथ सूचित किया जाता है कि बैंकिंग सेवाओं के विस्तार एवं बैंक मित्रों के संगठनात्मक हितों के प्रति आपकी निष्ठा को देखते हुए प्रदेश कार्यकारिणी द्वारा आपको विधिवत मनोनीत / पंजीकृत किया जाता है।"}
                required
              />
            </div>
            <div>
              <label className="about-form-label">{t(lang, "Main Paragraph (English)", "Main Paragraph (English)")}</label>
              <textarea
                className="form-control"
                rows={4}
                name="bodyParaEn"
                defaultValue={lt.bodyParaEn || "We are pleased to certify that in recognition of your dedication towards banking inclusion and the welfare of Bank Mitras, the State Executive Committee hereby appoints and registers you in the association."}
                required
              />
            </div>

            {/* Row 4: ID Card Back Guidelines */}
            <div>
              <label className="about-form-label">{t(lang, "ID कार्ड पीछे के निर्देश (हिंदी)", "ID Card Back Guidelines (Hindi)")}</label>
              <textarea
                className="form-control"
                rows={4}
                name="idBackRulesHi"
                defaultValue={lt.idBackRulesHi || "1. यह पहचान पत्र संघ की संपत्ति है तथा केवल संगठनात्मक पहचान हेतु मान्य है।\n2. खो जाने या अनुपयोगी होने पर तुरंत प्रांतीय कार्यालय को सूचित करें।\n3. कार्ड की वैधता ऊपर दिए गए क्यूआर कोड से ऑनलाइन सत्यापित की जा सकती है।"}
                required
              />
            </div>
            <div>
              <label className="about-form-label">{t(lang, "ID Card Back Guidelines (English)", "ID Card Back Guidelines (English)")}</label>
              <textarea
                className="form-control"
                rows={4}
                name="idBackRulesEn"
                defaultValue={lt.idBackRulesEn || "1. This identity card remains the property of UPBMS and is valid strictly for organizational identification.\n2. Please inform the State Central Office immediately if lost.\n3. Authenticity can be verified anytime by scanning the QR code above."}
                required
              />
            </div>
          </div>

          <div style={{ marginTop: 22 }}>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ background: "#0b1a30", color: "#ffffff", fontWeight: 800, padding: "10px 24px", borderRadius: 8, border: "none", cursor: "pointer" }}
            >
              💾 {t(lang, "पत्र व कार्ड शब्दावली सेव करें", "Save Letter & Card Wording")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function Hero({ state, saveSettings, run, session, showToast }) {
  const { lang } = usePortal();
  const cb = state.settings.campaignBlock || {};
  const stats = state.settings.statCards || [];
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("slider"); // 'slider' | 'campaign' | 'all'

  const slides = state.slides || [];

  async function addSlide(e) {
    e.preventDefault();
    if (!imageUrl) return showToast(t(lang, "पहले बैनर इमेज चुनें व अपलोड करें", "Please select and upload a banner image first"));
    const raw = Object.fromEntries(new FormData(e.target).entries());
    if (await run("/api/slides", { method: "POST", body: { ...raw, imageUrl, active: true, order: slides.length + 1 } }, t(lang, "स्लाइड सफलतापूर्वक जोड़ी गई", "Slide added successfully"))) {
      e.target.reset();
      setImageUrl("");
    }
  }

  function saveCampaign(e) {
    e.preventDefault();
    const r = Object.fromEntries(new FormData(e.target).entries());
    const statCards = [0, 1, 2, 3].map((i) => ({
      id: `st-${i + 1}`,
      icon: r[`st_icon_${i}`] || "",
      valueHi: r[`st_valHi_${i}`] || "",
      valueEn: r[`st_valEn_${i}`] || "",
      labelHi: r[`st_lblHi_${i}`] || "",
      labelEn: r[`st_lblEn_${i}`] || ""
    }));
    saveSettings({
      campaignBlock: {
        ...cb,
        badgeHi: r.badgeHi,
        badgeEn: r.badgeEn,
        titleHi: r.titleHi,
        titleEn: r.titleEn,
        subtitleHi: r.subtitleHi,
        subtitleEn: r.subtitleEn,
        btn1Hi: r.btn1Hi,
        btn1En: r.btn1En,
        btn2Hi: r.btn2Hi,
        btn2En: r.btn2En,
        btn3Hi: r.btn3Hi,
        btn3En: r.btn3En
      },
      statCards
    }, t(lang, "अभियान व चारों हाइलाइट बॉक्स सफलतापूर्वक सेव हो गए", "Campaign and 4 stat boxes saved successfully"));
  }

  const defaultStats = [
    { icon: "🗺️", valueHi: "75 जनपद", valueEn: "75 Districts", labelHi: "सक्रिय जिला इकाइयाँ", labelEn: "Active District Units" },
    { icon: "👑", valueHi: "500+ साथी", valueEn: "500+ Members", labelHi: "पंजीकृत बैंक मित्र नेटवर्क", labelEn: "Registered Bank Mitra Network" },
    { icon: "🪪", valueHi: "100% QR", valueEn: "100% QR", labelHi: "सत्यापित डिजिटल पहचान पत्र", labelEn: "Verified Digital ID Cards" },
    { icon: "🌐", valueHi: "6+ पोर्टल", valueEn: "6+ Portals", labelHi: "सीधे उपयोगी बैंकिंग लिंक", labelEn: "Direct Banking Portals" }
  ];

  return (
    <div style={{ display: "grid", gap: 20 }}>
      {/* Subtab Navigation Strip (Matching UI/UX of Menus & Backgrounds) */}
      <div className="card-panel" style={{ padding: "12px 16px", borderRadius: 14 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <button
            type="button"
            className={`menus-subtab-btn ${activeTab === "slider" ? "active" : ""}`}
            onClick={() => setActiveTab("slider")}
          >
            🖼️ {t(lang, "1. मुख्य बैनर स्लाइडर", "1. Homepage Banner Slider")}
          </button>
          <button
            type="button"
            className={`menus-subtab-btn ${activeTab === "campaign" ? "active" : ""}`}
            onClick={() => setActiveTab("campaign")}
          >
            🎯 {t(lang, "2. अभियान संदेश एवं 4 हाइलाइट बॉक्स", "2. Campaign & 4 Stat Cards")}
          </button>
          <button
            type="button"
            className={`menus-subtab-btn ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            📑 {t(lang, "सभी एक साथ देखें", "View All Sections")}
          </button>
        </div>
      </div>

      {/* SECTION 1: HOMEPAGE BANNER SLIDER (EXACT MATCH TO REFERENCE IMAGE 1) */}
      {(activeTab === "slider" || activeTab === "all") && (
        <div className="card-panel" style={{ borderRadius: 16, padding: "26px 28px" }}>
          <h3 style={{ color: "#1e3a8a", fontWeight: 800, fontSize: "1.2rem", margin: "0 0 18px", display: "flex", alignItems: "center", gap: 8 }}>
            🖼️ 1. {t(lang, "मुख्य बैनर स्लाइडर (स्पष्ट अनुपात बिना कटे)", "Main Banner Slider (Exact 16:9 Aspect Ratio)")}
          </h3>

          {/* Add Slide Form */}
          <form onSubmit={addSlide} style={{ borderBottom: "1.5px solid #e2e8f0", paddingBottom: 24, marginBottom: 24 }}>
            <div className="form-grid" style={{ rowGap: 16, columnGap: 24 }}>
              <div>
                <label className="about-form-label">{t(lang, "स्लाइड कैप्शन (हिंदी)", "Slide Caption (Hindi)")}</label>
                <Inp name="captionHi" placeholder={t(lang, "हिंदी कैप्शन", "Hindi Caption")} required />
              </div>
              <div>
                <label className="about-form-label">{t(lang, "Slide Caption (English)", "Slide Caption (English)")}</label>
                <Inp name="captionEn" placeholder={t(lang, "English Caption", "English Caption")} required />
              </div>

              <div>
                <label className="about-form-label">{t(lang, "इमेज फिट विकल्प", "Image Fit Option")}</label>
                <select className="form-control" name="fitMode" defaultValue="cover">
                  <option value="cover">{t(lang, "Cover (फुल बैनर)", "Cover (Full Banner)")}</option>
                  <option value="contain">{t(lang, "Contain (बिना कटे पूरी इमेज)", "Contain (Fit Without Crop)")}</option>
                </select>
              </div>

              <div>
                <label className="about-form-label">{t(lang, "बैनर इमेज अपलोड करें *", "Upload Banner Image *")}</label>
                <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      setUploading(true);
                      try {
                        const url = await uploadFile(f, session);
                        setImageUrl(url);
                        showToast(t(lang, "इमेज तैयार है", "Image uploaded successfully"));
                      } catch (err) {
                        showToast(err.message);
                      } finally {
                        setUploading(false);
                      }
                    }}
                  />
                  {uploading && <span style={{ color: "#ea580c", fontWeight: 700, fontSize: "0.85rem" }}>⏳ {t(lang, "अपलोड हो रहा है...", "Uploading...")}</span>}
                  {imageUrl && <span style={{ color: "#16a34a", fontWeight: 800, fontSize: "0.85rem" }}>✓ {t(lang, "इमेज संलग्न", "Image Attached")}</span>}
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-sm"
              style={{
                background: "#0b1a30",
                color: "#ffffff",
                fontWeight: 800,
                padding: "9px 22px",
                borderRadius: "8px",
                marginTop: "18px",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                border: "none",
                cursor: "pointer"
              }}
            >
              + {t(lang, "नई स्लाइड जोड़ें", "Add New Slide")}
            </button>
          </form>

          {/* Existing Slides Cards matching Image 1 */}
          {slides.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 20px", background: "#f8fafc", borderRadius: 12, border: "1.5px dashed #cbd5e1", color: "#64748b" }}>
              {t(lang, "अभी कोई स्लाइड नहीं जोड़ी गई है। ऊपर दिए गए फॉर्म से नई स्लाइड जोड़ें।", "No slides added yet. Use the form above to add a slide.")}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
              {slides.map((sl) => (
                <div
                  key={sl.id}
                  style={{
                    background: "#ffffff",
                    border: "1.5px solid #cbd5e1",
                    borderRadius: "14px",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.04)"
                  }}
                >
                  <div style={{ width: "100%", aspectRatio: "16/9", background: "#f8fafc", overflow: "hidden" }}>
                    <img
                      src={sl.imageUrl}
                      alt={sl.captionHi || "Slide"}
                      style={{ width: "100%", height: "100%", objectFit: sl.fitMode === "contain" ? "contain" : "cover", display: "block" }}
                    />
                  </div>
                  <div style={{ padding: "14px 16px" }}>
                    <div style={{ fontWeight: 800, fontSize: "0.96rem", color: "#0f172a", marginBottom: "4px", lineHeight: 1.35 }}>
                      {sl.captionHi}
                    </div>
                    <div style={{ fontSize: "0.84rem", color: "#64748b", marginBottom: "14px" }}>
                      {sl.captionEn}
                    </div>
                    <button
                      type="button"
                      className="cert-btn-delete"
                      onClick={() => {
                        if (confirm(t(lang, "क्या आप यह स्लाइड हटाना चाहते हैं?", "Are you sure you want to delete this slide?"))) {
                          run(`/api/slides/${sl.id}`, { method: "DELETE" }, t(lang, "स्लाइड हटा दी गई", "Slide deleted"));
                        }
                      }}
                    >
                      🗑️ {t(lang, "हटाएँ", "Delete")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: CAMPAIGN MESSAGE & 4 STAT CARDS (EXACT MATCH TO REFERENCE IMAGE 2) */}
      {(activeTab === "campaign" || activeTab === "all") && (
        <form className="card-panel" onSubmit={saveCampaign} style={{ borderRadius: 16, padding: "26px 28px" }}>
          <h3 style={{ color: "#1e3a8a", fontWeight: 800, fontSize: "1.2rem", margin: "0 0 6px", display: "flex", alignItems: "center", gap: 8 }}>
            🎯 2. {t(lang, "स्लाइडर के नीचे का मुख्य अभियान संदेश एवं 4 हाइलाइट बॉक्स", "Main Campaign Message & 4 Highlight Boxes Below Slider")}
          </h3>
          <p style={{ color: "#64748b", fontSize: "0.86rem", margin: "0 0 20px" }}>
            {t(lang, "स्लाइडर के ठीक नीचे दिखने वाला अभियान संदेश, तीनों बटन और चारों आंकड़ों वाले बॉक्स यहाँ से हिंदी व English दोनों में बदलें:", "Customize the campaign headline, 3 action buttons and 4 stat cards displayed directly below the hero slider in both Hindi and English:")}
          </p>

          <div className="form-grid" style={{ rowGap: 18, columnGap: 24 }}>
            {/* Row 1: Badges */}
            <div>
              <label className="about-form-label">{t(lang, "अभियान बैज (हिंदी)", "Campaign Badge (Hindi)")}</label>
              <Inp name="badgeHi" defaultValue={cb.badgeHi || "उत्तर प्रदेश के समस्त 75 जनपदों के बैंक मित्रों का अधिकृत संगठन"} />
            </div>
            <div>
              <label className="about-form-label">{t(lang, "Campaign Badge (English)", "Campaign Badge (English)")}</label>
              <Inp name="badgeEn" defaultValue={cb.badgeEn || "Official Organization of Bank Mitras Across All 75 Districts of UP"} />
            </div>

            {/* Row 2: Main Headline */}
            <div>
              <label className="about-form-label">{t(lang, "मुख्य शीर्षक (हिंदी)", "Main Headline (Hindi)")}</label>
              <Inp name="titleHi" defaultValue={cb.titleHi || "स्थायी मानदेय, कमीशन वृद्धि और सामाजिक सुरक्षा के लिए एकजुट हो रहा प्रदेश का हर बैंक मित्र!"} required />
            </div>
            <div>
              <label className="about-form-label">{t(lang, "Main Headline (English)", "Main Headline (English)")}</label>
              <Inp name="titleEn" defaultValue={cb.titleEn || "Every Bank Mitra of Uttar Pradesh Uniting for Assured Honorarium, Fair Commission & Social Security!"} required />
            </div>

            {/* Row 3: Subtitle */}
            <div>
              <label className="about-form-label">{t(lang, "उप-शीर्षक (हिंदी)", "Subtitle (Hindi)")}</label>
              <textarea
                className="form-control"
                rows={3}
                name="subtitleHi"
                defaultValue={cb.subtitleHi || "ऑनलाइन सदस्यता लें, तुरंत आधिकारिक पहचान पत्र एवं नियुक्ति पत्र डाउनलोड करें और अपनी आवाज मजबूत बनाएं।"}
              />
            </div>
            <div>
              <label className="about-form-label">{t(lang, "Subtitle (English)", "Subtitle (English)")}</label>
              <textarea
                className="form-control"
                rows={3}
                name="subtitleEn"
                defaultValue={cb.subtitleEn || "Register online, download your official Identity Card & Appointment Letter immediately, and strengthen our collective voice."}
              />
            </div>

            {/* Row 4: Buttons 1 & 2 */}
            <div>
              <label className="about-form-label">{t(lang, "बटन 1 नाम (हिंदी | English)", "Button 1 Label (Hindi | English)")}</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Inp name="btn1Hi" defaultValue={cb.btn1Hi || "सदस्यता पंजीकरण करें"} />
                <Inp name="btn1En" defaultValue={cb.btn1En || "Register for Membership"} />
              </div>
            </div>
            <div>
              <label className="about-form-label">{t(lang, "बटन 2 नाम (हिंदी | English)", "Button 2 Label (Hindi | English)")}</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Inp name="btn2Hi" defaultValue={cb.btn2Hi || "प्रमुख मांग-पत्र देखें"} />
                <Inp name="btn2En" defaultValue={cb.btn2En || "View Charter of Demands"} />
              </div>
            </div>

            {/* Row 5: Button 3 */}
            <div>
              <label className="about-form-label">{t(lang, "बटन 3 नाम (हिंदी | English)", "Button 3 Label (Hindi | English)")}</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Inp name="btn3Hi" defaultValue={cb.btn3Hi || "समस्या / शिकायत दर्ज करें"} />
                <Inp name="btn3En" defaultValue={cb.btn3En || "Lodge a Grievance"} />
              </div>
            </div>
            <div></div>
          </div>

          {/* Row 6: 4 Highlight Stat Cards matching Image 2 */}
          <div style={{ marginTop: 24 }}>
            <h4 style={{ color: "var(--primary)", fontWeight: 800, fontSize: "1.0rem", margin: "0 0 14px", display: "flex", alignItems: "center", gap: 8 }}>
              📊 {t(lang, "चारों हाइलाइट बॉक्स (Stat Cards):", "4 Highlight Stat Cards:")}
            </h4>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 18 }}>
              {[0, 1, 2, 3].map((i) => {
                const st = stats[i] || defaultStats[i] || {};
                return (
                  <div
                    key={i}
                    style={{
                      border: "1.5px solid #cbd5e1",
                      borderRadius: 12,
                      padding: 16,
                      background: "#ffffff",
                      display: "grid",
                      gap: 8,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
                    }}
                  >
                    <div style={{ color: "#ea580c", fontWeight: 800, fontSize: "0.95rem" }}>
                      {t(lang, `बॉक्स #${i + 1}`, `Box #${i + 1}`)}
                    </div>
                    <Inp name={`st_icon_${i}`} defaultValue={st.icon} placeholder={t(lang, "आइकॉन (उदा. 🗺️)", "Icon (e.g. 🗺️)")} />
                    <Inp name={`st_valHi_${i}`} defaultValue={st.valueHi} placeholder={t(lang, "मान हिंदी (उदा. 75 जनपद)", "Value Hindi")} />
                    <Inp name={`st_valEn_${i}`} defaultValue={st.valueEn} placeholder={t(lang, "Value English", "Value English")} />
                    <Inp name={`st_lblHi_${i}`} defaultValue={st.labelHi} placeholder={t(lang, "लेबल हिंदी (उदा. सक्रिय जिला इकाइयाँ)", "Label Hindi")} />
                    <Inp name={`st_lblEn_${i}`} defaultValue={st.labelEn} placeholder={t(lang, "Label English", "Label English")} />
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ marginTop: 24 }}>
            <button type="submit" className="btn-save-orange">
              💾 {t(lang, "अभियान व चारों बॉक्स सेव करें", "Save Campaign & 4 Stat Boxes")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function Members({ portal, run }) {
  const { state, session, setModal, showToast, lang } = portal;
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [edit, setEdit] = useState(null);
  const rows = state.members.filter((m) => {
    if (filter === "core" && !m.isCoreMember) return false;
    if (filter === "general" && m.isCoreMember) return false;
    if (filter === "pending" && m.status !== "pending") return false;
    if (q && !`${m.nameHi} ${m.nameEn} ${m.memberCode} ${m.mobile} ${m.district} ${m.koCode}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });
  async function saveMeta(e) {
    e.preventDefault();
    const r = Object.fromEntries(new FormData(e.target).entries());
    await run("/api/meta", { method: "PUT", body: { districts: lines(r.districts), banks: lines(r.banks), bcCompanies: lines(r.bcCompanies) } }, "मास्टर सूची सेव");
  }
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div className="card-panel">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
          <h3 style={{ color: "var(--primary)" }}>👥 {t(lang, "सदस्य प्रबंधन", "Member Management")}</h3>
          <button className="btn btn-accent btn-sm" onClick={() => setEdit({})}>➕ {t(lang, "नया सदस्य", "New Member")}</button>
        </div>
        <div className="filter-bar">
          <Inp value={q} onChange={(e) => setQ(e.target.value)} placeholder="खोजें" />
          <select className="form-control" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">सभी ({state.members.length})</option>
            <option value="core">मुख्य कार्यकारिणी</option>
            <option value="general">सामान्य</option>
            <option value="pending">लंबित</option>
          </select>
        </div>
        <div className="admin-table-wrap">
          <table className="data-table">
            <thead><tr><th>{t(lang, "आईडी", "ID")}</th><th>{t(lang, "नाम", "Name")}</th><th>{t(lang, "जनपद", "District")}</th><th>{t(lang, "मोबाइल", "Mobile")}</th><th>{t(lang, "स्थिति", "Status")}</th><th>{t(lang, "कार्य", "Actions")}</th></tr></thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.id}>
                  <td><b>{m.memberCode}</b><br />{m.isCoreMember ? "CORE" : "सामान्य"}</td>
                  <td>{m.nameHi}<br />{m.designationHi}</td>
                  <td>{m.district}<br />{m.bankName}</td>
                  <td>{m.mobile}</td>
                  <td><span className={`badge badge-${m.status === "active" ? "active" : "pending"}`}>{m.status}</span></td>
                  <td style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {m.status !== "active" && <button className="btn btn-whatsapp btn-sm" onClick={() => run(`/api/members/${m.id}`, { method: "PUT", body: { status: "active" } }, "स्वीकृत")}>स्वीकृत</button>}
                    <button className="btn btn-primary btn-sm" onClick={() => setEdit(m)}>संशोधित</button>
                    <button className="btn btn-outline btn-sm" onClick={() => { const p = prompt("नया पासवर्ड", "UPBMS@123"); if (p) run(`/api/members/${m.id}/reset-password`, { method: "POST", body: { newPassword: p } }, "पासवर्ड बदला"); }}>पासवर्ड</button>
                    <button className="btn btn-outline btn-sm" onClick={() => showToast(`${m.memberCode} का पत्र सदस्य लॉगिन के बाद खुलता है`)}>ID</button>
                    <button className="btn btn-danger btn-sm" onClick={() => { if (confirm("सदस्य हटाएँ?")) run(`/api/members/${m.id}`, { method: "DELETE" }, "हटाया"); }}>हटाएँ</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {edit && <MemberForm member={edit.id ? edit : null} state={state} session={session} run={run} onClose={() => setEdit(null)} showToast={showToast} />}
      <form className="card-panel" onSubmit={saveMeta}>
        <h3 style={{ color: "var(--primary)" }}>जनपद, बैंक और बीसी कंपनी</h3>
        <div className="form-grid">
          <Field label={`बैंक (${state.meta.banks.length})`}><Area name="banks" defaultValue={state.meta.banks.join("\n")} /></Field>
          <Field label={`बीसी (${state.meta.bcCompanies.length})`}><Area name="bcCompanies" defaultValue={state.meta.bcCompanies.join("\n")} /></Field>
          <Field label={`जनपद (${state.meta.districts.length})`}><Area name="districts" defaultValue={state.meta.districts.join("\n")} /></Field>
        </div>
        <button className="btn btn-primary" style={{ marginTop: 10 }}>सूची सेव</button>
      </form>
    </div>
  );
}

function MemberForm({ member, state, session, run, onClose, showToast }) {
  const { lang } = usePortal();
  const cur = member || { status: "active", email: "", designationHi: "सक्रिय बैंक मित्र सदस्य", designationEn: "Active Bank Mitra Member", feePaid: 251, displayOrder: 50, district: state.meta.districts[0], bankName: state.meta.banks[0], bcCompany: state.meta.bcCompanies[0] };
  const sigs = state.settings.signatories || [];
  const letterIds = cur.letterSignatoryIds || (cur.signatoryId ? [cur.signatoryId] : state.settings.defaultSignatoryIds || []);
  const [photoUrl, setPhotoUrl] = useState(cur.photoUrl || "");
  async function submit(e) {
    e.preventDefault();
    const payload = Object.fromEntries(new FormData(e.target).entries());
    payload.isCoreMember = e.target.querySelector("[name=isCoreMember]").checked;
    payload.photoUrl = photoUrl;
    payload.displayOrder = Number(payload.displayOrder || 50);
    payload.feePaid = Number(payload.feePaid || 0);
    payload.letterSignatoryIds = [...e.target.querySelectorAll("[name=letterSig]:checked")].map((el) => el.value);
    if (!payload.letterSignatoryIds.length) payload.letterSignatoryIds = [payload.signatoryId];
    payload.fromAdmin = true;
    const ok = member
      ? await run(`/api/members/${member.id}`, { method: "PUT", body: payload }, "सदस्य अपडेट")
      : await run("/api/members", { method: "POST", body: payload }, "सदस्य जोड़ा");
    if (ok) onClose();
  }
  return (
    <form className="card-panel" onSubmit={submit}>
      <h3 style={{ color: "var(--primary)" }}>{member ? `संशोधन ${member.memberCode}` : "नया सदस्य"}</h3>
      <div className="form-grid">
        <Inp name="nameHi" defaultValue={cur.nameHi} placeholder="नाम हिंदी" required />
        <Inp name="nameEn" defaultValue={cur.nameEn} placeholder="Name" required />
        <Inp name="fatherName" defaultValue={cur.fatherName} placeholder="पिता का नाम" />
        <Inp name="fatherNameEn" defaultValue={cur.fatherNameEn} placeholder="Father" />
        <Inp name="designationHi" defaultValue={cur.designationHi} required />
        <Inp name="designationEn" defaultValue={cur.designationEn} required />
        <select className="form-control" name="district" defaultValue={cur.district}>{state.meta.districts.map((d) => <option key={d}>{d}</option>)}</select>
        <Inp name="block" defaultValue={cur.block} placeholder="ब्लॉक" />
        <select className="form-control" name="bankName" defaultValue={cur.bankName}>{state.meta.banks.map((b) => <option key={b}>{b}</option>)}</select>
        <select className="form-control" name="bcCompany" defaultValue={cur.bcCompany}>{state.meta.bcCompanies.map((c) => <option key={c}>{c}</option>)}</select>
        <Inp name="koCode" defaultValue={cur.koCode} placeholder="KO / CSP" />
        <Inp name="mobile" defaultValue={cur.mobile} placeholder="मोबाइल" required />
        <Inp name="websiteUrl" defaultValue={cur.websiteUrl || cur.website || ""} placeholder="वेबसाइट लिंक (Website Link e.g. https://...)" type="url" />
        <Inp name="email" defaultValue={cur.email} placeholder="ईमेल आईडी (Email)" type="email" />
        <Inp name="displayOrder" type="number" defaultValue={cur.displayOrder || 50} />
        <Inp name="joinedDate" type="date" defaultValue={cur.joinedDate || today()} />
        <Inp name="validUntil" type="date" defaultValue={cur.validUntil || "2027-12-31"} />
        <select className="form-control" name="status" defaultValue={cur.status || "active"}>
          <option value="active">सक्रिय</option>
          <option value="pending">लंबित</option>
          <option value="suspended">निलंबित</option>
        </select>
        <select className="form-control" name="signatoryId" defaultValue={cur.signatoryId || state.settings.defaultSignatoryId}>
          {sigs.map((sg) => <option key={sg.id} value={sg.id}>{sg.nameHi} — ID कार्ड</option>)}
        </select>
        {!member && <Inp name="password" defaultValue="123456" placeholder="पासवर्ड" required />}
        {!member && <Inp name="feePaid" type="number" defaultValue="251" />}
        <label className="form-group full"><input type="checkbox" name="isCoreMember" defaultChecked={cur.isCoreMember} /> मुख्य कार्यकारिणी</label>
        <div className="form-group full">
          {sigs.map((sg) => (
            <label key={sg.id} style={{ marginRight: 10 }}>
              <input type="checkbox" name="letterSig" value={sg.id} defaultChecked={letterIds.includes(sg.id)} /> {sg.nameHi}
            </label>
          ))}
        </div>
        <Area name="messageHi" defaultValue={cur.messageHi} placeholder="संदेश हिंदी" />
        <Area name="messageEn" defaultValue={cur.messageEn} placeholder="Message" />
        <label>फोटो {photoUrl && <img src={photoUrl} alt="" style={{ width: 48, height: 48, objectFit: "cover" }} />}<input type="file" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { setPhotoUrl(await uploadFile(f, session)); showToast("फोटो तैयार"); } }} /></label>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button className="btn btn-accent">सेव</button>
        <button type="button" className="btn btn-outline" onClick={onClose}>रद्द</button>
      </div>
    </form>
  );
}

function Circulars({ state, run, session, showToast, saveSettings }) {
  const { lang, setModal } = usePortal();
  const [activeTab, setActiveTab] = useState("list"); // 'list' | 'upload' | 'settings' | 'all'
  const [file, setFile] = useState({ url: "", type: "image", name: "" });
  const [uploading, setUploading] = useState(false);
  const [editingCirc, setEditingCirc] = useState(null);
  const [editFile, setEditFile] = useState({ url: "", type: "image", name: "" });
  const [editUploading, setEditUploading] = useState(false);

  const circulars = state.circulars || [];
  const s = state.settings || {};
  const stx = s.sectionTexts || {};
  const circNavItem = (s.navItems || []).find((it) => it.id === "circulars");
  const isNavVisible = circNavItem ? circNavItem.visible !== false : true;

  async function add(e) {
    e.preventDefault();
    if (!file.url) return showToast(t(lang, "पहले सर्कुलर फाइल चुनें व अपलोड करें", "Please select and upload a circular file first"));
    const raw = Object.fromEntries(new FormData(e.target).entries());
    raw.fileUrl = file.url;
    raw.fileType = file.type;
    raw.requiresMemberLogin = e.target.querySelector("[name=requiresMemberLogin]").checked;

    if (await run("/api/circulars", { method: "POST", body: raw }, t(lang, "सर्कुलर / PDF सफलतापूर्वक प्रकाशित हुआ", "Circular / PDF published successfully"))) {
      e.target.reset();
      setFile({ url: "", type: "image", name: "" });
      setActiveTab("list");
    }
  }

  async function saveEditCirc(e) {
    e.preventDefault();
    if (!editingCirc) return;
    const raw = Object.fromEntries(new FormData(e.target).entries());
    raw.fileUrl = editFile.url || editingCirc.fileUrl;
    raw.fileType = editFile.type || editingCirc.fileType || "image";
    raw.requiresMemberLogin = e.target.querySelector("[name=requiresMemberLogin]").checked;

    const ok = await run(`/api/circulars/${editingCirc.id}`, {
      method: "PUT",
      body: raw
    }, t(lang, "सर्कुलर सफलतापूर्वक अपडेट हो गया", "Circular updated successfully"));

    if (ok) {
      setEditingCirc(null);
      setEditFile({ url: "", type: "image", name: "" });
    }
  }

  async function saveCircularSectionSettings(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const updatedTexts = {
      ...stx,
      homeCircularsEyebrowHi: fd.get("homeCircularsEyebrowHi"),
      homeCircularsEyebrowEn: fd.get("homeCircularsEyebrowEn"),
      homeCircularsTitleHi: fd.get("homeCircularsTitleHi"),
      homeCircularsTitleEn: fd.get("homeCircularsTitleEn"),
      homeCircularsSubHi: fd.get("homeCircularsSubHi"),
      homeCircularsSubEn: fd.get("homeCircularsSubEn")
    };

    const navVis = e.target.querySelector("[name=circularsNavVisible]")?.checked;
    let navItems = s.navItems ? [...s.navItems] : null;
    if (navVis !== undefined && navItems) {
      navItems = navItems.map((n) => (n.id === "circulars" ? { ...n, visible: navVis } : n));
    }

    const payload = { sectionTexts: updatedTexts };
    if (navItems) payload.navItems = navItems;

    if (saveSettings) {
      await saveSettings(payload, t(lang, "सर्कुलर सेक्शन शीर्षक एवं सेटिंग्स सफलतापूर्वक सेव हो गई", "Circular section titles & settings saved successfully"));
    } else {
      await run("/api/settings", { method: "PUT", body: payload }, t(lang, "सेटिंग्स सेव हो गई", "Settings saved"));
    }
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      {/* Subtab Navigation Strip like Menus */}
      <div className="card-panel" style={{ padding: "12px 18px", borderRadius: 14 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <button
            type="button"
            className={`menus-subtab-btn ${activeTab === "list" ? "active" : ""}`}
            onClick={() => setActiveTab("list")}
          >
            📑 {t(lang, "सर्कुलर सूची एवं कार्ड्स", "Circulars List & Cards")} ({circulars.length})
          </button>
          <button
            type="button"
            className={`menus-subtab-btn ${activeTab === "upload" ? "active" : ""}`}
            onClick={() => setActiveTab("upload")}
          >
            📤 {t(lang, "नया सर्कुलर अपलोड करें", "Upload New Circular")}
          </button>
          <button
            type="button"
            className={`menus-subtab-btn ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            ⚙️ {t(lang, "सर्कुलर सेक्शन व मेनू सेटिंग्स", "Circular Section & Menus Settings")}
          </button>
          <button
            type="button"
            className={`menus-subtab-btn ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            👁️ {t(lang, "संपूर्ण दृश्य (All in One)", "View All Sections")}
          </button>
        </div>
      </div>

      {/* SECTION 1: CIRCULAR CARDS GRID (When activeTab === 'list' or 'all') */}
      {(activeTab === "list" || activeTab === "all") && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
            <div>
              <h4 style={{ color: "var(--primary)", fontWeight: 900, fontSize: "1.15rem", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                📑 {t(lang, "प्रकाशित बैंक मित्र सर्कुलर सूची", "Published Bank Mitra Circulars List")}
              </h4>
              <p style={{ color: "#64748b", fontSize: "0.85rem", margin: "4px 0 0" }}>
                {t(lang, "वेबसाइट पर प्रदर्शित सर्कुलर कार्ड्स (मूल फ़ाइल प्रीव्यू थंबनेल एवं त्वरित नियंत्रण)", "Circular cards displayed on the website (original file preview thumbnails and quick controls)")}
              </p>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span className="badge badge-active" style={{ fontSize: "0.85rem", padding: "6px 14px", fontWeight: 700 }}>
                {circulars.length} {t(lang, "कुल परिपत्र", "Total Circulars")}
              </span>
              {activeTab !== "all" && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{ fontWeight: 800 }}
                  onClick={() => setActiveTab("upload")}
                >
                  + {t(lang, "नया सर्कुलर जोड़ें", "Add New Circular")}
                </button>
              )}
            </div>
          </div>

          {circulars.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", background: "#f8fafc", borderRadius: 14, border: "1.5px dashed #cbd5e1", color: "#64748b" }}>
              <div style={{ fontSize: "2.4rem", marginBottom: 8 }}>📄</div>
              <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "#334155" }}>
                {t(lang, "अभी कोई सर्कुलर प्रकाशित नहीं किया गया है।", "No circulars published yet.")}
              </div>
              <p style={{ margin: "6px 0 16px", fontSize: "0.86rem" }}>
                {t(lang, "नया बैंक आदेश, परिपत्र या पीडीएफ जोड़ने के लिए नीचे दिए गए बटन पर क्लिक करें।", "Click the button below to upload a bank circular or PDF.")}
              </p>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setActiveTab("upload")}
              >
                + {t(lang, "नया सर्कुलर जोड़ें", "Upload New Circular")}
              </button>
            </div>
          ) : (
            <div className="cert-card-grid-match" style={{ marginBottom: 28 }}>
              {circulars.map((c) => {
                const isPdf = c.fileType === "pdf" || String(c.fileUrl || "").toLowerCase().endsWith(".pdf");
                return (
                  <div key={c.id} className="cert-card-match">
                    {/* Framed File Thumbnail Preview matching Reference Image 2 */}
                    <div
                      className="cert-preview-frame"
                      onClick={() => setModal({ kind: "file", item: c, locked: false })}
                      title={t(lang, "सर्कुलर फ़ाइल देखने के लिए क्लिक करें", "Click to view circular file")}
                    >
                      {isPdf && !String(c.fileUrl || "").toLowerCase().endsWith(".svg") && !String(c.fileUrl || "").match(/\.(jpg|jpeg|png|webp|svg)$/i) ? (
                        <div style={{ textAlign: "center", padding: 12 }}>
                          <div style={{ fontSize: "3rem", color: "#dc2626", marginBottom: 6 }}>📄</div>
                          <div style={{ fontSize: "0.86rem", fontWeight: 800, color: "#1e3a8a", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {c.titleHi || c.titleEn}
                          </div>
                          <span className="badge-file-type" style={{ marginTop: 8, display: "inline-block" }}>PDF DOCUMENT</span>
                        </div>
                      ) : (
                        <img
                          src={c.fileUrl || "/images/circular-sample.svg"}
                          alt={c.titleHi}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "/images/circular-sample.svg";
                          }}
                        />
                      )}
                    </div>

                    {/* Title & Subtitle matching Reference Image 2 */}
                    <div>
                      <h4 className="cert-card-title-hi">{c.titleHi}</h4>
                      <div className="cert-card-sub-en">
                        {c.titleEn || c.titleHi}
                        {(c.date || c.issuerHi) && (
                          <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 4 }}>
                            {c.date || ""}{c.date && c.issuerHi ? " • " : ""}{c.issuerHi || ""}
                          </div>
                        )}
                      </div>

                      {/* Status Indicator (Public View or Member Login Protected) matching Image 2 */}
                      {c.requiresMemberLogin ? (
                        <div className="cert-status-line locked">
                          <span>🔒</span>
                          <span className="label-text">{t(lang, "सदस्य लॉगिन सुरक्षित", "Member Login Protected")}</span>
                        </div>
                      ) : (
                        <div className="cert-status-line public">
                          <span>🌐</span>
                          <span className="label-text">{t(lang, "सार्वजनिक दृश्य", "Public View")}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons matching Reference Image 2 */}
                    <div>
                      <div className="cert-btn-group-row">
                        {/* View Button -> Opens Document Modal */}
                        <button
                          type="button"
                          className="cert-btn-action"
                          onClick={() => setModal({ kind: "file", item: c, locked: false })}
                        >
                          👁️ {t(lang, "देखें", "View")}
                        </button>

                        {/* Lock / Unlock Toggle */}
                        <button
                          type="button"
                          className="cert-btn-action"
                          onClick={() => run(`/api/circulars/${c.id}`, { method: "PUT", body: { requiresMemberLogin: !c.requiresMemberLogin } }, t(lang, "सुरक्षा स्थिति बदली गई", "Security status changed"))}
                        >
                          {c.requiresMemberLogin ? (
                            <>🔓 {t(lang, "अनलॉक करें", "Unlock")}</>
                          ) : (
                            <>🔒 {t(lang, "लॉगिन लॉक लगाएँ", "Set Login Lock")}</>
                          )}
                        </button>

                        {/* Edit Option */}
                        <button
                          type="button"
                          className="cert-btn-action"
                          onClick={() => {
                            setEditingCirc(c);
                            setEditFile({ url: c.fileUrl || "", type: c.fileType || (isPdf ? "pdf" : "image"), name: "" });
                          }}
                        >
                          ✏️ {t(lang, "संपादित करें", "Edit")}
                        </button>
                      </div>

                      {/* Delete Button matching Image 2 */}
                      <button
                        type="button"
                        className="cert-btn-delete"
                        onClick={() => {
                          if (confirm(t(lang, "क्या आप यह सर्कुलर हटाना चाहते हैं?", "Are you sure you want to delete this circular?"))) {
                            run(`/api/circulars/${c.id}`, { method: "DELETE" }, t(lang, "सर्कुलर हटाया गया", "Circular deleted"));
                          }
                        }}
                      >
                        🗑️ {t(lang, "हटाएँ", "Delete")}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: CIRCULAR UPLOAD FORM (When activeTab === 'upload' or 'all') */}
      {(activeTab === "upload" || activeTab === "all") && (
        <form className="card-panel" onSubmit={add} style={{ borderRadius: 16, padding: "26px 28px" }}>
          <h3 style={{ color: "#1e3a8a", fontWeight: 900, fontSize: "1.2rem", margin: "0 0 6px", display: "flex", alignItems: "center", gap: 8 }}>
            📤 {t(lang, "बैंक मित्र सर्कुलर एवं PDF अपलोड (हूबहू मूल दस्तावेज़ प्रदर्शन)", "Bank Mitra Circulars & PDF Upload (Exact Original Document View)")}
          </h3>
          <p style={{ color: "#64748b", fontSize: "0.86rem", margin: "0 0 20px", lineHeight: 1.6 }}>
            {t(lang, "यहाँ किसी भी प्रकार के हस्ताक्षर जोड़ने की आवश्यकता नहीं है — आप जो भी PDF या इमेज अपलोड करेंगे, वह आपके दिए गए शीर्षक (Title) के साथ हूबहू वैसा ही दिखाई देगा।", "No signatures are added here — whichever PDF or image you upload will be displayed exactly as-is alongside your specified title.")}
          </p>

          <div className="form-grid" style={{ rowGap: 18, columnGap: 24 }}>
            {/* Row 1: Titles */}
            <div>
              <label className="about-form-label">{t(lang, "सर्कुलर शीर्षक (हिंदी) *", "Circular Title (Hindi) *")}</label>
              <Inp name="titleHi" placeholder={t(lang, "उदा: एसबीआई कमीशन संशोधन परिपत्र", "e.g. SBI Commission Revision Circular")} required />
            </div>
            <div>
              <label className="about-form-label">{t(lang, "Circular Title (English) *", "Circular Title (English) *")}</label>
              <Inp name="titleEn" placeholder={t(lang, "e.g. SBI Commission Revision Circular", "e.g. SBI Commission Revision Circular")} required />
            </div>

            {/* Row 2: Issuers */}
            <div>
              <label className="about-form-label">{t(lang, "जारीकर्ता विभाग/बैंक (हिंदी)", "Issuer Department/Bank (Hindi)")}</label>
              <Inp name="issuerHi" placeholder={t(lang, "उदा: भारतीय स्टेट बैंक / SLBC", "e.g. State Bank of India / SLBC")} />
            </div>
            <div>
              <label className="about-form-label">{t(lang, "Issuer (English)", "Issuer (English)")}</label>
              <Inp name="issuerEn" placeholder={t(lang, "e.g. State Bank of India / SLBC", "e.g. State Bank of India / SLBC")} />
            </div>

            {/* Row 3: Date & Custom Dashed Upload Box */}
            <div>
              <label className="about-form-label">{t(lang, "दिनांक", "Date")}</label>
              <Inp name="date" type="date" defaultValue={today()} />
            </div>

            <div>
              <label className="about-form-label">{t(lang, "सर्कुलर फाइल अपलोड करें (PDF या Image) *", "Upload Circular File (PDF or Image) *")}</label>
              {/* Custom Dashed Upload Box */}
              <div className="dashed-upload-box">
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  style={{ fontSize: "0.88rem", cursor: "pointer" }}
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    setUploading(true);
                    try {
                      const url = await uploadFile(f, session);
                      setFile({ url, type: f.type === "application/pdf" ? "pdf" : "image", name: f.name });
                      showToast(t(lang, "फाइल तैयार है", "File is ready"));
                    } catch (err) {
                      showToast(err.message);
                    } finally {
                      setUploading(false);
                    }
                  }}
                />
                <div className="upload-cloud-icon">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="#2563eb">
                    <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
                  </svg>
                </div>
              </div>
              <div className="upload-hint-text">
                {uploading ? (
                  <span style={{ color: "#ea580c", fontWeight: 700 }}>⏳ {t(lang, "अपलोड हो रहा है...", "Uploading...")}</span>
                ) : file.url ? (
                  <span style={{ color: "#16a34a", fontWeight: 800 }}>✓ {file.name || "फाइल संलग्न"} ({file.type.toUpperCase()})</span>
                ) : (
                  "Only PDF, JPG, PNG allowed • Max Size: 5MB"
                )}
              </div>
            </div>
          </div>

          {/* Security Checkbox */}
          <div style={{ marginTop: 18, background: "#fffbeb", border: "1px solid #fef3c7", padding: "12px 16px", borderRadius: 10 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontWeight: 700, color: "#b45309", fontSize: "0.9rem" }}>
              <input type="checkbox" name="requiresMemberLogin" />
              <span>🔒 {t(lang, "इस सर्कुलर/PDF पर पदाधिकारी का हस्ताक्षर/मुहर है — इसे केवल सदस्य लॉगिन के बाद दिखाएँ (Require Member Login)", "This circular/PDF contains officer seal/signature — show only after member login (Require Member Login)")}</span>
            </label>
          </div>

          {/* Orange Submit Button */}
          <div style={{ marginTop: 22, display: "flex", gap: 12, alignItems: "center" }}>
            <button type="submit" className="btn-save-orange">
              + {t(lang, "सर्कुलर / PDF प्रकाशित करें", "Publish Circular / PDF")}
            </button>
            {activeTab !== "all" && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setActiveTab("list")}
              >
                {t(lang, "रद्द करें व सूची देखें", "Cancel & View List")}
              </button>
            )}
          </div>
        </form>
      )}

      {/* SECTION 3: CIRCULAR SECTION & MENUS SETTINGS (Like Menus Section Texts!) */}
      {(activeTab === "settings" || activeTab === "all") && (
        <form className="card-panel" onSubmit={saveCircularSectionSettings} style={{ borderRadius: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 18 }}>
            <div>
              <h3 style={{ color: "var(--primary)", fontSize: "1.15rem", fontWeight: 900, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                ⚙️ {t(lang, "सर्कुलर सेक्शन शीर्षक, उपशीर्षक एवं मेनू प्रबंधन", "Circular Section Title, Subtitle & Menu Management")}
              </h3>
              <p style={{ color: "#64748b", fontSize: "0.85rem", margin: "4px 0 0" }}>
                {t(lang, "वेबसाइट के होमपेज एवं परिपत्र पेज पर प्रदर्शित शीर्षकों व नेविगेशन मेनू दृश्यता को यहाँ से बदलें।", "Manage circular headings, subtitles and navigation menu visibility across the website.")}
              </p>
            </div>
            <button type="submit" className="btn btn-primary btn-sm" style={{ fontWeight: 800 }}>
              💾 {t(lang, "सेटिंग्स सेव करें", "Save Settings")}
            </button>
          </div>

          <div style={{ display: "grid", gap: 16 }}>
            {/* Card 1: Section Headings */}
            <div className="header-btn-config-card">
              <div style={{ fontWeight: 900, color: "var(--primary)", marginBottom: 12, fontSize: "0.95rem" }}>
                📌 {t(lang, "1. होमपेज एवं परिपत्र पेज के शीर्षक व उपशीर्षक", "1. Homepage & Circulars Page Headings")}
              </div>
              <div className="form-grid" style={{ rowGap: 16 }}>
                <div>
                  <label className="about-form-label">{t(lang, "सेक्शन आईब्रो / श्रेणी (हिंदी)", "Section Eyebrow (Hindi)")}</label>
                  <Inp name="homeCircularsEyebrowHi" defaultValue={stx.homeCircularsEyebrowHi || "बैंक आदेश एवं आधिकारिक परिपत्र"} />
                </div>
                <div>
                  <label className="about-form-label">{t(lang, "Section Eyebrow (English)", "Section Eyebrow (English)")}</label>
                  <Inp name="homeCircularsEyebrowEn" defaultValue={stx.homeCircularsEyebrowEn || "BANK ORDERS & OFFICIAL CIRCULARS"} />
                </div>

                <div>
                  <label className="about-form-label">{t(lang, "मुख्य सेक्शन शीर्षक (हिंदी)", "Main Section Title (Hindi)")}</label>
                  <Inp name="homeCircularsTitleHi" defaultValue={stx.homeCircularsTitleHi || "बैंक मित्रों से संबंधित नवीनतम सर्कुलर एवं दिशानिर्देश"} />
                </div>
                <div>
                  <label className="about-form-label">{t(lang, "Main Section Title (English)", "Main Section Title (English)")}</label>
                  <Inp name="homeCircularsTitleEn" defaultValue={stx.homeCircularsTitleEn || "Latest Circulars & Guidelines for Bank Mitras"} />
                </div>

                <div>
                  <label className="about-form-label">{t(lang, "सेक्शन विवरण / सबटाइटल (हिंदी)", "Section Subtitle (Hindi)")}</label>
                  <Inp name="homeCircularsSubHi" defaultValue={stx.homeCircularsSubHi || "भारतीय रिज़र्व बैंक, एसएलबीसी एवं प्रायोजक बैंकों द्वारा जारी महत्वपूर्ण परिपत्र व आदेश।"} />
                </div>
                <div>
                  <label className="about-form-label">{t(lang, "Section Subtitle (English)", "Section Subtitle (English)")}</label>
                  <Inp name="homeCircularsSubEn" defaultValue={stx.homeCircularsSubEn || "Important circulars and notifications issued by RBI, SLBC, and sponsor banks."} />
                </div>
              </div>
            </div>

            {/* Card 2: Navigation Menu Visibility */}
            <div className="header-btn-config-card">
              <div style={{ fontWeight: 900, color: "var(--primary)", marginBottom: 10, fontSize: "0.95rem" }}>
                🧭 {t(lang, "2. मुख्य नेविगेशन मेनू दृश्यता (Navbar Menu Control)", "2. Main Navigation Menu Visibility")}
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontWeight: 700, color: "#1e293b", fontSize: "0.92rem" }}>
                <input
                  type="checkbox"
                  name="circularsNavVisible"
                  defaultChecked={isNavVisible}
                />
                <span>
                  {t(
                    lang,
                    "वेबसाइट के मुख्य मेनू बार में '📑 परिपत्र' (Circulars) मेनू प्रदर्शित रखें",
                    "Keep '📑 Circulars' displayed in the website's main navigation menu"
                  )}
                </span>
              </label>
              <div style={{ fontSize: "0.82rem", color: "#64748b", marginTop: 6 }}>
                {t(
                  lang,
                  "यदि इसे अनचेक करेंगे तो सामान्य विज़िटर्स को नेविगेशन बार में परिपत्र का मेनू नहीं दिखेगा।",
                  "If unchecked, the circulars menu link will be hidden from normal website visitors."
                )}
              </div>
            </div>

            <div style={{ marginTop: 6, display: "flex", justifyContent: "flex-end" }}>
              <button type="submit" className="btn-save-orange">
                💾 {t(lang, "सर्कुलर सेक्शन सेटिंग्स सेव करें", "Save Circular Section Settings")}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Edit Circular Modal */}
      {editingCirc && (
        <div className="modal-backdrop" onClick={() => setEditingCirc(null)}>
          <div className="modal-box" style={{ maxWidth: 650, borderRadius: 14, overflow: "hidden" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, fontSize: "1.08rem" }}>
                <span>✏️ {t(lang, "सर्कुलर / परिपत्र संपादित करें", "Edit Circular / Document")}</span>
              </div>
              <button
                type="button"
                className="btn btn-sm modal-btn-close"
                onClick={() => setEditingCirc(null)}
              >
                ✕ {t(lang, "Close", "Close")}
              </button>
            </div>

            <form onSubmit={saveEditCirc} style={{ padding: "24px 26px" }}>
              <div className="form-grid" style={{ rowGap: 16, columnGap: 20 }}>
                <div>
                  <label className="about-form-label">{t(lang, "सर्कुलर शीर्षक (हिंदी) *", "Circular Title (Hindi) *")}</label>
                  <Inp name="titleHi" defaultValue={editingCirc.titleHi} required />
                </div>
                <div>
                  <label className="about-form-label">{t(lang, "Circular Title (English) *", "Circular Title (English) *")}</label>
                  <Inp name="titleEn" defaultValue={editingCirc.titleEn} required />
                </div>

                <div>
                  <label className="about-form-label">{t(lang, "जारीकर्ता विभाग/बैंक (हिंदी)", "Issuer Department/Bank (Hindi)")}</label>
                  <Inp name="issuerHi" defaultValue={editingCirc.issuerHi || ""} />
                </div>
                <div>
                  <label className="about-form-label">{t(lang, "Issuer (English)", "Issuer (English)")}</label>
                  <Inp name="issuerEn" defaultValue={editingCirc.issuerEn || ""} />
                </div>

                <div>
                  <label className="about-form-label">{t(lang, "दिनांक", "Date")}</label>
                  <Inp name="date" type="date" defaultValue={editingCirc.date || today()} />
                </div>

                <div>
                  <label className="about-form-label">{t(lang, "फाइल बदलें (PDF या Image)", "Replace File (PDF or Image)")}</label>
                  <div className="dashed-upload-box">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      style={{ fontSize: "0.85rem", cursor: "pointer" }}
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        setEditUploading(true);
                        try {
                          const url = await uploadFile(f, session);
                          setEditFile({ url, type: f.type === "application/pdf" ? "pdf" : "image", name: f.name });
                          showToast(t(lang, "नई फाइल तैयार है", "New file is ready"));
                        } catch (err) {
                          showToast(err.message);
                        } finally {
                          setEditUploading(false);
                        }
                      }}
                    />
                    <div className="upload-cloud-icon">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="#2563eb">
                        <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
                      </svg>
                    </div>
                  </div>
                  {editFile.url && (
                    <div style={{ fontSize: "0.8rem", color: "#16a34a", fontWeight: 800, marginTop: 4 }}>
                      ✓ {t(lang, "नई फाइल संलग्न", "New file attached")} ({editFile.type.toUpperCase()})
                    </div>
                  )}
                  {editingCirc.fileUrl && !editFile.url && (
                    <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 4 }}>
                      {t(lang, "वर्तमान फाइल:", "Current file:")} <a href={editingCirc.fileUrl} target="_blank" rel="noreferrer">{editingCirc.fileUrl}</a>
                    </div>
                  )}
                </div>

                <div style={{ gridColumn: "1 / -1", background: "#f8fafc", border: "1px solid #e2e8f0", padding: "12px 16px", borderRadius: 10 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontWeight: 800, color: "var(--primary)", fontSize: "0.9rem" }}>
                    <input type="checkbox" name="requiresMemberLogin" defaultChecked={editingCirc.requiresMemberLogin} />
                    <span>🔒 {t(lang, "केवल सदस्य लॉगिन के बाद दिखाएँ (Login Protected)", "Show only after member login (Login Protected)")}</span>
                  </label>
                </div>
              </div>

              <div style={{ marginTop: 22, display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setEditingCirc(null)}
                >
                  ✕ {t(lang, "रद्द करें", "Cancel")}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ fontWeight: 800, padding: "9px 24px" }}
                >
                  💾 {t(lang, "परिवर्तन सेव करें", "Save Changes")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Documents({ state, run, saveSettings }) {
  const { lang, setModal } = usePortal();
  const [activeTab, setActiveTab] = useState("docs"); // 'docs' | 'addDoc' | 'demands' | 'addDemand' | 'settings'
  const [editingDoc, setEditingDoc] = useState(null);
  const [editingDemand, setEditingDemand] = useState(null);

  const officers = state.settings?.signatories || [];
  const stx = state.settings?.sectionTexts || {};
  const docNavItem = (state.settings?.navItems || []).find((it) => it.id === "documents");
  const isNavVisible = docNavItem ? docNavItem.visible !== false : true;

  async function addDoc(e) {
    e.preventDefault();
    const payload = Object.fromEntries(new FormData(e.target).entries());
    payload.signatoryIds = [...e.target.querySelectorAll("[name=docSig]:checked")].map((el) => el.value);
    if (!payload.signatoryIds.length) payload.signatoryIds = [officers[0]?.id || "sig-gs"];
    delete payload.docSig;
    if (await run("/api/documents", { method: "POST", body: payload }, t(lang, "दस्तावेज़ सफलतापूर्वक जोड़ा गया", "Document added successfully"))) {
      e.target.reset();
      setActiveTab("docs");
    }
  }

  async function addDemand(e) {
    e.preventDefault();
    const payload = Object.fromEntries(new FormData(e.target).entries());
    payload.number = (state.demands.length || 0) + 1;
    if (await run("/api/demands", { method: "POST", body: payload }, t(lang, "मांग सफलतापूर्वक जोड़ी गई", "Demand added successfully"))) {
      e.target.reset();
      setActiveTab("demands");
    }
  }

  async function saveDocSettings(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const updatedTexts = {
      ...stx,
      homeDemandsEyebrowHi: fd.get("homeDemandsEyebrowHi"),
      homeDemandsEyebrowEn: fd.get("homeDemandsEyebrowEn"),
      homeDemandsTitleHi: fd.get("homeDemandsTitleHi"),
      homeDemandsTitleEn: fd.get("homeDemandsTitleEn"),
      homeDemandsSubHi: fd.get("homeDemandsSubHi"),
      homeDemandsSubEn: fd.get("homeDemandsSubEn")
    };
    const navVis = e.target.querySelector("[name=docsNavVisible]")?.checked;
    let navItems = state.settings?.navItems ? [...state.settings.navItems] : null;
    if (navVis !== undefined && navItems) {
      navItems = navItems.map((n) => (n.id === "documents" ? { ...n, visible: navVis } : n));
    }
    const payload = { sectionTexts: updatedTexts };
    if (navItems) payload.navItems = navItems;
    if (saveSettings) {
      await saveSettings(payload, t(lang, "दस्तावेज़ सेक्शन सेटिंग्स सेव हो गई", "Document section settings saved"));
    } else {
      await run("/api/settings", { method: "PUT", body: payload }, t(lang, "सेटिंग्स सेव हो गई", "Settings saved"));
    }
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>

      {/* ── SUBTAB NAV (like Menus / Circulars) ── */}
      <div className="card-panel" style={{ padding: "12px 18px", borderRadius: 14 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <button type="button" className={`menus-subtab-btn ${activeTab === "docs" ? "active" : ""}`} onClick={() => setActiveTab("docs")}>
            📄 {t(lang, `दस्तावेज़ सूची (${state.documents.length})`, `Documents List (${state.documents.length})`)}
          </button>
          <button type="button" className={`menus-subtab-btn ${activeTab === "addDoc" ? "active" : ""}`} onClick={() => setActiveTab("addDoc")}>
            ➕ {t(lang, "नया दस्तावेज़ जोड़ें", "Add New Document")}
          </button>
          <button type="button" className={`menus-subtab-btn ${activeTab === "demands" ? "active" : ""}`} onClick={() => setActiveTab("demands")}>
            🤝 {t(lang, `मांग-पत्र (${state.demands.length})`, `Demands (${state.demands.length})`)}
          </button>
          <button type="button" className={`menus-subtab-btn ${activeTab === "addDemand" ? "active" : ""}`} onClick={() => setActiveTab("addDemand")}>
            ➕ {t(lang, "नई मांग जोड़ें", "Add New Demand")}
          </button>
          <button type="button" className={`menus-subtab-btn ${activeTab === "settings" ? "active" : ""}`} onClick={() => setActiveTab("settings")}>
            ⚙️ {t(lang, "सेक्शन सेटिंग्स", "Section Settings")}
          </button>
        </div>
      </div>

      {/* ── SUBTAB 1: DOCUMENTS LIST ── */}
      {activeTab === "docs" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
            <div>
              <h4 style={{ color: "var(--primary)", fontWeight: 900, fontSize: "1.15rem", margin: 0 }}>
                📄 {t(lang, "प्रकाशित संघ दस्तावेज़ एवं ज्ञापन", "Published Association Documents & Memorandums")}
              </h4>
              <p style={{ color: "#64748b", fontSize: "0.85rem", margin: "4px 0 0" }}>
                {t(lang, "हस्ताक्षर एवं मुहर सहित दस्तावेज़ — सदस्य लॉगिन के बाद पूर्ण प्रमाणित प्रतिलिपि उपलब्ध होती है।", "Documents with officer signature & seal — full authenticated copy available after member login.")}
              </p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <span className="badge badge-active" style={{ fontSize: "0.85rem", padding: "6px 14px" }}>
                {state.documents.length} {t(lang, "दस्तावेज़", "Documents")}
              </span>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setActiveTab("addDoc")}>
                ➕ {t(lang, "नया दस्तावेज़", "Add Document")}
              </button>
            </div>
          </div>

          {state.documents.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", background: "#f8fafc", borderRadius: 14, border: "1.5px dashed #cbd5e1", color: "#64748b" }}>
              <div style={{ fontSize: "2.4rem", marginBottom: 8 }}>📄</div>
              <div style={{ fontWeight: 800, fontSize: "1rem", color: "#334155" }}>{t(lang, "कोई दस्तावेज़ प्रकाशित नहीं है।", "No documents published yet.")}</div>
              <button type="button" className="btn btn-primary btn-sm" style={{ marginTop: 14 }} onClick={() => setActiveTab("addDoc")}>
                ➕ {t(lang, "नया दस्तावेज़ जोड़ें", "Add New Document")}
              </button>
            </div>
          ) : (
            <div className="cert-card-grid-match">
              {state.documents.map((d) => (
                <div key={d.id} className="cert-card-match">
                  {/* Category badge + preview icon */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 48, height: 48, background: "#eff6ff", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", flexShrink: 0 }}>
                      📋
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{ background: "#e0f2fe", color: "#0369a1", fontSize: "0.76rem", fontWeight: 800, padding: "3px 10px", borderRadius: 6, display: "inline-block" }}>
                        {t(lang, d.categoryHi || "दस्तावेज़", d.categoryEn || "Document")}
                      </span>
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <h4 className="cert-card-title-hi" style={{ fontSize: "0.98rem" }}>{d.titleHi}</h4>
                    <div className="cert-card-sub-en">{d.titleEn}</div>
                    {d.refNo && <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: 2 }}>{"📎"} {d.refNo} {d.date ? (" • " + d.date) : ""}</div>}
                  </div>

                  {/* Summary */}
                  {d.summaryHi && (
                    <p style={{ fontSize: "0.84rem", color: "#475569", margin: "10px 0 0", lineHeight: 1.5 }}>
                      {d.summaryHi.length > 110 ? d.summaryHi.slice(0, 110) + "…" : d.summaryHi}
                    </p>
                  )}

                  {/* Signatories */}
                  <div style={{ marginTop: 10 }}>
                    {officers.filter((o) => (d.signatoryIds || []).includes(o.id)).map((o) => (
                      <span key={o.id} style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: "0.78rem", fontWeight: 700, padding: "2px 10px", marginRight: 6, display: "inline-block", marginBottom: 4 }}>
                        ✍️ {o.nameHi}
                      </span>
                    ))}
                  </div>

                  {/* Action buttons */}
                  <div style={{ marginTop: 12 }}>
                    <div className="cert-btn-group-row">
                      <button type="button" className="cert-btn-action" onClick={() => setModal({ kind: "plainDoc", item: d })}>
                        👁️ {t(lang, "सादा देखें", "View Plain")}
                      </button>
                      <button type="button" className="cert-btn-action" onClick={() => setModal({ kind: "signedDoc", item: d })}>
                        🔏 {t(lang, "हस्ताक्षरित", "Signed Copy")}
                      </button>
                      <button type="button" className="cert-btn-action" onClick={() => setEditingDoc(d)}>
                        ✏️ {t(lang, "संपादित करें", "Edit")}
                      </button>
                    </div>
                    <button
                      type="button"
                      className="cert-btn-delete"
                      onClick={() => {
                        if (confirm(t(lang, "क्या आप यह दस्तावेज़ हटाना चाहते हैं?", "Delete this document?")))
                          run(`/api/documents/${d.id}`, { method: "DELETE" }, t(lang, "दस्तावेज़ हटाया गया", "Document deleted"));
                      }}
                    >
                      🗑️ {t(lang, "हटाएँ", "Delete")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── SUBTAB 2: ADD DOCUMENT ── */}
      {activeTab === "addDoc" && (
        <form className="card-panel" onSubmit={addDoc} style={{ borderRadius: 16, padding: "26px 28px" }}>
          <h3 style={{ color: "#1e3a8a", fontWeight: 900, fontSize: "1.15rem", margin: "0 0 6px", display: "flex", alignItems: "center", gap: 8 }}>
            📄 {t(lang, "नया संघ दस्तावेज़ / ज्ञापन जोड़ें", "Add New Association Document / Memorandum")}
          </h3>
          <p style={{ color: "#64748b", fontSize: "0.85rem", margin: "0 0 20px", lineHeight: 1.6 }}>
            {t(lang, "दस्तावेज़ के शीर्षक, श्रेणी, पत्रांक, सारांश, विस्तृत विषय-वस्तु एवं हस्ताक्षरकर्ता पदाधिकारी चुनें।", "Enter title, category, ref number, summary, full content and select signing officers.")}
          </p>
          <div className="form-grid" style={{ rowGap: 18, columnGap: 24 }}>
            <div>
              <label className="about-form-label">{t(lang, "शीर्षक (हिंदी) *", "Title (Hindi) *")}</label>
              <Inp name="titleHi" placeholder={t(lang, "उदा: 10-सूत्रीय मांग ज्ञापन", "e.g. 10-Point Memorandum")} required />
            </div>
            <div>
              <label className="about-form-label">{t(lang, "Title (English) *", "Title (English) *")}</label>
              <Inp name="titleEn" placeholder="e.g. 10-Point Demand Charter" required />
            </div>
            <div>
              <label className="about-form-label">{t(lang, "श्रेणी (हिंदी) *", "Category (Hindi) *")}</label>
              <Inp name="categoryHi" defaultValue={t(lang, "मांग ज्ञापन", "मांग ज्ञापन")} required />
            </div>
            <div>
              <label className="about-form-label">{t(lang, "Category (English) *", "Category (English) *")}</label>
              <Inp name="categoryEn" defaultValue="Official Memorandum" required />
            </div>
            <div>
              <label className="about-form-label">{t(lang, "पत्रांक / संदर्भ संख्या", "Reference No.")}</label>
              <Inp name="refNo" placeholder="e.g. UPBMS/MEMO/2026/108" />
            </div>
            <div>
              <label className="about-form-label">{t(lang, "दिनांक", "Date")}</label>
              <Inp name="date" type="date" defaultValue={today()} />
            </div>
            <div>
              <label className="about-form-label">{t(lang, "सारांश (हिंदी) *", "Summary (Hindi) *")}</label>
              <Inp name="summaryHi" placeholder={t(lang, "संक्षिप्त विवरण…", "Brief summary…")} required />
            </div>
            <div>
              <label className="about-form-label">{t(lang, "Summary (English) *", "Summary (English) *")}</label>
              <Inp name="summaryEn" placeholder="Brief summary…" required />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label className="about-form-label">{t(lang, "पत्र / ज्ञापन की पूर्ण विषय-वस्तु (हिंदी) *", "Full Letter / Memo Content (Hindi) *")}</label>
              <textarea name="contentHi" className="form-control" rows={5} placeholder={t(lang, "पत्र का पूरा मसौदा यहाँ लिखें…", "Write the full content here…")} required style={{ width: "100%", fontFamily: "inherit", fontSize: "0.9rem", lineHeight: 1.6, resize: "vertical" }} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label className="about-form-label">{t(lang, "Full Letter / Memo Content (English)", "Full Letter / Memo Content (English)")}</label>
              <textarea name="contentEn" className="form-control" rows={4} placeholder="Write the full content in English…" style={{ width: "100%", fontFamily: "inherit", fontSize: "0.9rem", lineHeight: 1.6, resize: "vertical" }} />
            </div>

            {/* Officer signatories */}
            {officers.length > 0 && (
              <div style={{ gridColumn: "1 / -1" }}>
                <label className="about-form-label">
                  ✍️ {t(lang, "हस्ताक्षरकर्ता पदाधिकारी चुनें (जिनके हस्ताक्षर दस्तावेज़ पर दिखेंगे)", "Select Signing Officers (whose signatures will appear on the document)")}
                </label>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
                  {officers.map((o, i) => (
                    <label key={o.id} style={{ display: "flex", alignItems: "center", gap: 7, background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontWeight: 700, fontSize: "0.88rem" }}>
                      <input type="checkbox" name="docSig" value={o.id} defaultChecked={i === 0} />
                      {o.nameHi}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ marginTop: 22, display: "flex", gap: 12 }}>
            <button type="submit" className="btn-save-orange">
              📄 {t(lang, "दस्तावेज़ प्रकाशित करें", "Publish Document")}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => setActiveTab("docs")}>
              {t(lang, "रद्द करें", "Cancel")}
            </button>
          </div>
        </form>
      )}

      {/* ── SUBTAB 3: DEMANDS LIST ── */}
      {activeTab === "demands" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
            <div>
              <h4 style={{ color: "var(--primary)", fontWeight: 900, fontSize: "1.15rem", margin: 0 }}>
                🤝 {t(lang, "मांग-पत्र / चार्टर ऑफ डिमांड्स", "Demands / Charter of Demands")}
              </h4>
              <p style={{ color: "#64748b", fontSize: "0.85rem", margin: "4px 0 0" }}>
                {t(lang, "वेबसाइट पर प्रदर्शित संघ की प्रमुख माँगें। क्रम संख्या स्वतः निर्धारित होती है।", "Key demands displayed on the website. Numbers are assigned automatically.")}
              </p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <span className="badge badge-active" style={{ fontSize: "0.85rem", padding: "6px 14px" }}>
                {state.demands.length} {t(lang, "मांगें", "Demands")}
              </span>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setActiveTab("addDemand")}>
                ➕ {t(lang, "नई मांग", "Add Demand")}
              </button>
            </div>
          </div>

          {state.demands.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", background: "#f8fafc", borderRadius: 14, border: "1.5px dashed #cbd5e1", color: "#64748b" }}>
              <div style={{ fontSize: "2.4rem", marginBottom: 8 }}>🤝</div>
              <div style={{ fontWeight: 800, fontSize: "1rem" }}>{t(lang, "कोई मांग नहीं जोड़ी गई।", "No demands added yet.")}</div>
              <button type="button" className="btn btn-primary btn-sm" style={{ marginTop: 14 }} onClick={() => setActiveTab("addDemand")}>
                ➕ {t(lang, "नई मांग जोड़ें", "Add New Demand")}
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 14 }}>
              {[...state.demands].sort((a, b) => (a.number || 99) - (b.number || 99)).map((d) => (
                <div key={d.id} className="card-panel" style={{ borderRadius: 12, padding: "16px 20px", border: "1.5px solid #e2e8f0", display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                  {/* Number circle */}
                  <div style={{ width: 44, height: 44, background: "var(--primary)", color: "#fff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "1.1rem", flexShrink: 0 }}>
                    {d.number}
                  </div>
                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                      <h4 style={{ margin: 0, fontWeight: 900, fontSize: "1rem", color: "#0f172a" }}>{d.titleHi}</h4>
                      <span style={{ background: "#fef3c7", color: "#b45309", fontSize: "0.76rem", fontWeight: 800, padding: "2px 10px", borderRadius: 6 }}>
                        {t(lang, d.statusHi || "प्रमुख मांग", d.statusEn || "Priority")}
                      </span>
                    </div>
                    <div style={{ color: "#64748b", fontSize: "0.84rem", marginBottom: 4 }}>{d.titleEn}</div>
                    <p style={{ margin: 0, fontSize: "0.84rem", color: "#475569", lineHeight: 1.5 }}>
                      {d.descHi && d.descHi.length > 120 ? d.descHi.slice(0, 120) + "…" : d.descHi}
                    </p>
                  </div>
                  {/* Actions */}
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                    <button type="button" className="cert-btn-action" onClick={() => setEditingDemand(d)}>
                      ✏️ {t(lang, "संपादित", "Edit")}
                    </button>
                    <button
                      type="button"
                      className="cert-btn-delete"
                      onClick={() => {
                        if (confirm(t(lang, "क्या आप यह मांग हटाना चाहते हैं?", "Delete this demand?")))
                          run(`/api/demands/${d.id}`, { method: "DELETE" }, t(lang, "मांग हटाई गई", "Demand deleted"));
                      }}
                    >
                      🗑️ {t(lang, "हटाएँ", "Delete")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── SUBTAB 4: ADD DEMAND ── */}
      {activeTab === "addDemand" && (
        <form className="card-panel" onSubmit={addDemand} style={{ borderRadius: 16, padding: "26px 28px" }}>
          <h3 style={{ color: "#1e3a8a", fontWeight: 900, fontSize: "1.15rem", margin: "0 0 6px", display: "flex", alignItems: "center", gap: 8 }}>
            🤝 {t(lang, "नई मांग जोड़ें (Charter of Demands)", "Add New Demand (Charter of Demands)")}
          </h3>
          <p style={{ color: "#64748b", fontSize: "0.85rem", margin: "0 0 20px" }}>
            {t(lang, "मांग की जानकारी भरें — क्रम संख्या स्वतः निर्धारित होगी।", "Fill the demand details — number will be assigned automatically.")}
          </p>
          <div className="form-grid" style={{ rowGap: 18, columnGap: 24 }}>
            <div>
              <label className="about-form-label">{t(lang, "मांग शीर्षक (हिंदी) *", "Demand Title (Hindi) *")}</label>
              <Inp name="titleHi" placeholder={t(lang, "उदा: ₹15,000 न्यूनतम मासिक मानदेय", "e.g. ₹15,000 Minimum Monthly Honorarium")} required />
            </div>
            <div>
              <label className="about-form-label">{t(lang, "Demand Title (English) *", "Demand Title (English) *")}</label>
              <Inp name="titleEn" placeholder="e.g. ₹15,000 Minimum Monthly Honorarium" required />
            </div>
            <div>
              <label className="about-form-label">{t(lang, "मांग विवरण (हिंदी) *", "Demand Description (Hindi) *")}</label>
              <Inp name="descHi" placeholder={t(lang, "मांग का विस्तृत विवरण…", "Detailed description…")} required />
            </div>
            <div>
              <label className="about-form-label">{t(lang, "Demand Description (English) *", "Demand Description (English) *")}</label>
              <Inp name="descEn" placeholder="Detailed description in English…" required />
            </div>
            <div>
              <label className="about-form-label">{t(lang, "स्थिति (हिंदी)", "Status (Hindi)")}</label>
              <Inp name="statusHi" defaultValue={t(lang, "प्रमुख मांग", "प्रमुख मांग")} />
            </div>
            <div>
              <label className="about-form-label">{t(lang, "Status (English)", "Status (English)")}</label>
              <Inp name="statusEn" defaultValue="Priority Demand" />
            </div>
          </div>
          <div style={{ marginTop: 22, display: "flex", gap: 12 }}>
            <button type="submit" className="btn-save-orange">
              🤝 {t(lang, "मांग प्रकाशित करें", "Publish Demand")}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => setActiveTab("demands")}>
              {t(lang, "रद्द करें", "Cancel")}
            </button>
          </div>
        </form>
      )}

      {/* ── SUBTAB 5: SECTION SETTINGS ── */}
      {activeTab === "settings" && (
        <form className="card-panel" onSubmit={saveDocSettings} style={{ borderRadius: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 18 }}>
            <div>
              <h3 style={{ color: "var(--primary)", fontSize: "1.15rem", fontWeight: 900, margin: 0 }}>
                ⚙️ {t(lang, "दस्तावेज़ व मांग सेक्शन शीर्षक एवं मेनू प्रबंधन", "Documents & Demands Section Title & Menu Management")}
              </h3>
              <p style={{ color: "#64748b", fontSize: "0.85rem", margin: "4px 0 0" }}>
                {t(lang, "होमपेज पर मांग-पत्र सेक्शन के शीर्षक एवं नेविगेशन मेनू को यहाँ से नियंत्रित करें।", "Control the Charter of Demands section heading on homepage and navigation menu visibility.")}
              </p>
            </div>
            <button type="submit" className="btn btn-primary btn-sm" style={{ fontWeight: 800 }}>
              💾 {t(lang, "सेटिंग्स सेव करें", "Save Settings")}
            </button>
          </div>

          <div style={{ display: "grid", gap: 16 }}>
            {/* Demands Section Headings */}
            <div className="header-btn-config-card">
              <div style={{ fontWeight: 900, color: "var(--primary)", marginBottom: 12, fontSize: "0.95rem" }}>
                🤝 {t(lang, "1. होमपेज मांग-पत्र सेक्शन के शीर्षक व उपशीर्षक", "1. Homepage Demands Section Headings")}
              </div>
              <div className="form-grid" style={{ rowGap: 16 }}>
                <div>
                  <label className="about-form-label">{t(lang, "आईब्रो / श्रेणी (हिंदी)", "Eyebrow / Category (Hindi)")}</label>
                  <Inp name="homeDemandsEyebrowHi" defaultValue={stx.homeDemandsEyebrowHi || "बैंक मित्र अधिकार चार्टर"} />
                </div>
                <div>
                  <label className="about-form-label">{t(lang, "Eyebrow (English)", "Eyebrow (English)")}</label>
                  <Inp name="homeDemandsEyebrowEn" defaultValue={stx.homeDemandsEyebrowEn || "CHARTER OF DEMANDS"} />
                </div>
                <div>
                  <label className="about-form-label">{t(lang, "मुख्य शीर्षक (हिंदी)", "Main Title (Hindi)")}</label>
                  <Inp name="homeDemandsTitleHi" defaultValue={stx.homeDemandsTitleHi || "उत्तर प्रदेश बैंक मित्र संघ की प्रमुख मांगें"} />
                </div>
                <div>
                  <label className="about-form-label">{t(lang, "Main Title (English)", "Main Title (English)")}</label>
                  <Inp name="homeDemandsTitleEn" defaultValue={stx.homeDemandsTitleEn || "Key Demands of Uttar Pradesh Bank Mitra Sangh"} />
                </div>
                <div>
                  <label className="about-form-label">{t(lang, "उपशीर्षक / सबटाइटल (हिंदी)", "Subtitle (Hindi)")}</label>
                  <Inp name="homeDemandsSubHi" defaultValue={stx.homeDemandsSubHi || "प्रदेश के प्रत्येक ग्राहक सेवा केंद्र संचालक के सम्मान, सुरक्षा और आर्थिक स्थायित्व हेतु संघ का संकल्प।"} />
                </div>
                <div>
                  <label className="about-form-label">{t(lang, "Subtitle (English)", "Subtitle (English)")}</label>
                  <Inp name="homeDemandsSubEn" defaultValue={stx.homeDemandsSubEn || "Our collective charter for the dignity, safety, and financial stability of every CSP operator."} />
                </div>
              </div>
            </div>

            {/* Nav visibility */}
            <div className="header-btn-config-card">
              <div style={{ fontWeight: 900, color: "var(--primary)", marginBottom: 10, fontSize: "0.95rem" }}>
                🧭 {t(lang, "2. नेविगेशन मेनू दृश्यता", "2. Navigation Menu Visibility")}
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontWeight: 700, fontSize: "0.92rem" }}>
                <input type="checkbox" name="docsNavVisible" defaultChecked={isNavVisible} />
                <span>{t(lang, "वेबसाइट नेविगेशन बार में '📂 दस्तावेज़ व मांगें' मेनू दिखाएँ", "Show '📂 Documents & Demands' in website navigation bar")}</span>
              </label>
              <div style={{ fontSize: "0.82rem", color: "#64748b", marginTop: 6 }}>
                {t(lang, "अनचेक करने पर सामान्य विज़िटर को यह मेनू नहीं दिखेगा।", "If unchecked, this menu will be hidden from normal visitors.")}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button type="submit" className="btn-save-orange">
                💾 {t(lang, "दस्तावेज़ सेक्शन सेटिंग्स सेव करें", "Save Document Section Settings")}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ── EDIT DOCUMENT MODAL ── */}
      {editingDoc && (
        <div className="modal-backdrop" onClick={() => setEditingDoc(null)}>
          <div className="modal-box" style={{ maxWidth: 680, borderRadius: 14, overflow: "hidden" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span style={{ fontWeight: 800, fontSize: "1.08rem" }}>✏️ {t(lang, "दस्तावेज़ संपादित करें", "Edit Document")}</span>
              <button type="button" className="btn btn-sm modal-btn-close" onClick={() => setEditingDoc(null)}>✕ Close</button>
            </div>
            <form
              style={{ padding: "22px 24px" }}
              onSubmit={async (e) => {
                e.preventDefault();
                const raw = Object.fromEntries(new FormData(e.target).entries());
                raw.signatoryIds = [...e.target.querySelectorAll("[name=editDocSig]:checked")].map((el) => el.value);
                delete raw.editDocSig;
                const ok = await run(`/api/documents/${editingDoc.id}`, { method: "PUT", body: raw }, t(lang, "दस्तावेज़ अपडेट हुआ", "Document updated"));
                if (ok) setEditingDoc(null);
              }}
            >
              <div className="form-grid" style={{ rowGap: 14, columnGap: 20 }}>
                <div><label className="about-form-label">{t(lang, "शीर्षक (हिंदी) *", "Title (Hindi) *")}</label><Inp name="titleHi" defaultValue={editingDoc.titleHi} required /></div>
                <div><label className="about-form-label">Title (English) *</label><Inp name="titleEn" defaultValue={editingDoc.titleEn} required /></div>
                <div><label className="about-form-label">{t(lang, "श्रेणी (हिंदी)", "Category (Hindi)")}</label><Inp name="categoryHi" defaultValue={editingDoc.categoryHi || ""} /></div>
                <div><label className="about-form-label">Category (English)</label><Inp name="categoryEn" defaultValue={editingDoc.categoryEn || ""} /></div>
                <div><label className="about-form-label">{t(lang, "पत्रांक", "Ref No.")}</label><Inp name="refNo" defaultValue={editingDoc.refNo || ""} /></div>
                <div><label className="about-form-label">{t(lang, "दिनांक", "Date")}</label><Inp name="date" type="date" defaultValue={editingDoc.date || today()} /></div>
                <div><label className="about-form-label">{t(lang, "सारांश (हिंदी)", "Summary (Hindi)")}</label><Inp name="summaryHi" defaultValue={editingDoc.summaryHi || ""} /></div>
                <div><label className="about-form-label">Summary (English)</label><Inp name="summaryEn" defaultValue={editingDoc.summaryEn || ""} /></div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label className="about-form-label">{t(lang, "पूर्ण विषय-वस्तु (हिंदी)", "Full Content (Hindi)")}</label>
                  <textarea name="contentHi" className="form-control" rows={4} defaultValue={editingDoc.contentHi || ""} style={{ width: "100%", fontFamily: "inherit", resize: "vertical", fontSize: "0.88rem", lineHeight: 1.6 }} />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label className="about-form-label">Full Content (English)</label>
                  <textarea name="contentEn" className="form-control" rows={3} defaultValue={editingDoc.contentEn || ""} style={{ width: "100%", fontFamily: "inherit", resize: "vertical", fontSize: "0.88rem", lineHeight: 1.6 }} />
                </div>
                {officers.length > 0 && (
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label className="about-form-label">✍️ {t(lang, "हस्ताक्षरकर्ता पदाधिकारी", "Signing Officers")}</label>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
                      {officers.map((o) => (
                        <label key={o.id} style={{ display: "flex", alignItems: "center", gap: 7, background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontWeight: 700, fontSize: "0.86rem" }}>
                          <input type="checkbox" name="editDocSig" value={o.id} defaultChecked={(editingDoc.signatoryIds || []).includes(o.id)} />
                          {o.nameHi}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button type="button" className="btn btn-outline" onClick={() => setEditingDoc(null)}>✕ {t(lang, "रद्द करें", "Cancel")}</button>
                <button type="submit" className="btn btn-primary" style={{ fontWeight: 800 }}>💾 {t(lang, "परिवर्तन सेव करें", "Save Changes")}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT DEMAND MODAL ── */}
      {editingDemand && (
        <div className="modal-backdrop" onClick={() => setEditingDemand(null)}>
          <div className="modal-box" style={{ maxWidth: 620, borderRadius: 14, overflow: "hidden" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span style={{ fontWeight: 800, fontSize: "1.08rem" }}>✏️ {t(lang, "मांग संपादित करें", "Edit Demand")} #{editingDemand.number}</span>
              <button type="button" className="btn btn-sm modal-btn-close" onClick={() => setEditingDemand(null)}>✕ Close</button>
            </div>
            <form
              style={{ padding: "22px 24px" }}
              onSubmit={async (e) => {
                e.preventDefault();
                const raw = Object.fromEntries(new FormData(e.target).entries());
                const ok = await run(`/api/demands/${editingDemand.id}`, { method: "PUT", body: raw }, t(lang, "मांग अपडेट हुई", "Demand updated"));
                if (ok) setEditingDemand(null);
              }}
            >
              <div className="form-grid" style={{ rowGap: 14, columnGap: 20 }}>
                <div><label className="about-form-label">{t(lang, "मांग शीर्षक (हिंदी) *", "Demand Title (Hindi) *")}</label><Inp name="titleHi" defaultValue={editingDemand.titleHi} required /></div>
                <div><label className="about-form-label">Demand Title (English) *</label><Inp name="titleEn" defaultValue={editingDemand.titleEn} required /></div>
                <div><label className="about-form-label">{t(lang, "विवरण (हिंदी) *", "Description (Hindi) *")}</label><Inp name="descHi" defaultValue={editingDemand.descHi} required /></div>
                <div><label className="about-form-label">Description (English) *</label><Inp name="descEn" defaultValue={editingDemand.descEn} required /></div>
                <div><label className="about-form-label">{t(lang, "स्थिति (हिंदी)", "Status (Hindi)")}</label><Inp name="statusHi" defaultValue={editingDemand.statusHi || "प्रमुख मांग"} /></div>
                <div><label className="about-form-label">Status (English)</label><Inp name="statusEn" defaultValue={editingDemand.statusEn || "Priority Demand"} /></div>
              </div>
              <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button type="button" className="btn btn-outline" onClick={() => setEditingDemand(null)}>✕ {t(lang, "रद्द करें", "Cancel")}</button>
                <button type="submit" className="btn btn-primary" style={{ fontWeight: 800 }}>💾 {t(lang, "परिवर्तन सेव करें", "Save Changes")}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function DocRow({ doc, officers, run }) {
  const { lang } = usePortal();
  const [ids, setIds] = useState(doc.signatoryIds || []);
  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 10, marginTop: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}><b>{doc.titleHi}</b><button className="btn btn-danger btn-sm" onClick={() => run(`/api/documents/${doc.id}`, { method: "DELETE" }, "हटाया")}>हटाएँ</button></div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
        {officers.map((o) => (
          <label key={o.id}><input type="checkbox" checked={ids.includes(o.id)} onChange={(e) => setIds((prev) => e.target.checked ? [...prev, o.id] : prev.filter((x) => x !== o.id))} /> {o.nameHi}</label>
        ))}
        <button className="btn btn-primary btn-sm" onClick={() => ids.length && run(`/api/documents/${doc.id}`, { method: "PUT", body: { signatoryIds: ids } }, "हस्ताक्षर सेव")}>हस्ताक्षर सेव</button>
      </div>
    </div>
  );
}


function Portals({ state, run, session, showToast, saveSettings }) {
  const { lang } = usePortal();
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'list' | 'add' | 'settings'
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [editingPortal, setEditingPortal] = useState(null);
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editUploading, setEditUploading] = useState(false);

  const portals = state.externalLinks || [];
  const s = state.settings || {};
  const stx = s.sectionTexts || {};
  const portalNavItem = (s.navItems || []).find((it) => it.id === "portals");
  const isNavVisible = portalNavItem ? portalNavItem.visible !== false : true;

  async function add(e) {
    e.preventDefault();
    const raw = Object.fromEntries(new FormData(e.target).entries());
    const finalImg = imageUrl || "/images/portal-csc.jpg";
    const payload = {
      ...raw,
      imageUrl: finalImg,
      order: (portals.length || 0) + 1,
      active: true
    };
    if (await run("/api/external-links", { method: "POST", body: payload }, t(lang, "पोर्टल सफलतापूर्वक जोड़ा गया", "Portal added successfully"))) {
      e.target.reset();
      setImageUrl("");
      setActiveTab("list");
    }
  }

  async function saveEditPortal(e) {
    e.preventDefault();
    if (!editingPortal) return;
    const raw = Object.fromEntries(new FormData(e.target).entries());
    const payload = {
      ...raw,
      imageUrl: editImageUrl || editingPortal.imageUrl || "/images/portal-csc.jpg",
      active: e.target.querySelector("[name=active]")?.checked ?? true
    };
    const ok = await run(`/api/external-links/${editingPortal.id}`, { method: "PUT", body: payload }, t(lang, "पोर्टल सफलतापूर्वक अपडेट हो गया", "Portal updated successfully"));
    if (ok) {
      setEditingPortal(null);
      setEditImageUrl("");
    }
  }

  async function savePortalSettings(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const updatedTexts = {
      ...stx,
      homePortalsEyebrowHi: fd.get("homePortalsEyebrowHi"),
      homePortalsEyebrowEn: fd.get("homePortalsEyebrowEn"),
      homePortalsTitleHi: fd.get("homePortalsTitleHi"),
      homePortalsTitleEn: fd.get("homePortalsTitleEn"),
      homePortalsSubHi: fd.get("homePortalsSubHi"),
      homePortalsSubEn: fd.get("homePortalsSubEn")
    };
    const navVis = e.target.querySelector("[name=portalsNavVisible]")?.checked;
    let navItems = s.navItems ? [...s.navItems] : null;
    if (navVis !== undefined && navItems) {
      navItems = navItems.map((n) => (n.id === "portals" ? { ...n, visible: navVis } : n));
    }
    const payload = { sectionTexts: updatedTexts };
    if (navItems) payload.navItems = navItems;

    if (saveSettings) {
      await saveSettings(payload, t(lang, "पोर्टल सेक्शन सेटिंग्स सफलतापूर्वक सेव हो गई", "Portal section settings saved successfully"));
    } else {
      await run("/api/settings", { method: "PUT", body: payload }, t(lang, "सेटिंग्स सेव हो गई", "Settings saved"));
    }
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      {/* ── SUBTAB NAVIGATION STRIP (like Menus / Circulars) ── */}
      <div className="card-panel" style={{ padding: "12px 18px", borderRadius: 14 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <button
            type="button"
            className={`menus-subtab-btn ${activeTab === "list" ? "active" : ""}`}
            onClick={() => setActiveTab("list")}
          >
            🌐 {t(lang, "पोर्टल सूची एवं कार्ड्स", "Portals List & Cards")} ({portals.length})
          </button>
          <button
            type="button"
            className={`menus-subtab-btn ${activeTab === "add" ? "active" : ""}`}
            onClick={() => setActiveTab("add")}
          >
            ➕ {t(lang, "नया पोर्टल जोड़ें", "Add New Portal")}
          </button>
          <button
            type="button"
            className={`menus-subtab-btn ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            ⚙️ {t(lang, "पोर्टल सेक्शन व मेनू सेटिंग्स", "Portal Section & Menu Settings")}
          </button>
          <button
            type="button"
            className={`menus-subtab-btn ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            👁️ {t(lang, "संपूर्ण दृश्य (All in One)", "View All")}
          </button>
        </div>
      </div>

      {/* ── SECTION 1: ADD PORTAL FORM (EXACT MATCH TO REFERENCE IMAGE) ── */}
      {(activeTab === "add" || activeTab === "all") && (
        <form className="card-panel" onSubmit={add} style={{ borderRadius: 16, padding: "26px 28px" }}>
          <h3 style={{ color: "#0284c7", fontWeight: 800, fontSize: "1.2rem", margin: "0 0 18px", display: "flex", alignItems: "center", gap: 8 }}>
            🌐 {t(lang, "महत्वपूर्ण बाहरी पोर्टल व वेबसाइट लिंक", "Important External Portals & Website Links")}
          </h3>

          <div className="form-grid" style={{ rowGap: 16, columnGap: 24 }}>
            {/* Row 1: Titles */}
            <div>
              <Inp name="titleHi" placeholder={t(lang, "वेबसाइट नाम (हिंदी) *", "Website Name (Hindi) *")} required />
            </div>
            <div>
              <Inp name="titleEn" placeholder={t(lang, "Portal Name (English) *", "Portal Name (English) *")} required />
            </div>

            {/* Row 2: Categories */}
            <div>
              <Inp name="categoryHi" defaultValue={t(lang, "बैंकिंग पोर्टल", "बैंकिंग पोर्टल")} placeholder={t(lang, "बैंकिंग पोर्टल", "बैंकिंग पोर्टल")} />
            </div>
            <div>
              <Inp name="categoryEn" defaultValue="Banking Portal" placeholder="Banking Portal" />
            </div>

            {/* Row 3: URL & Domain */}
            <div>
              <Inp name="url" placeholder="https://example.gov.in *" required />
            </div>
            <div>
              <Inp name="domainLabel" placeholder="example.gov.in" />
            </div>

            {/* Row 4: Descriptions */}
            <div>
              <Inp name="descHi" placeholder={t(lang, "विवरण (हिंदी) *", "Description (Hindi) *")} required />
            </div>
            <div>
              <Inp name="descEn" placeholder={t(lang, "Description (English) *", "Description (English) *")} required />
            </div>

            {/* Row 5: Upload Preview Image (Full width or Col 1) */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label className="about-form-label" style={{ fontWeight: 700, color: "#334155", marginBottom: 6, display: "block" }}>
                {t(lang, "पोर्टल प्रीव्यू इमेज अपलोड करें *", "Upload Portal Preview Image *")}
              </label>
              <div className="dashed-upload-box" style={{ maxWidth: 540 }}>
                <input
                  type="file"
                  accept="image/*"
                  style={{ fontSize: "0.88rem", cursor: "pointer" }}
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    setUploading(true);
                    try {
                      const url = await uploadFile(f, session);
                      setImageUrl(url);
                      showToast(t(lang, "पोर्टल इमेज तैयार है", "Portal image is ready"));
                    } catch (err) {
                      showToast(err.message);
                    } finally {
                      setUploading(false);
                    }
                  }}
                />
                <div className="upload-cloud-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#2563eb">
                    <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
                  </svg>
                </div>
              </div>
              <div className="upload-hint-text">
                {uploading ? (
                  <span style={{ color: "#ea580c", fontWeight: 700 }}>⏳ {t(lang, "अपलोड हो रहा है...", "Uploading...")}</span>
                ) : imageUrl ? (
                  <span style={{ color: "#16a34a", fontWeight: 800 }}>✓ {t(lang, "कस्टम इमेज संलग्न", "Custom Image Attached")}</span>
                ) : (
                  t(lang, "खाली रखने पर डिफ़ॉल्ट बैंकिंग इमेज उपयोग होगी • अनुशंसित अनुपात: 16:9", "Default banking image will be used if left blank • Recommended ratio: 16:9")
                )}
              </div>
            </div>
          </div>

          {/* Orange Submit Button matching Reference Image */}
          <div style={{ marginTop: 20, display: "flex", gap: 12, alignItems: "center" }}>
            <button type="submit" className="btn-save-orange">
              + {t(lang, "पोर्टल जोड़ें", "Add Portal")}
            </button>
            {activeTab !== "all" && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setActiveTab("list")}
              >
                {t(lang, "रद्द करें व सूची देखें", "Cancel & View List")}
              </button>
            )}
          </div>
        </form>
      )}

      {/* ── SECTION 2: PORTALS CARDS GRID (EXACT MATCH TO REFERENCE IMAGE) ── */}
      {(activeTab === "list" || activeTab === "all") && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
            <div>
              <h4 style={{ color: "var(--primary)", fontWeight: 900, fontSize: "1.15rem", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                🌐 {t(lang, "सक्रिय पोर्टल व वेबसाइट्स सूची", "Active Portals & Websites List")}
              </h4>
              <p style={{ color: "#64748b", fontSize: "0.85rem", margin: "4px 0 0" }}>
                {t(lang, "वेबसाइट के होमपेज एवं पोर्टल डायरेक्टरी पर प्रदर्शित होने वाले सभी लिंक।", "All links displayed on the website homepage and portals directory.")}
              </p>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span className="badge badge-active" style={{ fontSize: "0.85rem", padding: "6px 14px", fontWeight: 700 }}>
                {portals.length} {t(lang, "कुल पोर्टल", "Total Portals")}
              </span>
              {activeTab !== "all" && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{ fontWeight: 800 }}
                  onClick={() => setActiveTab("add")}
                >
                  + {t(lang, "नया पोर्टल जोड़ें", "Add New Portal")}
                </button>
              )}
            </div>
          </div>

          {portals.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", background: "#f8fafc", borderRadius: 14, border: "1.5px dashed #cbd5e1", color: "#64748b" }}>
              <div style={{ fontSize: "2.4rem", marginBottom: 8 }}>🌐</div>
              <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "#334155" }}>
                {t(lang, "अभी कोई पोर्टल नहीं जोड़ा गया है।", "No portals added yet.")}
              </div>
              <p style={{ margin: "6px 0 16px", fontSize: "0.86rem" }}>
                {t(lang, "नया उपयोगी बैंकिंग या सरकारी पोर्टल जोड़ने के लिए ऊपर दिए गए फॉर्म का उपयोग करें।", "Use the form above to add an external banking or government portal.")}
              </p>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setActiveTab("add")}
              >
                + {t(lang, "नया पोर्टल जोड़ें", "Add New Portal")}
              </button>
            </div>
          ) : (
            <div className="portal-admin-grid" style={{ marginBottom: 28 }}>
              {portals.map((p) => {
                return (
                  <div key={p.id} className="portal-admin-card">
                    {/* Top Image Preview Box (Clean aspect ratio matching screenshot) */}
                    <div className="portal-admin-img-box">
                      <img
                        src={p.imageUrl || "/images/portal-csc.jpg"}
                        alt={p.titleHi}
                        className="portal-admin-img"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/images/portal-csc.jpg";
                        }}
                      />
                    </div>

                    {/* Content area: Title, URL, and Delete action matching Reference Image */}
                    <div className="portal-admin-body">
                      <div>
                        <h4 className="portal-admin-title">{p.titleHi}</h4>
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noreferrer"
                          className="portal-admin-link"
                          title={t(lang, "नया टैब में खोलें", "Open in new tab")}
                        >
                          {p.url}
                        </a>
                      </div>

                      {/* Action buttons: Delete button exactly like screenshot + subtle Edit */}
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <button
                          type="button"
                          className="cert-btn-delete"
                          style={{ padding: "3px 10px", fontSize: "0.78rem", borderRadius: 6 }}
                          onClick={() => {
                            if (confirm(t(lang, "क्या आप यह पोर्टल हटाना चाहते हैं?", "Are you sure you want to delete this portal?"))) {
                              run(`/api/external-links/${p.id}`, { method: "DELETE" }, t(lang, "पोर्टल हटाया गया", "Portal deleted"));
                            }
                          }}
                        >
                          🗑️ {t(lang, "हटाएँ", "Delete")}
                        </button>

                        <button
                          type="button"
                          className="cert-btn-action"
                          style={{ padding: "3px 8px", fontSize: "0.76rem", borderRadius: 6 }}
                          onClick={() => {
                            setEditingPortal(p);
                            setEditImageUrl(p.imageUrl || "");
                          }}
                          title={t(lang, "संपादित करें", "Edit Portal")}
                        >
                          ✏️ {t(lang, "संपादित", "Edit")}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── SECTION 3: PORTAL SECTION SETTINGS (like Menus / Circulars / Documents) ── */}
      {(activeTab === "settings" || activeTab === "all") && (
        <form className="card-panel" onSubmit={savePortalSettings} style={{ borderRadius: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 18 }}>
            <div>
              <h3 style={{ color: "var(--primary)", fontSize: "1.15rem", fontWeight: 900, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                ⚙️ {t(lang, "पोर्टल सेक्शन शीर्षक, उपशीर्षक एवं मेनू प्रबंधन", "Portal Section Title, Subtitle & Menu Management")}
              </h3>
              <p style={{ color: "#64748b", fontSize: "0.85rem", margin: "4px 0 0" }}>
                {t(lang, "होमपेज एवं पोर्टल डायरेक्टरी पेज पर प्रदर्शित शीर्षकों तथा नेविगेशन मेनू की दृश्यता को यहाँ से बदलें।", "Control portal headings, subtitles and navigation menu visibility across the website.")}
              </p>
            </div>
            <button type="submit" className="btn btn-primary btn-sm" style={{ fontWeight: 800 }}>
              💾 {t(lang, "सेटिंग्स सेव करें", "Save Settings")}
            </button>
          </div>

          <div style={{ display: "grid", gap: 16 }}>
            {/* Card 1: Section Headings */}
            <div className="header-btn-config-card">
              <div style={{ fontWeight: 900, color: "var(--primary)", marginBottom: 12, fontSize: "0.95rem" }}>
                🌐 {t(lang, "1. होमपेज एवं पोर्टल पेज के शीर्षक व उपशीर्षक", "1. Homepage & Portals Page Headings")}
              </div>
              <div className="form-grid" style={{ rowGap: 16 }}>
                <div>
                  <label className="about-form-label">{t(lang, "सेक्शन आईब्रो / श्रेणी (हिंदी)", "Section Eyebrow (Hindi)")}</label>
                  <Inp name="homePortalsEyebrowHi" defaultValue={stx.homePortalsEyebrowHi || "संबद्ध आधिकारिक पोर्टल"} />
                </div>
                <div>
                  <label className="about-form-label">{t(lang, "Section Eyebrow (English)", "Section Eyebrow (English)")}</label>
                  <Inp name="homePortalsEyebrowEn" defaultValue={stx.homePortalsEyebrowEn || "IMPORTANT OFFICIAL PORTALS"} />
                </div>

                <div>
                  <label className="about-form-label">{t(lang, "मुख्य सेक्शन शीर्षक (हिंदी)", "Main Section Title (Hindi)")}</label>
                  <Inp name="homePortalsTitleHi" defaultValue={stx.homePortalsTitleHi || "बैंक मित्रों के लिए उपयोगी सरकारी एवं बैंकिंग पोर्टल"} />
                </div>
                <div>
                  <label className="about-form-label">{t(lang, "Main Section Title (English)", "Main Section Title (English)")}</label>
                  <Inp name="homePortalsTitleEn" defaultValue={stx.homePortalsTitleEn || "Useful Government & Banking Portals for Bank Mitras"} />
                </div>

                <div>
                  <label className="about-form-label">{t(lang, "सेक्शन विवरण / सबटाइटल (हिंदी)", "Section Subtitle (Hindi)")}</label>
                  <Inp name="homePortalsSubHi" defaultValue={stx.homePortalsSubHi || "रोजमर्रा के बैंकिंग, शिकायत, परीक्षा व योजनाओं से जुड़े आधिकारिक पोर्टल की सीधी लिंक।"} />
                </div>
                <div>
                  <label className="about-form-label">{t(lang, "Section Subtitle (English)", "Section Subtitle (English)")}</label>
                  <Inp name="homePortalsSubEn" defaultValue={stx.homePortalsSubEn || "Direct links to official portals related to daily banking, grievance, examination and schemes."} />
                </div>
              </div>
            </div>

            {/* Card 2: Navigation Menu Visibility */}
            <div className="header-btn-config-card">
              <div style={{ fontWeight: 900, color: "var(--primary)", marginBottom: 10, fontSize: "0.95rem" }}>
                🧭 {t(lang, "2. मुख्य नेविगेशन मेनू दृश्यता (Navbar Menu Control)", "2. Main Navigation Menu Visibility")}
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontWeight: 700, color: "#1e293b", fontSize: "0.92rem" }}>
                <input
                  type="checkbox"
                  name="portalsNavVisible"
                  defaultChecked={isNavVisible}
                />
                <span>
                  {t(
                    lang,
                    "वेबसाइट के मुख्य मेनू बार में '🌐 पोर्टल' (Portals) मेनू प्रदर्शित रखें",
                    "Keep '🌐 Portals' displayed in the website's main navigation menu"
                  )}
                </span>
              </label>
              <div style={{ fontSize: "0.82rem", color: "#64748b", marginTop: 6 }}>
                {t(
                  lang,
                  "यदि इसे अनचेक करेंगे तो सामान्य विज़िटर्स को नेविगेशन बार में पोर्टल का मेनू नहीं दिखेगा।",
                  "If unchecked, the portals menu link will be hidden from normal website visitors."
                )}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button type="submit" className="btn-save-orange">
                💾 {t(lang, "पोर्टल सेटिंग्स सेव करें", "Save Portal Settings")}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ── EDIT PORTAL MODAL ── */}
      {editingPortal && (
        <div className="modal-backdrop" onClick={() => setEditingPortal(null)}>
          <div className="modal-box" style={{ maxWidth: 660, borderRadius: 14, overflow: "hidden" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, fontSize: "1.08rem" }}>
                <span>✏️ {t(lang, "पोर्टल विवरण संपादित करें", "Edit Portal Details")}</span>
              </div>
              <button
                type="button"
                className="btn btn-sm modal-btn-close"
                onClick={() => setEditingPortal(null)}
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={saveEditPortal} style={{ padding: "24px 26px" }}>
              <div className="form-grid" style={{ rowGap: 16, columnGap: 20 }}>
                <div>
                  <label className="about-form-label">{t(lang, "वेबसाइट नाम (हिंदी) *", "Website Name (Hindi) *")}</label>
                  <Inp name="titleHi" defaultValue={editingPortal.titleHi} required />
                </div>
                <div>
                  <label className="about-form-label">{t(lang, "Portal Name (English) *", "Portal Name (English) *")}</label>
                  <Inp name="titleEn" defaultValue={editingPortal.titleEn} required />
                </div>

                <div>
                  <label className="about-form-label">{t(lang, "श्रेणी (हिंदी)", "Category (Hindi)")}</label>
                  <Inp name="categoryHi" defaultValue={editingPortal.categoryHi || ""} />
                </div>
                <div>
                  <label className="about-form-label">{t(lang, "Category (English)", "Category (English)")}</label>
                  <Inp name="categoryEn" defaultValue={editingPortal.categoryEn || ""} />
                </div>

                <div>
                  <label className="about-form-label">{t(lang, "वेबसाइट URL *", "Website URL *")}</label>
                  <Inp name="url" defaultValue={editingPortal.url} required />
                </div>
                <div>
                  <label className="about-form-label">{t(lang, "Domain Label", "Domain Label")}</label>
                  <Inp name="domainLabel" defaultValue={editingPortal.domainLabel || ""} />
                </div>

                <div>
                  <label className="about-form-label">{t(lang, "विवरण (हिंदी) *", "Description (Hindi) *")}</label>
                  <Inp name="descHi" defaultValue={editingPortal.descHi} required />
                </div>
                <div>
                  <label className="about-form-label">{t(lang, "Description (English) *", "Description (English) *")}</label>
                  <Inp name="descEn" defaultValue={editingPortal.descEn} required />
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <label className="about-form-label">{t(lang, "प्रीव्यू इमेज बदलें", "Replace Preview Image")}</label>
                  <div className="dashed-upload-box">
                    <input
                      type="file"
                      accept="image/*"
                      style={{ fontSize: "0.85rem", cursor: "pointer" }}
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        setEditUploading(true);
                        try {
                          const url = await uploadFile(f, session);
                          setEditImageUrl(url);
                          showToast(t(lang, "नई इमेज तैयार है", "New image is ready"));
                        } catch (err) {
                          showToast(err.message);
                        } finally {
                          setEditUploading(false);
                        }
                      }}
                    />
                    <div className="upload-cloud-icon">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="#2563eb">
                        <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
                      </svg>
                    </div>
                  </div>
                  {editImageUrl && (
                    <div style={{ fontSize: "0.8rem", color: "#16a34a", fontWeight: 800, marginTop: 4 }}>
                      ✓ {t(lang, "नई इमेज संलग्न", "New image attached")}
                    </div>
                  )}
                  {editingPortal.imageUrl && !editImageUrl && (
                    <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 4 }}>
                      {t(lang, "वर्तमान इमेज URL:", "Current image URL:")} <code>{editingPortal.imageUrl}</code>
                    </div>
                  )}
                </div>

                <div style={{ gridColumn: "1 / -1", background: "#f8fafc", border: "1px solid #e2e8f0", padding: "10px 14px", borderRadius: 8 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontWeight: 700, fontSize: "0.9rem" }}>
                    <input type="checkbox" name="active" defaultChecked={editingPortal.active !== false} />
                    <span>{t(lang, "पोर्टल सक्रिय रखें (वेबसाइट पर दिखाएँ)", "Keep portal active (Show on website)")}</span>
                  </label>
                </div>
              </div>

              <div style={{ marginTop: 22, display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setEditingPortal(null)}
                >
                  ✕ {t(lang, "रद्द करें", "Cancel")}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ fontWeight: 800, padding: "9px 24px" }}
                >
                  💾 {t(lang, "परिवर्तन सेव करें", "Save Changes")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Payments({ state, saveSettings, run }) {
  const { lang, setModal } = usePortal();
  const s = state.settings || {};
  const [editSigPayment, setEditSigPayment] = useState(null);
  const officers = s.signatories || [];

  async function saveFees(e) {
    e.preventDefault();
    const r = Object.fromEntries(new FormData(e.target).entries());
    ["membershipFeeGeneral", "membershipFeeDistrictOfficer", "membershipFeeCore"].forEach((k) => {
      r[k] = Number(r[k]) || 0;
    });
    if (saveSettings) {
      await saveSettings(r, t(lang, "शुल्क, यूपीआई एवं बैंक खाता विवरण सेव हो गए", "Fees, UPI & Bank details saved"));
    } else {
      await run("/api/settings", { method: "PUT", body: r }, t(lang, "शुल्क विवरण सेव हो गए", "Fee details saved"));
    }
  }

  return (
    <div style={{ display: "grid", gap: 24 }}>
      {/* ── CARD 1: शुल्क दरें, यूपीआई एवं बैंक खाता विवरण (EXACT MATCH TO REFERENCE IMAGE) ── */}
      <form className="card-panel" onSubmit={saveFees} style={{ borderRadius: 16, padding: "26px 28px" }}>
        <h3 style={{ color: "var(--primary)", fontWeight: 800, fontSize: "1.18rem", margin: "0 0 20px", display: "flex", alignItems: "center", gap: 8 }}>
          💳 {t(lang, "सदस्यता शुल्क दरें, यूपीआई एवं बैंक खाता विवरण", "Membership Fee Rates, UPI & Bank Account Details")}
        </h3>

        <div className="form-grid" style={{ rowGap: 18, columnGap: 24 }}>
          {/* Row 1 */}
          <div>
            <label className="about-form-label">{t(lang, "सामान्य सदस्यता शुल्क (₹)", "General Membership Fee (₹)")}</label>
            <Inp type="number" name="membershipFeeGeneral" defaultValue={s.membershipFeeGeneral || 251} required />
          </div>
          <div>
            <label className="about-form-label">{t(lang, "जिला पदाधिकारी शुल्क (₹)", "District Officer Fee (₹)")}</label>
            <Inp type="number" name="membershipFeeDistrictOfficer" defaultValue={s.membershipFeeDistrictOfficer || 501} required />
          </div>

          {/* Row 2 */}
          <div>
            <label className="about-form-label">{t(lang, "मुख्य कार्यकारिणी शुल्क (₹)", "Core Executive Committee Fee (₹)")}</label>
            <Inp type="number" name="membershipFeeCore" defaultValue={s.membershipFeeCore || 1100} required />
          </div>
          <div>
            <label className="about-form-label">{t(lang, "आधिकारिक UPI ID", "Official UPI ID")}</label>
            <Inp name="upiId" defaultValue={s.upiId || "upbms.sangh@sbi"} required />
          </div>

          {/* Row 3 */}
          <div>
            <label className="about-form-label">{t(lang, "खाता धारक नाम", "Account Holder Name")}</label>
            <Inp name="bankAccountName" defaultValue={s.bankAccountName || "Uttar Pradesh Bank Mitra Sangh"} required />
          </div>
          <div>
            <label className="about-form-label">{t(lang, "खाता संख्या", "Bank Account Number")}</label>
            <Inp name="bankAccountNumber" defaultValue={s.bankAccountNumber || "3984002100088412"} required />
          </div>

          {/* Row 4 */}
          <div>
            <label className="about-form-label">{t(lang, "IFSC कोड", "IFSC Code")}</label>
            <Inp name="bankIfsc" defaultValue={s.bankIfsc || "SBIN0000125"} required />
          </div>
          <div>
            <label className="about-form-label">{t(lang, "शाखा", "Branch")}</label>
            <Inp name="bankBranch" defaultValue={s.bankBranch || "Hazratganj Main Branch, Lucknow"} required />
          </div>
        </div>

        {/* Submit button matching reference image */}
        <div style={{ marginTop: 22 }}>
          <button
            type="submit"
            className="btn"
            style={{
              background: "#0f172a",
              color: "#ffffff",
              fontWeight: 800,
              padding: "10px 22px",
              borderRadius: 8,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              border: "none",
              cursor: "pointer"
            }}
          >
            💾 {t(lang, "शुल्क व बैंक विवरण सेव करें", "Save Fees & Bank Details")}
          </button>
        </div>
      </form>

      {/* ── CARD 2: समस्त शुल्क एवं सहयोग रसीद रजिस्टर (EXACT MATCH TO REFERENCE IMAGE) ── */}
      <div className="card-panel" style={{ borderRadius: 16, padding: "24px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
          <h3 style={{ color: "var(--primary)", fontWeight: 800, fontSize: "1.18rem", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            🧾 {t(lang, `समस्त शुल्क एवं सहयोग रसीद रजिस्टर (${state.payments.length})`, `All Fees & Donation Receipts Register (${state.payments.length})`)}
          </h3>
        </div>

        <div className="admin-table-wrap" style={{ overflowX: "auto" }}>
          <table className="data-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" }}>
                <th style={{ padding: "12px 14px", textAlign: "left", fontSize: "0.86rem", color: "#475569", fontWeight: 800 }}>{t(lang, "रसीद सं.", "Receipt No.")}</th>
                <th style={{ padding: "12px 14px", textAlign: "left", fontSize: "0.86rem", color: "#475569", fontWeight: 800 }}>{t(lang, "नाम", "Name")}</th>
                <th style={{ padding: "12px 14px", textAlign: "left", fontSize: "0.86rem", color: "#475569", fontWeight: 800 }}>{t(lang, "प्रकार", "Type")}</th>
                <th style={{ padding: "12px 14px", textAlign: "left", fontSize: "0.86rem", color: "#475569", fontWeight: 800 }}>{t(lang, "राशि", "Amount")}</th>
                <th style={{ padding: "12px 14px", textAlign: "left", fontSize: "0.86rem", color: "#475569", fontWeight: 800 }}>{t(lang, "स्थिति", "Status")}</th>
                <th style={{ padding: "12px 14px", textAlign: "center", fontSize: "0.86rem", color: "#475569", fontWeight: 800 }}>{t(lang, "कार्यवाही", "Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {state.payments.map((p) => {
                const isVerified = p.status === "verified";
                const isDonation = p.paymentCategory === "donation";
                return (
                  <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    {/* Receipt No. & Date */}
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ fontWeight: 800, fontSize: "0.88rem", color: "#0f172a" }}>{p.receiptNo}</div>
                      <div style={{ fontSize: "0.76rem", color: "#64748b", marginTop: 2 }}>{p.date}</div>
                    </td>

                    {/* Name & District */}
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ fontWeight: 800, fontSize: "0.88rem", color: "#0f172a" }}>{p.payerName}</div>
                      <div style={{ fontSize: "0.76rem", color: "#64748b", marginTop: 2 }}>{p.district || p.payerNameEn || ""}</div>
                    </td>

                    {/* Type */}
                    <td style={{ padding: "12px 14px", fontSize: "0.86rem", color: "#334155", fontWeight: 600 }}>
                      {isDonation ? t(lang, "सहयोग राशि", "Donation") : t(lang, "सदस्यता शुल्क", "Membership Fee")}
                    </td>

                    {/* Amount */}
                    <td style={{ padding: "12px 14px", fontWeight: 800, fontSize: "0.95rem", color: "#0f172a" }}>
                      ₹{p.amount}
                    </td>

                    {/* Status badge matching screenshot */}
                    <td style={{ padding: "12px 14px" }}>
                      {isVerified ? (
                        <span style={{ background: "#dcfce7", color: "#15803d", fontWeight: 800, padding: "3px 10px", borderRadius: 6, fontSize: "0.78rem", display: "inline-block" }}>
                          {t(lang, "सत्यापित", "Verified")}
                        </span>
                      ) : (
                        <span style={{ background: "#fef3c7", color: "#b45309", fontWeight: 800, padding: "3px 10px", borderRadius: 6, fontSize: "0.78rem", display: "inline-block" }}>
                          {t(lang, "लंबित", "Pending")}
                        </span>
                      )}
                    </td>

                    {/* Action buttons matching screenshot */}
                    <td style={{ padding: "12px 14px", textAlign: "center" }}>
                      <div style={{ display: "inline-flex", gap: 8, alignItems: "center", justifyContent: "center" }}>
                        {/* Modify Signatures Button */}
                        <button
                          type="button"
                          className="cert-btn-action"
                          style={{ padding: "5px 12px", fontSize: "0.82rem", borderRadius: 6 }}
                          onClick={() => setEditSigPayment(p)}
                        >
                          ✍️ {t(lang, "हस्ताक्षर संशोधित", "Modify Signature")}
                        </button>

                        {/* View/Print Official Receipt Button */}
                        <button
                          type="button"
                          className="cert-btn-action"
                          style={{ padding: "5px 12px", fontSize: "0.82rem", borderRadius: 6 }}
                          onClick={() => setModal({ kind: "receipt", item: p, locked: false })}
                        >
                          🧾 {t(lang, "रसीद", "Receipt")}
                        </button>

                        {/* Delete Button matching pink/red icon style */}
                        <button
                          type="button"
                          className="cert-btn-delete"
                          style={{ padding: "5px 10px", fontSize: "0.82rem", borderRadius: 6 }}
                          onClick={() => {
                            if (confirm(t(lang, "क्या आप यह रसीद रिकॉर्ड हटाना चाहते हैं?", "Are you sure you want to delete this receipt record?"))) {
                              run(`/api/payments/${p.id}`, { method: "DELETE" }, t(lang, "रसीद हटाई गई", "Receipt deleted"));
                            }
                          }}
                          title={t(lang, "हटाएँ", "Delete")}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── EDIT SIGNATORIES MODAL ── */}
      {editSigPayment && (
        <div className="modal-backdrop" onClick={() => setEditSigPayment(null)}>
          <div className="modal-box" style={{ maxWidth: 560, borderRadius: 14, overflow: "hidden" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, fontSize: "1.08rem" }}>
                <span>✍️ {t(lang, "रसीद हस्ताक्षरकर्ता संशोधित करें", "Modify Receipt Signatories")}</span>
              </div>
              <button
                type="button"
                className="btn btn-sm modal-btn-close"
                onClick={() => setEditSigPayment(null)}
              >
                ✕ Close
              </button>
            </div>

            <form
              style={{ padding: "24px 26px" }}
              onSubmit={async (e) => {
                e.preventDefault();
                const ids = [...e.target.querySelectorAll("[name=sig]:checked")].map((el) => el.value);
                if (!ids.length) return alert(t(lang, "कम से कम एक हस्ताक्षरकर्ता चुनें", "Select at least one signatory"));
                const ok = await run(`/api/payments/${editSigPayment.id}`, { method: "PUT", body: { signatoryIds: ids } }, t(lang, "रसीद हस्ताक्षर सफलतापूर्वक संशोधित किए गए", "Receipt signatories updated successfully"));
                if (ok) setEditSigPayment(null);
              }}
            >
              <div style={{ background: "#f8fafc", padding: "12px 16px", borderRadius: 10, border: "1px solid #e2e8f0", marginBottom: 18 }}>
                <div style={{ fontWeight: 800, color: "var(--primary)", fontSize: "0.95rem" }}>
                  {editSigPayment.receiptNo}
                </div>
                <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: 2 }}>
                  {editSigPayment.payerName} • ₹{editSigPayment.amount} ({editSigPayment.date})
                </div>
              </div>

              <label className="about-form-label" style={{ marginBottom: 10, display: "block" }}>
                {t(lang, "रसीद पर मुद्रित होने वाले अधिकृत पदाधिकारी चुनें:", "Select authorized officers to be printed on this receipt:")}
              </label>

              <div style={{ display: "grid", gap: 10, marginBottom: 22 }}>
                {officers.map((sg) => (
                  <label
                    key={sg.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      background: "#ffffff",
                      border: "1.5px solid #cbd5e1",
                      borderRadius: 8,
                      padding: "10px 14px",
                      cursor: "pointer",
                      fontWeight: 700,
                      fontSize: "0.9rem"
                    }}
                  >
                    <input
                      type="checkbox"
                      name="sig"
                      value={sg.id}
                      defaultChecked={(editSigPayment.signatoryIds || []).includes(sg.id)}
                    />
                    <span>{sg.nameHi} ({sg.roleHi || sg.roleEn})</span>
                  </label>
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setEditSigPayment(null)}
                >
                  ✕ {t(lang, "रद्द करें", "Cancel")}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ fontWeight: 800, padding: "9px 24px" }}
                >
                  💾 {t(lang, "हस्ताक्षर सेव करें", "Save Signatures")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function GrievanceNews({ state, saveSettings, run, session, showToast }) {
  const { lang } = usePortal();
  const [activeTab, setActiveTab] = useState("grievance"); // 'grievance' | 'news'
  const [newsImageUrl, setNewsImageUrl] = useState("/images/hero-banner-1.jpg");
  const [uploading, setUploading] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editUploading, setEditUploading] = useState(false);

  const on = state.settings?.enableGrievanceModule !== false;
  const grievances = state.grievances || [];
  const newsList = state.news || [];
  const s = state.settings || {};
  const stx = s.sectionTexts || {};

  async function addNews(e) {
    e.preventDefault();
    const raw = Object.fromEntries(new FormData(e.target).entries());
    const payload = {
      ...raw,
      imageUrl: newsImageUrl || "/images/hero-banner-1.jpg",
      date: today()
    };
    if (await run("/api/news", { method: "POST", body: payload }, t(lang, "समाचार सफलतापूर्वक प्रकाशित हुआ", "News published successfully"))) {
      e.target.reset();
      setNewsImageUrl("/images/hero-banner-1.jpg");
      showToast(t(lang, "समाचार प्रकाशित हो गया", "News published"));
    }
  }

  async function updateGrievance(e, gId) {
    e.preventDefault();
    const raw = Object.fromEntries(new FormData(e.target).entries());
    await run(`/api/grievances/${gId}`, { method: "PUT", body: raw }, t(lang, "शिकायत स्थिति एवं समाधान अपडेट हुआ", "Grievance status & resolution updated"));
  }

  async function saveNewsEdit(e) {
    e.preventDefault();
    if (!editingNews) return;
    const raw = Object.fromEntries(new FormData(e.target).entries());
    const payload = {
      ...raw,
      imageUrl: editImageUrl || editingNews.imageUrl || "/images/hero-banner-1.jpg"
    };
    const ok = await run(`/api/news/${editingNews.id}`, { method: "PUT", body: payload }, t(lang, "समाचार अपडेट हो गया", "News updated successfully"));
    if (ok) {
      setEditingNews(null);
      setEditImageUrl("");
    }
  }

  return (
    <div style={{ display: "grid", gap: 24 }}>
      {/* ── SUBTAB NAVIGATION STRIP (Grievance Redressal & News Only) ── */}
      <div className="card-panel" style={{ padding: "12px 18px", borderRadius: 14 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <button
            type="button"
            className={`menus-subtab-btn ${activeTab === "grievance" ? "active" : ""}`}
            onClick={() => setActiveTab("grievance")}
          >
            ⚖️ {t(lang, `शिकायत निवारण नियंत्रण (${grievances.length})`, `Grievance Redressal (${grievances.length})`)}
          </button>
          <button
            type="button"
            className={`menus-subtab-btn ${activeTab === "news" ? "active" : ""}`}
            onClick={() => setActiveTab("news")}
          >
            📰 {t(lang, `समाचार एवं गतिविधियाँ (${newsList.length})`, `News & Activities (${newsList.length})`)}
          </button>
        </div>
      </div>

      {/* ── CARD 1: 1. शिकायत निवारण नियंत्रण (EXACT MATCH TO REFERENCE IMAGE TOP SECTION) ── */}
      {activeTab === "grievance" && (
        <div
          className="card-panel"
          style={{
            borderRadius: 16,
            padding: "24px 28px",
            border: "2px solid #86efac",
            background: "#ffffff"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
            <div>
              <h3 style={{ color: "#0f172a", fontWeight: 800, fontSize: "1.18rem", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                ⚖️ {t(lang, "1. शिकायत निवारण नियंत्रण (दिखाएँ / छिपाएँ विकल्प सहित)", "1. Grievance Redressal Control (With Show / Hide Option)")}
              </h3>
              <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: on ? "#16a34a" : "#dc2626", fontWeight: 700 }}>
                {on ? (
                  <>✓ {t(lang, "वर्तमान स्थिति: चालू (वेबसाइट पर दिख रहा है)", "Current Status: Active (Visible on website)")}</>
                ) : (
                  <>🛑 {t(lang, "वर्तमान स्थिति: बंद (वेबसाइट पर छिपा हुआ है)", "Current Status: Disabled (Hidden from website)")}</>
                )}
              </p>
            </div>

            {/* Toggle show/hide button matching screenshot */}
            <button
              type="button"
              style={{
                background: on ? "#fee2e2" : "#dcfce7",
                color: on ? "#dc2626" : "#15803d",
                border: on ? "1px solid #fecaca" : "1px solid #bbf7d0",
                fontWeight: 700,
                borderRadius: 8,
                padding: "7px 16px",
                cursor: "pointer",
                fontSize: "0.88rem",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.2s ease"
              }}
              onClick={async () => {
                const next = !on;
                if (saveSettings) {
                  await saveSettings({ enableGrievanceModule: next }, next ? t(lang, "शिकायत मॉड्यूल चालू किया गया", "Grievance module activated") : t(lang, "शिकायत मॉड्यूल वेबसाइट से छिपाया गया", "Grievance module hidden from website"));
                } else {
                  await run("/api/settings", { method: "PUT", body: { enableGrievanceModule: next } }, t(lang, "शिकायत स्थिति बदली गई", "Status changed"));
                }
              }}
            >
              {on ? (
                <>🛑 {t(lang, "शिकायत निवारण को वेबसाइट से छिपाएँ", "Hide Grievance from Website")}</>
              ) : (
                <>✓ {t(lang, "शिकायत निवारण को वेबसाइट पर दिखाएँ", "Show Grievance on Website")}</>
              )}
            </button>
          </div>

          {/* Grievance List Items */}
          {grievances.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px 20px", background: "#f8fafc", borderRadius: 12, border: "1.5px dashed #cbd5e1", color: "#64748b" }}>
              {t(lang, "कोई शिकायत दर्ज नहीं है।", "No grievances registered.")}
            </div>
          ) : (
            <div style={{ display: "grid", gap: 14 }}>
              {grievances.map((g) => (
                <form
                  key={g.id}
                  onSubmit={(e) => updateGrievance(e, g.id)}
                  style={{
                    background: "#ffffff",
                    border: "1.5px solid #cbd5e1",
                    borderRadius: 12,
                    padding: "16px 20px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
                  }}
                >
                  {/* Top row: Ticket No, Applicant Name, District & Status dropdown */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 8 }}>
                    <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#0f172a" }}>
                      💳 {g.ticketNo} — {g.applicantName} ({g.district || ""})
                    </div>

                    {/* Status dropdown matching screenshot */}
                    <div>
                      <select
                        name="status"
                        defaultValue={g.status || "pending"}
                        style={{
                          padding: "6px 14px",
                          borderRadius: 8,
                          border: "1.5px solid #cbd5e1",
                          fontWeight: 700,
                          fontSize: "0.85rem",
                          background: "#ffffff",
                          color: "#0f172a",
                          cursor: "pointer"
                        }}
                      >
                        <option value="resolved">{t(lang, "समाधान पूर्ण (Resolved)", "Resolved")}</option>
                        <option value="in_progress">{t(lang, "कार्यवाही जारी (In Progress)", "In Progress")}</option>
                        <option value="pending">{t(lang, "लंबित / पंजीकृत (Pending)", "Pending")}</option>
                      </select>
                    </div>
                  </div>

                  {/* Subject line */}
                  <div style={{ fontSize: "0.86rem", color: "#334155", fontWeight: 600, marginBottom: 10 }}>
                    {g.subject}
                  </div>

                  {/* Two text inputs side-by-side matching screenshot */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14, marginBottom: 12 }}>
                    <div>
                      <textarea
                        name="adminRemark"
                        defaultValue={g.adminRemark || ""}
                        placeholder={t(lang, "प्रदेश महामंत्री द्वारा क्षेत्रीय कार्यालय से वार्ता के उपरांत बकाया कमीशन बैंक...", "Resolution / Remarks (Hindi)")}
                        rows={2}
                        className="form-control"
                        style={{ width: "100%", fontSize: "0.84rem", padding: "8px 12px", borderRadius: 8, border: "1.5px solid #cbd5e1", resize: "vertical" }}
                      />
                    </div>
                    <div>
                      <textarea
                        name="adminRemarkEn"
                        defaultValue={g.adminRemarkEn || ""}
                        placeholder={t(lang, "Following intervention by the State General Secretary with the Regional Office...", "Resolution / Remarks (English)")}
                        rows={2}
                        className="form-control"
                        style={{ width: "100%", fontSize: "0.84rem", padding: "8px 12px", borderRadius: 8, border: "1.5px solid #cbd5e1", resize: "vertical" }}
                      />
                    </div>
                  </div>

                  {/* Action buttons matching screenshot */}
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <button
                      type="submit"
                      style={{
                        background: "#0f172a",
                        color: "#ffffff",
                        fontWeight: 700,
                        padding: "6px 18px",
                        borderRadius: 6,
                        border: "none",
                        cursor: "pointer",
                        fontSize: "0.84rem",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6
                      }}
                    >
                      💾 {t(lang, "अपडेट करें", "Update")}
                    </button>

                    <button
                      type="button"
                      className="cert-btn-delete"
                      style={{ padding: "6px 10px", fontSize: "0.84rem", borderRadius: 6 }}
                      onClick={() => {
                        if (confirm(t(lang, "क्या आप यह शिकायत हटाना चाहते हैं?", "Are you sure you want to delete this grievance?"))) {
                          run(`/api/grievances/${g.id}`, { method: "DELETE" }, t(lang, "शिकायत हटाई गई", "Grievance deleted"));
                        }
                      }}
                      title={t(lang, "हटाएँ", "Delete")}
                    >
                      🗑️
                    </button>
                  </div>
                </form>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── CARD 2: 2. समाचार एवं गतिविधियाँ (EXACT MATCH TO REFERENCE IMAGE BOTTOM SECTION) ── */}
      {activeTab === "news" && (
        <div className="card-panel" style={{ borderRadius: 16, padding: "24px 28px" }}>
          <h3 style={{ color: "#0f172a", fontWeight: 800, fontSize: "1.18rem", margin: "0 0 18px", display: "flex", alignItems: "center", gap: 8 }}>
            📰 {t(lang, "2. समाचार एवं गतिविधियाँ (हिंदी एवं English)", "2. News & Activities (Hindi & English)")}
          </h3>

          <form onSubmit={addNews}>
            <div className="form-grid" style={{ rowGap: 16, columnGap: 24 }}>
              {/* Row 1: Titles */}
              <div>
                <Inp name="titleHi" placeholder={t(lang, "समाचार शीर्षक (हिंदी) *", "News Headline (Hindi) *")} required />
              </div>
              <div>
                <Inp name="titleEn" placeholder={t(lang, "News Headline (English) *", "News Headline (English) *")} required />
              </div>

              {/* Row 2: Categories */}
              <div>
                <Inp name="categoryHi" defaultValue="संगठन समाचार" placeholder="संगठन समाचार" />
              </div>
              <div>
                <Inp name="categoryEn" defaultValue="Union Update" placeholder="Union Update" />
              </div>

              {/* Row 3: District / Location */}
              <div>
                <Inp name="district" defaultValue="लखनऊ" placeholder="लखनऊ" />
              </div>
              <div>
                <Inp name="districtEn" defaultValue="Lucknow" placeholder="Lucknow" />
              </div>

              {/* Row 4: Summaries */}
              <div>
                <textarea
                  name="summaryHi"
                  rows={3}
                  className="form-control"
                  placeholder={t(lang, "सारांश (हिंदी) *", "Summary (Hindi) *")}
                  required
                  style={{ width: "100%", fontSize: "0.88rem", padding: "8px 12px", borderRadius: 8, border: "1.5px solid #cbd5e1", resize: "vertical" }}
                />
              </div>
              <div>
                <textarea
                  name="summaryEn"
                  rows={3}
                  className="form-control"
                  placeholder={t(lang, "Summary (English) *", "Summary (English) *")}
                  style={{ width: "100%", fontSize: "0.88rem", padding: "8px 12px", borderRadius: 8, border: "1.5px solid #cbd5e1", resize: "vertical" }}
                />
              </div>

              {/* Row 5: Photo Upload matching screenshot */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label className="about-form-label" style={{ fontWeight: 700, color: "#334155", marginBottom: 6, display: "block" }}>
                  {t(lang, "समाचार फोटो", "News Photo")}
                </label>
                <div className="dashed-upload-box" style={{ maxWidth: 520 }}>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ fontSize: "0.88rem", cursor: "pointer" }}
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      setUploading(true);
                      try {
                        const url = await uploadFile(f, session);
                        setNewsImageUrl(url);
                        showToast(t(lang, "समाचार फोटो तैयार है", "Photo uploaded"));
                      } catch (err) {
                        showToast(err.message);
                      } finally {
                        setUploading(false);
                      }
                    }}
                  />
                  <div className="upload-cloud-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="#2563eb">
                      <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
                    </svg>
                  </div>
                </div>
                <div className="upload-hint-text">
                  {uploading ? (
                    <span style={{ color: "#ea580c", fontWeight: 700 }}>⏳ {t(lang, "अपलोड हो रहा है...", "Uploading...")}</span>
                  ) : newsImageUrl && newsImageUrl !== "/images/hero-banner-1.jpg" ? (
                    <span style={{ color: "#16a34a", fontWeight: 800 }}>✓ {t(lang, "कस्टम फोटो संलग्न", "Custom photo attached")}</span>
                  ) : (
                    t(lang, "खाली रखने पर डिफ़ॉल्ट बैनर उपयोग होगा", "Default banner will be used if left blank")
                  )}
                </div>
              </div>
            </div>

            {/* Orange Submit Button matching screenshot */}
            <div style={{ marginTop: 20 }}>
              <button type="submit" className="btn-save-orange">
                + {t(lang, "समाचार प्रकाशित करें", "Publish News")}
              </button>
            </div>
          </form>

          {/* Published News List matching screenshot */}
          <div style={{ marginTop: 24 }}>
            {newsList.length === 0 ? (
              <div style={{ textAlign: "center", padding: "26px 20px", background: "#f8fafc", borderRadius: 12, border: "1.5px dashed #cbd5e1", color: "#64748b" }}>
                {t(lang, "कोई समाचार प्रकाशित नहीं है।", "No news published yet.")}
              </div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {newsList.map((n) => (
                  <div
                    key={n.id}
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: 10,
                      padding: "14px 18px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 14,
                      boxShadow: "0 1px 2px rgba(0,0,0,0.02)"
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#0f172a", marginBottom: 3, lineHeight: 1.35 }}>
                        {n.titleHi}
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 500 }}>
                        {n.titleEn || n.titleHi}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                      <button
                        type="button"
                        className="cert-btn-action"
                        style={{ padding: "4px 8px", fontSize: "0.78rem", borderRadius: 6 }}
                        onClick={() => {
                          setEditingNews(n);
                          setEditImageUrl(n.imageUrl || "");
                        }}
                        title={t(lang, "संपादित करें", "Edit News")}
                      >
                        ✏️ {t(lang, "संपादित", "Edit")}
                      </button>

                      {/* Delete button matching screenshot soft pink style */}
                      <button
                        type="button"
                        className="cert-btn-delete"
                        style={{ padding: "5px 10px", fontSize: "0.82rem", borderRadius: 6 }}
                        onClick={() => {
                          if (confirm(t(lang, "क्या आप यह समाचार हटाना चाहते हैं?", "Are you sure you want to delete this news item?"))) {
                            run(`/api/news/${n.id}`, { method: "DELETE" }, t(lang, "समाचार हटाया गया", "News deleted"));
                          }
                        }}
                        title={t(lang, "हटाएँ", "Delete")}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── EDIT NEWS MODAL ── */}
      {editingNews && (
        <div className="modal-backdrop" onClick={() => setEditingNews(null)}>
          <div className="modal-box" style={{ maxWidth: 640, borderRadius: 14, overflow: "hidden" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, fontSize: "1.08rem" }}>
                <span>✏️ {t(lang, "समाचार संपादित करें", "Edit News Item")}</span>
              </div>
              <button
                type="button"
                className="btn btn-sm modal-btn-close"
                onClick={() => setEditingNews(null)}
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={saveNewsEdit} style={{ padding: "24px 26px" }}>
              <div className="form-grid" style={{ rowGap: 16, columnGap: 20 }}>
                <div>
                  <label className="about-form-label">{t(lang, "समाचार शीर्षक (हिंदी) *", "Headline (Hindi) *")}</label>
                  <Inp name="titleHi" defaultValue={editingNews.titleHi} required />
                </div>
                <div>
                  <label className="about-form-label">Headline (English) *</label>
                  <Inp name="titleEn" defaultValue={editingNews.titleEn} required />
                </div>

                <div>
                  <label className="about-form-label">{t(lang, "श्रेणी (हिंदी)", "Category (Hindi)")}</label>
                  <Inp name="categoryHi" defaultValue={editingNews.categoryHi || ""} />
                </div>
                <div>
                  <label className="about-form-label">Category (English)</label>
                  <Inp name="categoryEn" defaultValue={editingNews.categoryEn || ""} />
                </div>

                <div>
                  <label className="about-form-label">{t(lang, "स्थान / जनपद (हिंदी)", "Location (Hindi)")}</label>
                  <Inp name="district" defaultValue={editingNews.district || ""} />
                </div>
                <div>
                  <label className="about-form-label">Location (English)</label>
                  <Inp name="districtEn" defaultValue={editingNews.districtEn || ""} />
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <label className="about-form-label">{t(lang, "सारांश (हिंदी) *", "Summary (Hindi) *")}</label>
                  <textarea
                    name="summaryHi"
                    rows={3}
                    className="form-control"
                    defaultValue={editingNews.summaryHi || ""}
                    required
                    style={{ width: "100%", fontSize: "0.88rem", resize: "vertical" }}
                  />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label className="about-form-label">Summary (English)</label>
                  <textarea
                    name="summaryEn"
                    rows={3}
                    className="form-control"
                    defaultValue={editingNews.summaryEn || ""}
                    style={{ width: "100%", fontSize: "0.88rem", resize: "vertical" }}
                  />
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <label className="about-form-label">{t(lang, "फोटो बदलें", "Replace Photo")}</label>
                  <div className="dashed-upload-box">
                    <input
                      type="file"
                      accept="image/*"
                      style={{ fontSize: "0.85rem", cursor: "pointer" }}
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        setEditUploading(true);
                        try {
                          const url = await uploadFile(f, session);
                          setEditImageUrl(url);
                          showToast(t(lang, "नई फोटो तैयार है", "New photo ready"));
                        } catch (err) {
                          showToast(err.message);
                        } finally {
                          setEditUploading(false);
                        }
                      }}
                    />
                    <div className="upload-cloud-icon">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="#2563eb">
                        <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
                      </svg>
                    </div>
                  </div>
                  {editImageUrl && (
                    <div style={{ fontSize: "0.8rem", color: "#16a34a", fontWeight: 800, marginTop: 4 }}>
                      ✓ {t(lang, "नई फोटो संलग्न", "New photo attached")}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginTop: 22, display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setEditingNews(null)}
                >
                  ✕ {t(lang, "रद्द करें", "Cancel")}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ fontWeight: 800, padding: "9px 24px" }}
                >
                  💾 {t(lang, "परिवर्तन सेव करें", "Save Changes")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Branding({ state, saveSettings, session, showToast, persistSession, refresh }) {
  const { lang } = usePortal();
  const [activeSection, setActiveSection] = useState("all"); // 'all' | 'identity' | 'contact' | 'theme' | 'ticker' | 'socials' | 'security'
  const s = state.settings || {};
  const sl = s.socialLinks || {};
  const [logoUrl, setLogoUrl] = useState(s.logoUrl || "/images/upbms-logo.png");
  const [uploading, setUploading] = useState(false);

  // Dedicated state for social media links with delete / update capabilities
  const [socials, setSocials] = useState({
    whatsappChannel: sl.whatsappChannel || "",
    whatsappGroup: sl.whatsappGroup || "",
    facebook: sl.facebook || "",
    instagram: sl.instagram || "",
    youtube: sl.youtube || "",
    twitter: sl.twitter || "",
    telegram: sl.telegram || "",
    extra1Label: sl.extra1Label || "",
    extra1Url: sl.extra1Url || "",
    extra2Label: sl.extra2Label || "",
    extra2Url: sl.extra2Url || ""
  });

  // Calculate count of active social links
  const activeSocialCount = [
    socials.whatsappChannel,
    socials.whatsappGroup,
    socials.facebook,
    socials.instagram,
    socials.youtube,
    socials.twitter,
    socials.telegram,
    socials.extra1Url,
    socials.extra2Url
  ].filter(Boolean).length;

  // Single-click delete / remove specific social media link
  async function deleteSpecificSocial(key, platformName) {
    if (!confirm(t(lang, `क्या आप ${platformName} लिंक को वेबसाइट से हटाना चाहते हैं?`, `Are you sure you want to remove ${platformName} from the website?`))) {
      return;
    }
    const updated = { ...socials };
    if (key === "extra1") {
      updated.extra1Label = "";
      updated.extra1Url = "";
    } else if (key === "extra2") {
      updated.extra2Label = "";
      updated.extra2Url = "";
    } else {
      updated[key] = "";
    }
    setSocials(updated);

    // Save directly to backend so the icon is removed from website header and footer in real time!
    if (saveSettings) {
      await saveSettings(
        {
          socialLinks: {
            ...sl,
            ...updated
          }
        },
        t(lang, `${platformName} लिंक वेबसाइट से हटा दिया गया`, `${platformName} link removed from website`)
      );
    }
  }

  async function save(e) {
    e.preventDefault();
    const r = Object.fromEntries(new FormData(e.target).entries());
    const patch = {
      orgNameHi: r.orgNameHi,
      orgNameEn: r.orgNameEn,
      shortName: r.shortName,
      regNumber: r.regNumber,
      taglineHi: r.taglineHi,
      taglineEn: r.taglineEn,
      helplinePrimary: r.helplinePrimary,
      email: r.email,
      whatsappNumber: r.whatsappNumber,
      headOfficeHi: r.headOfficeHi,
      headOfficeEn: r.headOfficeEn,
      themePreset: r.themePreset,
      logoUrl: logoUrl || s.logoUrl || "/images/upbms-logo.png",
      tickerNoticesHi: lines(r.tickerNoticesHi),
      tickerNoticesEn: lines(r.tickerNoticesEn),
      socialLinks: {
        ...socials,
        whatsappChannel: r.soc_waCh ?? socials.whatsappChannel,
        whatsappGroup: r.soc_waGr ?? socials.whatsappGroup,
        facebook: r.soc_fb ?? socials.facebook,
        instagram: r.soc_ig ?? socials.instagram,
        youtube: r.soc_yt ?? socials.youtube,
        twitter: r.soc_tw ?? socials.twitter,
        telegram: r.soc_tg ?? socials.telegram,
        extra1Label: r.soc_ex1Lbl ?? socials.extra1Label,
        extra1Url: r.soc_ex1Url ?? socials.extra1Url,
        extra2Label: r.soc_ex2Lbl ?? socials.extra2Label,
        extra2Url: r.soc_ex2Url ?? socials.extra2Url
      }
    };

    if (r.newAdminPin?.trim()) {
      patch.newAdminPin = r.newAdminPin.trim();
    }

    if (saveSettings) {
      await saveSettings(patch, t(lang, "संगठन पहचान व सोशल लिंक सफलतापूर्वक सेव हो गए", "Organization identity & branding saved successfully"));
    }

    if (r.newAdminPin?.trim()) {
      const next = { adminPin: r.newAdminPin.trim(), isAdmin: true };
      if (persistSession) persistSession(next);
      if (refresh) await refresh(next);
      showToast(t(lang, "एडमिन सुरक्षा पिन अपडेट हो गया", "Admin security PIN updated"));
    }
  }

  return (
    <form onSubmit={save} style={{ display: "grid", gap: 20 }}>
      {/* ── SECTION NAVIGATION PILLS (Jump to specific section or View All) ── */}
      <div className="card-panel" style={{ padding: "12px 18px", borderRadius: 14 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <button
            type="button"
            className={`menus-subtab-btn ${activeSection === "all" ? "active" : ""}`}
            onClick={() => setActiveSection("all")}
          >
            👁️ {t(lang, "संपूर्ण दृश्य (All Sections)", "View All Sections")}
          </button>
          <button
            type="button"
            className={`menus-subtab-btn ${activeSection === "identity" ? "active" : ""}`}
            onClick={() => setActiveSection("identity")}
          >
            🏛️ {t(lang, "1. संगठन पहचान", "1. Org Identity")}
          </button>
          <button
            type="button"
            className={`menus-subtab-btn ${activeSection === "contact" ? "active" : ""}`}
            onClick={() => setActiveSection("contact")}
          >
            📞 {t(lang, "2. संपर्क व मुख्यालय", "2. Contact & Office")}
          </button>
          <button
            type="button"
            className={`menus-subtab-btn ${activeSection === "theme" ? "active" : ""}`}
            onClick={() => setActiveSection("theme")}
          >
            🎨 {t(lang, "3. रंग थीम", "3. Color Theme")}
          </button>
          <button
            type="button"
            className={`menus-subtab-btn ${activeSection === "ticker" ? "active" : ""}`}
            onClick={() => setActiveSection("ticker")}
          >
            📢 {t(lang, "4. सूचना टिकर", "4. Notice Ticker")}
          </button>
          <button
            type="button"
            className={`menus-subtab-btn ${activeSection === "socials" ? "active" : ""}`}
            onClick={() => setActiveSection("socials")}
          >
            🌐 {t(lang, "5. सोशल मीडिया लिंक्स", "5. Social Media")} ({activeSocialCount})
          </button>
          <button
            type="button"
            className={`menus-subtab-btn ${activeSection === "security" ? "active" : ""}`}
            onClick={() => setActiveSection("security")}
          >
            🔐 {t(lang, "6. सुरक्षा पिन", "6. Security PIN")}
          </button>
        </div>
      </div>

      {/* ── SECTION 1: संगठन बुनियादी पहचान, पंजीकरण एवं लोगो ── */}
      {(activeSection === "all" || activeSection === "identity") && (
        <div className="card-panel" style={{ borderRadius: 16, padding: "24px 28px" }}>
          <h3 style={{ color: "#0f172a", fontWeight: 800, fontSize: "1.15rem", margin: "0 0 18px", display: "flex", alignItems: "center", gap: 8 }}>
            🏛️ {t(lang, "1. संगठन मूल पहचान, पंजीकरण एवं लोगो", "1. Organization Core Identity, Registration & Logo")}
          </h3>

          <div className="form-grid" style={{ rowGap: 18, columnGap: 24 }}>
            <div>
              <label className="about-form-label">{t(lang, "संगठन नाम (हिंदी)", "Organization Name (Hindi)")}</label>
              <Inp name="orgNameHi" defaultValue={s.orgNameHi || "उत्तर प्रदेश बैंक मित्र संघ"} required />
            </div>
            <div>
              <label className="about-form-label">{t(lang, "Organization Name (English)", "Organization Name (English)")}</label>
              <Inp name="orgNameEn" defaultValue={s.orgNameEn || "Uttar Pradesh Bank Mitra Sangh"} required />
            </div>

            <div>
              <label className="about-form-label">{t(lang, "संक्षिप्त नाम (Short Name)", "Short Name (Acronym)")}</label>
              <Inp name="shortName" defaultValue={s.shortName || "UPBMS"} />
            </div>
            <div>
              <label className="about-form-label">{t(lang, "पंजीकरण विवरण", "Registration Details")}</label>
              <Inp name="regNumber" defaultValue={s.regNumber || "Regd. No.: UP-REG-LKO-2024-8841"} />
            </div>

            <div>
              <label className="about-form-label">{t(lang, "टैगलाइन (हिंदी)", "Tagline (Hindi)")}</label>
              <Inp name="taglineHi" defaultValue={s.taglineHi || "बैंक मित्र एकता जिंदाबाद • सम्मान, सुरक्षा और स्थायी मानदेय का संकल्प"} />
            </div>
            <div>
              <label className="about-form-label">{t(lang, "Tagline (English)", "Tagline (English)")}</label>
              <Inp name="taglineEn" defaultValue={s.taglineEn || "Unity of Bank Mitras • Dignity, Social Security & Assured Monthly Honorarium"} />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label className="about-form-label">{t(lang, "संगठन का आधिकारिक लोगो (Logo)", "Official Organization Logo")}</label>
              <div style={{ display: "flex", alignItems: "center", gap: 14, background: "#f8fafc", padding: "12px 18px", borderRadius: 12, border: "1.5px solid #cbd5e1", maxWidth: 540 }}>
                <img
                  src={logoUrl || "/images/upbms-logo.png"}
                  alt="Logo Preview"
                  style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "contain", background: "#ffffff", border: "1.5px solid #cbd5e1", flexShrink: 0, padding: 3 }}
                  onError={(e) => { e.target.onerror = null; e.target.src = "/images/upbms-logo.png"; }}
                />
                <div style={{ flex: 1 }}>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ fontSize: "0.85rem", cursor: "pointer" }}
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      setUploading(true);
                      try {
                        const url = await uploadFile(f, session);
                        setLogoUrl(url);
                        showToast(t(lang, "लोगो इमेज तैयार है", "Logo uploaded"));
                      } catch (err) {
                        showToast(err.message);
                      } finally {
                        setUploading(false);
                      }
                    }}
                  />
                  <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: 4 }}>
                    {uploading ? (
                      <span style={{ color: "#ea580c", fontWeight: 700 }}>⏳ अपलोड हो रहा है...</span>
                    ) : (
                      t(lang, "अनुशंसित: PNG/SVG पारदर्शी पृष्ठभूमि (Transparent)", "Recommended: Transparent PNG or SVG")
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION 2: संपर्क सूत्र, हेल्पलाइन एवं मुख्यालय पता ── */}
      {(activeSection === "all" || activeSection === "contact") && (
        <div className="card-panel" style={{ borderRadius: 16, padding: "24px 28px" }}>
          <h3 style={{ color: "#0f172a", fontWeight: 800, fontSize: "1.15rem", margin: "0 0 18px", display: "flex", alignItems: "center", gap: 8 }}>
            📞 {t(lang, "2. संपर्क सूत्र, हेल्पलाइन एवं मुख्यालय पता", "2. Contact Numbers, Helpline & Head Office Address")}
          </h3>

          <div className="form-grid" style={{ rowGap: 18, columnGap: 24 }}>
            <div>
              <label className="about-form-label">{t(lang, "प्राथमिक हेल्पलाइन", "Primary Helpline")}</label>
              <Inp name="helplinePrimary" defaultValue={s.helplinePrimary || "+91-94500-11223"} />
            </div>
            <div>
              <label className="about-form-label">{t(lang, "ईमेल एवं WhatsApp नंबर", "Email & WhatsApp Number")}</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Inp name="email" defaultValue={s.email || "helpdesk@upbms.org.in"} placeholder="helpdesk@upbms.org.in" />
                <Inp name="whatsappNumber" defaultValue={s.whatsappNumber || "919450011223"} placeholder="919450011223" />
              </div>
            </div>

            <div>
              <label className="about-form-label">{t(lang, "मुख्यालय पता (हिंदी)", "Head Office Address (Hindi)")}</label>
              <Inp name="headOfficeHi" defaultValue={s.headOfficeHi || "प्रांतीय केंद्रीय कार्यालय: हज़रतगंज, लखनऊ — 226001 (उत्तर प्रदेश)"} />
            </div>
            <div>
              <label className="about-form-label">{t(lang, "Head Office Address (English)", "Head Office Address (English)")}</label>
              <Inp name="headOfficeEn" defaultValue={s.headOfficeEn || "State Central Office: Hazratganj, Lucknow — 226001 (Uttar Pradesh)"} />
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION 3: वेबसाइट रंग थीम ── */}
      {(activeSection === "all" || activeSection === "theme") && (
        <div className="card-panel" style={{ borderRadius: 16, padding: "24px 28px" }}>
          <h3 style={{ color: "#0f172a", fontWeight: 800, fontSize: "1.15rem", margin: "0 0 18px", display: "flex", alignItems: "center", gap: 8 }}>
            🎨 {t(lang, "3. वेबसाइट रंग थीम (Color Theme Preset)", "3. Website Color Theme Preset")}
          </h3>

          <div style={{ maxWidth: 540 }}>
            <label className="about-form-label">{t(lang, "रंग थीम चयन करें", "Select Active Color Theme")}</label>
            <select
              name="themePreset"
              defaultValue={s.themePreset || "navy_saffron"}
              className="form-control"
              style={{ fontWeight: 700, borderRadius: 8, height: 42, background: "#ffffff", cursor: "pointer", marginBottom: 14 }}
            >
              <option value="navy_saffron">{t(lang, "नेवी ब्लू एवं केसरिया (Navy & Saffron)", "Navy & Saffron")}</option>
              <option value="blue_green">{t(lang, "नीला एवं हरा (Blue & Green)", "Blue & Green")}</option>
              <option value="maroon_gold">{t(lang, "मैरून एवं गोल्ड (Maroon & Gold)", "Maroon & Gold")}</option>
              <option value="classic_dark">{t(lang, "क्लासिक डार्क (Classic Dark)", "Classic Dark")}</option>
            </select>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 8, background: "#f8fafc", padding: "12px 14px", borderRadius: 10, border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem", fontWeight: 700 }}>
                <span style={{ width: 14, height: 14, borderRadius: "50%", background: "#0b1a30", display: "inline-block" }}></span>
                <span>Navy</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem", fontWeight: 700 }}>
                <span style={{ width: 14, height: 14, borderRadius: "50%", background: "#ea580c", display: "inline-block" }}></span>
                <span>Saffron</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem", fontWeight: 700 }}>
                <span style={{ width: 14, height: 14, borderRadius: "50%", background: "#0284c7", display: "inline-block" }}></span>
                <span>Sky Blue</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem", fontWeight: 700 }}>
                <span style={{ width: 14, height: 14, borderRadius: "50%", background: "#16a34a", display: "inline-block" }}></span>
                <span>Green</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION 4: ताज़ा सूचना टिकर ── */}
      {(activeSection === "all" || activeSection === "ticker") && (
        <div className="card-panel" style={{ borderRadius: 16, padding: "24px 28px" }}>
          <h3 style={{ color: "#0f172a", fontWeight: 800, fontSize: "1.15rem", margin: "0 0 8px", display: "flex", alignItems: "center", gap: 8 }}>
            📢 {t(lang, "4. ताज़ा सूचना टिकर (Live Announcement Ticker)", "4. Live Announcement Ticker")}
          </h3>
          <p style={{ color: "#64748b", fontSize: "0.85rem", margin: "0 0 18px" }}>
            {t(lang, "प्रत्येक पंक्ति होमपेज के शीर्ष टिकर में एक अलग सूचना के रूप में बारी-बारी से स्क्रॉल होगी।", "Each line will scroll alternately as a distinct notice in the top announcement bar.")}
          </p>

          <div className="form-grid" style={{ rowGap: 18, columnGap: 24 }}>
            <div>
              <label className="about-form-label">{t(lang, "ताज़ा सूचना टिकर — प्रति पंक्ति 1 (हिंदी)", "Notice Ticker — One per line (Hindi)")}</label>
              <textarea
                name="tickerNoticesHi"
                rows={4}
                className="form-control"
                defaultValue={(s.tickerNoticesHi || []).join("\n")}
                style={{ width: "100%", fontSize: "0.86rem", padding: "10px 14px", borderRadius: 8, border: "1.5px solid #cbd5e1", resize: "vertical" }}
              />
            </div>
            <div>
              <label className="about-form-label">{t(lang, "Ticker Notices — One per line (English)", "Ticker Notices — One per line (English)")}</label>
              <textarea
                name="tickerNoticesEn"
                rows={4}
                className="form-control"
                defaultValue={(s.tickerNoticesEn || []).join("\n")}
                style={{ width: "100%", fontSize: "0.86rem", padding: "10px 14px", borderRadius: 8, border: "1.5px solid #cbd5e1", resize: "vertical" }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION 5: सोशल मीडिया लिंक्स (WITH OPTION TO DELETE SPECIFIC PLATFORMS) ── */}
      {(activeSection === "all" || activeSection === "socials") && (
        <div className="card-panel" style={{ borderRadius: 16, padding: "24px 28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
            <div>
              <h3 style={{ color: "#0f172a", fontWeight: 800, fontSize: "1.15rem", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                🌐 {t(lang, "5. आधिकारिक सोशल मीडिया व अतिरिक्त लिंक्स", "5. Official Social Media & Custom Links")}
              </h3>
              <p style={{ color: "#64748b", fontSize: "0.85rem", margin: "4px 0 0" }}>
                {t(lang, "यहाँ से किसी भी सोशल मीडिया को हटाएँ या उसका URL बदलें — हटाने पर वह वेबसाइट के हेडर व फुटर से स्वतः छिप जाएगा।", "Remove any social media or edit its URL — removed platforms are hidden from website header and footer automatically.")}
              </p>
            </div>
            <span className="badge badge-active" style={{ fontSize: "0.85rem", padding: "6px 14px", fontWeight: 700 }}>
              {activeSocialCount} {t(lang, "सक्रिय लिंक्स", "Active Links")}
            </span>
          </div>

          <div style={{ display: "grid", gap: 14 }}>
            {/* 1. WhatsApp Channel */}
            <div style={{ background: "#ffffff", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 200 }}>
                <span style={{ width: 34, height: 34, borderRadius: "50%", background: "#22c55e", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>
                  💬
                </span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "0.92rem", color: "#0f172a" }}>WhatsApp Channel</div>
                  <div style={{ fontSize: "0.76rem", color: socials.whatsappChannel ? "#16a34a" : "#94a3b8", fontWeight: 700 }}>
                    {socials.whatsappChannel ? "✓ सक्रिय (Active)" : "✕ हटाया गया (Disabled)"}
                  </div>
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 240 }}>
                <input
                  type="text"
                  name="soc_waCh"
                  value={socials.whatsappChannel}
                  onChange={(e) => setSocials({ ...socials, whatsappChannel: e.target.value })}
                  placeholder="https://whatsapp.com/channel/..."
                  className="form-control"
                  style={{ width: "100%", fontSize: "0.86rem" }}
                />
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {socials.whatsappChannel && (
                  <button
                    type="button"
                    className="cert-btn-delete"
                    style={{ padding: "5px 12px", fontSize: "0.8rem", borderRadius: 6 }}
                    onClick={() => deleteSpecificSocial("whatsappChannel", "WhatsApp Channel")}
                    title={t(lang, "WhatsApp Channel हटाएं", "Remove WhatsApp Channel")}
                  >
                    🗑️ {t(lang, "हटाएँ", "Delete")}
                  </button>
                )}
              </div>
            </div>

            {/* 2. WhatsApp Group */}
            <div style={{ background: "#ffffff", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 200 }}>
                <span style={{ width: 34, height: 34, borderRadius: "50%", background: "#16a34a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>
                  👥
                </span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "0.92rem", color: "#0f172a" }}>WhatsApp Group</div>
                  <div style={{ fontSize: "0.76rem", color: socials.whatsappGroup ? "#16a34a" : "#94a3b8", fontWeight: 700 }}>
                    {socials.whatsappGroup ? "✓ सक्रिय (Active)" : "✕ हटाया गया (Disabled)"}
                  </div>
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 240 }}>
                <input
                  type="text"
                  name="soc_waGr"
                  value={socials.whatsappGroup}
                  onChange={(e) => setSocials({ ...socials, whatsappGroup: e.target.value })}
                  placeholder="https://chat.whatsapp.com/..."
                  className="form-control"
                  style={{ width: "100%", fontSize: "0.86rem" }}
                />
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {socials.whatsappGroup && (
                  <button
                    type="button"
                    className="cert-btn-delete"
                    style={{ padding: "5px 12px", fontSize: "0.8rem", borderRadius: 6 }}
                    onClick={() => deleteSpecificSocial("whatsappGroup", "WhatsApp Group")}
                    title={t(lang, "WhatsApp Group हटाएं", "Remove WhatsApp Group")}
                  >
                    🗑️ {t(lang, "हटाएँ", "Delete")}
                  </button>
                )}
              </div>
            </div>

            {/* 3. Facebook */}
            <div style={{ background: "#ffffff", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 200 }}>
                <span style={{ width: 34, height: 34, borderRadius: "50%", background: "#1877f2", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>
                  📘
                </span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "0.92rem", color: "#0f172a" }}>Facebook</div>
                  <div style={{ fontSize: "0.76rem", color: socials.facebook ? "#16a34a" : "#94a3b8", fontWeight: 700 }}>
                    {socials.facebook ? "✓ सक्रिय (Active)" : "✕ हटाया गया (Disabled)"}
                  </div>
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 240 }}>
                <input
                  type="text"
                  name="soc_fb"
                  value={socials.facebook}
                  onChange={(e) => setSocials({ ...socials, facebook: e.target.value })}
                  placeholder="https://facebook.com/..."
                  className="form-control"
                  style={{ width: "100%", fontSize: "0.86rem" }}
                />
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {socials.facebook && (
                  <button
                    type="button"
                    className="cert-btn-delete"
                    style={{ padding: "5px 12px", fontSize: "0.8rem", borderRadius: 6 }}
                    onClick={() => deleteSpecificSocial("facebook", "Facebook")}
                    title={t(lang, "Facebook हटाएं", "Remove Facebook")}
                  >
                    🗑️ {t(lang, "हटाएँ", "Delete")}
                  </button>
                )}
              </div>
            </div>

            {/* 4. Instagram */}
            <div style={{ background: "#ffffff", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 200 }}>
                <span style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>
                  📷
                </span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "0.92rem", color: "#0f172a" }}>Instagram</div>
                  <div style={{ fontSize: "0.76rem", color: socials.instagram ? "#16a34a" : "#94a3b8", fontWeight: 700 }}>
                    {socials.instagram ? "✓ सक्रिय (Active)" : "✕ हटाया गया (Disabled)"}
                  </div>
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 240 }}>
                <input
                  type="text"
                  name="soc_ig"
                  value={socials.instagram}
                  onChange={(e) => setSocials({ ...socials, instagram: e.target.value })}
                  placeholder="https://instagram.com/..."
                  className="form-control"
                  style={{ width: "100%", fontSize: "0.86rem" }}
                />
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {socials.instagram && (
                  <button
                    type="button"
                    className="cert-btn-delete"
                    style={{ padding: "5px 12px", fontSize: "0.8rem", borderRadius: 6 }}
                    onClick={() => deleteSpecificSocial("instagram", "Instagram")}
                    title={t(lang, "Instagram हटाएं", "Remove Instagram")}
                  >
                    🗑️ {t(lang, "हटाएँ", "Delete")}
                  </button>
                )}
              </div>
            </div>

            {/* 5. YouTube */}
            <div style={{ background: "#ffffff", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 200 }}>
                <span style={{ width: 34, height: 34, borderRadius: "50%", background: "#ff0000", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>
                  📺
                </span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "0.92rem", color: "#0f172a" }}>YouTube</div>
                  <div style={{ fontSize: "0.76rem", color: socials.youtube ? "#16a34a" : "#94a3b8", fontWeight: 700 }}>
                    {socials.youtube ? "✓ सक्रिय (Active)" : "✕ हटाया गया (Disabled)"}
                  </div>
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 240 }}>
                <input
                  type="text"
                  name="soc_yt"
                  value={socials.youtube}
                  onChange={(e) => setSocials({ ...socials, youtube: e.target.value })}
                  placeholder="https://youtube.com/@..."
                  className="form-control"
                  style={{ width: "100%", fontSize: "0.86rem" }}
                />
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {socials.youtube && (
                  <button
                    type="button"
                    className="cert-btn-delete"
                    style={{ padding: "5px 12px", fontSize: "0.8rem", borderRadius: 6 }}
                    onClick={() => deleteSpecificSocial("youtube", "YouTube")}
                    title={t(lang, "YouTube हटाएं", "Remove YouTube")}
                  >
                    🗑️ {t(lang, "हटाएँ", "Delete")}
                  </button>
                )}
              </div>
            </div>

            {/* 6. X (Twitter) */}
            <div style={{ background: "#ffffff", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 200 }}>
                <span style={{ width: 34, height: 34, borderRadius: "50%", background: "#000000", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", fontWeight: 900 }}>
                  𝕏
                </span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "0.92rem", color: "#0f172a" }}>X (Twitter)</div>
                  <div style={{ fontSize: "0.76rem", color: socials.twitter ? "#16a34a" : "#94a3b8", fontWeight: 700 }}>
                    {socials.twitter ? "✓ सक्रिय (Active)" : "✕ हटाया गया (Disabled)"}
                  </div>
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 240 }}>
                <input
                  type="text"
                  name="soc_tw"
                  value={socials.twitter}
                  onChange={(e) => setSocials({ ...socials, twitter: e.target.value })}
                  placeholder="https://x.com/..."
                  className="form-control"
                  style={{ width: "100%", fontSize: "0.86rem" }}
                />
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {socials.twitter && (
                  <button
                    type="button"
                    className="cert-btn-delete"
                    style={{ padding: "5px 12px", fontSize: "0.8rem", borderRadius: 6 }}
                    onClick={() => deleteSpecificSocial("twitter", "X (Twitter)")}
                    title={t(lang, "X (Twitter) हटाएं", "Remove X (Twitter)")}
                  >
                    🗑️ {t(lang, "हटाएँ", "Delete")}
                  </button>
                )}
              </div>
            </div>

            {/* 7. Telegram */}
            <div style={{ background: "#ffffff", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 200 }}>
                <span style={{ width: 34, height: 34, borderRadius: "50%", background: "#0088cc", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>
                  ✈️
                </span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "0.92rem", color: "#0f172a" }}>Telegram</div>
                  <div style={{ fontSize: "0.76rem", color: socials.telegram ? "#16a34a" : "#94a3b8", fontWeight: 700 }}>
                    {socials.telegram ? "✓ सक्रिय (Active)" : "✕ हटाया गया (Disabled)"}
                  </div>
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 240 }}>
                <input
                  type="text"
                  name="soc_tg"
                  value={socials.telegram}
                  onChange={(e) => setSocials({ ...socials, telegram: e.target.value })}
                  placeholder="https://t.me/..."
                  className="form-control"
                  style={{ width: "100%", fontSize: "0.86rem" }}
                />
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {socials.telegram && (
                  <button
                    type="button"
                    className="cert-btn-delete"
                    style={{ padding: "5px 12px", fontSize: "0.8rem", borderRadius: 6 }}
                    onClick={() => deleteSpecificSocial("telegram", "Telegram")}
                    title={t(lang, "Telegram हटाएं", "Remove Telegram")}
                  >
                    🗑️ {t(lang, "हटाएँ", "Delete")}
                  </button>
                )}
              </div>
            </div>

            {/* 8. Extra Link 1 */}
            <div style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
              <div style={{ minWidth: 160 }}>
                <div style={{ fontWeight: 800, fontSize: "0.9rem", color: "#0f172a" }}>🔗 {t(lang, "कस्टम लिंक 1", "Custom Link 1")}</div>
                <div style={{ fontSize: "0.76rem", color: socials.extra1Url ? "#16a34a" : "#94a3b8", fontWeight: 700 }}>
                  {socials.extra1Url ? "✓ सक्रिय (Active)" : "✕ हटाया गया (Disabled)"}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10, flex: 1, minWidth: 260 }}>
                <input
                  type="text"
                  name="soc_ex1Lbl"
                  value={socials.extra1Label}
                  onChange={(e) => setSocials({ ...socials, extra1Label: e.target.value })}
                  placeholder={t(lang, "नाम (उदा: पोर्टल)", "Name")}
                  className="form-control"
                  style={{ fontSize: "0.86rem" }}
                />
                <input
                  type="text"
                  name="soc_ex1Url"
                  value={socials.extra1Url}
                  onChange={(e) => setSocials({ ...socials, extra1Url: e.target.value })}
                  placeholder="https://..."
                  className="form-control"
                  style={{ fontSize: "0.86rem" }}
                />
              </div>
              {socials.extra1Url && (
                <button
                  type="button"
                  className="cert-btn-delete"
                  style={{ padding: "5px 12px", fontSize: "0.8rem", borderRadius: 6 }}
                  onClick={() => deleteSpecificSocial("extra1", "Custom Link 1")}
                  title={t(lang, "कस्टम लिंक 1 हटाएं", "Remove Custom Link 1")}
                >
                  🗑️ {t(lang, "हटाएँ", "Delete")}
                </button>
              )}
            </div>

            {/* 9. Extra Link 2 */}
            <div style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
              <div style={{ minWidth: 160 }}>
                <div style={{ fontWeight: 800, fontSize: "0.9rem", color: "#0f172a" }}>🔗 {t(lang, "कस्टम लिंक 2", "Custom Link 2")}</div>
                <div style={{ fontSize: "0.76rem", color: socials.extra2Url ? "#16a34a" : "#94a3b8", fontWeight: 700 }}>
                  {socials.extra2Url ? "✓ सक्रिय (Active)" : "✕ हटाया गया (Disabled)"}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10, flex: 1, minWidth: 260 }}>
                <input
                  type="text"
                  name="soc_ex2Lbl"
                  value={socials.extra2Label}
                  onChange={(e) => setSocials({ ...socials, extra2Label: e.target.value })}
                  placeholder={t(lang, "नाम (उदा: ब्लॉग)", "Name")}
                  className="form-control"
                  style={{ fontSize: "0.86rem" }}
                />
                <input
                  type="text"
                  name="soc_ex2Url"
                  value={socials.extra2Url}
                  onChange={(e) => setSocials({ ...socials, extra2Url: e.target.value })}
                  placeholder="https://..."
                  className="form-control"
                  style={{ fontSize: "0.86rem" }}
                />
              </div>
              {socials.extra2Url && (
                <button
                  type="button"
                  className="cert-btn-delete"
                  style={{ padding: "5px 12px", fontSize: "0.8rem", borderRadius: 6 }}
                  onClick={() => deleteSpecificSocial("extra2", "Custom Link 2")}
                  title={t(lang, "कस्टम लिंक 2 हटाएं", "Remove Custom Link 2")}
                >
                  🗑️ {t(lang, "हटाएँ", "Delete")}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION 6: सुरक्षा पिन ── */}
      {(activeSection === "all" || activeSection === "security") && (
        <div className="card-panel" style={{ borderRadius: 16, padding: "24px 28px" }}>
          <h3 style={{ color: "#0f172a", fontWeight: 800, fontSize: "1.15rem", margin: "0 0 10px", display: "flex", alignItems: "center", gap: 8 }}>
            🔐 {t(lang, "6. एडमिन सुरक्षा पिन (Admin Security PIN)", "6. Admin Security PIN")}
          </h3>
          <p style={{ color: "#64748b", fontSize: "0.85rem", margin: "0 0 16px" }}>
            {t(lang, "यह पिन एडमिन कंट्रोल पैनल में लॉगिन करने के लिए सुरक्षित रहता है।", "This PIN secures access to the Super Admin Control Panel.")}
          </p>

          <div style={{ maxWidth: 440 }}>
            <label className="about-form-label">{t(lang, "नया एडमिन सुरक्षा पिन (बदलना हो तो लिखें)", "New Admin PIN (Leave blank to keep current)")}</label>
            <Inp name="newAdminPin" placeholder={t(lang, "खाली छोड़ने पर वर्तमान पिन रहेगा (डिफ़ॉल्ट: 1234)", "Leave blank to keep current PIN")} />
          </div>
        </div>
      )}

      {/* ── GLOBAL SAVE BUTTON (AT BOTTOM) ── */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
        <button type="submit" className="btn-save-orange" style={{ padding: "12px 28px", fontSize: "0.95rem" }}>
          💾 {t(lang, "संगठन पहचान व सोशल लिंक सेव करें", "Save Organization Identity & Social Links")}
        </button>
      </div>
    </form>
  );
}
