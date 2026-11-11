import { useEffect, useState } from "react";
import { usePortal } from "../context";
import { NAV_ICONS, SOCIAL, grievanceEnabled, t } from "../utils";

function Icon({ name }) {
  return <span dangerouslySetInnerHTML={{ __html: SOCIAL[name] || SOCIAL.link }} />;
}

export function Layout({ children }) {
  const { state, lang, setLang, route, setRoute, session, persistSession, showToast, setModal } = usePortal();
  if (!state) return null;
  const s = state.settings;
  const sl = s.socialLinks || {};
  const hb = s.headerButtons || {};
  const stx = s.sectionTexts || {};
  const grv = grievanceEnabled(state);
  const pendingTotal = (state.stats?.pendingMembersCount || 0) + (state.stats?.pendingPaymentsCount || 0);
  const navItems = [...(s.navItems || [])]
    .filter((it) => it.visible !== false && it.id !== "grievance" || (it.id === "grievance" && grv && it.visible !== false))
    .filter((it) => !["admin", "idcard", "donation"].includes(it.id))
    .sort((a, b) => (a.order || 99) - (b.order || 99));
  const ticker = lang === "en" ? (s.tickerNoticesEn || s.tickerNoticesHi || []) : (s.tickerNoticesHi || []);
  const socials = [
    ["whatsappChannel", "whatsapp", "WA"],
    ["whatsappGroup", "whatsapp", lang === "en" ? "Group" : "ग्रुप"],
    ["facebook", "facebook", "FB"],
    ["instagram", "instagram", "Insta"],
    ["youtube", "youtube", "YT"],
    ["twitter", "twitter", "X"],
    ["telegram", "telegram", "TG"]
  ];
  const member = session?.member;

  return (
    <>
      <div className="top-utility no-print">
        <div className="container top-utility-inner">
          <div className="top-left-meta">
            <a href={`tel:${s.helplinePrimary}`} className="top-pill">📞 <b>{t(lang, "हेल्पलाइन:", "Helpline:")}</b> {s.helplinePrimary}</a>
            <a href={`mailto:${s.email}`} className="top-pill">✉️ {s.email}</a>
          </div>
          <div className="top-right-actions">
            <div className="social-icon-strip">
              {socials.filter(([key]) => sl[key]).map(([key, icon, label]) => (
                <a key={key} href={sl[key]} target="_blank" rel="noreferrer" className="soc-icon-btn"><Icon name={icon} /><span>{label}</span></a>
              ))}
            </div>
            <button className="btn-lang" onClick={() => setLang(lang === "hi" ? "en" : "hi")}>🌐 {lang === "hi" ? "Switch to English" : "हिंदी में देखें"}</button>
            <button className="btn-admin-launch" onClick={() => setRoute("admin")}>⚙️ {t(lang, hb.adminLabelHi || "एडमिन पैनल", hb.adminLabelEn || "Admin Panel")} {pendingTotal ? `(${pendingTotal})` : ""}</button>
          </div>
        </div>
      </div>

      <header className="site-header no-print">
        <div className="container brand-row">
          <div className="brand-identity" onClick={() => setRoute("home")}>
            <div className="brand-logo-wrap"><img src={s.logoUrl || "/images/upbms-crest.svg"} alt={s.shortName} /></div>
            <div style={{ minWidth: 0 }}>
              <div className="brand-badge-row">
                <span className="short-tag">{s.shortName}</span>
                <span className="reg-tag">{s.regNumber}</span>
              </div>
              <div className="brand-name">{t(lang, s.orgNameHi, s.orgNameEn)}</div>
              <div className="brand-tagline">{t(lang, s.taglineHi, s.taglineEn)}</div>
            </div>
          </div>
          <div className="header-cta-group">
            {hb.memberLoginVisible !== false && (
              <button className="btn btn-outline btn-sm" onClick={() => member ? (showToast(t(lang, "सदस्य सत्र सक्रिय है।", "Member session is active.")), setModal({ kind: "memberMenu" })) : setModal({ kind: "login" })}>
                🔑 {member ? t(lang, member.nameHi, member.nameEn) : t(lang, hb.memberLoginLabelHi || "सदस्य लॉगिन", hb.memberLoginLabelEn || "Member Login")}
              </button>
            )}
            {hb.idcardVisible !== false && (
              <button className={`btn ${route === "idcard" ? "btn-primary" : "btn-outline"} btn-sm`} onClick={() => setRoute("idcard")}>🪪 {t(lang, hb.idcardLabelHi || "पहचान पत्र एवं नियुक्ति पत्र", hb.idcardLabelEn || "ID Card & Appointment Letter")}</button>
            )}
            {hb.donationVisible !== false && (
              <button className="btn btn-whatsapp btn-sm" onClick={() => setRoute("donation")}>🤝 {t(lang, hb.donationLabelHi || "सहयोग राशि / डोनेशन", hb.donationLabelEn || "Contribute / Donate")}</button>
            )}
            {hb.joinVisible !== false && (
              <button className="btn btn-accent btn-sm" onClick={() => setRoute("join")}>✍️ {t(lang, hb.joinLabelHi, hb.joinLabelEn)}</button>
            )}
          </div>
        </div>
        <nav className="main-nav">
          <div className="container nav-list">
            {navItems.map((it) => (
              <button key={it.id} className={`nav-btn ${route === it.id ? "active" : ""}`} onClick={() => setRoute(it.id)}>
                <span>{NAV_ICONS[it.id] || "•"}</span>
                <span>{t(lang, it.labelHi, it.labelEn)}</span>
              </button>
            ))}
          </div>
        </nav>
      </header>

      {ticker.length > 0 && (
        <div className="ticker-bar no-print">
          <div className="container ticker-inner">
            <span className="ticker-label">{t(lang, stx.tickerBadgeHi || "ताज़ा सूचना", stx.tickerBadgeEn || "LATEST UPDATE")}</span>
            <div className="ticker-track-wrap"><div className="ticker-track">{ticker.join("   ✦   ")}</div></div>
          </div>
        </div>
      )}

      <main>{children}</main>

      <footer className="site-footer no-print">
        <div className="container">
          <div className="footer-grid">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <img src={s.logoUrl || "/images/upbms-crest.svg"} style={{ width: 48, height: 48, borderRadius: "50%", background: "#fff", padding: 2 }} alt="" />
                <div>
                  <div style={{ color: "#ffd166", fontWeight: 900 }}>{t(lang, s.orgNameHi, s.orgNameEn)}</div>
                  <div style={{ fontSize: "0.78rem" }}>{s.regNumber}</div>
                </div>
              </div>
              <p style={{ fontSize: "0.86rem", color: "#94a3b8" }}>{t(lang, s.taglineHi, s.taglineEn)}</p>
            </div>
            <div>
              <div className="footer-title">{t(lang, "प्रमुख मेनू लिंक", "Quick Navigation")}</div>
              <ul className="footer-links">
                {navItems.map((it) => <li key={it.id}><button onClick={() => setRoute(it.id)}>• {t(lang, it.labelHi, it.labelEn)}</button></li>)}
                <li><button onClick={() => setRoute("idcard")}>• {t(lang, "पहचान पत्र एवं नियुक्ति पत्र", "ID Card & Appointment Letter")}</button></li>
                <li><button onClick={() => setRoute("donation")}>• {t(lang, "सहयोग राशि / डोनेशन", "Contribute / Donate")}</button></li>
              </ul>
            </div>
            <div>
              <div className="footer-title">{t(lang, "उपयोगी बैंकिंग पोर्टल", "Important Portals")}</div>
              <ul className="footer-links">
                {state.externalLinks.slice(0, 5).map((l) => <li key={l.id}><a href={l.url} target="_blank" rel="noreferrer">🔗 {t(lang, l.titleHi, l.titleEn)}</a></li>)}
              </ul>
            </div>
            <div>
              <div className="footer-title">{t(lang, "प्रांतीय कार्यालय संपर्क", "State Office Contact")}</div>
              <div style={{ fontSize: "0.86rem", display: "grid", gap: 6 }}>
                <div>📍 {t(lang, s.headOfficeHi, s.headOfficeEn)}</div>
                <div>📞 {s.helplinePrimary}</div>
                <div>✉️ {s.email}</div>
              </div>
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.12)", paddingTop: 16, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10, fontSize: "0.81rem", color: "#94a3b8" }}>
            <span>© 2026 {t(lang, s.orgNameHi, s.orgNameEn)} ({s.shortName})</span>
            <span>{t(lang, stx.footerCopyrightHi, stx.footerCopyrightEn)}</span>
          </div>
        </div>
      </footer>
      <button
        type="button"
        className="floating-join no-print"
        onClick={() => {
          setRoute("join");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      >
        ✍️ {t(lang, hb.joinLabelHi || "सदस्य बनें", hb.joinLabelEn || "Join Membership")}
      </button>
    </>
  );
}

export function HeroSlider() {
  const { state, lang } = usePortal();
  const slides = (state.slides || []).filter((s) => s.active !== false);
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (slides.length < 2) return undefined;
    const timer = setInterval(() => setIdx((n) => (n + 1) % slides.length), 5000);
    return () => clearInterval(timer);
  }, [slides.length]);
  if (!slides.length) return null;
  const sl = slides[idx % slides.length];
  const caption = t(lang, sl.captionHi, sl.captionEn);
  return (
    <div className="hero-16x9-stage">
      <img src={sl.imageUrl} alt={caption || "UPBMS"} className={`hero-16x9-img ${sl.fitMode === "contain" ? "fit-contain" : ""}`} />
      {caption && <div className="hero-caption-pill">📸 {caption}</div>}
      {slides.length > 1 && (
        <>
          <button className="hero-arrow prev" onClick={() => setIdx((n) => (n - 1 + slides.length) % slides.length)}>‹</button>
          <button className="hero-arrow next" onClick={() => setIdx((n) => (n + 1) % slides.length)}>›</button>
          <div className="hero-dots">
            {slides.map((_, i) => <button key={i} className={`hero-dot ${i === idx % slides.length ? "active" : ""}`} onClick={() => setIdx(i)} />)}
          </div>
        </>
      )}
    </div>
  );
}

export function MemberCard({ member, compact }) {
  const { lang, session, setRoute, setModal } = usePortal();
  const photo = member.photoUrl || (window.UPBMSHelpers?.initialsAvatarSvg?.(member.nameEn || member.nameHi, compact ? "#184296" : "#0b2559", "#ffffff") || "/images/upbms-crest.svg");
  const own = session?.isAdmin || (session?.member?.status === "active" && session.member.id === member.id);
  if (compact) {
    return (
      <div className="member-compact-card">
        <div className="member-avatar-sm"><img src={photo} alt="" /></div>
        <div className="member-compact-info">
          <div className="member-compact-name">{t(lang, member.nameHi, member.nameEn)}</div>
          <div className="member-compact-role">{t(lang, member.designationHi, member.designationEn)}</div>
          <div className="member-compact-meta">📍 {window.UPBMSPrint?.localizeDual?.(member.district, lang) || member.district}</div>
          <div className="member-compact-meta">ID: <b>{member.memberCode}</b></div>
        </div>
        {own ? <button className="btn btn-outline btn-sm" onClick={() => { setRoute("idcard"); setModal(null); }}>🪪 {t(lang, "मेरा कार्ड", "My Card")}</button> : <span className="badge badge-verified">✓ {t(lang, "सक्रिय", "Active")}</span>}
      </div>
    );
  }
  const quote = t(lang, member.messageHi, member.messageEn);
  const website = member.websiteUrl || member.website;
  return (
    <article className="core-card">
      <div className="core-card-top-ribbon"><span>★ {t(lang, "प्रदेश मुख्य कार्यकारिणी", "STATE CORE EXECUTIVE COMMITTEE")}</span><span>ID: {member.memberCode}</span></div>
      <div className="core-card-body">
        <div className="core-photo-frame">
          <img src={photo} alt="" />
          <span className="core-verified-seal">✓ {t(lang, "सत्यापित", "Verified")}</span>
        </div>
        <div className="core-info">
          <div className="core-designation-banner">🎖️ {t(lang, member.designationHi, member.designationEn)}</div>
          <h3 className="core-name">{t(lang, member.nameHi, member.nameEn)}</h3>
          <div className="core-meta-list">
            <span>📍 {window.UPBMSPrint?.localizeDual?.(member.district, lang) || member.district}</span>
            <span>🏦 {member.bankName}</span>
            <span>✉️ {t(lang, "ईमेल:", "Email:")} <b>{member.email || "info@upbms.org"}</b></span>
          </div>
          {quote && <div className="core-quote">“{quote}”</div>}
          <div className="core-actions">
            <a href={`tel:${member.mobile}`} className="btn btn-primary btn-sm">📞 {member.mobile}</a>
            {website ? (
              <a
                href={website.startsWith("http://") || website.startsWith("https://") ? website : `https://${website}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline btn-sm"
                style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
              >
                🌐 {t(lang, "वेबसाइट", "Website")}
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

export function PortalCard({ link }) {
  const { lang } = usePortal();
  const domain = link.domainLabel || String(link.url || "").replace(/^https?:\/\//, "").split("/")[0];
  return (
    <article className="portal-big-card">
      <a href={link.url} target="_blank" rel="noreferrer" className="portal-big-image-box">
        <img src={link.imageUrl} alt={t(lang, link.titleHi, link.titleEn)} />
        <span className="portal-cat-badge">{t(lang, link.categoryHi, link.categoryEn)}</span>
        <span className="portal-domain-pill">🔗 {domain}</span>
      </a>
      <div className="portal-big-content">
        <div>
          <h3 className="portal-big-title">{t(lang, link.titleHi, link.titleEn)}</h3>
          <p className="portal-big-desc">{t(lang, link.descHi, link.descEn)}</p>
        </div>
        <a href={link.url} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ width: "100%" }}>🌐 {t(lang, "आधिकारिक पोर्टल खोलें", "Open Official Portal")} ↗</a>
      </div>
    </article>
  );
}

export function HtmlBlock({ html }) {
  return <div dangerouslySetInnerHTML={{ __html: html || "" }} />;
}
