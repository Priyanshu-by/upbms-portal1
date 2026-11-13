import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "./api";
import { canAccessSigned } from "./utils";

const PortalContext = createContext(null);
const SESSION_KEY = "upbms_mern_session";

function readSession() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

export function PortalProvider({ children }) {
  const [state, setState] = useState(null);
  const [lang, setLang] = useState("hi");
  const [route, setRoute] = useState("home");
  const [session, setSession] = useState(readSession);
  const [toast, setToast] = useState("");
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3600);
  }, []);

  const persistSession = useCallback((next) => {
    setSession(next);
    if (next) sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
    else sessionStorage.removeItem(SESSION_KEY);
  }, []);

  const refresh = useCallback(async (nextSession = session) => {
    const data = await api("/api/bootstrap", { session: nextSession });
    setState(data);
    return data;
  }, [session]);

  useEffect(() => {
    refresh(readSession())
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const signed = canAccessSigned(session);

  const recordSignedUsage = useCallback(async (payload) => {
    if (!signed || !state) return;
    try {
      const officers = window.UPBMSPrint?.resolveSignatories?.(state.settings, payload.signatoryIds) || [];
      const sigSummary = window.UPBMSPrint?.formatSignatoriesAuditSummary?.(officers, state.settings) || { hi: "", en: "" };
      const json = await api("/api/access-logs", {
        method: "POST",
        session,
        body: {
          actionType: payload.actionType,
          actionLabelHi: payload.actionLabelHi,
          actionLabelEn: payload.actionLabelEn,
          targetTitleHi: payload.targetTitleHi,
          targetTitleEn: payload.targetTitleEn,
          signatoriesUsedHi: sigSummary.hi,
          signatoriesUsedEn: sigSummary.en
        }
      });
      if (json.logItem && session?.isAdmin) {
        setState((prev) => prev ? { ...prev, accessLogs: [json.logItem, ...(prev.accessLogs || [])] } : prev);
      }
    } catch {
      /* audit must stay silent for members */
    }
  }, [session, signed, state]);

  const userLevel = session?.level || (session?.isAdmin ? 1 : (session?.member?.level || (session?.member ? 3 : 4)));
  const isAdmin = userLevel === 1 || userLevel === 2;
  const isSuperAdmin = userLevel === 1;
  const canAccessMembers = userLevel <= 3;
  const canAccessAdmin = userLevel <= 2;
  const canAccessUserManagement = userLevel === 1;

  const logout = useCallback(async () => {
    persistSession(null);
    setModal(null);
    setRoute("home");
    try {
      await refresh(null);
    } catch {
      /* silent */
    }
    showToast(lang === "en" ? "Logged out successfully (Returned to Level 4 Guest mode)" : "आप सफलतापूर्वक लॉगआउट हो चुके हैं (Level 4 मोड सक्रिय)");
  }, [persistSession, setModal, setRoute, refresh, showToast, lang]);

  const value = useMemo(() => ({
    state, setState, lang, setLang, route, setRoute, session, persistSession, logout,
    toast, showToast, modal, setModal, loading, error, refresh, signed, recordSignedUsage,
    userLevel, isAdmin, isSuperAdmin, canAccessMembers, canAccessAdmin, canAccessUserManagement
  }), [
    state, lang, route, session, toast, modal, loading, error, refresh, signed, recordSignedUsage,
    showToast, persistSession, logout, userLevel, isAdmin, isSuperAdmin, canAccessMembers, canAccessAdmin, canAccessUserManagement
  ]);

  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>;
}

export function usePortal() {
  return useContext(PortalContext);
}
