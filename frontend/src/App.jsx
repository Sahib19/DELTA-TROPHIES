import { useEffect, useRef } from "react";
import { BrowserRouter } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import API from "./api/axios";
import InitialPreloader from "./components/InitialPreloader";
import ScrollToTop from "./components/ScrollToTop";
import AppRoutes from "./routes/AppRoutes";
import { applySiteTheme, getCachedSiteTheme, refreshSiteTheme } from "./utils/siteTheme";

function App() {
  const warmupStarted = useRef(false);

  useEffect(() => {
    if (warmupStarted.current) return;
    warmupStarted.current = true;

    // Start the free Render service in the background. This deliberately does
    // not control the preloader, so a slow cold start can never block the site.
    void API.get("/health/ready", { timeout: 60_000 }).catch(() => {});
  }, []);

  useEffect(() => {
    applySiteTheme(getCachedSiteTheme());
    const refresh = () => void refreshSiteTheme().catch(() => {});
    refresh();
    const timer = window.setInterval(refresh, 60_000);
    const onVisibilityChange = () => {
      if (!document.hidden) refresh();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    const onStorage = (event) => {
      if (event.key === 'delta-public-theme') applySiteTheme(getCachedSiteTheme());
    };
    window.addEventListener('storage', onStorage);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return (
    <BrowserRouter>
      <InitialPreloader />
      <ScrollToTop />
      <AppRoutes />
      <Analytics />
    </BrowserRouter>
  );
}

export default App;
