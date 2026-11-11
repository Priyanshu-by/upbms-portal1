import { useEffect } from "react";
import { Layout } from "./components/Layout";
import { usePortal } from "./context";
import { AdminPage } from "./pages/Admin";
import {
  AboutPage, CircularsPage, DocumentsPage, DonatePage, GrievancePage,
  HomePage, JoinPage, MembersPage, Modals, PortalsPage, VerifyPage
} from "./pages/Public";

export default function App() {
  const { state, route, loading, error, toast } = usePortal();
  useEffect(() => {
    if (state?.settings?.themePreset) {
      document.documentElement.setAttribute("data-theme", state.settings.themePreset);
    }
  }, [state]);
  if (loading) {
    return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#06173a", color: "#ffd166" }}>UPBMS पोर्टल लोड हो रहा है...</div>;
  }
  if (error || !state) {
    return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>API नहीं चल रही। <code>npm run dev</code> से सर्वर चालू करें। {error}</div>;
  }
  const page = {
    about: <AboutPage />,
    members: <MembersPage />,
    join: <JoinPage />,
    donation: <DonatePage />,
    circulars: <CircularsPage />,
    documents: <DocumentsPage />,
    idcard: <VerifyPage />,
    portals: <PortalsPage />,
    grievance: <GrievancePage />,
    admin: <AdminPage />
  }[route] || <HomePage />;

  return (
    <>
      <Layout>{page}</Layout>
      <Modals />
      {toast && <div className="toast-container"><div className="toast">{toast}</div></div>}
    </>
  );
}
