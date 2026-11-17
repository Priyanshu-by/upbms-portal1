export function t(lang, hi, en) {
  return lang === "en" ? (en !== undefined && en !== "" ? en : hi) : (hi !== undefined && hi !== "" ? hi : en);
}

export function localizeDual(val, lang) {
  const helpers = window.UPBMSPrint;
  if (helpers?.localizeDual) return helpers.localizeDual(val, lang);
  const str = String(val || "").trim();
  const m = str.match(/^(.+?)\s*\(([^)]+)\)$/);
  if (m) return lang === "en" ? m[2].trim() : m[1].trim();
  return str;
}

export function initialsAvatar(name, bg = "#0a2252", fg = "#ffd166") {
  if (window.UPBMSHelpers?.initialsAvatarSvg) return window.UPBMSHelpers.initialsAvatarSvg(name, bg, fg);
  return "/images/upbms-crest.svg";
}

export function qrSvg(text, size = 128, color = "#0a2252") {
  return window.UPBMSHelpers?.generateQrSvg?.(text, size, color) || "";
}

export function grievanceEnabled(state) {
  if (!state?.settings) return true;
  if (state.settings.enableGrievanceModule === false) return false;
  const nav = (state.settings.navItems || []).find((x) => x.id === "grievance");
  if (nav && nav.visible === false) return false;
  return true;
}

export function canAccessSigned(session) {
  return Boolean(session?.isAdmin || (session?.member && session.member.status === "active"));
}

export function canAccessPersonal(session, memberId) {
  if (session?.isAdmin) return true;
  return Boolean(session?.member && session.member.status === "active" && session.member.id === memberId);
}

export function canAccessReceipt(session, payment) {
  if (!payment) return false;
  if (session?.isAdmin) return true;
  const m = session?.member;
  if (!m || m.status !== "active") return false;
  return payment.memberId === m.id || (payment.memberCode && payment.memberCode === m.memberCode) || (payment.mobile && payment.mobile === m.mobile);
}

export const NAV_ICONS = {
  home: "🏠",
  about: "🏛️",
  members: "👥",
  join: "✍️",
  circulars: "📑",
  documents: "📂",
  grievance: "⚖️",
  portals: "🌐"
};

export const SOCIAL = {
  whatsapp: `<svg viewBox="0 0 32 32" width="20" height="20"><circle cx="16" cy="16" r="16" fill="#25D366"/><path fill="#ffffff" d="M16 6.5C10.8 6.5 6.5 10.7 6.5 16c0 1.9.5 3.6 1.5 5.1L6.5 25.5l4.6-1.4c1.4.9 3.1 1.4 4.9 1.4 5.3 0 9.5-4.2 9.5-9.5s-4.2-9.5-9.5-9.5zm5.6 13.5c-.2.7-1.3 1.4-1.8 1.4-.5.1-1.1.1-1.8-.1a16.4 16.4 0 0 1-6.2-5.4c-.7-.9-1.2-2.1-1.2-3.2 0-1.1.6-1.7.8-2 .2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.4.2.5.7 1.7.8 1.8.1.2.1.3 0 .5-.1.2-.2.3-.4.5l-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.4 1.8 2.2 1.2 1.1 2.2 1.4 2.6 1.6.3.1.5.1.7-.1.2-.2.8-.9 1-1.2.2-.3.4-.2.7-.1.3.1 1.8.8 2.1 1 .3.2.5.2.6.4.1.1.1.7-.1 1.3z"/></svg>`,
  whatsappGroup: `<svg viewBox="0 0 32 32" width="20" height="20"><circle cx="16" cy="16" r="16" fill="#128C7E"/><path fill="#ffffff" d="M12.5 14a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm7 0a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zm-7 1.5c-2.4 0-7 1.2-7 3.6V21h14v-1.9c0-2.4-4.6-3.6-7-3.6zm7 0c-.5 0-1.1.1-1.7.2 1.1.8 1.7 1.8 1.7 3.2V21h5v-1.9c0-2.2-3.7-3.6-5-3.6z"/></svg>`,
  facebook: `<svg viewBox="0 0 32 32" width="20" height="20"><circle cx="16" cy="16" r="16" fill="#1877F2"/><path fill="#ffffff" d="M17.8 25v-8.2h2.8l.4-3.2h-3.2V11.5c0-.9.3-1.6 1.6-1.6h1.7V7.1c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.3h-2.8v3.2h2.8V25h3.4z"/></svg>`,
  instagram: `<svg viewBox="0 0 32 32" width="20" height="20"><defs><radialGradient id="ig-grad-utils" cx="20%" cy="110%" r="130%"><stop offset="0%" stop-color="#ffd600"/><stop offset="25%" stop-color="#ff7a00"/><stop offset="50%" stop-color="#ff0169"/><stop offset="75%" stop-color="#d300c5"/><stop offset="100%" stop-color="#7638fa"/></radialGradient></defs><rect x="0" y="0" width="32" height="32" rx="9" fill="url(#ig-grad-utils)"/><path fill="#ffffff" d="M16 9.8c2 0 2.2 0 3 .1.7.1 1.1.2 1.4.3.4.2.6.3.9.6.3.3.4.5.6.9.1.3.2.7.3 1.4.1.8.1 1 .1 3s0 2.2-.1 3c-.1.7-.2 1.1-.3 1.4-.2.4-.3.6-.6.9-.3.3-.5.4-.9.6-.3.1-.7.2-1.4.3-.8.1-1 .1-3 .1s-2.2 0-3-.1c-.7-.1-1.1-.2-1.4-.3-.4-.2-.6-.3-.9-.6-.3-.3-.4-.5-.6-.9-.1-.3-.2-.7-.3-1.4-.1-.8-.1-1-.1-3s0-2.2.1-3c.1-.7.2-1.1.3-1.4.2-.4.3-.6.6-.9.3-.3.5-.4.9-.6.3-.1.7-.2 1.4-.3.8-.1 1-.1 3-.1m0-1.8c-2 0-2.3 0-3.1.1-.8.1-1.3.2-1.8.4-.5.2-.9.5-1.3.9-.4.4-.7.8-.9 1.3-.2.5-.3 1-.4 1.8-.1.8-.1 1.1-.1 3.1s0 2.3.1 3.1c.1.8.2 1.3.4 1.8.2.5.5.9.9 1.3.4.4.8.7 1.3.9.5.2 1 .3 1.8.4.8.1 1.1.1 3.1.1s2.3 0 3.1-.1c.8-.1 1.3-.2 1.8-.4.5-.2.9-.5 1.3-.9.4-.4.7-.8.9-1.3.2-.5.3-1 .4-1.8.1-.8.1-1.1.1-3.1s0-2.3-.1-3.1c-.1-.8-.2-1.3-.4-1.8-.2-.5-.5-.9-.9-1.3-.4-.4-.8-.7-1.3-.9-.5-.2-1-.3-1.8-.4-.8-.1-1.1-.1-3.1-.1z"/><path fill="#ffffff" d="M16 12.3a3.7 3.7 0 1 0 0 7.4 3.7 3.7 0 0 0 0-7.4zm0 6a2.3 2.3 0 1 1 0-4.6 2.3 2.3 0 0 1 0 4.6zm4.8-5.3a.9.9 0 1 0 0-1.8.9.9 0 0 0 0 1.8z"/></svg>`,
  youtube: `<svg viewBox="0 0 32 32" width="20" height="20"><rect x="0" y="0" width="32" height="32" rx="9" fill="#FF0000"/><path fill="#ffffff" d="M24.7 11.4a2.2 2.2 0 0 0-1.5-1.5C21.9 9.5 16 9.5 16 9.5s-5.9 0-7.2.4a2.2 2.2 0 0 0-1.5 1.5c-.4 1.3-.4 4.1-.4 4.1s0 2.8.4 4.1a2.2 2.2 0 0 0 1.5 1.5c1.3.4 7.2.4 7.2.4s5.9 0 7.2-.4a2.2 2.2 0 0 0 1.5-1.5c.4-1.3.4-4.1.4-4.1s0-2.8-.4-4.1zM14.5 18.5V12.7l5.2 2.9-5.2 2.9z"/></svg>`,
  twitter: `<svg viewBox="0 0 32 32" width="20" height="20"><rect x="0" y="0" width="32" height="32" rx="9" fill="#000000"/><path fill="#ffffff" d="M19.7 7.5h2.5l-5.5 6.3L23.2 24h-5.1l-4-5.2-4.6 5.2H7l5.9-6.7L6.8 7.5h5.3l3.6 4.8 4-4.8zm-.9 15h1.4l-8.9-13.5H9.8l9 13.5z"/></svg>`,
  telegram: `<svg viewBox="0 0 32 32" width="20" height="20"><circle cx="16" cy="16" r="16" fill="#229ED9"/><path fill="#ffffff" d="M23.5 8.5 7.2 14.8c-1.1.4-1.1 1-.2 1.3l4.2 1.3 1.6 4.9c.2.6.1.8.7.8.4 0 .6-.2.9-.4l2.4-2.3 4.9 3.6c.9.5 1.6.3 1.8-.8l3.2-15c.3-1.3-.5-1.9-1.4-1.5z"/></svg>`,
  link: `<svg viewBox="0 0 32 32" width="20" height="20"><circle cx="16" cy="16" r="16" fill="#475569"/><path fill="#ffffff" d="M14.6 17.4a1 1 0 0 1 0-1.4l3.4-3.4a1 1 0 0 1 1.4 1.4l-3.4 3.4a1 1 0 0 1-1.4 0z"/><path fill="#ffffff" d="M12.2 20.8a4 4 0 0 1 0-5.6l2.2-2.2a1 1 0 1 0-1.4-1.4l-2.2 2.2a6 6 0 0 0 8.5 8.5l2.2-2.2a1 1 0 0 0-1.4-1.4l-2.2 2.2a4 4 0 0 1-5.7 0zm7.6-9.6a4 4 0 0 1 0 5.6l-2.2 2.2a1 1 0 1 0 1.4 1.4l2.2-2.2a6 6 0 0 0-8.5-8.5L10.5 11.9a1 1 0 1 0 1.4 1.4l2.2-2.2a4 4 0 0 1 5.7 0z"/></svg>`
};
