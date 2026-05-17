
import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Cloud as CloudIcon, CloudOff as CloudOffIcon, RefreshCw as RefreshIcon, BarChart3, FileText, Sparkles, Database, Maximize, Minimize, MapPin, Clock, Smartphone, Info, Moon, Sun } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  isCloudEnabled: boolean;
  isSyncing: boolean;
  logoUrl?: string;
  lastSync?: string | null;
  onManualSync?: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

const Header: React.FC<HeaderProps> = ({ activeTab, isCloudEnabled, isSyncing, logoUrl, lastSync, onManualSync, isDarkMode, onToggleDarkMode }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [supportsFullscreen, setSupportsFullscreen] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const docEl = document.documentElement as any;
    const hasSupport = !!(
      docEl.requestFullscreen || 
      docEl.webkitRequestFullscreen || 
      docEl.mozRequestFullScreen || 
      docEl.msRequestFullscreen
    );
    setSupportsFullscreen(hasSupport);

    const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

  const toggleFullscreen = () => {
    const docEl = document.documentElement as any;
    const doc = document as any;

    try {
      if (!doc.fullscreenElement && !doc.webkitFullscreenElement) {
        if (docEl.requestFullscreen) docEl.requestFullscreen();
        else if (docEl.webkitRequestFullscreen) docEl.webkitRequestFullscreen();
        setIsFullscreen(true);
      } else {
        if (doc.exitFullscreen) doc.exitFullscreen();
        else if (doc.webkitExitFullscreen) doc.webkitExitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn("Fullscreen error", err);
    }
  };

  const theme = (() => {
    switch (activeTab) {
      case 'input': return { title: 'SISTEM E-REKOD QURAN IQRA (SERQI)', subtitle: 'MEREKOD DAN MENGANALISIS DATA QURAN IQRA SECARA PINTAR', location: 'SK BUKIT RAMBAI', color: 'emerald' };
      case 'dashboard': return { title: 'ANALISIS PRESTASI (SERQI)', subtitle: 'MEREKOD DAN MENGANALISIS DATA QURAN IQRA SECARA PINTAR', location: 'SK BUKIT RAMBAI', color: 'indigo' };
      case 'reports': return { title: 'LAPORAN INDIVIDU (SERQI)', subtitle: 'MEREKOD DAN MENGANALISIS DATA QURAN IQRA SECARA PINTAR', location: 'SK BUKIT RAMBAI', color: 'sky' };
      case 'data': return { title: 'KONFIGURASI SISTEM (SERQI)', subtitle: 'MEREKOD DAN MENGANALISIS DATA QURAN IQRA SECARA PINTAR', location: 'SK BUKIT RAMBAI', color: 'slate' };
      default: return { title: 'SERQI', subtitle: 'MEREKOD DAN MENGANALISIS DATA QURAN IQRA SECARA PINTAR', location: 'SK BUKIT RAMBAI', color: 'slate' };
    }
  })();

  const today = new Date().toLocaleDateString('ms-MY', { weekday: 'short', day: 'numeric', month: 'short' });
  const syncTime = lastSync ? new Date(lastSync).toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' }) : 'Belum Sinkron';

  const showInstallGuide = () => {
    alert("CARA PASANG SEBAGAI APPS:\n\nANDROID: Tekan 3 titik (Menu) di atas kanan Chrome -> Tekan 'Install App' atau 'Add to Home Screen'.\n\niOS (IPHONE): Tekan butang 'Share' (ikon kotak panah atas) di bawah Safari -> Scroll bawah -> Tekan 'Add to Home Screen'.");
  };

  return (
    <header className="sticky top-0 z-40">
      <div className={`${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200'} backdrop-blur-2xl border-b py-3 px-4 md:py-6 md:px-12 shadow-sm transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3 md:space-x-6 min-w-0">
            <div className="relative shrink-0 group">
              <div className={`absolute -inset-1 bg-gradient-to-tr ${isDarkMode ? 'from-indigo-500 to-indigo-200' : 'from-emerald-500 to-emerald-200'} rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000`}></div>
              <div className={`relative w-10 h-10 md:w-20 md:h-20 rounded-2xl ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} shadow-md flex items-center justify-center p-1.5 overflow-hidden transition-colors`}>
                 <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
              </div>
            </div>
            
            <div className="min-w-0">
              <h2 className={`text-[10px] md:text-xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'} uppercase leading-none truncate md:mb-1 transition-colors`}>
                {theme.title}
              </h2>
              <p className={`text-[7px] md:text-[10px] font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-tight mt-0.5 opacity-80 transition-colors`}>
                {theme.subtitle}
              </p>
              <p className={`text-[7px] md:text-[10px] font-black ${isDarkMode ? 'text-indigo-400' : 'text-emerald-600'} uppercase tracking-[0.2em] mt-0.5 transition-colors`}>
                {theme.location}
              </p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-2 md:mt-1">
                <div className={`flex items-center text-[7px] md:text-[8px] font-black ${isDarkMode ? 'text-indigo-300' : 'text-indigo-400'} uppercase tracking-widest transition-colors`}>
                  <CalendarIcon className="w-2 h-2 md:w-3 md:h-3 mr-1" /> {today}
                </div>
                <div className={`flex items-center text-[7px] md:text-[8px] font-black ${isDarkMode ? 'text-slate-500' : 'text-slate-400'} uppercase tracking-widest transition-colors`}>
                  <Clock className="w-2 h-2 md:w-3 md:h-3 mr-1" /> {syncTime}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 md:space-x-3 shrink-0">
            <button 
              onClick={onToggleDarkMode}
              className={`p-3 md:p-4 rounded-2xl transition-all shadow-sm ${isDarkMode ? 'bg-slate-800 text-amber-400 border-slate-700 hover:bg-slate-700' : 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100'}`}
              title={isDarkMode ? "Tukar ke Mod Terang" : "Tukar ke Mod Gelap"}
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {!isStandalone && (
              <button 
                onClick={showInstallGuide}
                className={`p-3 md:p-4 rounded-2xl border shadow-sm transition-all ${isDarkMode ? 'bg-slate-800 text-emerald-400 border-slate-700 hover:bg-slate-700' : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100'}`}
                title="Pasang Apl pada Telefon"
              >
                <Smartphone size={18} />
              </button>
            )}

            <button 
              onClick={onManualSync}
              disabled={isSyncing || !isCloudEnabled}
              className={`flex flex-col items-center justify-center px-4 py-2 md:px-8 md:py-4 rounded-2xl text-white font-black text-[7px] md:text-[10px] uppercase tracking-widest shadow-xl transition-all active:scale-95 group ${
                isSyncing ? 'bg-indigo-600' : isCloudEnabled ? (isDarkMode ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-slate-900 hover:bg-slate-800') : 'bg-slate-300'
              }`}
            >
              <div className="flex items-center">
                <RefreshIcon className={`w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-3 ${isSyncing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                <span className="hidden xs:inline">{isSyncing ? 'SINKRON...' : 'SINKRON'}</span>
              </div>
            </button>
            
            {supportsFullscreen && !isStandalone && (
              <button onClick={toggleFullscreen} className={`hidden sm:flex p-3 rounded-2xl border shadow-sm transition-all ${isDarkMode ? 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700' : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'}`}>
                {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
