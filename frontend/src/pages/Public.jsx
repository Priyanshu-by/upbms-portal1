import { useEffect, useMemo, useState } from "react";
import { api, uploadFile } from "../api";
import { usePortal } from "../context";
import { HeroSlider, HtmlBlock, MemberCard, PortalCard } from "../components/Layout";
import { canAccessPersonal, canAccessReceipt, grievanceEnabled, localizeDual, qrSvg, t } from "../utils";

function SectionHead({ eyebrow, title, sub, action }) {
  return (
    <div className="section-head">
      <div>
        <span className="section-eyebrow">{eyebrow}</span>
        <h2 className="section-title">{title}</h2>
        {sub && <p className="section-sub">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function HomePage() {
  const { state, lang, setRoute, userLevel } = usePortal();
  const s = state.settings;
  const cb = s.campaignBlock || {};
  const stx = s.sectionTexts || {};
  const grv = grievanceEnabled(state);
  const members = state.members.filter((m) => m.status === "active" && !m.isCoreMember).slice(0, 6);
  const portals = state.externalLinks.filter((l) => l.active !== false);
  const sl = s.socialLinks || {};
  const go = (routeName) => setRoute(routeName === "demands" ? "home" : routeName);
  return (
    <>
      <section className="hero-showcase-wrapper">
        <div className="container">
          <HeroSlider />
          {stx.campaignDeckVisible !== false && (
            <div className="campaign-impact-deck">
              <div className="campaign-top-grid">
                <div>
                  <div className="campaign-pill">✨ {t(lang, cb.badgeHi, cb.badgeEn)}</div>
                  <h1 className="campaign-headline">{t(lang, cb.titleHi, cb.titleEn)}</h1>
                  <p className="campaign-sub">{t(lang, cb.subtitleHi, cb.subtitleEn)}</p>
                </div>
                <div className="campaign-cta-stack">
                  {userLevel === 4 ? (
                    <button className="btn btn-accent btn-lg" onClick={() => go(cb.btn1Route || "join")}>✍️ {t(lang, cb.btn1Hi, cb.btn1En)}</button>
                  ) : (
                    <button className="btn btn-accent btn-lg" onClick={() => setRoute("idcard")}>🪪 {t(lang, "पहचान पत्र व नियुक्ति पत्र", "View ID Card & Letter")}</button>
                  )}
                  <button className="btn btn-white btn-lg" onClick={() => document.getElementById("demands-section")?.scrollIntoView({ behavior: "smooth" })}>📋 {t(lang, cb.btn2Hi, cb.btn2En)}</button>
                  <button className="btn btn-whatsapp btn-lg" onClick={() => setRoute(cb.btn3Route === "grievance" && !grv ? "about" : (cb.btn3Route || "grievance"))}>⚖️ {t(lang, cb.btn3Hi, cb.btn3En)}</button>
                </div>
              </div>
              {stx.statBoxesVisible !== false && (
                <div className="impact-stats-row">
                  {(s.statCards || []).map((st, i) => (
                    <div className="impact-stat-box" key={i}>
                      <div className="impact-stat-icon">{st.icon || "⭐"}</div>
                      <div>
                        <div className="impact-stat-val">{t(lang, st.valueHi, st.valueEn)}</div>
                        <div className="impact-stat-lbl">{t(lang, st.labelHi, st.labelEn)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>


      {/* CIRCULARS SECTION */}
      {stx.homeCircularsVisible !== false && (
        <section className="section-block">
          <div className="container">
            <SectionHead
              eyebrow={`📑 ${t(lang, stx.homeCircularsEyebrowHi, stx.homeCircularsEyebrowEn)}`}
              title={t(lang, stx.homeCircularsTitleHi, stx.homeCircularsTitleEn)}
              sub={t(lang, stx.homeCircularsSubHi, stx.homeCircularsSubEn)}
              action={
                <button className="btn btn-primary btn-sm" onClick={() => setRoute("circulars")}>
                  📁 {t(lang, "सभी सर्कुलर व पीडीएफ देखें", "View All Circulars & PDFs")} →
                </button>
              }
            />
            <div className="circulars-grid">
              {(state.circulars || []).slice(0, 3).map((c) => <CircularCard key={c.id} item={c} />)}
            </div>
          </div>
        </section>
      )}

      {/* PORTALS SECTION */}
      {stx.homePortalsVisible !== false && (
        <section className="section-block alt-bg">
          <div className="container">
            <SectionHead eyebrow={`🌐 ${t(lang, stx.homePortalsEyebrowHi, stx.homePortalsEyebrowEn)}`} title={t(lang, stx.homePortalsTitleHi, stx.homePortalsTitleEn)} sub={t(lang, stx.homePortalsSubHi, stx.homePortalsSubEn)} action={<button className="btn btn-outline btn-sm" onClick={() => setRoute("portals")}>{t(lang, "सभी पोर्टल देखें", "View All Portals")} →</button>} />
            <div className="external-portals-grid">{portals.map((l) => <PortalCard key={l.id} link={l} />)}</div>
          </div>
        </section>
      )}

      {/* DEMANDS / CHARTER SECTION */}
      {stx.homeDemandsVisible !== false && (
        <section id="demands-section" className="section-block">
          <div className="container">
            <SectionHead
              eyebrow={`🤝 ${t(lang, stx.homeDemandsEyebrowHi, stx.homeDemandsEyebrowEn)}`}
              title={t(lang, stx.homeDemandsTitleHi, stx.homeDemandsTitleEn)}
              sub={t(lang, stx.homeDemandsSubHi, stx.homeDemandsSubEn)}
            />
            <div style={{ marginBottom: 18 }}>
              <button className="btn btn-outline btn-sm" onClick={() => setRoute("about")}>
                🏛 {t(lang, "संघ परिचय, प्रमाण-पत्र व मुख्य कार्यकारिणी →", "About, Certificates & Core Executive →")}
              </button>
            </div>
            <div className="demands-grid">
              {state.demands.map((d) => (
                <div className="demand-card" key={d.id}>
                  <div className="demand-num-row"><span className="demand-num">{d.number}</span><span className="demand-status">{t(lang, d.statusHi || d.status, d.statusEn || d.status)}</span></div>
                  <h3 className="demand-title">{t(lang, d.titleHi, d.titleEn)}</h3>
                  <p className="demand-desc">{t(lang, d.descHi, d.descEn)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* MEMBERS SECTION */}
      {stx.homeMembersVisible !== false && (
        <section className="section-block alt-bg">
          <div className="container">
            <SectionHead
              eyebrow={`👥 ${t(lang, stx.homeMembersEyebrowHi, stx.homeMembersEyebrowEn)}`}
              title={t(lang, stx.homeMembersTitleHi, stx.homeMembersTitleEn)}
              action={
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button className="btn btn-outline btn-sm" onClick={() => { sessionStorage.setItem("upbms_scroll_target", "core-executive-section"); setRoute("about"); }}>
                    👑 {t(lang, "प्रदेश मुख्य कार्यकारिणी देखें", "View State Executive")}
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={() => setRoute("members")}>
                    · {t(lang, "संपूर्ण सदस्य सूची", "Full Member Directory")} →
                  </button>
                </div>
              }
            />
            <div className="general-members-grid">
              {members.map((m) => <MemberCard key={m.id} member={m} compact />)}
            </div>
          </div>
        </section>
      )}

      {/* NEWS & SOCIAL SECTION */}
      {stx.homeNewsVisible !== false && (
        <section className="section-block">
          <div className="container">
            <SectionHead
              eyebrow={`📰 ${t(lang, stx.homeNewsEyebrowHi, stx.homeNewsEyebrowEn)}`}
              title={t(lang, stx.homeNewsTitleHi, stx.homeNewsTitleEn)}
            />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,330px),1fr))", gap: 22 }}>
              {state.news.map((n) => (
                <article className="news-card" key={n.id}>
                  <div className="news-card-img-wrap">
                    <img src={n.imageUrl || "/images/hero-banner-1.jpg"} alt="" />
                  </div>
                  <div className="news-card-body">
                    <div className="news-meta-row">
                      <span className="news-category-tag">{t(lang, n.categoryHi || n.category, n.categoryEn || n.category)}</span>
                      {n.location && <span className="news-location">📍 {n.location}</span>}
                      <span className="news-date">📅 {n.date}</span>
                    </div>
                    <h3 className="news-title">{t(lang, n.titleHi, n.titleEn)}</h3>
                    <p className="news-summary">{t(lang, n.summaryHi, n.summaryEn)}</p>
                    <a
                      className="btn btn-whatsapp btn-sm news-share-btn"
                      href={`https://wa.me/?text=${encodeURIComponent((t(lang, n.titleHi, n.titleEn) || "") + "\n" + (n.link || window.location.href))}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      🟢 {t(lang, "WhatsApp पर साझा करें", "Share on WhatsApp")}
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

export function AboutPage() {
  const { state, lang } = usePortal();
  const avm = state.settings.aboutVisionMission || {};
  const points = lang === "en" ? (avm.missionPointsEn || []) : (avm.missionPointsHi || []);
  const core = state.members.filter((m) => m.status === "active" && m.isCoreMember);
  useEffect(() => {
    const target = sessionStorage.getItem("upbms_scroll_target");
    if (target) {
      sessionStorage.removeItem("upbms_scroll_target");
      setTimeout(() => {
        document.getElementById(target)?.scrollIntoView({ behavior: "smooth" });
      }, 120);
    }
  }, []);
  return (
    <>
      <section className="section-block"><div className="container"><div className="about-vm-card">
        <div className="about-hero-banner">
          <span className="campaign-pill">🏛️ {t(lang, "संगठन परिचय एवं संकल्प", "ABOUT THE ASSOCIATION")}</span>
          <h1 style={{ color: "#ffd166" }}>{t(lang, avm.aboutTitleHi || "उत्तर प्रदेश बैंक मित्र संघ (UPBMS) — परिचय", avm.aboutTitleEn || "About Uttar Pradesh Bank Mitra Sangh (UPBMS)")}</h1>
          <p style={{ color: "#f1f5f9", lineHeight: 1.8 }}>{t(lang, avm.aboutBodyHi, avm.aboutBodyEn)}</p>
        </div>
        <div className="vm-two-col">
          <div className="vm-panel"><h2>🔭 {t(lang, avm.visionTitleHi, avm.visionTitleEn)}</h2><p>{t(lang, avm.visionBodyHi, avm.visionBodyEn)}</p></div>
          <div className="vm-panel mission"><h2>🎯 {t(lang, avm.missionTitleHi, avm.missionTitleEn)}</h2><ul>{points.map((p) => <li key={p}>{p}</li>)}</ul></div>
        </div>
      </div></div></section>
      {state.settings?.sectionTexts?.certificatesVisible !== false && (
        <section className="section-block alt-bg"><div className="container">
          <SectionHead eyebrow={t(lang, "आधिकारिक प्रमाणन", "OFFICIAL CERTIFICATES")} title={t(lang, avm.certSectionTitleHi || "संगठन पंजीकरण एवं प्राप्त प्रमाण-पत्र", avm.certSectionTitleEn || "Association Registrations & Certificates")} sub={t(lang, avm.certSectionSubHi, avm.certSectionSubEn)} />
          <div className="certificates-grid">{(state.certificates || []).map((c) => <CircularCard key={c.id} item={c} kind="certificate" />)}</div>
        </div></section>
      )}
      <section id="core-executive-section" className="section-block"><div className="container">
        <SectionHead eyebrow={t(lang, "शीर्ष नेतृत्व", "STATE LEADERSHIP")} title={t(lang, avm.coreSectionTitleHi || "प्रदेश मुख्य कार्यकारिणी (Core Members)", avm.coreSectionTitleEn || "State Core Executive Committee (Core Members)")} sub={t(lang, avm.coreSectionSubHi, avm.coreSectionSubEn)} />
        <div className="core-members-grid">{core.map((m) => <MemberCard key={m.id} member={m} />)}</div>
      </div></section>
    </>
  );
}

export function MembersPage() {
  const { state, lang, userLevel, canAccessMembers, setRoute, setModal } = usePortal();
  const [q, setQ] = useState("");
  const [district, setDistrict] = useState("");
  const [bank, setBank] = useState("");

  if (!canAccessMembers) {
    return (
      <section className="section-block">
        <div className="container" style={{ maxWidth: 680, textAlign: "center", margin: "40px auto" }}>
          <div className="card-panel" style={{ padding: "48px 24px", borderTop: "6px solid var(--accent)", borderRadius: 16 }}>
            <div style={{ fontSize: "3.5rem", marginBottom: 16 }}>🔒</div>
            <span className="badge badge-level4" style={{ fontSize: "0.85rem", padding: "4px 12px", marginBottom: 12, display: "inline-block" }}>
              👤 {t(lang, "सामान्य आगंतुक विधा", "Guest Visitor Mode")}
            </span>
            <h2 style={{ color: "var(--primary)", fontSize: "1.75rem", fontWeight: 900, marginTop: 8 }}>
              {t(lang, "सदस्य सूची (केवल पंजीकृत सदस्यों हेतु आरक्षित)", "Members Directory (Reserved for Registered Members)")}
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "1.05rem", lineHeight: 1.6, margin: "16px 0 28px" }}>
              {t(
                lang,
                "सुरक्षा एवं गोपनीयता नियमों के अनुसार संपूर्ण सदस्य सूची केवल पंजीकृत एवं सत्यापित बैंक मित्र सदस्यों के लिए उपलब्ध है। सदस्य सूची देखने हेतु कृपया सदस्यता पंजीकरण करें अथवा अपने खाते में लॉगिन करें।",
                "Per association privacy and security guidelines, the full member directory is accessible only to verified members. Please register for membership or log in to your existing account."
              )}
            </p>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <button className="btn btn-accent btn-lg" onClick={() => { setRoute("join"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                ✍️ {t(lang, "सदस्यता पंजीकरण करें", "Join Membership")}
              </button>
              <button className="btn btn-outline btn-lg" onClick={() => setModal({ kind: "login" })}>
                🔑 {t(lang, "सदस्य लॉगिन करें", "Member Login")}
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const handleReset = () => {
    setQ("");
    setDistrict("");
    setBank("");
  };

  const list = state.members.filter((m) => {
    if (m.status !== "active") return false;
    if (district && m.district !== district) return false;
    if (bank && m.bankName !== bank) return false;
    if (q && !`${m.nameHi} ${m.nameEn} ${m.memberCode} ${m.district} ${m.mobile} ${m.koCode}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });
  return (
    <section className="section-block"><div className="container">
      <SectionHead eyebrow={t(lang, "75 जनपद सदस्य नेटवर्क", "75 DISTRICTS MEMBER DIRECTORY")} title={t(lang, "पंजीकृत पदाधिकारी एवं बैंक मित्र सदस्य सूची", "Registered Office-Bearers & Bank Mitra Members")} />
      <div className="member-filter-bar">
        <div className="member-filter-row">
          <input
            className="form-control"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t(lang, "नाम, सदस्य आईडी, मोबाइल या केओ कोड खोजें...", "Search name, member ID, mobile or KO code...")}
          />
          <select className="form-control" value={district} onChange={(e) => setDistrict(e.target.value)}>
            <option value="">{t(lang, "सभी 75 जनपद", "All 75 districts")}</option>
            {state.meta.districts.map((d) => <option key={d} value={d}>{localizeDual(d, lang)}</option>)}
          </select>
        </div>
        <div className="member-filter-row secondary-row">
          <select className="form-control bank-select" value={bank} onChange={(e) => setBank(e.target.value)}>
            <option value="">{t(lang, "सभी बैंक", "All banks")}</option>
            {state.meta.banks.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <button type="button" className="btn-filter-reset" onClick={handleReset}>
            {t(lang, "रीसेट", "Reset")}
          </button>
        </div>
      </div>
      {list.length === 0 ? <div className="card-panel">{t(lang, "कोई रिकॉर्ड नहीं मिला।", "No records found.")}</div> : <div className="general-members-grid">{list.map((m) => <MemberCard key={m.id} member={m} compact />)}</div>}
    </div></section>
  );
}
export function CircularCard({ item, kind = "circular" }) {
  const { lang, signed, setModal } = usePortal();
  const locked = Boolean((item.requiresMemberLogin || item.isLockedForVisitor) && !signed);
  const isPdf = item.fileType === "pdf" || String(item.fileUrl || "").toLowerCase().endsWith(".pdf");
  const typeLabel = locked ? t(lang, "सदस्य लॉगिन", "Members only") : isPdf ? "PDF" : t(lang, "परिपत्र / इमेज", "Circular / Image");
  return (
    <article className="circular-card">
      <div className="circular-card-toprow">
        <span className="badge badge-in_progress">{typeLabel}</span>
        {item.date && <span className="circular-date-badge">📅 {item.date}</span>}
      </div>
      <div className="circular-exact-thumb" style={{ cursor: "pointer" }} onClick={() => setModal({ kind: "file", item, locked })}>
        {locked
          ? <div style={{ textAlign: "center", padding: 28 }}>🔒 {t(lang, "देखने हेतु सदस्य लॉगिन आवश्यक", "Member login required")}</div>
          : isPdf
            ? <div style={{ textAlign: "center", padding: 28, fontSize: "2rem" }}>📕<div style={{ fontSize: "0.85rem", marginTop: 6, color: "var(--text-muted)" }}>PDF</div></div>
            : <img src={item.fileUrl} alt="" />}
      </div>
      {(item.issuerHi || item.issuerEn) && (
        <div className="circular-issuer-label">{t(lang, item.issuerHi, item.issuerEn)}</div>
      )}
      <h3 className="circular-card-title">{t(lang, item.titleHi, item.titleEn)}</h3>
      <div className="circular-card-actions">
        <button
          className="btn btn-primary btn-sm"
          onClick={() => locked ? setModal({ kind: "login" }) : setModal({ kind: "file", item, locked: false })}
        >
          <span>👁</span> {locked ? t(lang, "लॉगिन करें", "Login to view") : t(lang, "दस्तावेज़ देखें", "View document")}
        </button>
        {!locked && item.fileUrl && (
          <a className="btn btn-outline btn-sm" href={item.fileUrl} download target="_blank" rel="noreferrer">
            <span>⬇</span> {t(lang, "डाउनलोड करें", "Download")}
          </a>
        )}
      </div>
    </article>
  );
}

export function CircularsPage() {
  const { state, lang } = usePortal();
  const [q, setQ] = useState("");
  const stx = state.settings?.sectionTexts || {};
  const list = (state.circulars || []).filter((c) => !q || `${c.titleHi} ${c.titleEn} ${c.issuerHi}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <section className="section-block"><div className="container">
      <SectionHead
        eyebrow={`📑 ${t(lang, stx.homeCircularsEyebrowHi || "बैंक आदेश एवं आधिकारिक परिपत्र", stx.homeCircularsEyebrowEn || "BANK ORDERS & OFFICIAL CIRCULARS")}`}
        title={t(lang, stx.homeCircularsTitleHi || "बैंक मित्र सर्कुलर, आदेश एवं पीडीएफ", stx.homeCircularsTitleEn || "Bank Mitra circulars, orders and PDFs")}
        sub={t(lang, stx.homeCircularsSubHi, stx.homeCircularsSubEn)}
      />
      <div className="filter-bar"><input className="form-control" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t(lang, "सर्कुलर खोजें", "Search circulars")} /></div>
      <div className="circulars-grid">{list.map((c) => <CircularCard key={c.id} item={c} />)}</div>
    </div></section>
  );
}

export function DocumentsPage() {
  const { state, lang, signed, setModal } = usePortal();
  return (
    <section className="section-block"><div className="container">
      <SectionHead eyebrow={t(lang, "आधिकारिक संघ अभिलेख", "OFFICIAL ASSOCIATION RECORDS")} title={t(lang, "संघ दस्तावेज़", "Association Documents")} sub={t(lang, "हस्ताक्षर एवं मुहर युक्त प्रपत्र केवल सदस्य लॉगिन के बाद खुलते हैं।", "Signed and stamped copies open only after member login.")} />
      <div className="card-panel" style={{ marginBottom: 16, background: signed ? "#f0fdf4" : "#fff7ed" }}>
        {signed ? t(lang, "सत्यापित सत्र सक्रिय है।", "Verified session is active.") : t(lang, "बिना लॉगिन केवल सादा पाठ उपलब्ध है।", "Only plain text is available without login.")}
        {!signed && <button className="btn btn-primary btn-sm" style={{ marginLeft: 12 }} onClick={() => setModal({ kind: "login" })}>{t(lang, "सदस्य लॉगिन", "Member login")}</button>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,350px),1fr))", gap: 20 }}>
        {state.documents.map((d) => (
          <div className="card-panel" key={d.id}>
            <span className="badge badge-in_progress">{t(lang, d.categoryHi || d.category, d.categoryEn)}</span>
            <h3 style={{ color: "var(--primary)" }}>{t(lang, d.titleHi, d.titleEn)}</h3>
            <p>{t(lang, d.summaryHi, d.summaryEn)}</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="btn btn-outline btn-sm" onClick={() => setModal({ kind: "plainDoc", item: d })}>{t(lang, "सादा पाठ", "Plain text")}</button>
              <button className="btn btn-primary btn-sm" onClick={() => signed ? setModal({ kind: "signedDoc", item: d }) : setModal({ kind: "login" })}>{signed ? t(lang, "हस्ताक्षरित प्रपत्र", "Signed copy") : t(lang, "लॉगिन आवश्यक", "Login required")}</button>
            </div>
          </div>
        ))}
      </div>
    </div></section>
  );
}

export function PortalsPage() {
  const { state, lang } = usePortal();
  const stx = state.settings?.sectionTexts || {};
  const portals = (state.externalLinks || []).filter((l) => l.active !== false);
  return (
    <section className="section-block"><div className="container">
      <SectionHead
        eyebrow={`🌐 ${t(lang, stx.homePortalsEyebrowHi || "संबद्ध वेबसाइट्स", stx.homePortalsEyebrowEn || "LINKED PORTALS")}`}
        title={t(lang, stx.homePortalsTitleHi || "महत्वपूर्ण बैंकिंग एवं सरकारी पोर्टल", stx.homePortalsTitleEn || "Important banking and government portals")}
        sub={t(lang, stx.homePortalsSubHi, stx.homePortalsSubEn)}
      />
      <div className="external-portals-grid">{portals.map((l) => <PortalCard key={l.id} link={l} />)}</div>
    </div></section>
  );
}

export function JoinPage() {
  const { state, lang, showToast, refresh, session, persistSession, setRoute, userLevel } = usePortal();

  if (userLevel !== 4) {
    const isPending = session?.member && session.member.status !== "active";
    return (
      <section className="section-block">
        <div className="container" style={{ maxWidth: 650, margin: "40px auto", textAlign: "center" }}>
          <div className="card-panel" style={{ padding: "40px 24px", borderTop: `5px solid ${isPending ? "#f59e0b" : "var(--success)"}`, borderRadius: 16 }}>
            <div style={{ fontSize: "3rem", marginBottom: 12 }}>{isPending ? "⏳" : "✅"}</div>
            <h2 style={{ color: isPending ? "#b45309" : "var(--primary)", fontSize: "1.6rem", fontWeight: 900, marginTop: 8 }}>
              {isPending
                ? t(lang, "कृपया अनुमोदन की प्रतीक्षा करें (Approval Pending)", "Please Wait for Admin Approval")
                : t(lang, "आप पहले से ही पंजीकृत सदस्य हैं", "You Are Already a Registered Member")}
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "1rem", lineHeight: 1.6, margin: "14px 0 24px" }}>
              {isPending
                ? t(
                    lang,
                    "आपका सदस्यता आवेदन राज्य कार्यालय में अनुमोदन हेतु लंबित है। Level 1 / Level 2 एडमिन द्वारा अनुमोदित होते ही आपका खाता सक्रिय हो जाएगा।",
                    "Your membership application is pending approval from the State Office. Your Level 3 member account will activate once approved by Level 1 or Level 2 Admin."
                  )
                : t(
                    lang,
                    "आपका सदस्यता खाता पहले से सक्रिय है। नए सदस्यता पंजीकरण की आवश्यकता केवल नए आगंतुकों के लिए है। आप अपना आधिकारिक पहचान पत्र एवं नियुक्ति पत्र देख सकते हैं।",
                    "Your account is already active. New membership registration is for new visitors only. You can view your digital ID card and appointment letter below."
                  )}
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              {!isPending && (
                <button className="btn btn-primary btn-lg" onClick={() => setRoute("idcard")}>
                  🪪 {t(lang, "पहचान पत्र व नियुक्ति पत्र देखें", "View ID Card & Letter")}
                </button>
              )}
              <button className="btn btn-outline btn-lg" onClick={() => setRoute("home")}>
                🏠 {t(lang, "मुख्य पृष्ठ पर जाएं", "Go to Home")}
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const s = state.settings;
  const tc = s.termsAndConditions || {};

  // Calendar-Year Dynamic Membership Pricing
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1 (Jan) to 12 (Dec)
  const initEntry = s.entryFee !== undefined ? Number(s.entryFee) : 10;
  const initRate = s.monthlyMembershipFee !== undefined ? Number(s.monthlyMembershipFee) : 20;
  const remainingMonths = s.validityMode === "months" ? (Number(s.validityMonths) || 12) : Math.max(1, 13 - currentMonth);
  const initSubTotal = remainingMonths * initRate;
  const defaultCalculatedFee = initEntry + initSubTotal;

  const [pricingInfo, setPricingInfo] = useState({
    year: currentYear,
    currentMonth,
    remainingMonths,
    entryFee: initEntry,
    ratePerMonth: initRate,
    subscriptionTotal: initSubTotal,
    price: defaultCalculatedFee,
    validUntil: `${currentYear}-12-31`,
    validityDisplayEn: `${currentYear}-12-31 (Jan–Dec calendar year)`,
    validityDisplayHi: `${currentYear}-12-31 (जनवरी–दिसंबर कैलेंडर वर्ष)`,
    monthNameEn: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][currentMonth - 1] || "Current",
    monthNameHi: ["जनवरी", "फ़रवरी", "मार्च", "अप्रैल", "मई", "जून", "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"][currentMonth - 1] || "वर्तमान",
    descriptionEn: `Entry fee ₹${initEntry} + Monthly subscription (₹${initRate} × ${remainingMonths} remaining month(s) = ₹${initSubTotal}) = Total ₹${defaultCalculatedFee}`,
    descriptionHi: `प्रवेश शुल्क ₹${initEntry} + मासिक चन्दा (₹${initRate} × ${remainingMonths} शेष माह = ₹${initSubTotal}) = कुल ₹${defaultCalculatedFee}`,
    purposeEn: `Membership Fee (Entry ₹${initEntry} + ${remainingMonths} mo × ₹${initRate})`,
    purposeHi: `सदस्यता शुल्क (प्रवेश ₹${initEntry} + ₹${initRate} × ${remainingMonths} माह)`
  });

  const [paymentGatewayType] = useState("manual_upi");
  const [razorpayKeyId, setRazorpayKeyId] = useState("");
  const [showPricingSchedule, setShowPricingSchedule] = useState(false);
  const [payingRazorpay, setPayingRazorpay] = useState(false);

  // PNB Dynamic QR State (unused, kept for state safety)
  const [pnbOrder, setPnbOrder] = useState(null);
  const [pnbGenerating, setPnbGenerating] = useState(false);
  const [pnbSecondsLeft, setPnbSecondsLeft] = useState(600);
  const [pnbSimulating, setPnbSimulating] = useState(false);

  // Fetch dynamic membership pricing from backend server
  useEffect(() => {
    api("/api/payment/membership-pricing")
      .then((res) => {
        if (res.ok && res.pricing) {
          setPricingInfo(res.pricing);
        }
      })
      .catch((err) => console.warn("Failed to fetch server pricing:", err.message));
  }, []);

  // PNB Dynamic QR 10-Minute Countdown Timer
  useEffect(() => {
    if (!pnbOrder || pnbOrder.status !== "PENDING" || pnbSecondsLeft <= 0) return;
    const interval = setInterval(() => {
      setPnbSecondsLeft((sec) => {
        if (sec <= 1) {
          setPnbOrder((prev) => (prev ? { ...prev, status: "EXPIRED" } : null));
          return 0;
        }
        return sec - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [pnbOrder, pnbSecondsLeft]);

  // PNB Dynamic QR Server-to-Server Live Status Polling
  useEffect(() => {
    if (!pnbOrder || pnbOrder.status !== "PENDING") return;
    let cancelled = false;

    const pollInterval = setInterval(async () => {
      try {
        const res = await api(`/api/payment/pnb/check-status/${pnbOrder.orderId}`);
        if (cancelled) return;

        if (res.ok && res.status === "SUCCESS") {
          clearInterval(pollInterval);
          setPnbOrder((prev) => (prev ? { ...prev, status: "SUCCESS" } : null));
          showToast(t(lang, "✓ PNB डायनामिक QR भुगतान प्राप्त! सदस्यता सक्रिय की जा रही है...", "✓ PNB payment confirmed! Activating membership..."));

          // Auto-login newly registered Level 3 member
          const memberPass = res.member?.password || "123456";
          persistSession({
            memberId: res.member.id,
            memberPass,
            member: res.member,
            isAdmin: false,
            level: 3
          });
          await refresh({
            memberId: res.member.id,
            memberPass,
            member: res.member
          });
          setRoute("idcard");
        } else if (res.ok && res.status === "EXPIRED") {
          setPnbOrder((prev) => (prev ? { ...prev, status: "EXPIRED" } : null));
          clearInterval(pollInterval);
        }
      } catch (err) {
        // Polling retry on error
      }
    }, 3000);

    return () => {
      cancelled = true;
      clearInterval(pollInterval);
    };
  }, [pnbOrder]);

  const fee = pricingInfo.price;
  const [photoUrl, setPhotoUrl] = useState("");
  const [signatureUrl, setSignatureUrl] = useState("");
  const [busy, setBusy] = useState(false);

  // Form fields state
  const [nameHi, setNameHi] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [age, setAge] = useState("");
  const [mobile, setMobile] = useState("");
  const [localAddress, setLocalAddress] = useState("");
  const singleCategoryHi = s.membershipFormConfig?.categoryHi || "साधारण सदस्य (सक्रिय बैंक मित्र)";
  const singleCategoryEn = s.membershipFormConfig?.categoryEn || "Ordinary Member (Active Bank Mitra)";
  const [memberCategory, setMemberCategory] = useState(singleCategoryEn);
  const [applicationDate, setApplicationDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedBank, setSelectedBank] = useState((state.meta?.banks || [])[0] || "State Bank of India (SBI)");
  const [customBank, setCustomBank] = useState("");
  const [selectedBc, setSelectedBc] = useState((state.meta?.bcCompanies || [])[0] || "CSC e-Governance Services India Ltd.");
  const [customBc, setCustomBc] = useState("");

  // Email OTP & Verification state
  const [email, setEmail] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailSendingOtp, setEmailSendingOtp] = useState(false);
  const [emailVerifyingOtp, setEmailVerifyingOtp] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailVerificationToken, setEmailVerificationToken] = useState("");
  const [emailCountdown, setEmailCountdown] = useState(0);
  const [devOtpNotice, setDevOtpNotice] = useState("");

  // Payment Verification state
  const [paymentMode, setPaymentMode] = useState("UPI");
  const [utrNumber, setUtrNumber] = useState("");
  const [receiptProofUrl, setReceiptProofUrl] = useState("");
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  // Validation errors state
  const [errors, setErrors] = useState({
    nameHi: "",
    nameEn: "",
    fatherName: "",
    mobile: "",
    photo: "",
    email: "",
    utr: ""
  });

  // Countdown timer for Resend OTP
  useEffect(() => {
    if (emailCountdown > 0) {
      const timer = setTimeout(() => setEmailCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [emailCountdown]);

  const upi = `upi://pay?pa=${encodeURIComponent(s.upiId || "")}&pn=${encodeURIComponent(s.upiPayeeName || "")}&am=${fee}&cu=INR`;

  const recentList = useMemo(() => {
    const memPayments = (state.payments || []).filter((p) => p.paymentCategory === "membership").slice(0, 4);
    if (memPayments.length) {
      return memPayments.map((p) => ({
        nameHi: p.payerName || p.payerNameEn,
        nameEn: p.payerNameEn || p.payerName,
        code: p.receiptNo || p.memberCode || "UPBMS-RCP-2026",
        amount: p.amount
      }));
    }
    return (state.members || []).filter((m) => m.status === "active").slice(0, 4).map((m, idx) => ({
      nameHi: m.nameHi,
      nameEn: m.nameEn,
      code: `UPBMS-RCP-2026-100${idx + 1}`,
      amount: m.feePaid || s.membershipFeeGeneral || 251
    }));
  }, [state.payments, state.members, s.membershipFeeGeneral]);

  // Validation for names (disallow numbers)
  const handleNameChange = (field, setter, labelHi, labelEn) => (e) => {
    const val = e.target.value;
    setter(val);
    if (/\d|[\u0966-\u096F]/.test(val)) {
      setErrors((prev) => ({
        ...prev,
        [field]: t(lang, `${labelHi} में अंकों (numbers) की अनुमति नहीं है।`, `Numbers are not allowed in ${labelEn}.`)
      }));
    } else {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Validation for mobile (disallow >10 digits, digits only)
  const handleMobileInput = (e) => {
    const rawVal = e.target.value.replace(/\D/g, "").slice(0, 10);
    setMobile(rawVal);
    if (rawVal.length > 0 && rawVal.length < 10) {
      setErrors((prev) => ({
        ...prev,
        mobile: t(lang, "मोबाइल नंबर ठीक 10 अंकों का होना चाहिए।", "Mobile number must be exactly 10 digits.")
      }));
    } else {
      setErrors((prev) => ({ ...prev, mobile: "" }));
    }
  };

  // Validation specifically for Passport Size Photo (JPG/PNG only, <= 2MB, 7:9 ratio)
  const handlePassportPhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/jpg"];
    const ext = (file.name || "").split(".").pop().toLowerCase();
    const validExts = ["jpg", "jpeg", "png"];

    if (!validTypes.includes(file.type) && !validExts.includes(ext)) {
      const msg = t(
        lang,
        "अमान्य फॉर्मेट! केवल JPG, JPEG और PNG फॉर्मेट की अनुमति है।",
        "Invalid format! Only JPG, JPEG, and PNG formats are allowed."
      );
      setErrors((prev) => ({ ...prev, photo: msg }));
      showToast(msg);
      e.target.value = "";
      setPhotoUrl("");
      return;
    }

    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      const msg = t(
        lang,
        `फाइल का आकार 2 MB से अधिक है (${sizeMB} MB)। कृपया 2 MB से छोटी फोटो चुनें।`,
        `File size exceeds 2 MB (${sizeMB} MB). Please upload a file under 2 MB.`
      );
      setErrors((prev) => ({ ...prev, photo: msg }));
      showToast(msg);
      e.target.value = "";
      setPhotoUrl("");
      return;
    }

    try {
      setBusy(true);
      setErrors((prev) => ({ ...prev, photo: "" }));
      const url = await uploadFile(file, session, { folder: "upbms/members" });
      setPhotoUrl(url);
      showToast(t(lang, "पासपोर्ट फोटो सफलतापूर्वक अपलोड हो गई।", "Passport photo uploaded successfully."));
    } catch (err) {
      const msg = err.message || "Upload failed";
      setErrors((prev) => ({ ...prev, photo: msg }));
      showToast(msg);
      e.target.value = "";
      setPhotoUrl("");
    } finally {
      setBusy(false);
    }
  };

  const handleSignatureChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      showToast(t(lang, "हस्ताक्षर इमेज 2 MB से कम होनी चाहिए।", "Signature image must be under 2 MB."));
      e.target.value = "";
      return;
    }
    try {
      setBusy(true);
      const url = await uploadFile(file, session, { folder: "upbms/signatures" });
      setSignatureUrl(url);
      showToast(t(lang, "✓ हस्ताक्षर / अंगूठे का निशान अपलोड हो गया", "✓ Signature / thumb impression uploaded"));
    } catch (err) {
      showToast(err.message || "Signature upload failed");
    } finally {
      setBusy(false);
    }
  };

  // Upload payment receipt proof
  const handleReceiptProofChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingReceipt(true);
      const url = await uploadFile(file, session, { folder: "upbms/receipts" });
      setReceiptProofUrl(url);
      showToast(t(lang, "भुगतान रसीद स्क्रीनशॉट अपलोड हो गया।", "Receipt screenshot uploaded."));
    } catch (err) {
      showToast(err.message || "Upload failed");
    } finally {
      setUploadingReceipt(false);
    }
  };

  // Send Email Registration OTP
  const handleSendEmailOtp = async () => {
    const cleanEmail = String(email || "").trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      setErrors((prev) => ({
        ...prev,
        email: t(lang, "कृपया एक मान्य ईमेल आईडी दर्ज करें।", "Please enter a valid email address.")
      }));
      showToast(t(lang, "कृपया एक मान्य ईमेल आईडी दर्ज करें।", "Please enter a valid email address."));
      return;
    }
    setErrors((prev) => ({ ...prev, email: "" }));
    setEmailSendingOtp(true);
    setDevOtpNotice("");

    try {
      const res = await api("/api/auth/send-registration-otp", {
        method: "POST",
        body: {
          email: cleanEmail,
          name: nameHi || nameEn || "बैंक मित्र"
        }
      });
      setEmailOtpSent(true);
      setEmailCountdown(60);
      if (res.devMode && res.devOtp) {
        setDevOtpNotice(`Dev OTP: ${res.devOtp}`);
      }
      showToast(t(lang, res.message || `ओटीपी कोड ${res.emailMasked || cleanEmail} पर भेज दिया गया है।`, res.message || `OTP sent to ${res.emailMasked || cleanEmail}`));
    } catch (err) {
      setErrors((prev) => ({ ...prev, email: err.message }));
      showToast(err.message || "OTP भेजने में त्रुटि हुई");
    } finally {
      setEmailSendingOtp(false);
    }
  };

  // Verify Email Registration OTP
  const handleVerifyEmailOtp = async () => {
    const cleanOtp = String(emailOtp || "").trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      showToast(t(lang, "कृपया सही 6-अंकीय ओटीपी कोड दर्ज करें।", "Please enter the 6-digit OTP code."));
      return;
    }
    setEmailVerifyingOtp(true);
    try {
      const res = await api("/api/auth/verify-registration-otp", {
        method: "POST",
        body: {
          email: String(email || "").trim().toLowerCase(),
          otp: cleanOtp
        }
      });
      setEmailVerified(true);
      setEmailVerificationToken(res.emailVerificationToken);
      showToast(t(lang, "✓ ईमेल सफलतापूर्वक सत्यापित हो गया!", "✓ Email verified successfully!"));
    } catch (err) {
      showToast(err.message || "ओटीपी सत्यापन विफल");
    } finally {
      setEmailVerifyingOtp(false);
    }
  };

  // Reset Email to edit
  const handleResetEmail = () => {
    setEmailVerified(false);
    setEmailOtpSent(false);
    setEmailOtp("");
    setEmailVerificationToken("");
    setDevOtpNotice("");
  };

  // Full 12-month calendar-year pricing schedule
  const PRICING_SCHEDULE = [
    { month: "January", monthHi: "जनवरी", price: 600, validity: `Jan 1 – Dec 31, ${currentYear}`, remaining: 12 },
    { month: "February", monthHi: "फ़रवरी", price: 550, validity: `Feb 1 – Dec 31, ${currentYear}`, remaining: 11 },
    { month: "March", monthHi: "मार्च", price: 500, validity: `Mar 1 – Dec 31, ${currentYear}`, remaining: 10 },
    { month: "April", monthHi: "अप्रैल", price: 450, validity: `Apr 1 – Dec 31, ${currentYear}`, remaining: 9 },
    { month: "May", monthHi: "मई", price: 400, validity: `May 1 – Dec 31, ${currentYear}`, remaining: 8 },
    { month: "June", monthHi: "जून", price: 350, validity: `Jun 1 – Dec 31, ${currentYear}`, remaining: 7 },
    { month: "July", monthHi: "जुलाई", price: 300, validity: `Jul 1 – Dec 31, ${currentYear}`, remaining: 6 },
    { month: "August", monthHi: "अगस्त", price: 250, validity: `Aug 1 – Dec 31, ${currentYear}`, remaining: 5 },
    { month: "September", monthHi: "सितंबर", price: 200, validity: `Sep 1 – Dec 31, ${currentYear}`, remaining: 4 },
    { month: "October", monthHi: "अक्टूबर", price: 150, validity: `Oct 1 – Dec 31, ${currentYear}`, remaining: 3 },
    { month: "November", monthHi: "नवंबर", price: 100, validity: `Nov 1 – Dec 31, ${currentYear}`, remaining: 2 },
    { month: "December", monthHi: "दिसंबर", price: 50, validity: `Dec 1 – Dec 31, ${currentYear}`, remaining: 1 }
  ];

  // Razorpay Checkout Handler (Secure Order Creation & Online Payment)
  const handleRazorpayCheckout = async () => {
    // 1. Mandatory Email OTP Verification Check
    if (!emailVerified || !emailVerificationToken) {
      const msg = t(
        lang,
        "⚠️ ऑनलाइन भुगतान से पूर्व ईमेल सत्यापन अनिवार्य है! कृपया 'Send OTP' दबाकर सत्यापित करें।",
        "⚠️ Please verify your email via OTP before proceeding to payment."
      );
      showToast(msg);
      return;
    }

    // 2. Validate form fields
    const form = document.querySelector("#join-membership-form");
    if (!form) return;
    const fd = new FormData(form);
    const raw = Object.fromEntries(fd.entries());

    if (!raw.nameHi || !raw.nameEn || !raw.fatherName || !raw.district || !raw.block || !raw.bankName || !raw.bcCompany || !raw.koCode || !raw.password) {
      showToast(t(lang, "कृपया फॉर्म के सभी अनिवार्य (*) विवरण भरें।", "Please fill all required form fields."));
      return;
    }

    if (!raw.acceptTerms) {
      showToast(t(lang, "कृपया उत्तर प्रदेश बैंक मित्र संघ के नियमों व शर्तों को स्वीकार करें।", "Please accept the membership terms & conditions."));
      return;
    }

    const mobileDigits = String(raw.mobile || mobile || "").trim();
    if (mobileDigits.length !== 10 || !/^\d{10}$/.test(mobileDigits)) {
      showToast(t(lang, "मोबाइल नंबर अनिवार्य रूप से ठीक 10 अंकों का होना चाहिए।", "Mobile number must be exactly 10 digits."));
      return;
    }

    setPayingRazorpay(true);
    try {
      // Create Razorpay Order on server (server calculates dynamic calendar fee)
      const orderRes = await api("/api/payment/create-order", {
        method: "POST",
        body: {
          nameHi: raw.nameHi || nameHi,
          nameEn: raw.nameEn || nameEn,
          email: String(email || raw.email || "").trim().toLowerCase(),
          mobile: mobileDigits
        }
      });

      if (!orderRes.ok || !orderRes.orderId) {
        throw new Error(orderRes.error || "Failed to create payment order");
      }

      // Check if Razorpay script is loaded, load dynamically if not present
      if (typeof window.Razorpay === "undefined") {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = resolve;
          script.onerror = () => reject(new Error("Unable to load Razorpay Checkout SDK"));
          document.body.appendChild(script);
        });
      }

      // If server returned testMode simulation (when keys are not configured in .env)
      if (orderRes.testMode) {
        const simPaymentId = "pay_sim_" + Date.now();
        const simSignature = "sim_sig_" + Date.now();
        const verifyRes = await api("/api/payment/verify", {
          method: "POST",
          body: {
            razorpay_order_id: orderRes.orderId,
            razorpay_payment_id: simPaymentId,
            razorpay_signature: simSignature,
            emailVerificationToken,
            memberData: {
              ...raw,
              nameHi: raw.nameHi || nameHi,
              nameEn: raw.nameEn || nameEn,
              fatherName: raw.fatherName || fatherName,
              mobile: mobileDigits,
              email: String(email || raw.email || "").trim().toLowerCase(),
              photoUrl,
              password: raw.password || "123456"
            }
          }
        });

        if (!verifyRes.ok) throw new Error(verifyRes.error || "Payment verification failed");

        showToast(t(lang, `✓ ${verifyRes.message || "सदस्यता सक्रिय!"}`, `✓ ${verifyRes.message || "Membership activated!"}`));

        persistSession({
          memberId: verifyRes.member.id,
          memberPass: raw.password || "123456",
          member: verifyRes.member,
          isAdmin: false,
          level: 3
        });
        await refresh({
          memberId: verifyRes.member.id,
          memberPass: raw.password || "123456",
          member: verifyRes.member
        });
        setRoute("idcard");
        return;
      }

      // Live Razorpay Checkout Options
      const options = {
        key: orderRes.keyId || razorpayKeyId,
        amount: orderRes.amountPaise,
        currency: orderRes.currency || "INR",
        name: "उत्तर प्रदेश बैंक मित्र संघ (UPBMS)",
        description: pricingInfo.descriptionEn || `Annual Membership (${pricingInfo.validityDisplayEn})`,
        image: "/images/upbms-crest.svg",
        order_id: orderRes.orderId,
        prefill: {
          name: raw.nameEn || raw.nameHi,
          email: String(email || raw.email || "").trim().toLowerCase(),
          contact: mobileDigits
        },
        theme: {
          color: "#0a2252"
        },
        handler: async (response) => {
          try {
            setBusy(true);
            const verifyRes = await api("/api/payment/verify", {
              method: "POST",
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                emailVerificationToken,
                memberData: {
                  ...raw,
                  nameHi: raw.nameHi || nameHi,
                  nameEn: raw.nameEn || nameEn,
                  fatherName: raw.fatherName || fatherName,
                  mobile: mobileDigits,
                  email: String(email || raw.email || "").trim().toLowerCase(),
                  photoUrl,
                  password: raw.password || "123456"
                }
              }
            });

            if (!verifyRes.ok) throw new Error(verifyRes.error || "Payment verification failed");

            showToast(t(lang, `✓ सदस्यता सक्रिय! रसीद: ${verifyRes.payment.receiptNo}`, `✓ Membership activated! Receipt: ${verifyRes.payment.receiptNo}`));

            persistSession({
              memberId: verifyRes.member.id,
              memberPass: raw.password || "123456",
              member: verifyRes.member,
              isAdmin: false,
              level: 3
            });
            await refresh({
              memberId: verifyRes.member.id,
              memberPass: raw.password || "123456",
              member: verifyRes.member
            });
            setRoute("idcard");
          } catch (vErr) {
            showToast(vErr.message || "Payment verification error");
          } finally {
            setBusy(false);
          }
        },
        modal: {
          ondismiss: () => {
            setPayingRazorpay(false);
            api("/api/payment/record-failed", {
              method: "POST",
              body: {
                orderId: orderRes.orderId,
                error: { message: "Checkout cancelled by user" },
                memberInfo: { nameHi: raw.nameHi, nameEn: raw.nameEn, mobile: mobileDigits }
              }
            }).catch(() => {});
            showToast(t(lang, "भुगतान प्रक्रिया रद्द कर दी गई। आप कभी भी पुनः प्रयास कर सकते हैं।", "Payment cancelled. You can retry whenever ready."));
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response) => {
        api("/api/payment/record-failed", {
          method: "POST",
          body: {
            orderId: orderRes.orderId,
            paymentId: response.error?.metadata?.payment_id,
            error: response.error || {},
            memberInfo: { nameHi: raw.nameHi, nameEn: raw.nameEn, mobile: mobileDigits }
          }
        }).catch(() => {});
        showToast(t(lang, `भुगतान विफल: ${response.error?.description || "त्रुटि"}`, `Payment failed: ${response.error?.description || "Error"}`));
        setPayingRazorpay(false);
      });
      rzp.open();
    } catch (err) {
      showToast(err.message || "Payment initiation error");
      setPayingRazorpay(false);
    }
  };

  // PNB Dynamic QR Generation Handler
  const handleGeneratePnbQr = async () => {
    if (!emailVerified || !emailVerificationToken) {
      showToast(t(lang, "⚠️ डायनामिक QR कोड जनरेट करने से पूर्व ईमेल सत्यापन अनिवार्य है!", "⚠️ Please verify your email via OTP before generating dynamic QR code."));
      return;
    }

    const form = document.querySelector("#join-membership-form");
    if (!form) return;
    const fd = new FormData(form);
    const raw = Object.fromEntries(fd.entries());

    if (!raw.nameHi || !raw.nameEn || !raw.fatherName || !raw.district || !raw.block || !raw.bankName || !raw.bcCompany || !raw.koCode || !raw.password) {
      showToast(t(lang, "कृपया फॉर्म के सभी अनिवार्य (*) विवरण भरें।", "Please fill all required form fields."));
      return;
    }

    if (!raw.acceptTerms) {
      showToast(t(lang, "कृपया उत्तर प्रदेश बैंक मित्र संघ के नियमों व शर्तों को स्वीकार करें।", "Please accept the membership terms & conditions."));
      return;
    }

    const mobileDigits = String(raw.mobile || mobile || "").trim();
    if (mobileDigits.length !== 10 || !/^\d{10}$/.test(mobileDigits)) {
      showToast(t(lang, "मोबाइल नंबर ठीक 10 अंकों का होना चाहिए।", "Mobile number must be exactly 10 digits."));
      return;
    }

    setPnbGenerating(true);
    try {
      const res = await api("/api/payment/pnb/create-order", {
        method: "POST",
        body: {
          emailVerificationToken,
          memberData: {
            ...raw,
            nameHi: raw.nameHi || nameHi,
            nameEn: raw.nameEn || nameEn,
            fatherName: raw.fatherName || fatherName,
            mobile: mobileDigits,
            email: String(email || raw.email || "").trim().toLowerCase(),
            photoUrl,
            password: raw.password || "123456"
          }
        }
      });

      if (!res.ok || !res.orderId) {
        throw new Error(res.error || "Failed to generate dynamic QR order");
      }

      setPnbOrder(res);
      setPnbSecondsLeft(res.expiresInSeconds || 600);
      showToast(t(lang, "✓ PNB डायनामिक QR कोड तैयार! कृपया किसी भी UPI ऐप से स्कैन करें।", "✓ PNB Dynamic QR generated! Scan with any UPI app."));
    } catch (err) {
      showToast(err.message || "Error generating PNB dynamic QR");
    } finally {
      setPnbGenerating(false);
    }
  };

  // Simulate Instant PNB Payment in Test / Sandbox Mode
  const handleSimulatePnbPayment = async () => {
    if (!pnbOrder?.orderId || pnbSimulating) return;
    setPnbSimulating(true);
    try {
      await api("/api/payment/pnb/simulate-pay", {
        method: "POST",
        body: { orderId: pnbOrder.orderId }
      });
      showToast(t(lang, "⚡ परीक्षण भुगतान सिमुलेट किया गया! स्थिति सत्यापन जारी...", "⚡ Test payment simulated! Verifying payment status..."));
    } catch (err) {
      showToast(err.message);
    } finally {
      setPnbSimulating(false);
    }
  };

  async function onSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const raw = Object.fromEntries(fd.entries());

    // 0. Mandatory Email OTP Verification Check
    if (!emailVerified || !emailVerificationToken) {
      const msg = t(
        lang,
        "⚠️ पंजीकरण से पहले ईमेल सत्यापन अनिवार्य है! कृपया ईमेल बॉक्स में 'Send OTP' दबाकर सत्यापित करें।",
        "⚠️ Email verification is required before registration! Please verify via OTP."
      );
      showToast(msg);
      return;
    }

    // 1. Names validation
    if (/\d|[\u0966-\u096F]/.test(raw.nameHi)) {
      const msg = t(lang, "पूरा नाम (हिंदी) में अंकों की अनुमति नहीं है।", "Numbers are not allowed in Hindi name.");
      setErrors((prev) => ({ ...prev, nameHi: msg }));
      showToast(msg);
      return;
    }
    if (/\d|[\u0966-\u096F]/.test(raw.nameEn)) {
      const msg = t(lang, "पूरा नाम (अंग्रेज़ी) में अंकों की अनुमति नहीं है।", "Numbers are not allowed in English name.");
      setErrors((prev) => ({ ...prev, nameEn: msg }));
      showToast(msg);
      return;
    }
    if (/\d|[\u0966-\u096F]/.test(raw.fatherName)) {
      const msg = t(lang, "पिता के नाम में अंकों की अनुमति नहीं है।", "Numbers are not allowed in father's name.");
      setErrors((prev) => ({ ...prev, fatherName: msg }));
      showToast(msg);
      return;
    }

    // 2. Mobile validation
    const mobileDigits = String(raw.mobile || mobile || "").trim();
    if (mobileDigits.length !== 10 || !/^\d{10}$/.test(mobileDigits)) {
      const msg = t(lang, "मोबाइल नंबर अनिवार्य रूप से ठीक 10 अंकों का होना चाहिए।", "Mobile number must be exactly 10 digits.");
      setErrors((prev) => ({ ...prev, mobile: msg }));
      showToast(msg);
      return;
    }

    const cleanUtr = String(utrNumber || raw.utrNumber || "").trim();

    setBusy(true);
    try {
      const result = await api("/api/members", {
        method: "POST",
        body: {
          ...raw,
          nameHi: raw.nameHi || nameHi,
          nameEn: raw.nameEn || nameEn,
          fatherName: raw.fatherName || fatherName,
          age: raw.age || age,
          localAddress: raw.localAddress || localAddress,
          bankName: selectedBank === "__other__" ? (customBank.trim() || "Other Bank") : (raw.bankName || selectedBank),
          bcCompany: selectedBc === "__other__" ? (customBc.trim() || "Other BC Company") : (raw.bcCompany || selectedBc),
          mobile: mobileDigits,
          email: String(email || raw.email || "").trim().toLowerCase(),
          emailVerificationToken: emailVerificationToken || undefined,
          photoUrl,
          signatureUrl,
          memberCategory,
          applicationDate: raw.applicationDate || applicationDate,
          isCoreMember: false,
          feePaid: Number(fee),
          paymentMode,
          utrNumber: cleanUtr,
          receiptProofUrl
        }
      });

      showToast(t(
        lang,
        `✓ आवेदन सफलतापूर्वक जमा! सदस्य कोड: ${result.member.memberCode} (अनुमोदन लंबित)`,
        `✓ Application submitted! Member Code: ${result.member.memberCode} (Pending Approval)`
      ));

      // Auto-login as pending member so user sees Waiting for Approval status
      const memberPass = raw.password || "123456";
      persistSession({
        memberId: result.member.id,
        memberPass,
        member: result.member,
        isAdmin: false,
        level: 3
      });
      await refresh({
        memberId: result.member.id,
        memberPass,
        member: result.member
      });
      setRoute("idcard");
    } catch (err) {
      showToast(err.message || "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="section-block"><div className="container">
      <SectionHead
        eyebrow={`✍️ ${t(lang, "ऑनलाइन सदस्यता पंजीकरण", "ONLINE MEMBERSHIP REGISTRATION")}`}
        title={t(lang, "सदस्यता — Membership Application Form", "सदस्यता — Membership Application Form")}
        sub={t(lang, "आधिकारिक फॉर्म के अनुसार विवरण भरें। अनुमोदन के बाद ही सदस्यता सक्रिय होती है।", "Fill the details as per the official form. Membership becomes active only after approval.")}
      />

      {/* IMPORTANT — Approval Required Banner (matches Image 5) */}
      <div style={{
        background: "#fefce8",
        border: "1.5px solid #fde047",
        borderRadius: 12,
        padding: "14px 18px",
        marginBottom: 22
      }}>
        <div style={{ fontWeight: 900, fontSize: "0.95rem", color: "#854d0e", display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <span>⏳</span>
          <span>{t(lang, "महत्वपूर्ण — अनुमोदन आवश्यक (IMPORTANT — Approval Required)", "IMPORTANT — Approval Required")}</span>
        </div>
        <div style={{ fontSize: "0.86rem", color: "#713f12", lineHeight: 1.55 }}>
          {t(
            lang,
            "पंजीकरण के बाद आपकी सदस्यता लंबित (Pending) रहेगी। राज्य कार्यालय से अनुमोदन के बाद ही पहचान पत्र, नियुक्ति पत्र और रसीद उपलब्ध होंगे। आप वेबसाइट पर लॉगिन करके अनुमोदन की स्थिति देख सकते हैं।",
            "After registration your membership stays Pending. Identity Card, Appointment Letter and Receipt become available only after approval by the State Office. You can check the approval status by logging in on the website."
          )}
        </div>
      </div>

      <div className="join-layout-grid">
        {/* Left Column: Registration Form */}
        <form id="join-membership-form" className="card-panel" onSubmit={onSubmit} style={{ padding: "24px 26px", borderRadius: 16 }}>
          <div style={{ marginBottom: 18 }}>
            <h3 style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--primary)", margin: 0, fontSize: "1.12rem", fontWeight: 900 }}>
              ✍️ {t(lang, "सदस्यता आवेदन पत्र (ऑनलाइन)", "Membership Application Form (Online)")}
            </h3>
            <div style={{ fontSize: "0.82rem", color: "#64748b", marginTop: 2 }}>
              {t(lang, "उत्तर प्रदेश बैंक मित्र संघ, लखनऊ", "Uttar Pradesh Bank Mitra Sangh, Lucknow")}
            </div>
          </div>

          <div style={{ display: "grid", gap: 18 }}>
            {/* SECTION 1: Personal Details */}
            <div style={{ border: "1.5px solid #e2e8f0", borderRadius: 14, padding: "16px 18px", background: "#ffffff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 10, marginBottom: 14, borderBottom: "1.5px dashed #cbd5e1", fontWeight: 900, color: "var(--primary)", fontSize: "0.95rem" }}>
                <span style={{ background: "#2563eb", color: "#fff", width: 20, height: 20, borderRadius: 4, display: "inline-grid", placeItems: "center", fontSize: "0.75rem" }}>1</span>
                <span>{t(lang, "व्यक्तिगत विवरण (Personal Details)", "Personal Details")}</span>
              </div>
              <div className="form-grid">
                <Field
                  label={t(lang, "पूरा नाम (हिंदी में) *", "Full Name (Hindi) *")}
                  name="nameHi"
                  value={nameHi}
                  placeholder={t(lang, "उदा: सुरेश चंद्र मौर्य", "e.g. सुरेश चंद्र मौर्य")}
                  required
                  error={errors.nameHi}
                  onChange={handleNameChange("nameHi", setNameHi, "पूरा नाम (हिंदी)", "Hindi name")}
                />
                <Field
                  label={t(lang, "पूरा नाम (अंग्रेज़ी में) *", "Full Name (English) *")}
                  name="nameEn"
                  value={nameEn}
                  placeholder="e.g. Suresh Chandra Maurya"
                  required
                  error={errors.nameEn}
                  onChange={handleNameChange("nameEn", setNameEn, "पूरा नाम (अंग्रेज़ी)", "English name")}
                />
                <Field
                  label={t(lang, "पिता का नाम *", "Father's Name *")}
                  name="fatherName"
                  value={fatherName}
                  placeholder={t(lang, "पिता का नाम", "Father's Name")}
                  required
                  error={errors.fatherName}
                  onChange={handleNameChange("fatherName", setFatherName, "पिता का नाम", "Father's name")}
                />
                <Field
                  label={t(lang, "उम्र (Age) *", "Age *")}
                  name="age"
                  type="number"
                  min="18"
                  max="90"
                  value={age}
                  placeholder="e.g. 34"
                  required
                  onChange={(e) => setAge(e.target.value)}
                />
                <Field
                  label={t(lang, "मोबाइल नंबर (WhatsApp) *", "Mobile Number (WhatsApp) *")}
                  name="mobile"
                  value={mobile}
                  placeholder="10-digit mobile number"
                  required
                  maxLength={10}
                  error={errors.mobile}
                  onChange={handleMobileInput}
                />
                {/* EMAIL VERIFICATION SECTION (MANDATORY OTP via Resend) */}
                <div className="form-group full" style={{
                  background: emailVerified ? "#f0fdf4" : "#f8fafc",
                  border: `1.5px solid ${emailVerified ? "#16a34a" : "#cbd5e1"}`,
                  borderRadius: 12,
                  padding: "14px 16px",
                  marginTop: 2
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontWeight: 800, fontSize: "0.92rem", color: emailVerified ? "#16a34a" : "var(--primary)" }}>
                      ✉️ {t(lang, "ईमेल पता एवं OTP सत्यापन *", "Email Address & OTP Verification *")}
                    </span>
                    {emailVerified && (
                      <span style={{ background: "#dcfce7", color: "#15803d", padding: "3px 10px", borderRadius: 20, fontSize: "0.76rem", fontWeight: 800 }}>
                        ✓ {t(lang, "ईमेल सत्यापित (Verified)", "Email Verified")}
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: 8, alignItems: "flex-start", flexWrap: "wrap" }}>
                    <input
                      type="email"
                      name="email"
                      className={`form-control ${errors.email ? "is-invalid" : ""}`}
                      placeholder="name@example.com"
                      value={email}
                      readOnly={emailVerified}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailOtpSent) setEmailOtpSent(false);
                        setDevOtpNotice("");
                        setErrors((prev) => ({ ...prev, email: "" }));
                      }}
                      required
                      style={{ flex: "1 1 220px", backgroundColor: emailVerified ? "#f0fdf4" : "#ffffff" }}
                    />

                    {!emailVerified ? (
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={emailSendingOtp || !email || emailCountdown > 0}
                        onClick={handleSendEmailOtp}
                        style={{ whiteSpace: "nowrap", minWidth: 125 }}
                      >
                        {emailSendingOtp
                          ? t(lang, "भेज रहे हैं...", "Sending...")
                          : emailCountdown > 0
                          ? `${t(lang, "पुनः भेजें", "Resend")} (${emailCountdown}s)`
                          : emailOtpSent
                          ? t(lang, "पुनः OTP भेजें", "Resend OTP")
                          : t(lang, "ओटीपी भेजें (Send OTP)", "Send OTP")}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={handleResetEmail}
                        style={{ whiteSpace: "nowrap" }}
                      >
                        ✏️ {t(lang, "ईमेल बदलें", "Change Email")}
                      </button>
                    )}
                  </div>

                  {errors.email && (
                    <div style={{ color: "var(--danger)", fontSize: "0.82rem", fontWeight: 700, marginTop: 6 }}>
                      {errors.email}
                    </div>
                  )}

                  {devOtpNotice && !emailVerified && (
                    <div style={{ marginTop: 8, padding: "6px 12px", background: "#fef3c7", border: "1px dashed #d97706", borderRadius: 8, fontSize: "0.82rem", color: "#92400e", fontWeight: 700 }}>
                      ⚡ {devOtpNotice} ({t(lang, "परीक्षण हेतु यह कोड नीचे दर्ज करें", "Enter this code below for verification")})
                    </div>
                  )}

                  {emailOtpSent && !emailVerified && (
                    <div style={{ marginTop: 10, padding: 12, background: "#ffffff", borderRadius: 8, border: "1px solid #bfdbfe" }}>
                      <div style={{ fontSize: "0.82rem", color: "#1e40af", fontWeight: 700, marginBottom: 8 }}>
                        📩 {t(lang, `आपके ईमेल (${email}) पर 6-अंकीय सत्यापन कोड भेजा गया है। कोड दर्ज करें:`, `A 6-digit verification code was sent to ${email}. Enter code:`)}
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <input
                          type="text"
                          maxLength={6}
                          value={emailOtp}
                          onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          placeholder="6-Digit OTP"
                          className="form-control"
                          style={{ maxWidth: 200, fontSize: "1.05rem", letterSpacing: 3, fontWeight: 900, textAlign: "center" }}
                        />
                        <button
                          type="button"
                          className="btn btn-accent"
                          disabled={emailVerifyingOtp || emailOtp.length !== 6}
                          onClick={handleVerifyEmailOtp}
                          style={{ whiteSpace: "nowrap", padding: "9px 18px", fontWeight: 800 }}
                        >
                          {emailVerifyingOtp ? t(lang, "सत्यापित कर रहे हैं...", "Verifying...") : `✓ ${t(lang, "सत्यापित करें (Verify)", "Verify OTP")}`}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <label className="form-group full">
                  <span>{t(lang, "स्थानीय निजी पता *", "Local Private Address *")}</span>
                  <textarea
                    className="form-control"
                    name="localAddress"
                    rows={2}
                    value={localAddress}
                    onChange={(e) => setLocalAddress(e.target.value)}
                    placeholder={t(lang, "मकान नं., मोहल्ला, ग्राम/शहर, जनपद, पिन कोड", "House no., locality, village/city, district, PIN code")}
                    required
                  />
                </label>
                <label className="form-group">
                  <span>{t(lang, "जनपद *", "District *")}</span>
                  <select className="form-control" name="district" required>
                    {state.meta.districts.map((d) => <option key={d} value={d}>{localizeDual(d, lang)}</option>)}
                  </select>
                </label>
                <Field
                  label={t(lang, "केंद्र का पता (ब्लॉक) *", "Center Address (Block) *")}
                  name="block"
                  placeholder="e.g. Hazratganj, Lucknow — CSC Center"
                  required
                />
              </div>
            </div>

            {/* SECTION 2: Bank & KO Details */}
            <div style={{ border: "1.5px solid #e2e8f0", borderRadius: 14, padding: "16px 18px", background: "#ffffff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 10, marginBottom: 14, borderBottom: "1.5px dashed #cbd5e1", fontWeight: 900, color: "var(--primary)", fontSize: "0.95rem" }}>
                <span style={{ background: "#2563eb", color: "#fff", width: 20, height: 20, borderRadius: 4, display: "inline-grid", placeItems: "center", fontSize: "0.75rem" }}>2</span>
                <span>{t(lang, "बैंक व केओ विवरण (Bank & KO Details)", "Bank & KO Details")}</span>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-group" style={{ margin: 0 }}>
                    <span>{t(lang, "संबद्ध बैंक *", "Sponsor Bank *")}</span>
                    <select
                      className="form-control"
                      name="bankName"
                      value={selectedBank}
                      onChange={(e) => setSelectedBank(e.target.value)}
                      required
                    >
                      {state.meta.banks.map((b) => <option key={b} value={b}>{b}</option>)}
                      <option value="__other__">{t(lang, "अन्य (Others — स्वयं लिखें)", "Others (Specify)")}</option>
                    </select>
                  </label>
                  {selectedBank === "__other__" && (
                    <input
                      className="form-control"
                      style={{ marginTop: 8 }}
                      value={customBank}
                      onChange={(e) => setCustomBank(e.target.value)}
                      placeholder={t(lang, "अपना बैंक नाम दर्ज करें *", "Enter Bank Name *")}
                      required
                    />
                  )}
                </div>
                <div className="form-group">
                  <Field
                    label={t(lang, "KO CODE *", "KO CODE *")}
                    name="koCode"
                    placeholder="E.G. SBI-KNP-5501"
                    required
                  />
                  <div style={{ fontSize: "0.74rem", color: "#64748b", marginTop: 3 }}>
                    {t(lang, "कोड हमेशा अंग्रेज़ी में लिखा जाता है।", "Code is always written in English.")}
                  </div>
                </div>
                <div className="form-group full">
                  <label className="form-group" style={{ margin: 0 }}>
                    <span>{t(lang, "कॉर्पोरेट बीसी कंपनी", "Corporate BC Company")}</span>
                    <select
                      className="form-control"
                      name="bcCompany"
                      value={selectedBc}
                      onChange={(e) => setSelectedBc(e.target.value)}
                    >
                      {state.meta.bcCompanies.map((c) => <option key={c} value={c}>{c}</option>)}
                      <option value="__other__">{t(lang, "अन्य (Others — स्वयं लिखें)", "Others (Specify)")}</option>
                    </select>
                  </label>
                  {selectedBc === "__other__" && (
                    <input
                      className="form-control"
                      style={{ marginTop: 8 }}
                      value={customBc}
                      onChange={(e) => setCustomBc(e.target.value)}
                      placeholder={t(lang, "अपनी बीसी कंपनी का नाम दर्ज करें *", "Enter Corporate BC Company Name *")}
                      required
                    />
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 3: Livelihood Details */}
            <div style={{ border: "1.5px solid #e2e8f0", borderRadius: 14, padding: "16px 18px", background: "#ffffff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 10, marginBottom: 14, borderBottom: "1.5px dashed #cbd5e1", fontWeight: 900, color: "var(--primary)", fontSize: "0.95rem" }}>
                <span style={{ background: "#2563eb", color: "#fff", width: 20, height: 20, borderRadius: 4, display: "inline-grid", placeItems: "center", fontSize: "0.75rem" }}>3</span>
                <span>{t(lang, "जीविका वृत्ति सम्बन्धी विवरण (Livelihood Details)", "Livelihood Details")}</span>
              </div>
              <div className="form-grid">
                <div className="form-group full">
                  <Field
                    label={t(lang, "(1) संस्था या मालिक का नाम जिनके कर्मचारी हो", "(1) Institution / Owner Name")}
                    name="livelihoodInstitution"
                    placeholder="e.g. State Bank of India / CSC e-Governance"
                  />
                </div>
                <Field
                  label={t(lang, "(2) कार्य में पद", "(2) Designation at Work")}
                  name="livelihoodDesignation"
                  placeholder="e.g. Bank Mitra / CSP"
                />
                <Field
                  label={t(lang, "(3) नौकरी/कार्य की अवधि", "(3) Duration")}
                  name="livelihoodDuration"
                  placeholder="e.g. 3 years"
                />
                <Field
                  label={t(lang, "(4) मासिक/दैनिक वेतन", "(4) Monthly / Daily Remuneration")}
                  name="livelihoodRemuneration"
                  placeholder="e.g. Rs. 8,000 per month"
                />
                <Field
                  label={t(lang, "तारीख (Date)", "Date")}
                  name="applicationDate"
                  type="date"
                  value={applicationDate}
                  onChange={(e) => setApplicationDate(e.target.value)}
                />
              </div>
            </div>

            {/* SECTION 4: Photo & Signature Upload */}
            <div style={{ border: "1.5px solid #e2e8f0", borderRadius: 14, padding: "16px 18px", background: "#ffffff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 10, marginBottom: 14, borderBottom: "1.5px dashed #cbd5e1", fontWeight: 900, color: "var(--primary)", fontSize: "0.95rem" }}>
                <span style={{ background: "#2563eb", color: "#fff", width: 20, height: 20, borderRadius: 4, display: "inline-grid", placeItems: "center", fontSize: "0.75rem" }}>4</span>
                <span>{t(lang, "फोटो व हस्ताक्षर अपलोड (Photo & Signature Upload)", "Photo & Signature Upload")}</span>
              </div>
              <div className="form-grid">
                <label className="form-group">
                  <span>{t(lang, "पासपोर्ट साइज फोटो *", "Passport Size Photo *")}</span>
                  <input type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" onChange={handlePassportPhotoChange} required={!photoUrl} />
                  {photoUrl && (
                    <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10 }}>
                      <img src={photoUrl} alt="Preview" style={{ width: 52, height: 64, objectFit: "cover", borderRadius: 6, border: "2px solid #0a2252" }} />
                      <span style={{ fontSize: "0.8rem", color: "#16a34a", fontWeight: 700 }}>✓ {t(lang, "फोटो अपलोड", "Uploaded")}</span>
                    </div>
                  )}
                  {errors.photo && <div style={{ color: "var(--danger)", fontSize: "0.8rem", fontWeight: 700, marginTop: 4 }}>{errors.photo}</div>}
                </label>

                <label className="form-group">
                  <span>{t(lang, "प्रार्थी के हस्ताक्षर / अंगूठे का निशान (Image) *", "Signature / Thumb Impression (Image) *")}</span>
                  <input type="file" accept=".jpg,.jpeg,.png,image/*" onChange={handleSignatureChange} required={!signatureUrl} />
                  {signatureUrl && (
                    <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10 }}>
                      <img src={signatureUrl} alt="Signature" style={{ height: 40, objectFit: "contain", borderRadius: 6, border: "1px solid #cbd5e1", padding: 2, background: "#fff" }} />
                      <span style={{ fontSize: "0.8rem", color: "#16a34a", fontWeight: 700 }}>✓ {t(lang, "हस्ताक्षर अपलोड", "Uploaded")}</span>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* SECTION 5: Membership Category & Fee */}
            <div style={{ border: "1.5px solid #e2e8f0", borderRadius: 14, padding: "16px 18px", background: "#ffffff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 10, marginBottom: 14, borderBottom: "1.5px dashed #cbd5e1", fontWeight: 900, color: "var(--primary)", fontSize: "0.95rem" }}>
                <span style={{ background: "#2563eb", color: "#fff", width: 20, height: 20, borderRadius: 4, display: "inline-grid", placeItems: "center", fontSize: "0.75rem" }}>5</span>
                <span>{t(lang, "सदस्यता श्रेणी व शुल्क (Membership Category & Fee)", "Membership Category & Fee")}</span>
              </div>
              <label className="form-group" style={{ marginBottom: 10 }}>
                <span>{t(lang, "सदस्यता श्रेणी *", "Membership Category *")}</span>
                <select className="form-control" name="memberCategory" value={memberCategory} onChange={(e) => setMemberCategory(e.target.value)} required>
                  <option value={singleCategoryEn}>{t(lang, singleCategoryHi, singleCategoryEn)}</option>
                </select>
                <span style={{ fontSize: "0.74rem", color: "#64748b", marginTop: 3 }}>
                  {t(lang, "श्रेणी और इसका शुल्क एडमिन पैनल से नियंत्रित होते हैं।", "Category and its label are controlled from the Admin Panel.")}
                </span>
              </label>

              <div style={{
                background: "#f0fdf4",
                border: "1.5px solid #86efac",
                borderRadius: 10,
                padding: "12px 16px"
              }}>
                <div style={{ fontWeight: 900, fontSize: "1.02rem", color: "#065f46" }}>
                  {t(lang, `देय सदस्यता शुल्क: ₹${pricingInfo.price}`, `Payable Membership Fee: ₹${pricingInfo.price}`)}
                </div>
                <div style={{ fontSize: "0.84rem", color: "#047857", marginTop: 2 }}>
                  {t(lang, pricingInfo.descriptionHi, pricingInfo.descriptionEn)}
                </div>
                <div style={{ fontSize: "0.8rem", color: "#b45309", fontWeight: 800, marginTop: 3 }}>
                  {t(lang, `वैधता: ${pricingInfo.validityDisplayHi}`, `Valid until: ${pricingInfo.validityDisplayEn}`)}
                </div>
              </div>
            </div>

            {/* SECTION 6: Payment Details */}
            <div style={{ border: "1.5px solid #e2e8f0", borderRadius: 14, padding: "16px 18px", background: "#ffffff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 10, marginBottom: 14, borderBottom: "1.5px dashed #cbd5e1", fontWeight: 900, color: "var(--primary)", fontSize: "0.95rem" }}>
                <span style={{ background: "#2563eb", color: "#fff", width: 20, height: 20, borderRadius: 4, display: "inline-grid", placeItems: "center", fontSize: "0.75rem" }}>6</span>
                <span>{t(lang, "भुगतान विवरण (Payment Details)", "Payment Details")}</span>
              </div>

              {/* TAB CONTENT B: MANUAL UPI PAYMENT BOX (matches Image 7) */}
              {paymentGatewayType === "manual_upi" && (
                <div style={{
                  background: "#fffbeb",
                  border: "1.5px solid #fde68a",
                  borderRadius: 12,
                  padding: "16px",
                  display: "flex",
                  gap: 18,
                  alignItems: "center",
                  flexWrap: "wrap"
                }}>
                  {s.qrShowInMembership !== false && (
                    <div style={{ textAlign: "center" }}>
                      {s.qrSource === "upload" && s.qrImageUrl ? (
                        <img src={s.qrImageUrl} alt="Payment QR" style={{ width: 180, height: 180, objectFit: "contain", background: "#fff", padding: 6, borderRadius: 10, border: "1px solid #cbd5e1" }} />
                      ) : (
                        <div style={{ background: "#fff", padding: 8, borderRadius: 10, border: "1px solid #cbd5e1", display: "inline-block" }} dangerouslySetInnerHTML={{ __html: qrSvg(upi, 175) }} />
                      )}
                      <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "#92400e", marginTop: 4, maxWidth: 130 }}>
                        {t(lang, s.qrCaptionHi || "आधिकारिक भुगतान QR", s.qrCaptionEn || "Official Payment QR")}
                      </div>
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <div style={{ fontSize: "0.86rem", color: "#1e293b", fontWeight: 700, marginBottom: 2 }}>
                      <b>UPI ID:</b> <code style={{ background: "#fef3c7", padding: "1px 6px", borderRadius: 4 }}>{s.upiId}</code>
                    </div>
                    <div style={{ fontSize: "0.86rem", color: "#1e293b", fontWeight: 700, marginBottom: 10 }}>
                      <b>{t(lang, "बैंक खाता:", "Bank A/c:")}</b> {s.bankAccountNumber} ({s.bankIfsc})
                    </div>
                    <input
                      className="form-control"
                      name="utrNumber"
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value)}
                      placeholder={t(lang, "12-अंकीय UPI UTR नंबर दर्ज करें", "12-digit UPI UTR number")}
                      style={{ background: "#ffffff", fontWeight: 700 }}
                    />
                    <div style={{ fontSize: "0.74rem", color: "#64748b", marginTop: 4 }}>
                      {t(lang, "भुगतान के बाद UTR दर्ज करें। एडमिन सत्यापन के बाद रसीद जारी की जाती है।", "Enter the UTR after payment. Receipt is issued after admin verification.")}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 7: Terms & Conditions (matches Image 7 & 8) */}
            <div style={{ border: "1.5px solid #e2e8f0", borderRadius: 14, padding: "16px 18px", background: "#ffffff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 10, marginBottom: 14, borderBottom: "1.5px dashed #cbd5e1", fontWeight: 900, color: "var(--primary)", fontSize: "0.95rem" }}>
                <span style={{ background: "#2563eb", color: "#fff", width: 20, height: 20, borderRadius: 4, display: "inline-grid", placeItems: "center", fontSize: "0.75rem" }}>7</span>
                <span>{t(lang, "नियम एवं शर्तें (Terms & Conditions)", "Terms & Conditions")}</span>
              </div>
              <div style={{ border: "1px solid #cbd5e1", borderRadius: 10, padding: "12px 14px", background: "#f8fafc" }}>
                <div style={{ fontSize: "0.9rem", fontWeight: 900, color: "var(--primary)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  📜 {t(lang, tc.titleHi || "सदस्यता नियम एवं शर्तें", tc.titleEn || "Membership Terms & Conditions")}
                </div>
                <div className="terms-scroll-box" style={{ maxHeight: 120, background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 14px", fontSize: "0.82rem", lineHeight: 1.65, color: "#334155" }}>
                  {t(lang, tc.contentHi, tc.contentEn)}
                </div>
                <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: "0.84rem", fontWeight: 700, marginTop: 10, cursor: "pointer", color: "var(--text)" }}>
                  <input type="checkbox" name="acceptTerms" required style={{ marginTop: 3 }} />
                  <span>{t(lang, tc.checkboxLabelHi || "मैंने उत्तर प्रदेश बैंक मित्र संघ के उपरोक्त सभी नियम एवं शर्तें ध्यानपूर्वक पढ़ ली हैं और मैं इनसे पूर्णतः सहमत हूँ।", tc.checkboxLabelEn || "I have carefully read and agree to abide by all the Terms & Conditions of Uttar Pradesh Bank Mitra Sangh.")} *</span>
                </label>
              </div>
            </div>

            {/* SECTION 8: Member Login Password (matches Image 8) */}
            <div style={{ border: "1.5px solid #e2e8f0", borderRadius: 14, padding: "16px 18px", background: "#ffffff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 10, marginBottom: 14, borderBottom: "1.5px dashed #cbd5e1", fontWeight: 900, color: "var(--primary)", fontSize: "0.95rem" }}>
                <span style={{ background: "#2563eb", color: "#fff", width: 20, height: 20, borderRadius: 4, display: "inline-grid", placeItems: "center", fontSize: "0.75rem" }}>8</span>
                <span>{t(lang, "सदस्य लॉगिन पासवर्ड (Member Login Password)", "Member Login Password")}</span>
              </div>
              <Field
                label={t(lang, "लॉगिन पासवर्ड बनाएँ *", "Create Login Password *")}
                name="password"
                type="password"
                placeholder={t(lang, "न्यूनतम 4 अक्षर", "Minimum 4 characters")}
                required
                minLength={4}
              />
              <div style={{ fontSize: "0.76rem", color: "#64748b", marginTop: 4 }}>
                {t(lang, "सदस्य लॉगिन के लिए इस मोबाइल नंबर और पासवर्ड का उपयोग करें।", "Use this mobile number and password for Member Login.")}
              </div>
            </div>
          </div>

          {/* Submit Button (matches Image 8) */}
          <button
            type="submit"
            className="btn btn-accent btn-lg"
            disabled={busy}
            style={{
              width: "100%",
              marginTop: 18,
              padding: "13px 20px",
              fontSize: "1.02rem",
              fontWeight: 900,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8
            }}
          >
            {busy
              ? t(lang, "आवेदन जमा हो रहा है...", "Submitting application...")
              : `✅ ${t(lang, "सदस्यता आवेदन जमा करें (अनुमोदन हेतु)", "Submit Membership Application (for Approval)")}`}
          </button>
        </form>

        {/* Right Column: Sidebar Cards (matches Image 5) */}
        <aside className="join-sidebar-col">
          <div className="join-sidebar-card join-benefits-card">
            <h4 className="join-sidebar-title">
              🪪 {t(lang, "सदस्यता प्रपत्र एवं सुरक्षा नीति", "Membership Documents & Security Policy")}
            </h4>
            <ul className="join-benefits-list">
              <li>
                <b>{t(lang, "आधिकारिक पहचान पत्र:", "Official Identity Card:")}</b>{" "}
                {t(lang, "अनुमोदन और सदस्य लॉगिन के बाद आधिकारिक मुहर व हस्ताक्षर सहित उपलब्ध।", "Available after approval and Member Login, with official seal & signature.")}
              </li>
              <li>
                <b>{t(lang, "नियुक्ति / सदस्यता प्रमाण-पत्र:", "Appointment / Membership Certificate:")}</b>{" "}
                {t(lang, "सुरक्षित सदस्य लॉगिन के बाद लेटरहेड पर जारी।", "Issued on official letterhead after secure Member Login.")}
              </li>
              <li>
                <b>{t(lang, "सदस्यता फॉर्म PDF:", "Membership Form PDF:")}</b>{" "}
                {t(lang, "आवेदन जमा करने पर आधिकारिक A4 PDF स्वतः तैयार होता है।", "An official A4 PDF is generated automatically on submission.")}
              </li>
            </ul>
          </div>

          <div className="join-sidebar-card join-recent-card">
            <h4 className="join-sidebar-title">
              📜 {t(lang, "हालिया सदस्यता पंजीकरण", "Recent Membership Registrations")}
            </h4>
            <div className="join-recent-list">
              {recentList.map((m, i) => (
                <div key={i} className="join-recent-item">
                  <div className="join-recent-info">
                    <div className="join-recent-name">{t(lang, m.nameHi, m.nameEn)}</div>
                    <div className="join-recent-code">{m.code}</div>
                  </div>
                  <span className="join-recent-amount">
                    ₹{m.amount} ✓
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div></section>
  );
}

export function DonatePage() {
  const { state, lang, showToast, refresh, session, setModal } = usePortal();
  const s = state.settings;
  const [amount, setAmount] = useState(501);
  const [busy, setBusy] = useState(false);
  const upi = `upi://pay?pa=${encodeURIComponent(s.upiId || "")}&pn=${encodeURIComponent(s.upiPayeeName || "")}&cu=INR`;
  const donations = state.payments.filter((p) => p.paymentCategory === "donation");

  const donorList = donations.length > 0
    ? donations.slice(0, 5)
    : [
        {
          id: "demo-donor-1",
          payerName: "श्री बृजेश कुमार पाण्डेय",
          payerNameEn: "Shri Brijesh Kumar Pandey",
          district: "प्रयागराज (Prayagraj)",
          amount: 2100
        }
      ];

  async function onSubmit(e) {
    e.preventDefault();
    const raw = Object.fromEntries(new FormData(e.target).entries());
    setBusy(true);
    try {
      const result = await api("/api/payments", {
        method: "POST",
        body: {
          ...raw,
          amount: Number(amount),
          paymentCategory: "donation",
          instantDemoVerify: true,
          payerNameEn: raw.payerName
        }
      });
      showToast(t(lang, `सहयोग रसीद जारी: ${result.payment.receiptNo}`, `Receipt generated: ${result.payment.receiptNo}`));
      await refresh();
      if (canAccessReceipt(session, result.payment)) {
        setModal({ kind: "receipt", payment: result.payment });
      }
      e.target.reset();
      setAmount(501);
    } catch (err) {
      showToast(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="section-block"><div className="container">
      <SectionHead
        eyebrow={`🤝 ${t(lang, "संघर्ष एवं कल्याण कोष", "STRUGGLE & WELFARE FUND")}`}
        title={t(lang, "स्वैच्छिक सहयोग राशि एवं डोनेशन पोर्टल", "Voluntary Contribution & Donation Portal")}
        sub={t(lang, "पीड़ित बैंक मित्रों की विधिक सहायता एवं प्रांतीय संगठनात्मक अभियानों हेतु सहयोग करें तथा तुरंत आधिकारिक सहयोग रसीद प्राप्त करें।", "Contribute towards legal assistance and state organizational campaigns for aggrieved Bank Mitras and receive official contribution receipt instantly.")}
      />

      <div className="donate-layout-grid">
        {/* Left Column: Form */}
        <form className="card-panel" onSubmit={onSubmit}>
          <h3 style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--primary)", fontSize: "1.1rem", fontWeight: 800, marginBottom: 18 }}>
            🤝 {t(lang, "सहयोग राशि विवरण प्रपत्र", "Contribution Details Form")}
          </h3>

          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#475569", marginBottom: 8 }}>
              {t(lang, "त्वरित राशि चुनें:", "Quick Amount:")}
            </div>
            <div className="donate-quick-amounts">
              {[101, 251, 501, 1100, 2100, 5100].map((n) => (
                <button
                  type="button"
                  key={n}
                  className={`donate-amt-btn ${Number(amount) === n ? "active" : ""}`}
                  onClick={() => setAmount(n)}
                >
                  ₹{n}
                </button>
              ))}
            </div>
          </div>

          <div className="form-grid">
            <Field
              label={t(lang, "सहयोगकर्ता का पूरा नाम *", "Full Name of Contributor *")}
              name="payerName"
              placeholder={t(lang, "उदा: सुरेश चंद्र मौर्य", "e.g. Suresh Chandra")}
              required
            />
            <Field
              label={t(lang, "मोबाइल नंबर *", "Mobile Number *")}
              name="mobile"
              placeholder={t(lang, "10 अंकों का मोबाइल", "10-digit mobile")}
              required
              maxLength={10}
            />

            <label className="form-group">
              {t(lang, "जनपद", "District")}
              <select className="form-control" name="district" defaultValue={state.meta.districts[0]}>
                {state.meta.districts.map((d) => <option key={d} value={d}>{localizeDual(d, lang)}</option>)}
              </select>
            </label>

            <label className="form-group">
              {t(lang, "सहयोग राशि (₹) *", "Contribution Amount (₹) *")}
              <input
                className="form-control"
                type="number"
                min="11"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </label>

            <label className="form-group full">
              {t(lang, "सहयोग का उद्देश्य", "Purpose of Contribution")}
              <select className="form-control" name="purpose">
                <option value="बैंक मित्र संघर्ष एवं कल्याण कोष">{t(lang, "बैंक मित्र संघर्ष एवं कल्याण कोष", "Bank Mitra Struggle & Welfare Fund")}</option>
                <option value="विधिक सहायता एवं अधिवक्ता कोष">{t(lang, "विधिक सहायता एवं अधिवक्ता कोष", "Legal Aid & Advocate Fund")}</option>
                <option value="प्रांतीय संगठनात्मक अभियान कोष">{t(lang, "प्रांतीय संगठनात्मक अभियान कोष", "State Organizational Campaign Fund")}</option>
                <option value="आंदोलन एवं धरना-प्रदर्शन सहायता कोष">{t(lang, "आंदोलन एवं धरना-प्रदर्शन सहायता कोष", "Agitation & Demonstration Fund")}</option>
                <option value="सामान्य स्वैच्छिक सहयोग">{t(lang, "सामान्य स्वैच्छिक सहयोग", "General Voluntary Contribution")}</option>
              </select>
            </label>

            <label className="form-group full">
              {t(lang, "यूपीआई यूटीआर / रेफरेंस नंबर", "UPI UTR / Reference Number")}
              <input className="form-control" name="utrNumber" placeholder={t(lang, "डेमो में वैकल्पिक", "Optional in demo")} />
            </label>
          </div>

          <button type="submit" className="btn-donate-submit" disabled={busy}>
            👥 {t(lang, "सहयोग राशि जमा करें एवं आधिकारिक रसीद प्राप्त करें", "Submit Contribution & Get Official Receipt")}
          </button>
        </form>

        {/* Right Column */}
        <div className="donate-sidebar-col">
          {/* Top Card: QR (uses Donation Bank/UPI/QR settings, falling back to Membership settings) */}
          {s.donationQrShowInDonation !== false && (
            <div className="card-panel" style={{ textAlign: "center" }}>
              <h4 style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "var(--primary)", fontSize: "1.0rem", fontWeight: 800, marginBottom: 16 }}>
                🏦 {t(lang, s.donationQrCaptionHi || "स्कैन कर आधिकारिक खाते में सहयोग करें", s.donationQrCaptionEn || "Scan to Contribute to Official Account")}
              </h4>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
                {s.donationQrSource === "upload" && s.donationQrImageUrl ? (
                  <img src={s.donationQrImageUrl} alt="Donation QR" style={{ width: 210, height: 210, objectFit: "contain", background: "#fff", padding: 10, borderRadius: 12, border: "1.5px solid #e2e8f0" }} />
                ) : (
                  <div
                    style={{ background: "#ffffff", padding: 12, borderRadius: 12, border: "1.5px solid #e2e8f0", display: "inline-block" }}
                    dangerouslySetInnerHTML={{
                      __html: qrSvg(
                        `upi://pay?pa=${encodeURIComponent(s.donationUpiId || s.upiId || "")}&pn=${encodeURIComponent(s.donationUpiPayeeName || s.upiPayeeName || "")}&cu=INR`,
                        205
                      )
                    }}
                  />
                )}
              </div>
              <div style={{ fontSize: "0.88rem", lineHeight: 1.7, color: "#334155" }}>
                <div style={{ fontWeight: 800, color: "var(--primary)" }}>UPI ID: {s.donationUpiId || s.upiId || "upbms.sangh@sbi"}</div>
                <div style={{ fontWeight: 700, color: "#64748b" }}>{t(lang, "खाता नाम:", "Account Name:")} {s.donationBankAccountName || s.bankAccountName || "Uttar Pradesh Bank Mitra Sangh"}</div>
                <div style={{ fontWeight: 700, color: "#64748b" }}>A/c No.: {s.donationBankAccountNumber || s.bankAccountNumber || "3984002100088412"} | IFSC: {s.donationBankIfsc || s.bankIfsc || "SBIN0000125"}</div>
              </div>
            </div>
          )}

          {/* Bottom Card: Contributor List */}
          <div className="card-panel">
            <h4 style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--primary)", fontSize: "1.0rem", fontWeight: 800, marginBottom: 14 }}>
              🌟 {t(lang, "सम्मानित सहयोगकर्ता सूची", "Honored Contributors List")}
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {donorList.map((d, idx) => (
                <div
                  key={d.id || idx}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 0",
                    borderBottom: idx < donorList.length - 1 ? "1px solid #f1f5f9" : "none",
                    gap: 10
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text)" }}>
                    {t(lang, d.payerName, d.payerNameEn || d.payerName)} {d.district ? `(${localizeDual(d.district, lang)})` : ""}
                  </span>
                  <span className="donor-pill-badge">
                    ₹{d.amount} 📄
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div></section>
  );
}

export function VerifyPage() {
  const { state, lang, session, setModal, recordSignedUsage, setRoute, showToast } = usePortal();
  const [query, setQuery] = useState(session?.member?.memberCode || "");
  const [found, setFound] = useState(null);
  const [searchError, setSearchError] = useState("");
  const [searching, setSearching] = useState(false);
  const [tab, setTab] = useState("idcard");

  const member = found?.member || session?.member;
  const receipts = useMemo(() => {
    if (found?.receipts) return found.receipts;
    if (!session?.member || !state) return [];
    const m = session.member;
    return state.payments.filter((p) => p.memberId === m.id || p.memberCode === m.memberCode || p.mobile === m.mobile);
  }, [found, session, state]);

  const personal = member ? canAccessPersonal(session, member.id) : false;

  async function lookup(e) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setSearchError("");
    try {
      const data = await api(`/api/verify/${encodeURIComponent(q)}`);
      setFound(data);
    } catch (err) {
      setFound(null);
      setSearchError(err.message || t(lang, "इस सदस्य संख्या / मोबाइल से कोई रिकॉर्ड नहीं मिला।", "Record not found for this member ID / mobile."));
      showToast(err.message || t(lang, "रिकॉर्ड नहीं मिला।", "Record not found."));
    } finally {
      setSearching(false);
    }
  }

  let html = "";
  if (personal && member && window.UPBMSPrint) {
    const ids = member.letterSignatoryIds || state.settings.defaultSignatoryIds || [];
    if (tab === "idcard") html = window.UPBMSPrint.renderIdCardHtml(member, state.settings, member.signatoryId, lang, null);
    else if (tab === "letter") html = window.UPBMSPrint.renderAppointmentLetterHtml(member, state.settings, ids, lang, null);
    else if (receipts[0]) html = window.UPBMSPrint.renderReceiptHtml(receipts[0], state.settings, receipts[0].signatoryIds || ids, lang, null);
  }

  return (
    <section className="section-block"><div className="container">
      <SectionHead
        eyebrow={`🗂️ ${t(lang, "ऑनलाइन सदस्य सत्यापन एवं सुरक्षित प्रपत्र पोर्टल", "ONLINE MEMBER VERIFICATION & SECURE FORMS PORTAL")}`}
        title={t(lang, "सदस्य सत्यापन, पहचान पत्र, नियुक्ति पत्र एवं शुल्क रसीद", "Member Verification, ID Card, Appointment Letter & Fee Receipt")}
        sub={t(lang, "सार्वजनिक सत्यापन में केवल बिना हस्ताक्षर/मुहर का बुनियादी सदस्य विवरण दिखता है। हस्ताक्षर एवं मुहर युक्त कार्ड, नियुक्ति पत्र व रसीद केवल सदस्य लॉगिन के बाद खुलते हैं।", "Public verification displays only basic member details without signature/seal. Signed and stamped ID cards, appointment letters and receipts open only after member login.")}
      />

      <form className="verify-search-bar no-print" onSubmit={lookup}>
        <input
          className="form-control"
          style={{ flex: 1, height: 46, fontSize: "0.95rem" }}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setSearchError(""); }}
          placeholder={t(lang, "सदस्यता स्थिति जाँचने हेतु सदस्य आईडी या मोबाइल नंबर दर्ज करें...", "Enter member ID or mobile number to check membership status...")}
          required
        />
        <button type="submit" className="btn-verify-search" disabled={searching}>
          🔍 {searching ? t(lang, "खोज रहे हैं...", "Searching...") : t(lang, "सदस्यता स्थिति जांचें", "Check Membership Status")}
        </button>
      </form>

      {searchError && (
        <div className="card-panel" style={{ background: "#fef2f2", border: "1.5px solid #fecaca", color: "#991b1b", marginBottom: 20, textAlign: "center", fontWeight: 700 }}>
          ⚠️ {searchError}
        </div>
      )}

      {/* Signed personal view */}
      {personal && member && (
        <div style={{ marginBottom: 24 }}>
          <div className="card-panel no-print" style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", background: "#f0fdf4", border: "1.5px solid #bbf7d0", marginBottom: 16 }}>
            <span style={{ fontWeight: 800, color: "#166534", marginRight: 8 }}>
              ✓ {t(lang, "प्रमाणित सदस्य सत्र:", "Certified Member Session:")} {t(lang, member.nameHi, member.nameEn)} ({member.memberCode})
            </span>
            <button className={`btn btn-sm ${tab === "idcard" ? "btn-primary" : "btn-outline"}`} onClick={() => setTab("idcard")}>🪪 {t(lang, "पहचान पत्र", "ID Card")}</button>
            <button className={`btn btn-sm ${tab === "letter" ? "btn-primary" : "btn-outline"}`} onClick={() => setTab("letter")}>📜 {t(lang, "नियुक्ति पत्र", "Appointment Letter")}</button>
            <button className={`btn btn-sm ${tab === "receipt" ? "btn-primary" : "btn-outline"}`} onClick={() => setTab("receipt")}>🧾 {t(lang, "शुल्क रसीद", "Fee Receipt")}</button>
            <button
              className="btn btn-accent btn-sm"
              style={{ marginLeft: "auto" }}
              onClick={async () => {
                await recordSignedUsage({
                  actionType: `print_${tab}`,
                  actionLabelHi: "प्रपत्र प्रिंट",
                  actionLabelEn: "Printed document",
                  targetTitleHi: member.memberCode,
                  targetTitleEn: member.memberCode,
                  signatoryIds: member.letterSignatoryIds
                });
                window.print();
              }}
            >
              🖨️ {t(lang, "प्रिंट करें", "Print Document")}
            </button>
          </div>
          <HtmlBlock html={html} />
        </div>
      )}

      {/* Public search result */}
      {member && !personal && (
        <div className="card-panel" style={{ marginBottom: 24, background: "#f8fafc", border: "1.5px solid #cbd5e1" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, borderBottom: "1px solid #e2e8f0", paddingBottom: 12, marginBottom: 14 }}>
            <div style={{ fontWeight: 900, fontSize: "1.1rem", color: "var(--primary)", display: "flex", alignItems: "center", gap: 8 }}>
              ✓ {t(lang, "सार्वजनिक सत्यापन विवरण", "Public Verification Details")}
            </div>
            <span className={`badge badge-${member.status === "active" ? "active" : "pending"}`}>
              {member.status === "active" ? t(lang, "सक्रिय बैंक मित्र सदस्य", "Active Bank Mitra Member") : t(lang, "अनुमोदन लंबित", "Approval Pending")}
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, fontSize: "0.92rem" }}>
            <div><span style={{ color: "#64748b" }}>{t(lang, "सदस्य का नाम:", "Name:")}</span> <b>{t(lang, member.nameHi, member.nameEn)}</b></div>
            <div><span style={{ color: "#64748b" }}>{t(lang, "सदस्य आईडी:", "Member ID:")}</span> <b>{member.memberCode}</b></div>
            <div><span style={{ color: "#64748b" }}>{t(lang, "जनपद:", "District:")}</span> <b>{localizeDual(member.district, lang)}</b></div>
            <div><span style={{ color: "#64748b" }}>{t(lang, "संबंधित बैंक:", "Bank:")}</span> <b>{member.bankName}</b></div>
            {member.koCode && <div><span style={{ color: "#64748b" }}>KO/CSP:</span> <b>{member.koCode}</b></div>}
          </div>
        </div>
      )}

      {/* Pending Approval Lock Panel for logged-in pending members */}
      {!personal && session?.member && session.member.status !== "active" && (
        <div className="verify-lock-panel" style={{ background: "#fefce8", border: "2px solid #fde047" }}>
          <div style={{ fontSize: 52, lineHeight: 1, marginBottom: 14 }}>⏳</div>
          <h3 style={{ color: "#854d0e", fontSize: "1.3rem", fontWeight: 900, marginBottom: 10 }}>
            {session.member.status === "rejected"
              ? t(lang, "आवेदन अस्वीकृत किया गया", "Application Rejected")
              : t(lang, "कृपया अनुमोदन की प्रतीक्षा करें (Wait for Approval)", "Please Wait for Admin Approval")}
          </h3>
          <p style={{ color: "#713f12", fontSize: "0.95rem", maxWidth: 660, margin: "0 auto 20px", lineHeight: 1.6 }}>
            {session.member.status === "rejected"
              ? t(lang, "आपका सदस्यता आवेदन अस्वीकार कर दिया गया है। अधिक जानकारी के लिए राज्य कार्यालय से संपर्क करें।", "Your membership application has been rejected. Please contact the State Office for details.")
              : t(
                  lang,
                  `नमस्ते ${t(lang, session.member.nameHi, session.member.nameEn)} (${session.member.memberCode}), आपका सदस्यता आवेदन सफलतापूर्वक प्राप्त हो गया है और राज्य कार्यालय (Level 1 / Level 2 Admin) के अनुमोदन हेतु लंबित है। अनुमोदन के बाद आपका पहचान पत्र, नियुक्ति पत्र एवं रसीद स्वतः अनलॉक हो जाएंगे।`,
                  `Hello ${session.member.nameEn} (${session.member.memberCode}), your membership application has been received and is pending approval by the State Office (Admin). Once approved, your ID Card, Appointment Letter & Fee Receipt will unlock automatically.`
                )}
          </p>
        </div>
      )}

      {/* Centered lock panel for visitors who are not logged in */}
      {!personal && !session?.member && (
        <div className="verify-lock-panel">
          <div style={{ fontSize: 52, lineHeight: 1, marginBottom: 16 }}>🔒</div>
          <h3 style={{ color: "#0b1a30", fontSize: "1.25rem", fontWeight: 800, marginBottom: 12, lineHeight: 1.4, maxWidth: 720, margin: "0 auto 12px" }}>
            {t(lang, "हस्ताक्षर एवं मुहर युक्त पहचान पत्र, नियुक्ति पत्र व रसीद डाउनलोड करने हेतु सदस्य लॉगिन करें", "Please login as a member to download signed and stamped ID card, appointment letter & receipt")}
          </h3>
          <p style={{ color: "#64748b", fontSize: "0.92rem", maxWidth: 660, margin: "0 auto 28px", lineHeight: 1.6 }}>
            {t(lang, "संघ के पदाधिकारियों के हस्ताक्षर व आधिकारिक मुहर युक्त सभी प्रपत्र केवल पंजीकृत सदस्यों को लॉगिन के उपरांत उपलब्ध कराए जाते हैं।", "All documents with association officials' signatures and official seal are made available only to registered members after login.")}
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn"
              onClick={() => setModal({ kind: "login", prefill: member?.memberCode || query })}
              style={{
                background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                color: "#ffffff",
                fontWeight: 800,
                padding: "11px 26px",
                borderRadius: "10px",
                border: "none",
                fontSize: "0.95rem",
                boxShadow: "0 4px 14px rgba(234, 88, 12, 0.35)",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6
              }}
            >
              🔑 {t(lang, "सदस्य लॉगिन करें", "Member Login")}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => { setRoute("join"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              style={{
                background: "#ffffff",
                color: "#0b1a30",
                fontWeight: 800,
                padding: "11px 24px",
                borderRadius: "10px",
                border: "1.5px solid #cbd5e1",
                fontSize: "0.95rem",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6
              }}
            >
              ✍️ {t(lang, "नवीन सदस्यता पंजीकरण करें", "New Membership Registration")}
            </button>
          </div>
        </div>
      )}
    </div></section>
  );
}

export function GrievancePage() {
  const { state, lang, showToast, refresh } = usePortal();
  const [list, setList] = useState(null);
  if (!grievanceEnabled(state)) return <section className="section-block"><div className="container card-panel">{t(lang, "शिकायत मॉड्यूल बंद है।", "Grievance module is turned off.")}</div></section>;
  const rows = list || state.grievances;
  async function submit(e) {
    e.preventDefault();
    const raw = Object.fromEntries(new FormData(e.target).entries());
    try {
      const data = await api("/api/grievances", { method: "POST", body: raw });
      showToast(data.grievance.ticketNo);
      await refresh();
      e.target.reset();
    } catch (err) { showToast(err.message); }
  }
  async function track(e) {
    e.preventDefault();
    const q = new FormData(e.target).get("q");
    const data = await api(`/api/grievances/track/${encodeURIComponent(q)}`);
    setList(data.grievances);
  }
  return (
    <section className="section-block"><div className="container">
      <SectionHead eyebrow={t(lang, "शिकायत निवारण", "GRIEVANCE")} title={t(lang, "समस्या दर्ज करें", "Register a grievance")} />
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 20 }}>
        <form className="card-panel" onSubmit={submit}>
          <Field label={t(lang, "नाम", "Name")} name="applicantName" required />
          <Field label={t(lang, "मोबाइल", "Mobile")} name="mobile" required />
          <label className="form-group">{t(lang, "जनपद", "District")}<select className="form-control" name="district">{state.meta.districts.map((d) => <option key={d}>{d}</option>)}</select></label>
          <label className="form-group">{t(lang, "बैंक", "Bank")}<select className="form-control" name="bankName">{state.meta.banks.map((b) => <option key={b}>{b}</option>)}</select></label>
          <Field label="KO" name="koCode" />
          <label className="form-group">{t(lang, "प्रकार", "Type")}<select className="form-control" name="issueType"><option>बिना नोटिस केओ कोड ब्लॉक</option><option>कमीशन कटौती / भुगतान लंबित</option><option>सेटलमेंट खाता लीन / फ्रीज</option><option>शाखा / बीसी कंपनी उत्पीड़न</option></select></label>
          <Field label={t(lang, "विषय", "Subject")} name="subject" required />
          <label className="form-group">{t(lang, "विवरण", "Description")}<textarea className="form-control" name="description" required /></label>
          <button className="btn btn-accent">{t(lang, "शिकायत दर्ज करें", "Submit grievance")}</button>
        </form>
        <div>
          <form className="card-panel" onSubmit={track} style={{ display: "flex", gap: 8 }}>
            <input className="form-control" name="q" placeholder="GRV-2026-101" required />
            <button className="btn btn-primary btn-sm">{t(lang, "खोजें", "Track")}</button>
            {list && <button type="button" className="btn btn-outline btn-sm" onClick={() => setList(null)}>{t(lang, "सभी", "All")}</button>}
          </form>
          {rows.map((g) => (
            <div className="card-panel" key={g.id} style={{ borderLeft: `5px solid ${g.status === "resolved" ? "#15803d" : "#f59e0b"}` }}>
              <b>{g.ticketNo}</b> <span className={`badge badge-${g.status}`}>{g.status}</span>
              <div>{t(lang, g.subject, g.subjectEn)}</div>
              <div>{t(lang, g.adminRemark, g.adminRemarkEn)}</div>
            </div>
          ))}
        </div>
      </div>
    </div></section>
  );
}

function Field({ label, error, ...props }) {
  return (
    <label className="form-group">
      {label}
      <input className={`form-control ${error ? "is-invalid" : ""}`} {...props} />
      {error && (
        <span style={{ color: "var(--danger)", fontSize: "0.8rem", fontWeight: 700, marginTop: 4, display: "block" }}>
          {error}
        </span>
      )}
    </label>
  );
}

function LoginModalContent({ modal, setModal, lang, showToast, persistSession, refresh }) {
  const { setRoute } = usePortal();

  // Mode: "login" or "forgot"
  const [mode, setMode] = useState("login");
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");

  // ── Password Login State ──
  const [showPass, setShowPass] = useState(false);
  const [query, setQuery] = useState(modal.prefill || "");
  const [password, setPassword] = useState("");
  const [activePreset, setActivePreset] = useState(null);

  // ── Forgot Password State ──
  const [forgotStep, setForgotStep] = useState(1); // 1 = Enter Email/ID, 2 = Enter OTP + New Password
  const [forgotQuery, setForgotQuery] = useState("");
  const [targetEmail, setTargetEmail] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // 60-Second Cooldown Countdown Timer for Forgot Password
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // ── Handle Password Login ──
  async function handlePasswordLogin(e) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setAuthError("");
    setAuthSuccess("");

    const cleanQuery = query.trim();
    const cleanPass = password.trim();

    if (!cleanQuery || !cleanPass) {
      setAuthError(t(lang, "कृपया सदस्य आईडी / ईमेल और पासवर्ड दर्ज करें।", "Please enter Member ID / Email and password."));
      setSubmitting(false);
      return;
    }

    try {
      const data = await api("/api/member/login", {
        method: "POST",
        body: { query: cleanQuery, password: cleanPass }
      });
      const next = {
        memberId: data.member.id,
        memberPass: cleanPass,
        member: data.member,
        level: data.level || (data.isAdmin ? (data.member.level || 2) : (data.member.level || 3)),
        isAdmin: Boolean(data.isAdmin),
      };
      persistSession(next);
      await refresh(next);
      setModal(null);
      showToast(t(lang, "लॉगिन सफल!", "Login successful!"));
      if (next.isAdmin) {
        setRoute("admin");
      } else {
        setRoute("idcard");
      }
    } catch (err) {
      setAuthError(err.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Forgot Password Step 1: Send OTP ──
  async function handleSendForgotOtp(e) {
    if (e) e.preventDefault();
    if (submitting) return;
    const clean = forgotQuery.trim();
    if (!clean) {
      setAuthError(t(lang, "कृपया अपनी सदस्य आईडी, ईमेल अथवा मोबाइल नंबर दर्ज करें।", "Please enter your Member ID, Email, or Mobile."));
      return;
    }

    setSubmitting(true);
    setAuthError("");
    setAuthSuccess("");

    try {
      const res = await api("/api/auth/forgot-password/send-otp", {
        method: "POST",
        body: { query: clean }
      });
      setTargetEmail(res.email);
      setMaskedEmail(res.emailMasked);
      setForgotStep(2);
      setResendCooldown(60);
      setAuthSuccess(t(lang, res.message || `ओटीपी कोड ${res.emailMasked} पर भेजा गया है।`, res.message || `OTP sent to ${res.emailMasked}`));
    } catch (err) {
      setAuthError(err.message || "Failed to send reset code.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Forgot Password Step 2: Verify OTP & Reset Password ──
  async function handleResetPassword(e) {
    e.preventDefault();
    if (submitting) return;

    const cleanOtp = resetOtp.trim();
    const cleanNewPass = newPassword.trim();
    const cleanConfirm = confirmPassword.trim();

    if (!cleanOtp || cleanOtp.length !== 6) {
      setAuthError(t(lang, "कृपया 6-अंकीय ओटीपी कोड दर्ज करें।", "Please enter the 6-digit OTP code."));
      return;
    }

    if (!cleanNewPass || cleanNewPass.length < 4) {
      setAuthError(t(lang, "नया पासवर्ड कम से कम 4 अक्षरों का होना चाहिए।", "New password must be at least 4 characters."));
      return;
    }

    if (cleanNewPass !== cleanConfirm) {
      setAuthError(t(lang, "दोनों पासवर्ड मेल नहीं खा रहे हैं। कृपया दोबारा जांचें।", "Passwords do not match. Please verify."));
      return;
    }

    setSubmitting(true);
    setAuthError("");
    setAuthSuccess("");

    try {
      const res = await api("/api/auth/forgot-password/reset", {
        method: "POST",
        body: {
          email: targetEmail,
          otp: cleanOtp,
          newPassword: cleanNewPass
        }
      });

      // Auto-login the user with new credentials
      const next = {
        memberId: res.member.id,
        memberPass: cleanNewPass,
        member: res.member,
        level: res.level || (res.isAdmin ? 2 : 3),
        isAdmin: Boolean(res.isAdmin),
      };
      persistSession(next);
      await refresh(next);
      setModal(null);
      showToast(t(lang, "✓ पासवर्ड सफलतापूर्वक बदल दिया गया एवं लॉगिन पूर्ण!", "✓ Password reset successfully & logged in!"));
      if (next.isAdmin) {
        setRoute("admin");
      } else {
        setRoute("idcard");
      }
    } catch (err) {
      setAuthError(err.message || "Password reset failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-modal-wrapper">
      {/* Header */}
      <div className="login-modal-header">
        <div className="login-header-brand">
          <div className="login-header-icon-badge">{mode === "forgot" ? "🔑" : "🔐"}</div>
          <div>
            <div className="login-header-title">
              {mode === "forgot"
                ? t(lang, "पासवर्ड रीसेट करें (Reset Password)", "Reset Password via Email OTP")
                : t(lang, "पोर्टल सदस्य लॉगिन (Member Login)", "Portal Member Login")}
            </div>
            <div className="login-header-subtitle">
              {mode === "forgot"
                ? t(lang, "ईमेल OTP सत्यापन द्वारा पासवर्ड रीसेट • UPBMS", "Email OTP Verified Password Reset • UPBMS")
                : t(lang, "सदस्य आईडी / ईमेल एवं पासवर्ड द्वारा लॉगिन • UPBMS", "Sign In with Member ID / Email & Password • UPBMS")}
            </div>
          </div>
        </div>
        <button
          type="button"
          className="login-btn-close"
          onClick={() => setModal(null)}
          title={t(lang, "बंद करें", "Close")}
        >
          ✕ <span>{t(lang, "बंद करें", "Close")}</span>
        </button>
      </div>

      {/* Feedback Messages */}
      {authError && (
        <div className="auth-error-box" style={{ margin: "16px 20px 0" }}>
          <span>⚠️</span>
          <div>{authError}</div>
        </div>
      )}
      {authSuccess && (
        <div className="auth-success-box" style={{ margin: "16px 20px 0" }}>
          <span>✅</span>
          <div>{authSuccess}</div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          VIEW 1: STANDARD PASSWORD LOGIN (MEMBER ID / EMAIL + PASSWORD)
          ───────────────────────────────────────────────────────────── */}
      {mode === "login" && (
        <form onSubmit={handlePasswordLogin} className="login-form-container">
          {/* Member ID / Email Input */}
          <div className="login-field-group">
            <label className="login-field-label">
              <span>👤</span>
              <span>{t(lang, "सदस्य आईडी / ईमेल *", "Member ID / Email *")}</span>
            </label>
            <div className="login-input-wrap">
              <input
                className="login-form-input"
                name="query"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setActivePreset(null); setAuthError(""); }}
                placeholder="e.g. member@gmail.com or UPBMS-2026-1001"
                required
                autoFocus
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="login-field-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label className="login-field-label" style={{ marginBottom: 0 }}>
                <span>🔒</span>
                <span>{t(lang, "पासवर्ड *", "Password *")}</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setMode("forgot");
                  setForgotStep(1);
                  setForgotQuery(query);
                  setAuthError("");
                  setAuthSuccess("");
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#2563eb",
                  fontWeight: 700,
                  fontSize: "0.82rem",
                  cursor: "pointer",
                  padding: "0 2px",
                  textDecoration: "underline"
                }}
              >
                {t(lang, "पासवर्ड भूल गए? (Forgot Password?)", "Forgot Password?")}
              </button>
            </div>
            <div className="login-input-wrap" style={{ marginTop: 6 }}>
              <input
                className="login-form-input"
                name="password"
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setActivePreset(null); setAuthError(""); }}
                placeholder="e.g. ••••••••"
                style={{ paddingRight: "44px" }}
                required
              />
              <button
                type="button"
                className="login-toggle-pass-btn"
                onClick={() => setShowPass(!showPass)}
                tabIndex={-1}
                title={showPass ? "Hide" : "Show"}
              >
                {showPass ? "👁️" : "🙈"}
              </button>
            </div>
          </div>

          {/* Sign In Button */}
          <button type="submit" className="login-submit-btn" disabled={submitting}>
            {submitting ? (
              <>
                <span className="login-spinner"></span>
                <span>{t(lang, "सत्यापित किया जा रहा है...", "Authenticating...")}</span>
              </>
            ) : (
              <>
                <span>🔑</span>
                <span>{t(lang, "लॉगिन करें (Sign In)", "Sign In with Password")}</span>
              </>
            )}
          </button>

          {/* New Member Registration Link */}
          <div style={{ textAlign: "center", marginTop: 16, paddingTop: 14, borderTop: "1px solid #e2e8f0", fontSize: "0.86rem", color: "#64748b" }}>
            <span>{t(lang, "नए बैंक मित्र हैं? ", "New Bank Mitra? ")}</span>
            <button
              type="button"
              onClick={() => { setModal(null); setRoute("join"); }}
              style={{ background: "none", border: "none", color: "var(--primary)", fontWeight: 800, cursor: "pointer", textDecoration: "underline" }}
            >
              ✍️ {t(lang, "सदस्यता पंजीकरण करें (Join Us)", "Join Membership")}
            </button>
          </div>
        </form>
      )}

      {/* ─────────────────────────────────────────────────────────────
          VIEW 2: FORGOT PASSWORD (EMAIL OTP VERIFICATION & RESET)
          ───────────────────────────────────────────────────────────── */}
      {mode === "forgot" && (
        <div className="login-form-container">
          {/* Step 1: Enter Email / Member ID */}
          {forgotStep === 1 && (
            <form onSubmit={handleSendForgotOtp}>
              <div className="otp-screen-badge" style={{ marginBottom: 12 }}>
                <span>🔐</span>
                <span>{t(lang, "पासवर्ड रीसेट सुरक्षा सत्यापन", "Password Reset Verification")}</span>
              </div>
              <h3 className="otp-screen-title" style={{ fontSize: "1.1rem", marginBottom: 6 }}>
                {t(lang, "अपना पंजीकृत विवरण दर्ज करें", "Enter Registered Account Details")}
              </h3>
              <p className="otp-screen-desc" style={{ marginBottom: 16 }}>
                {t(
                  lang,
                  "अपनी पंजीकृत सदस्य आईडी अथवा ईमेल दर्ज करें। आपके पंजीकृत ईमेल पर 6-अंकीय सुरक्षा कोड भेजा जाएगा।",
                  "Enter your registered Member ID or Email. A 6-digit OTP code will be sent to your registered email."
                )}
              </p>

              <div className="login-field-group">
                <label className="login-field-label">
                  <span>✉️</span>
                  <span>{t(lang, "पंजीकृत सदस्य आईडी / ईमेल *", "Registered Member ID / Email *")}</span>
                </label>
                <div className="login-input-wrap">
                  <input
                    className="login-form-input"
                    type="text"
                    value={forgotQuery}
                    onChange={(e) => { setForgotQuery(e.target.value); setAuthError(""); }}
                    placeholder="e.g. member@gmail.com or UPBMS-2026-1001"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                className="login-submit-btn"
                disabled={submitting || !forgotQuery.trim()}
              >
                {submitting ? (
                  <>
                    <span className="login-spinner"></span>
                    <span>{t(lang, "ओटीपी कोड भेजा जा रहा है...", "Sending OTP code...")}</span>
                  </>
                ) : (
                  <>
                    <span>📤</span>
                    <span>{t(lang, "6-अंकीय रीसेट OTP भेजें", "Send 6-Digit Reset OTP")}</span>
                  </>
                )}
              </button>

              <div style={{ textAlign: "center", marginTop: 16 }}>
                <button
                  type="button"
                  onClick={() => { setMode("login"); setAuthError(""); setAuthSuccess(""); }}
                  style={{ background: "none", border: "none", color: "#64748b", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}
                >
                  ← {t(lang, "लॉगिन पृष्ठ पर वापस जाएं", "Back to Sign In")}
                </button>
              </div>
            </form>
          )}

          {/* Step 2: Enter 6-Digit OTP & Set New Password */}
          {forgotStep === 2 && (
            <form onSubmit={handleResetPassword}>
              <div className="otp-screen-badge" style={{ marginBottom: 12 }}>
                <span>📩</span>
                <span>{t(lang, "ओटीपी कोड भेजा गया", "OTP Code Sent")}</span>
              </div>
              <h3 className="otp-screen-title" style={{ fontSize: "1.1rem", marginBottom: 6 }}>
                {t(lang, "OTP दर्ज करें एवं नया पासवर्ड बनाएं", "Enter OTP & Create New Password")}
              </h3>
              <p className="otp-screen-desc" style={{ marginBottom: 14 }}>
                {t(lang, "सत्यापन कोड इस ईमेल पर भेजा गया है:", "Verification code was sent to:")}{" "}
                <span className="otp-target-email-pill">{maskedEmail || targetEmail}</span>
              </p>

              {/* 6-Digit OTP */}
              <div className="login-field-group">
                <label className="login-field-label">
                  <span>🔢</span>
                  <span>{t(lang, "6-अंकीय OTP कोड दर्ज करें *", "Enter 6-Digit OTP Code *")}</span>
                </label>
                <input
                  className="otp-digits-input"
                  value={resetOtp}
                  onChange={(e) => { setResetOtp(e.target.value.replace(/\D/g, "").slice(0, 6)); setAuthError(""); }}
                  placeholder="••••••"
                  maxLength={6}
                  inputMode="numeric"
                  required
                  autoFocus
                />
              </div>

              {/* New Password */}
              <div className="login-field-group" style={{ marginTop: 12 }}>
                <label className="login-field-label">
                  <span>🔒</span>
                  <span>{t(lang, "नया पासवर्ड बनाएं * (कम से कम 4 अक्षर)", "New Password * (Min 4 chars)")}</span>
                </label>
                <div className="login-input-wrap">
                  <input
                    className="login-form-input"
                    type={showNewPass ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setAuthError(""); }}
                    placeholder={t(lang, "नया सुरक्षित पासवर्ड", "Enter new password")}
                    required
                    minLength={4}
                    style={{ paddingRight: "44px" }}
                  />
                  <button
                    type="button"
                    className="login-toggle-pass-btn"
                    onClick={() => setShowNewPass(!showNewPass)}
                    tabIndex={-1}
                    title={showNewPass ? "Hide" : "Show"}
                  >
                    {showNewPass ? "👁️" : "🙈"}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="login-field-group" style={{ marginTop: 12 }}>
                <label className="login-field-label">
                  <span>🔒</span>
                  <span>{t(lang, "नए पासवर्ड की पुनः पुष्टि करें *", "Confirm New Password *")}</span>
                </label>
                <div className="login-input-wrap">
                  <input
                    className="login-form-input"
                    type={showNewPass ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setAuthError(""); }}
                    placeholder={t(lang, "नया पासवर्ड दोबारा लिखें", "Confirm new password")}
                    required
                    minLength={4}
                  />
                </div>
              </div>

              {/* Submit Reset Button */}
              <button
                type="submit"
                className="login-submit-btn"
                disabled={submitting || resetOtp.length !== 6 || newPassword.length < 4}
                style={{ marginTop: 16 }}
              >
                {submitting ? (
                  <>
                    <span className="login-spinner"></span>
                    <span>{t(lang, "पासवर्ड रीसेट हो रहा है...", "Resetting Password...")}</span>
                  </>
                ) : (
                  <>
                    <span>✓</span>
                    <span>{t(lang, "पासवर्ड रीसेट करें एवं लॉगिन करें", "Reset Password & Sign In")}</span>
                  </>
                )}
              </button>

              {/* Resend & Back Row */}
              <div className="otp-resend-row" style={{ marginTop: 16 }}>
                <button
                  type="button"
                  className="otp-resend-link"
                  onClick={() => { setForgotStep(1); setResetOtp(""); setAuthError(""); setAuthSuccess(""); }}
                >
                  ← {t(lang, "ईमेल बदलें", "Change Email")}
                </button>

                <div>
                  {resendCooldown > 0 ? (
                    <span className="otp-cooldown-text">
                      ⏱️ {t(lang, `पुनः भेजें (${resendCooldown}s)`, `Resend in ${resendCooldown}s`)}
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="otp-resend-link"
                      onClick={() => handleSendForgotOtp()}
                      disabled={submitting}
                    >
                      🔄 {t(lang, "पुनः OTP भेजें", "Resend OTP")}
                    </button>
                  )}
                </div>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

export function MembershipVerificationPage() {
  const { state, lang, verifyId, setVerifyId, verifyType } = usePortal();
  const s = state?.settings || {};

  // Auto-populate query from verifyId (set by QR scan URL param)
  const [query, setQuery] = useState(verifyId || "");
  const [member, setMember] = useState(null);
  const [payment, setPayment] = useState(null);
  const [receipts, setReceipts] = useState([]);
  const [docType, setDocType] = useState(verifyType || "idcard");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [verifiedAt] = useState(() => new Date().toLocaleString("hi-IN", { timeZone: "Asia/Kolkata" }));

  // Auto-search if verifyId is present on mount
  useEffect(() => {
    if (verifyId && verifyId.trim()) {
      doLookup(verifyId.trim(), verifyType || "idcard");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verifyId, verifyType]);

  async function doLookup(q, typeOverride) {
    if (!q) return;
    const requestedType = typeOverride || docType || "idcard";
    setLoading(true);
    setError("");
    setMember(null);
    setPayment(null);
    setReceipts([]);
    setSearched(false);
    try {
      const data = await api(`/api/verify/${encodeURIComponent(q)}?type=${encodeURIComponent(requestedType)}`);
      setMember(data.member || null);
      setPayment(data.payment || null);
      setReceipts(data.receipts || []);
      setDocType(data.docType || requestedType);
    } catch (err) {
      setDocType(requestedType);
      setError(err.message || t(lang, "इस आईडी / रसीद / मोबाइल से कोई रिकॉर्ड नहीं मिला।", "No record found for this ID / receipt / mobile."));
    } finally {
      setLoading(false);
      setSearched(true);
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    const isReceiptQuery = /^UPBMS-RCP/i.test(q);
    const nextType = isReceiptQuery ? "receipt" : "idcard";
    setDocType(nextType);
    setVerifyId(q);
    doLookup(q, nextType);
  }

  const isReceiptMode = docType === "receipt";
  const isLetterMode = docType === "letter";
  const isActive = member && member.status === "active";
  const isReceiptVerified = isReceiptMode && payment && payment.status === "verified";
  const isReceiptPending = isReceiptMode && payment && payment.status !== "verified";
  const orgName = s.orgNameHi || "उत्तर प्रदेश बैंक मित्र संघ";
  const orgNameEn = s.orgNameEn || "Uttar Pradesh Bank Mitra Sangh (UPBMS)";
  const regNo = s.regNo || "UP-REG-LKO-2024-8841";

  // Format date nicely
  function fmtDate(d) {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleDateString("hi-IN", { day: "2-digit", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });
    } catch { return d; }
  }

  const detailRows = isReceiptMode && payment ? [
    { icon: "🧾", labelHi: "रसीद संख्या", labelEn: "Receipt Number", value: payment.receiptNo || payment.id || "—" },
    { icon: "🔗", labelHi: "ट्रांज़ैक्शन / UTR आईडी", labelEn: "Transaction / UTR ID", value: payment.utrNumber || "—" },
    { icon: "₹", labelHi: "भुगतान राशि", labelEn: "Amount Paid", value: `₹${payment.amount || 0}`, highlight: "#0a2252" },
    { icon: "📅", labelHi: "भुगतान दिनांक", labelEn: "Payment Date", value: fmtDate(payment.verifiedDate || payment.date || payment.createdAt) },
    { icon: "💳", labelHi: "भुगतान माध्यम", labelEn: "Payment Mode", value: payment.mode || "UPI / Bank Transfer" },
    { icon: "👤", labelHi: "भुगतानकर्ता / सदस्य", labelEn: "Member / Payer Name", value: t(lang, payment.payerName || member?.nameHi, payment.payerNameEn || member?.nameEn) || "—" },
    { icon: "🪪", labelHi: "सदस्यता संख्या", labelEn: "Membership ID", value: payment.memberCode || member?.memberCode || "—" },
    { icon: "🏛️", labelHi: "जनपद", labelEn: "District", value: localizeDual(payment.district || member?.district, lang) || "—" },
    {
      icon: isReceiptVerified ? "🟢" : "🟡",
      labelHi: "भुगतान स्थिति",
      labelEn: "Payment Status",
      value: isReceiptVerified
        ? t(lang, "सत्यापित (Verified)", "Verified")
        : t(lang, "सत्यापन लंबित / निष्क्रिय", "Pending / Inactive"),
      highlight: isReceiptVerified ? "#16a34a" : "#d97706"
    }
  ] : isLetterMode && member ? [
    { icon: "👤", labelHi: "सदस्य का नाम", labelEn: "Member Name", value: t(lang, member.nameHi, member.nameEn) },
    { icon: "🪪", labelHi: "पंजीकरण / सदस्य संख्या", labelEn: "Registration Number", value: member.memberCode || "—" },
    { icon: "🏷️", labelHi: "नियुक्ति पदनाम", labelEn: "Designation", value: t(lang, member.designationHi, member.designationEn) || member.role || "—" },
    { icon: "📅", labelHi: "नियुक्ति दिनांक", labelEn: "Appointment Date", value: fmtDate(member.joinedDate || member.joinDate || member.createdAt) },
    { icon: "🏛️", labelHi: "जनपद", labelEn: "District", value: localizeDual(member.district, lang) || "—" },
    { icon: "🏘️", labelHi: "ब्लॉक/केंद्र", labelEn: "Block / Center", value: localizeDual(member.block, lang) || "—" },
    { icon: "🏦", labelHi: "संबद्ध बैंक", labelEn: "Sponsor Bank", value: member.bankName || "—" },
    { icon: "🔑", labelHi: "केओ/सीएसपी कोड", labelEn: "KO / CSP Code", value: member.koCode || "—" },
    {
      icon: isActive ? "🟢" : "🔴",
      labelHi: "वर्तमान स्थिति",
      labelEn: "Current Status",
      value: isActive ? t(lang, "सक्रिय एवं प्रमाणित (Verified)", "Verified & Active") : t(lang, "निष्क्रिय / लंबित (Inactive)", "Inactive / Pending"),
      highlight: isActive ? "#16a34a" : "#dc2626"
    }
  ] : member ? [
    { icon: "👤", labelHi: "सदस्य का नाम", labelEn: "Member Name", value: t(lang, member.nameHi, member.nameEn) },
    { icon: "🪪", labelHi: "पंजीकरण / सदस्य संख्या", labelEn: "Registration Number", value: member.memberCode || "—" },
    { icon: "👨‍👦", labelHi: "पिता का नाम", labelEn: "Father's Name", value: member.fatherName || "—" },
    { icon: "🏛️", labelHi: "जनपद", labelEn: "District", value: localizeDual(member.district, lang) || "—" },
    { icon: "🏘️", labelHi: "ब्लॉक/केंद्र", labelEn: "Block / Center", value: localizeDual(member.block, lang) || "—" },
    { icon: "🏦", labelHi: "संबद्ध बैंक", labelEn: "Sponsor Bank", value: member.bankName || "—" },
    { icon: "🔑", labelHi: "केओ/सीएसपी कोड", labelEn: "KO / CSP Code", value: member.koCode || "—" },
    { icon: "📅", labelHi: "पंजीकरण दिनांक", labelEn: "Registration Date", value: fmtDate(member.joinedDate || member.joinDate || member.createdAt) },
    {
      icon: isActive ? "🟢" : "🔴",
      labelHi: "सदस्यता स्थिति",
      labelEn: "Membership Status",
      value: isActive
        ? t(lang, "सक्रिय (Active)", "Active")
        : t(lang, "निष्क्रिय / लंबित", "Inactive / Pending"),
      highlight: isActive ? "#16a34a" : "#dc2626"
    }
  ] : [];

  const docTypeLabel = isReceiptMode
    ? t(lang, "आधिकारिक शुल्क रसीद सत्यापन", "OFFICIAL FEE RECEIPT VERIFICATION")
    : isLetterMode
      ? t(lang, "आधिकारिक नियुक्ति पत्र सत्यापन", "OFFICIAL APPOINTMENT LETTER VERIFICATION")
      : t(lang, "आधिकारिक पहचान पत्र सत्यापन", "OFFICIAL ID CARD VERIFICATION");

  return (
    <div className="verification-page-container">
      {/* ── Header Card ── */}
      <div className="verification-card">
        <div className="verification-card-header">
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
            <div className="verification-logo-wrap">
              <img src="/images/upbms-crest.svg" alt="UPBMS Logo" onError={(e) => { e.target.style.display = "none"; }} />
            </div>
          </div>
          <p className="verification-org-title">{orgName}</p>
          <p className="verification-org-subtitle">{orgNameEn}</p>
          <p className="verification-org-reg">Regd. No.: {regNo}</p>
          <div style={{ marginTop: 10 }}>
            <span style={{ display: "inline-block", background: "rgba(255,255,255,0.16)", border: "1px solid rgba(255,255,255,0.28)", color: "#fde68a", fontSize: "0.75rem", fontWeight: 800, padding: "4px 12px", borderRadius: 999, letterSpacing: "0.04em" }}>
              {docTypeLabel}
            </span>
          </div>
        </div>

        {/* ── Status Badge ── */}
        {searched && (isReceiptMode ? payment : member) && (
          <div className="verification-badge-strip">
            {(isReceiptMode ? isReceiptVerified : isActive) ? (
              <div className="official-verify-badge-verified">
                <div className="badge-shield-circle">✓</div>
                <div>
                  <div className="badge-verified-title">
                    {isReceiptMode
                      ? t(lang, "शुल्क रसीद सत्यापित", "Fee Receipt Verified")
                      : isLetterMode
                        ? t(lang, "नियुक्ति पत्र सत्यापित", "Appointment Letter Verified")
                        : t(lang, "पहचान पत्र एवं सदस्यता सत्यापित", "ID Card & Membership Verified")}
                  </div>
                  <div className="badge-verified-sub">
                    {isReceiptMode
                      ? "✅ VERIFIED PAYMENT RECEIPT • सत्यापित आधिकारिक रसीद"
                      : isLetterMode
                        ? "✅ VERIFIED APPOINTMENT LETTER • प्रमाणित नियुक्ति पत्र"
                        : "✅ VERIFIED ACTIVE MEMBER • सत्यापित सक्रिय सदस्य"}
                  </div>
                </div>
              </div>
            ) : (
              <div className="official-verify-badge-invalid" style={isReceiptPending ? { background: "#fffbeb", borderColor: "#f59e0b" } : undefined}>
                <div className="badge-shield-circle" style={{ background: isReceiptPending ? "#d97706" : "#dc2626" }}>{isReceiptPending ? "!" : "✕"}</div>
                <div>
                  <div className="badge-verified-title" style={{ color: isReceiptPending ? "#92400e" : "#991b1b" }}>
                    {isReceiptPending
                      ? t(lang, "रसीद सत्यापन लंबित / निष्क्रिय", "Receipt Pending / Inactive")
                      : t(lang, "स्थिति निष्क्रिय / अमान्य", "Status Inactive / Invalid")}
                  </div>
                  <div className="badge-verified-sub" style={{ color: isReceiptPending ? "#b45309" : "#7f1d1d" }}>
                    {isReceiptPending
                      ? "⏳ PENDING ADMIN VERIFICATION • सत्यापन लंबित"
                      : "⚠ INACTIVE RECORD • निष्क्रिय रिकॉर्ड"}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Declaration Banner ── */}
        {searched && (isReceiptMode ? isReceiptVerified : (member && isActive)) && (
          <div className="verify-declaration-banner">
            {isReceiptMode ? (
              <>
                <p className="declaration-text-hi">
                  "यह प्रमाणित किया जाता है कि यह भुगतान रसीद उत्तर प्रदेश बैंक मित्र संघ के पोर्टल पर आधिकारिक रूप से दर्ज एवं सत्यापित है।"
                </p>
                <p className="declaration-text-en">
                  "This is to certify that this fee receipt is officially recorded and verified on the Uttar Pradesh Bank Mitra Sangh (UPBMS) portal."
                </p>
              </>
            ) : isLetterMode ? (
              <>
                <p className="declaration-text-hi">
                  "यह प्रमाणित किया जाता है कि यह नियुक्ति / मनोनयन पत्र उत्तर प्रदेश बैंक मित्र संघ द्वारा आधिकारिक रूप से जारी किया गया है।"
                </p>
                <p className="declaration-text-en">
                  "This is to certify that this Appointment Letter is officially issued by Uttar Pradesh Bank Mitra Sangh (UPBMS)."
                </p>
              </>
            ) : (
              <>
                <p className="declaration-text-hi">
                  "यह प्रमाणित किया जाता है कि यह व्यक्ति उत्तर प्रदेश बैंक मित्र संघ का पंजीकृत सक्रिय सदस्य है।"
                </p>
                <p className="declaration-text-en">
                  "This is to certify that this person is an active registered member of Uttar Pradesh Bank Mitra Sangh (UPBMS)."
                </p>
              </>
            )}
          </div>
        )}

        {/* ── Member / Receipt Bio + Detail Grid ── */}
        {searched && (isReceiptMode ? payment : member) && (
          <>
            {member && (
              <div className="verify-member-bio-row">
                <div className="verify-photo-box">
                  {member.photoUrl
                    ? <img src={member.photoUrl} alt={t(lang, member.nameHi, member.nameEn)} />
                    : <span style={{ fontSize: 42, opacity: 0.35 }}>👤</span>
                  }
                </div>
                <div className="verify-bio-content">
                  <h2 className="verify-member-name">{t(lang, member.nameHi, member.nameEn)}</h2>
                  <p className="verify-member-role">
                    {t(lang, member.designationHi, member.designationEn) || member.role || t(lang, "बैंक मित्र सदस्य", "Bank Mitra Member")}
                  </p>
                  <div className="verify-code-pill">
                    🪪 {isReceiptMode ? (payment?.receiptNo || member.memberCode) : member.memberCode}
                  </div>
                </div>
              </div>
            )}

            {/* ── Detail Grid ── */}
            <div className="verify-details-grid">
              {detailRows.map((row, i) => (
                <div key={i} className="verify-detail-item">
                  <span className="verify-item-label">{row.icon} {t(lang, row.labelHi, row.labelEn)}</span>
                  <span className="verify-item-value" style={row.highlight ? { color: row.highlight, fontWeight: 900 } : {}}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            {/* ── Verification timestamp ── */}
            <div style={{ padding: "10px 24px 4px", textAlign: "right", fontSize: "0.78rem", color: "#94a3b8" }}>
              🕐 {t(lang, "सत्यापन समय:", "Verified at:")} {verifiedAt}
            </div>
          </>
        )}

        {/* ── Error / Not found (Invalid) ── */}
        {searched && (isReceiptMode ? !payment : !member) && (
          <div style={{ padding: "28px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 54, marginBottom: 12 }}>❌</div>
            <h3 style={{ color: "#991b1b", fontWeight: 900, fontSize: "1.2rem", marginBottom: 8 }}>
              {isReceiptMode
                ? t(lang, "अमान्य शुल्क रसीद (Invalid Receipt)", "Invalid Fee Receipt")
                : isLetterMode
                  ? t(lang, "अमान्य नियुक्ति पत्र (Invalid Letter)", "Invalid Appointment Letter")
                  : t(lang, "सदस्यता सत्यापन असफल (Invalid)", "Membership Verification Failed (Invalid)")}
            </h3>
            <p style={{ color: "#64748b", fontSize: "0.9rem", maxWidth: 480, margin: "0 auto 10px" }}>
              {error || t(lang, "दर्ज की गई आईडी से कोई पंजीकृत रिकॉर्ड नहीं मिला।", "No registered record found for the entered ID.")}
            </p>
          </div>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div style={{ padding: "36px 24px", textAlign: "center", color: "#64748b", fontSize: "1rem" }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>⏳</div>
            {t(lang, "सत्यापन डेटा प्राप्त हो रहा है...", "Fetching verification data...")}
          </div>
        )}

        {/* ── Search Bar ── */}
        <div style={{ padding: "20px 24px 24px", background: "#f8fafc", borderTop: "1.5px solid #e2e8f0" }} className="no-print">
          <p style={{ fontSize: "0.88rem", color: "#475569", fontWeight: 700, marginBottom: 10, textAlign: "center" }}>
            🔍 {t(lang, "किसी अन्य सदस्य या रसीद का सत्यापन करें — आईडी, रसीद संख्या या मोबाइल नंबर दर्ज करें", "Verify another member or receipt — enter ID, Receipt No, or mobile number")}
          </p>
          <form onSubmit={handleSearch} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input
              className="form-control"
              style={{ flex: 1, minWidth: 200, height: 44 }}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t(lang, "सदस्य आईडी / रसीद संख्या / मोबाइल नंबर", "Member ID / Receipt No / Mobile Number")}
              required
            />
            <button type="submit" className="btn-verify-search" disabled={loading}>
              {loading ? t(lang, "खोज रहे हैं...", "Searching...") : `🔍 ${t(lang, "सत्यापित करें", "Verify")}`}
            </button>
          </form>
        </div>

        {/* ── Action Buttons ── */}
        <div style={{ padding: "16px 24px 24px", display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }} className="no-print">
          {searched && member && (
            <button
              className="btn btn-accent btn-sm"
              onClick={() => window.print()}
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              🖨️ {t(lang, "सत्यापन पर्ची प्रिंट करें", "Print Verification Slip")}
            </button>
          )}
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setRoute("idcard")}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            🪪 {t(lang, "पहचान पत्र पोर्टल", "ID Card Portal")}
          </button>
          <button
            className="btn btn-white btn-sm"
            onClick={() => { setRoute("home"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            🏠 {t(lang, "मुख्य पृष्ठ पर जाएं", "Return to Homepage")}
          </button>
        </div>
      </div>

      {/* ── Official Footer ── */}
      <div className="verify-portal-footer no-print">
        <span>🏛️ {orgName} | <strong>Official Member Verification Portal</strong></span>
        <span style={{ display: "block", fontSize: "0.78rem", marginTop: 4, opacity: 0.75 }}>
          {t(lang, "हेल्पलाइन:", "Helpline:")} {s.helpline || "+91-94500-11223"} &nbsp;|&nbsp; {s.email || "helpdesk@upbms.org.in"}
        </span>
      </div>
    </div>
  );
}

export function Modals() {
  const { modal, setModal, lang, state, session, persistSession, logout, refresh, showToast, recordSignedUsage } = usePortal();
  useEffect(() => {
    if (modal) {
      document.body.classList.add("modal-open");
      return () => document.body.classList.remove("modal-open");
    }
  }, [modal]);

  if (!modal) return null;

  if (modal.kind === "login") {
    return (
      <div className="modal-backdrop" onClick={() => setModal(null)}>
        <div className="modal-box modal-box-login" onClick={(e) => e.stopPropagation()}>
          <LoginModalContent
            modal={modal}
            setModal={setModal}
            lang={lang}
            showToast={showToast}
            persistSession={persistSession}
            refresh={refresh}
          />
        </div>
      </div>
    );
  }

  let body = null;
  const item = modal.item;
  const isPrintable = modal.kind === "file" || modal.kind === "signedDoc" || modal.kind === "plainDoc" || modal.kind === "receipt";
  const modalTitle = modal.kind === "file"
    ? `📜 ${t(lang, item?.titleHi, item?.titleEn) || t(lang, "प्रमाण-पत्र व दस्तावेज़", "Certificate & Document")}`
    : modal.kind === "plainDoc" || modal.kind === "signedDoc"
    ? `📜 ${t(lang, item?.titleHi, item?.titleEn) || t(lang, "संघ दस्तावेज़", "Association Document")}`
    : modal.kind === "receipt"
    ? `🧾 ${t(lang, "शुल्क रसीद", "Payment Receipt")}`
    : modal.kind === "memberMenu"
    ? `👤 ${t(lang, "सदस्य प्रोफ़ाइल", "Member Profile")}`
    : "UPBMS";

  if (modal.kind === "memberMenu") {
    const userLvl = session?.level || (session?.isAdmin ? 1 : (session?.member?.level || 3));
    const rawMember = session?.member || {};
    // Find freshest member record from state
    const m = (state.members || []).find((mem) => mem.id === rawMember.id || mem.memberCode === rawMember.memberCode) || rawMember;

    const memberReceipts = (state.payments || []).filter(
      (p) => p.memberId === m.id || p.memberCode === m.memberCode || (m.mobile && p.mobile === m.mobile)
    );
    const latestReceipt = memberReceipts[0] || null;

    body = (
      <div className="profile-modal-container">
        {/* Profile Hero Header Card */}
        <div className="profile-hero-card">
          <div className="profile-avatar-wrap">
            {m.photoUrl ? (
              <img
                src={m.photoUrl}
                alt={m.nameHi || m.nameEn}
                className="profile-avatar-img"
              />
            ) : (
              <div className="profile-avatar-fallback">
                {m.nameHi?.charAt(0) || m.nameEn?.charAt(0) || "👤"}
              </div>
            )}
          </div>

          <div className="profile-hero-info">
            <div className="profile-hero-badges">
              <span className={`badge badge-level${userLvl}`} style={{ fontSize: "0.78rem", padding: "3px 10px" }}>
                {userLvl === 1 && "👑 " + t(lang, "मुख्य प्रशासक", "Super Admin")}
                {userLvl === 2 && "⭐ " + t(lang, "प्रशासक", "Admin")}
                {userLvl === 3 && "🎖️ " + t(lang, "सक्रिय सदस्य", "Active Member")}
                {userLvl === 4 && "👤 " + t(lang, "आगंतुक", "Guest Visitor")}
              </span>
              <span style={{
                background: m.status === "active" ? "#16a34a" : "#ca8a04",
                color: "#ffffff",
                padding: "3px 9px",
                borderRadius: 12,
                fontSize: "0.74rem",
                fontWeight: 800
              }}>
                {m.status === "active" ? "✓ " + t(lang, "सक्रिय", "Active") : "⏳ " + t(lang, "लंबित", "Pending")}
              </span>
            </div>

            <div className="profile-hero-name-hi">
              {t(lang, m.nameHi, m.nameEn)}
            </div>
            {m.nameEn && m.nameHi && (
              <div className="profile-hero-name-en">
                {m.nameEn}
              </div>
            )}
            <div className="profile-hero-sub">
              <span>{t(lang, m.designationHi, m.designationEn) || (m.isCoreMember ? t(lang, "प्रदेश पदाधिकारी", "State Executive") : t(lang, "सक्रिय बैंक मित्र", "Active Bank Mitra"))}</span>
              <span>•</span>
              <span className="profile-member-code-badge">{m.memberCode || "UPBMS-MEMBER"}</span>
            </div>
          </div>
        </div>

        {/* Section 1: Personal & Contact Information */}
        <div className="profile-section-card">
          <div className="profile-section-header">
            <span>👤</span>
            <span>{t(lang, "व्यक्तिगत एवं संपर्क विवरण", "Personal & Contact Details")}</span>
          </div>
          <div className="profile-fields-grid">
            <div className="profile-field-item">
              <span className="profile-field-label">{t(lang, "पिता का नाम", "Father's Name")}</span>
              <span className="profile-field-value">{t(lang, m.fatherName, m.fatherNameEn) || "—"}</span>
            </div>
            <div className="profile-field-item">
              <span className="profile-field-label">{t(lang, "मोबाइल नंबर (WhatsApp)", "Mobile (WhatsApp)")}</span>
              <span className="profile-field-value">{m.mobile || "—"}</span>
            </div>
            <div className="profile-field-item">
              <span className="profile-field-label">{t(lang, "ईमेल पता", "Email Address")}</span>
              <span className="profile-field-value">
                {m.email || "—"}{" "}
                {m.isEmailVerified && (
                  <span style={{ color: "#16a34a", fontSize: "0.76rem", fontWeight: 800, marginLeft: 4 }}>
                    ✓ {t(lang, "सत्यापित", "Verified")}
                  </span>
                )}
              </span>
            </div>
            <div className="profile-field-item">
              <span className="profile-field-label">{t(lang, "रक्त समूह", "Blood Group")}</span>
              <span className="profile-field-value">{m.bloodGroup || "—"}</span>
            </div>
          </div>
        </div>

        {/* Section 2: Banking & CSP Operations */}
        <div className="profile-section-card">
          <div className="profile-section-header">
            <span>🏦</span>
            <span>{t(lang, "बैंकिंग एवं सीएसपी संचालन विवरण", "Banking & CSP Operation Details")}</span>
          </div>
          <div className="profile-fields-grid">
            <div className="profile-field-item">
              <span className="profile-field-label">{t(lang, "संबंधित बैंक", "Associated Bank")}</span>
              <span className="profile-field-value">{m.bankName || "—"}</span>
            </div>
            <div className="profile-field-item">
              <span className="profile-field-label">{t(lang, "कॉर्पोरेट बीसी कंपनी", "Corporate BC Company")}</span>
              <span className="profile-field-value">{m.bcCompany || "—"}</span>
            </div>
            <div className="profile-field-item">
              <span className="profile-field-label">{t(lang, "केओ / सीएसपी कोड", "KO / CSP Code")}</span>
              <span className="profile-field-value"><code>{m.koCode || "—"}</code></span>
            </div>
            <div className="profile-field-item">
              <span className="profile-field-label">{t(lang, "जनपद (District)", "District")}</span>
              <span className="profile-field-value">{localizeDual(m.district, lang) || "—"}</span>
            </div>
            <div className="profile-field-item">
              <span className="profile-field-label">{t(lang, "ब्लॉक / केंद्र", "Block / Center")}</span>
              <span className="profile-field-value">{t(lang, m.block, m.blockEn) || "—"}</span>
            </div>
            <div className="profile-field-item">
              <span className="profile-field-label">{t(lang, "सदस्यता श्रेणी", "Member Category")}</span>
              <span className="profile-field-value">{m.memberCategory || "General Member"}</span>
            </div>
          </div>
        </div>

        {/* Section 3: Membership Status & Payment */}
        <div className="profile-section-card">
          <div className="profile-section-header">
            <span>📜</span>
            <span>{t(lang, "सदस्यता पंजीकरण एवं शुल्क विवरण", "Membership & Fee Record")}</span>
          </div>
          <div className="profile-fields-grid">
            <div className="profile-field-item">
              <span className="profile-field-label">{t(lang, "सदस्यता प्रारंभ दिनांक", "Joined Date")}</span>
              <span className="profile-field-value">{m.joinedDate || "—"}</span>
            </div>
            <div className="profile-field-item">
              <span className="profile-field-label">{t(lang, "मान्यता समाप्ति दिनांक", "Valid Until")}</span>
              <span className="profile-field-value">{m.validUntil || "—"}</span>
            </div>
            <div className="profile-field-item">
              <span className="profile-field-label">{t(lang, "जमा वार्षिक सदस्यता शुल्क", "Annual Fee Paid")}</span>
              <span className="profile-field-value" style={{ color: "#15803d" }}>₹{m.feePaid || 251}</span>
            </div>
            <div className="profile-field-item">
              <span className="profile-field-label">{t(lang, "शुल्क रसीद संख्या", "Receipt No")}</span>
              <span className="profile-field-value"><code>{latestReceipt?.receiptNo || "UPBMS-RCP-2026"}</code></span>
            </div>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="profile-actions-bar">
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => { setRoute("idcard"); setModal(null); }}
              style={{ fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              🪪 {t(lang, "पहचान पत्र व नियुक्ति पत्र", "View ID Card & Letter")}
            </button>
            {userLvl <= 2 && (
              <button
                className="btn btn-accent btn-sm"
                onClick={() => { setRoute("admin"); setModal(null); }}
                style={{ fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                ⚙️ {t(lang, "एडमिन पैनल", "Admin Panel")}
              </button>
            )}
          </div>
          <button
            className="btn btn-danger btn-sm"
            onClick={logout}
            style={{ fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            🔒 {t(lang, "लॉगआउट करें", "Sign Out")}
          </button>
        </div>
      </div>
    );
  } else if (modal.kind === "file" && !modal.locked) {
    body = window.UPBMSPrint ? <HtmlBlock html={window.UPBMSPrint.renderExactUploadedFileHtml(item, lang)} /> : <a href={item.fileUrl}>{item.fileUrl}</a>;
  } else if (modal.kind === "plainDoc") {
    body = <HtmlBlock html={window.UPBMSPrint?.renderUnsignedAssocDocumentHtml?.(item, state.settings, lang)} />;
  } else if (modal.kind === "signedDoc") {
    const ids = item.signatoryIds || state.settings.defaultSignatoryIds;
    body = (
      <>
        <HtmlBlock html={window.UPBMSPrint?.renderAssociationDocumentHtml?.(item, state.settings, ids, lang, null)} />
      </>
    );
  } else if (modal.kind === "receipt") {
    body = <HtmlBlock html={window.UPBMSPrint?.renderReceiptHtml?.(modal.payment, state.settings, modal.payment.signatoryIds, lang, null)} />;
  }
  return (
    <div className="modal-backdrop" onClick={() => setModal(null)}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 800, fontSize: "1.05rem" }}>
            <span>{modalTitle}</span>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }} className="no-print">
            {isPrintable && (
              <button
                className="btn btn-accent btn-sm"
                onClick={() => window.print()}
                style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}
              >
                🖨️ {t(lang, "प्रिंट करें", "Print")}
              </button>
            )}
            <button
              className="btn btn-white btn-sm"
              onClick={() => setModal(null)}
              style={{ color: "#b91c1c", fontWeight: 800, display: "inline-flex", alignItems: "center", gap: "4px" }}
            >
              ✕ {t(lang, "बंद करें", "Close")}
            </button>
          </div>
        </div>
        <div className="modal-body" style={{ padding: 0 }}>{body}</div>
      </div>
    </div>
  );
}
