import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import {
  isQuickEditEnabled,
  setQuickEditEnabled,
} from '../../utils/adminQuickEdit';
import { getCachedSiteTheme, updateSiteTheme } from '../../utils/siteTheme';

function Dashboard() {
  const [stats, setStats] = useState({ products: 0, leads: 0, inquiries: 0 });
  const [quickEdit, setQuickEdit] = useState(isQuickEditEnabled);
  const [siteTheme, setSiteTheme] = useState(getCachedSiteTheme);
  const [savingTheme, setSavingTheme] = useState(false);
  const [themeMessage, setThemeMessage] = useState('');
  const [publishingCatalogue, setPublishingCatalogue] = useState(false);
  const [catalogueMessage, setCatalogueMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const syncTheme = (event) => setSiteTheme(event.detail);
    window.addEventListener('delta:theme-change', syncTheme);
    return () => window.removeEventListener('delta:theme-change', syncTheme);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const fetchStats = async () => {
      try {
        const response = await API.get('/admin/stats', { signal: controller.signal });
        setStats({
          products: response.data.stats.products,
          leads: response.data.stats.leads,
          inquiries: response.data.stats.inquiries
        });
      } catch (error) {
        if (error.code !== 'ERR_CANCELED') console.error(error);
      }
    };
    void fetchStats();
    return () => controller.abort();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setQuickEditEnabled(false);
    navigate('/admin');
  };

  const toggleQuickEdit = () => {
    const enabled = !quickEdit;
    setQuickEditEnabled(enabled);
    setQuickEdit(enabled);
  };

  const handleThemeChange = async (theme) => {
    if (theme === siteTheme || savingTheme) return;
    setSavingTheme(true);
    setThemeMessage('');
    try {
      const savedTheme = await updateSiteTheme(theme);
      setSiteTheme(savedTheme);
      setThemeMessage(`${savedTheme === 'light' ? 'Light' : 'Dark'} theme is now live on the public website.`);
    } catch (error) {
      setThemeMessage(error.response?.data?.error || 'Could not update the theme. Please try again.');
    } finally {
      setSavingTheme(false);
    }
  };

  const handlePublishCatalogue = async () => {
    setPublishingCatalogue(true);
    setCatalogueMessage("");
    try {
      const response = await API.post('/admin/catalogue/publish');
      const publishedAt = response.data.catalogue?.generated_at;
      setCatalogueMessage(
        publishedAt
          ? `Public catalogue refreshed at ${new Date(publishedAt).toLocaleString()}.`
          : 'Public catalogue refreshed successfully.',
      );
    } catch (error) {
      setCatalogueMessage(
        error.response?.data?.error ||
          'Catalogue publish failed. Please try again.',
      );
    } finally {
      setPublishingCatalogue(false);
    }
  };

  return (
    <div className="bg-darkbg min-h-screen pt-24">
      <div className="max-w-7xl mx-auto px-6 py-12">

        <div className="flex items-center justify-between mb-12">
          <div>
            <p className="text-gold text-xs tracking-[0.4em] uppercase mb-1">Admin Panel</p>
            <h1 className="text-white text-3xl font-bold">Dashboard</h1>
          </div>
          <button
            onClick={handleLogout}
            className="border border-gold/20 text-white/50 hover:text-gold hover:border-gold px-6 py-2 text-sm tracking-wider uppercase transition-colors">
            Logout
          </button>
        </div>

        <section className="mb-12 flex flex-col gap-5 border border-gold/25 bg-white/[0.03] p-6 sm:flex-row sm:items-center sm:justify-between" aria-labelledby="site-theme-heading">
          <div>
            <p className="text-gold text-xs font-semibold uppercase tracking-[0.2em]">Public website appearance</p>
            <h2 id="site-theme-heading" className="mt-2 text-lg font-semibold text-white">Website theme</h2>
            <p className="mt-1 max-w-2xl text-sm text-white/55">Choose the theme visitors see across the website. Dark restores the original design.</p>
            {themeMessage && <p className="mt-3 text-sm text-gold" role="status">{themeMessage}</p>}
          </div>
          <div className="flex shrink-0 gap-2" role="group" aria-label="Public website theme">
            {['dark', 'light'].map((theme) => (
              <button
                key={theme}
                type="button"
                onClick={() => handleThemeChange(theme)}
                disabled={savingTheme}
                aria-pressed={siteTheme === theme}
                className={`border px-5 py-3 text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-50 ${siteTheme === theme ? 'border-gold bg-gold text-darkbg' : 'border-gold/30 text-gold hover:border-gold'}`}
              >
                {theme === 'dark' ? 'Dark' : 'Light'}
              </button>
            ))}
          </div>
        </section>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { label: 'Total Products', value: stats.products },
            { label: 'Total Leads', value: stats.leads },
            { label: 'Total Inquiries', value: stats.inquiries },
          ].map((stat, i) => (
            <div key={i} className="border border-gold/20 p-6">
              <p className="text-white/50 text-xs tracking-widest uppercase mb-2">{stat.label}</p>
              <p className="text-gold text-4xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="mb-12 flex flex-col gap-5 border border-gold/25 bg-white/[0.03] p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-gold text-xs font-semibold uppercase tracking-[0.2em]">
              Temporary editing shortcut
            </p>
            <h2 className="mt-2 text-lg font-semibold text-white">
              Save &amp; open next product
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-white/55">
              When on, press Enter in a product edit form to save it and open
              the next product in the current catalogue list. Turns off when
              you log out.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={quickEdit}
            aria-label="Save and open next product"
            onClick={toggleQuickEdit}
            className={`shrink-0 border px-6 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${quickEdit ? 'border-gold bg-gold text-darkbg' : 'border-gold/30 text-gold hover:border-gold'}`}
          >
            {quickEdit ? 'On' : 'Off'}
          </button>
        </div>

        <div className="mb-12 flex flex-col gap-5 border border-gold/25 bg-white/[0.03] p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-gold text-xs font-semibold uppercase tracking-[0.2em]">
              Public catalogue snapshot
            </p>
            <h2 className="mt-2 text-lg font-semibold text-white">
              Publish catalogue
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-white/55">
              Product changes publish automatically. Use this button to retry
              manually if the public catalogue ever falls behind.
            </p>
            {catalogueMessage && (
              <p className="mt-3 text-sm text-gold" role="status">
                {catalogueMessage}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handlePublishCatalogue}
            disabled={publishingCatalogue}
            className="shrink-0 border border-gold/30 px-6 py-3 text-xs font-bold uppercase tracking-widest text-gold transition-colors hover:border-gold disabled:cursor-wait disabled:opacity-50"
          >
            {publishingCatalogue ? 'Publishing…' : 'Publish now'}
          </button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link to="/admin/products"
            className="border border-gold/20 hover:border-gold p-6 transition-colors group">
            <p className="text-gold text-xs tracking-widest uppercase mb-2">Manage</p>
            <h3 className="text-white group-hover:text-gold text-xl font-bold transition-colors">
              Products →
            </h3>
            <p className="text-white/30 text-sm mt-2">Add, edit or delete products</p>
          </Link>
          <Link to="/admin/leads"
            className="border border-gold/20 hover:border-gold p-6 transition-colors group">
            <p className="text-gold text-xs tracking-widest uppercase mb-2">View</p>
            <h3 className="text-white group-hover:text-gold text-xl font-bold transition-colors">
              Leads & Inquiries →
            </h3>
            <p className="text-white/30 text-sm mt-2">Customer data from popup and forms</p>
          </Link>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;
