
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  BarChart3 as BarChartIcon, 
  FileText as FileTextIcon, 
  Database as DatabaseIcon, 
  Sparkles as SparkleIcon,
  Loader2,
  TriangleAlert
} from 'lucide-react';
import Header from './components/Header';
import ProgressForm from './components/ProgressForm';
import Dashboard from './components/Dashboard';
import Reports from './components/Reports';
import DataManagement from './components/DataManagement';
import { ReadingRecord, Student, CloudConfig, ClassOption } from './types';

type Tab = 'input' | 'dashboard' | 'reports' | 'data';

const SCHOOL_LOGO_URL = "https://iili.io/fQdElMx.png";

export const forceId = (id: any) => id ? String(id).trim().replace(/[^\w]/g, '').toUpperCase() : "";
export const normalizeString = (str: any) => str ? String(str).trim().replace(/\s+/g, ' ').toUpperCase() : "";

// Utility function for robust fetch with retries (Exponential Backoff)
const fetchWithRetry = async (url: string, options: RequestInit = {}, retries = 3, backoff = 1000): Promise<Response> => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response;
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(res => setTimeout(res, backoff * Math.pow(2, i)));
    }
  }
  throw new Error("Fetch failed after retries");
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('input');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem('serqi_dark_mode');
      return saved ? JSON.parse(saved) : false;
    } catch (e) { return false; }
  });
  
  const STORAGE_KEY_STUDENTS = 'serqi_stds_v20';
  const STORAGE_KEY_RECORDS = 'serqi_recs_v20';
  const STORAGE_KEY_CONFIG = 'serqi_conf_v20';

  const [records, setRecords] = useState<ReadingRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [cloudConfig, setCloudConfig] = useState<CloudConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
      return saved ? JSON.parse(saved) : { isEnabled: false, projectUrl: '', apiKey: '', lastSync: null };
    } catch (e) { return { isEnabled: false, projectUrl: '', apiKey: '', lastSync: null }; }
  });

  // FETCH SEMUA DATA DARI CLOUD (LOAD CLOUD AS MASTER)
  const fetchCloudData = useCallback(async (silent = false) => {
    if (!cloudConfig.projectUrl) return;
    if (!silent) setIsSyncing(true);
    setSyncError(null);

    try {
      const baseUrl = cloudConfig.projectUrl.split('?')[0];
      const res = await fetchWithRetry(`${baseUrl}?action=fetch&v=${Date.now()}`);
      
      const cloudData = await res.json();
      
      // Clean Murid Data
      const formattedStds = (cloudData.students || []).map((s: any) => ({
        ID_MURID: forceId(s.ID_MURID),
        NAMA_MURID: normalizeString(s.NAMA_MURID),
        KELAS: normalizeString(s.KELAS),
        TAHAP: parseInt(s.TAHAP || 1),
        STATUS_MURID: s.STATUS_MURID || 'AKTIF'
      }));

      // Clean Rekod Data
      const formattedRecs = (cloudData.records || []).map((r: any) => ({
        id: r.ID_REKOD || `REC-${r.TARIKH}-${r.ID_MURID}`,
        studentId: forceId(r.ID_MURID),
        readingType: r.JENIS,
        readingStatus: r.STATUS,
        page: String(r.MUKA_SURAT),
        juzuk: r.JUZUK ? parseInt(r.JUZUK) : undefined,
        isKhatam: r.KHATAM === "YA",
        timestamp: r.TARIKH,
        studentName: formattedStds.find((s: Student) => s.ID_MURID === forceId(r.ID_MURID))?.NAMA_MURID || "MURID",
        className: formattedStds.find((s: Student) => s.ID_MURID === forceId(r.ID_MURID))?.KELAS || "-"
      })).sort((a: any, b: any) => b.timestamp.localeCompare(a.timestamp));

      setStudents(formattedStds);
      setRecords(formattedRecs);
      setCloudConfig(prev => ({ ...prev, lastSync: new Date().toISOString() }));
      
      // Update local cache as backup
      localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(formattedStds));
      localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(formattedRecs));
    } catch (e) {
      setSyncError("Cloud Sync Gagal. Sila periksa URL WebApp GAS.");
      // If error, try to load from local as fallback
      const savedStds = localStorage.getItem(STORAGE_KEY_STUDENTS);
      const savedRecs = localStorage.getItem(STORAGE_KEY_RECORDS);
      if (savedStds) setStudents(JSON.parse(savedStds));
      if (savedRecs) setRecords(JSON.parse(savedRecs));
    } finally {
      setIsSyncing(false);
    }
  }, [cloudConfig.projectUrl]);

  // AWALAN: Load dari cloud sebaik sahaja App bermula
  useEffect(() => {
    if (cloudConfig.projectUrl) {
      fetchCloudData();
    }
  }, []);

  // SAVE REKOD KE CLOUD (POST) - ID FORMAT R000001
  const saveRecordCloud = async (recordData: Omit<ReadingRecord, 'id' | 'timestamp'>) => {
    if (!cloudConfig.projectUrl) {
      alert("Sila tetapkan URL WebApp di tab CLOUD terlebih dahulu.");
      return;
    }

    setIsSyncing(true);
    try {
      // Jana ID_REKOD Format R + Timestamp (contoh: R20240101120000)
      const now = new Date();
      const ts = now.toISOString();
      const idRekod = 'R' + now.getTime().toString(); 
      
      const fullRecord = {
        ...recordData,
        id: idRekod,
        timestamp: ts
      };

      const baseUrl = cloudConfig.projectUrl.split('?')[0];
      await fetchWithRetry(baseUrl, {
        method: 'POST',
        body: JSON.stringify({ action: 'saveRecord', data: fullRecord })
      });
      
      // Wajib reload dari cloud selepas success
      await fetchCloudData(true);
    } catch (e) {
      setSyncError("Gagal simpan rekod ke Cloud.");
    } finally {
      setIsSyncing(false);
    }
  };

  // SAVE MURID KE CLOUD (POST) - ID FORMAT M0001
  const saveStudentCloud = async (student: Student) => {
    if (!cloudConfig.projectUrl) {
      alert("Sila tetapkan URL WebApp di tab CLOUD.");
      return;
    }

    setIsSyncing(true);
    try {
      const baseUrl = cloudConfig.projectUrl.split('?')[0];
      await fetchWithRetry(baseUrl, {
        method: 'POST',
        body: JSON.stringify({ action: 'saveStudent', data: student })
      });
      await fetchCloudData(true);
    } catch (e) {
      setSyncError("Gagal kemaskini murid di Cloud.");
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => { localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(cloudConfig)); }, [cloudConfig]);
  useEffect(() => { localStorage.setItem('serqi_dark_mode', JSON.stringify(isDarkMode)); }, [isDarkMode]);

  const activeStudents = useMemo(() => students.filter(s => s.STATUS_MURID === 'AKTIF'), [students]);

  const availableClasses = useMemo(() => {
    const classesMap = new Map<string, ClassOption>();
    activeStudents.forEach(s => {
      const name = normalizeString(s.KELAS);
      if (name && !classesMap.has(name)) {
        classesMap.set(name, { id: name.replace(/\s+/g, '-'), name, grade: s.TAHAP });
      }
    });
    return Array.from(classesMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [activeStudents]);

  return (
    <div className={`flex flex-col md:flex-row h-screen w-full ${isDarkMode ? 'dark bg-slate-950' : 'bg-[#f8fafc]'} overflow-hidden transition-colors duration-300`}>
      <aside className={`hidden md:flex flex-col md:w-60 lg:w-72 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-900 border-slate-800'} text-white p-6 lg:p-8 border-r shrink-0 transition-all duration-300`}>
        <div className="mb-10 lg:mb-14 text-center px-2 lg:px-4">
          <div className="w-14 h-14 lg:w-16 lg:h-16 bg-white rounded-2xl mx-auto mb-4 p-2 shadow-xl flex items-center justify-center overflow-hidden">
            <img src={SCHOOL_LOGO_URL} alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-lg lg:text-xl font-black text-white uppercase tracking-[0.2em]">SERQI</h1>
          <p className="text-[7px] lg:text-[8px] font-bold text-slate-500 uppercase tracking-[0.1em] mt-2 leading-relaxed opacity-80">
            MEREKOD DAN MENGANALISIS DATA QURAN IQRA SECARA PINTAR
          </p>
        </div>
        <nav className="flex-1 space-y-1.5 lg:space-y-2">
          {[
            { id: 'input', icon: SparkleIcon, label: 'Input', color: 'emerald' },
            { id: 'dashboard', icon: BarChartIcon, label: 'Analisis', color: 'indigo' },
            { id: 'reports', icon: FileTextIcon, label: 'Laporan', color: 'sky' },
            { id: 'data', icon: DatabaseIcon, label: 'Cloud', color: 'slate' }
          ].map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id as Tab)} className={`w-full flex items-center space-x-3 lg:space-x-4 px-4 lg:px-6 py-3.5 lg:py-4 rounded-2xl transition-all ${activeTab === item.id ? `bg-${item.color}-600 text-white shadow-lg` : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
              <item.icon className="w-4 h-4 lg:w-5 lg:h-5" />
              <span className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col relative overflow-hidden">
        <Header 
          activeTab={activeTab} 
          isCloudEnabled={!!cloudConfig.projectUrl} 
          isSyncing={isSyncing} 
          logoUrl={SCHOOL_LOGO_URL} 
          lastSync={cloudConfig.lastSync} 
          onManualSync={() => fetchCloudData()} 
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        />
        
        {syncError && (
          <div className="bg-rose-600 text-white px-6 py-2 flex items-center justify-between text-[9px] font-black uppercase tracking-widest animate-in slide-in-from-top">
            <div className="flex items-center gap-2"><TriangleAlert size={14} /> {syncError}</div>
            <button onClick={() => setSyncError(null)} className="p-2 opacity-50 hover:opacity-100">X</button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-10 py-6 md:py-8 custom-scrollbar pb-32 md:pb-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'input' && (
              <ProgressForm 
                onSave={saveRecordCloud} 
                getLatestRecord={(id) => records.find(r => forceId(r.studentId) === forceId(id))} 
                students={activeStudents} 
                allRecords={records} 
                availableClasses={availableClasses} 
              />
            )}
            {activeTab === 'dashboard' && <Dashboard records={records} students={activeStudents} isDarkMode={isDarkMode} logoUrl={SCHOOL_LOGO_URL} />}
            {activeTab === 'reports' && <Reports records={records} students={students} availableClasses={availableClasses} logoUrl={SCHOOL_LOGO_URL} />}
            {activeTab === 'data' && (
              <DataManagement 
                students={students} 
                records={records} 
                cloudConfig={cloudConfig} 
                onUpdateStudents={setStudents} 
                onUpdateCloudConfig={(c) => setCloudConfig(c)} 
                onSyncPull={() => fetchCloudData()} 
                onSyncPush={() => fetchCloudData()} // Re-sync manually
                onClearData={() => { if(confirm("PERHATIAN: Ini akan memadam semua data cache pada peranti ini. Teruskan?")) { localStorage.clear(); window.location.reload(); } }} 
                onDeleteStudent={(id) => {
                  const student = students.find(s => forceId(s.ID_MURID) === forceId(id));
                  if (student) saveStudentCloud({ ...student, STATUS_MURID: 'TIDAK_AKTIF' });
                }} 
                onRestoreStudent={(id) => {
                  const student = students.find(s => forceId(s.ID_MURID) === forceId(id));
                  if (student) saveStudentCloud({ ...student, STATUS_MURID: 'AKTIF' });
                }}
                onHardDeleteStudent={(id) => {
                  // Sesuai arahan: DILARANG DELETE ROW. Jadi hard delete tetap set ke TIDAK_AKTIF
                  const student = students.find(s => forceId(s.ID_MURID) === forceId(id));
                  if (student) saveStudentCloud({ ...student, STATUS_MURID: 'TIDAK_AKTIF' });
                }}
                onAddStudent={(s) => {
                   // Jana ID_MURID Format M0001
                   let maxIdNum = 0;
                   students.forEach(st => { 
                     const match = st.ID_MURID.match(/M(\d+)/);
                     if (match) {
                       const num = parseInt(match[1]);
                       if (num > maxIdNum) maxIdNum = num;
                     }
                   });
                   const newId = `M${(maxIdNum + 1).toString().padStart(4, '0')}`;
                   saveStudentCloud({ ...s, ID_MURID: newId, STATUS_MURID: 'AKTIF' });
                }} 
                availableClasses={availableClasses} 
                isSyncing={isSyncing} 
                onUpdateRecords={setRecords}
              />
            )}
          </div>
        </div>

        <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-sm z-50">
          <nav className="bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] px-4 py-3 flex justify-between items-center shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            {[
              { id: 'input', icon: SparkleIcon, label: 'INPUT', activeColor: 'bg-emerald-500' },
              { id: 'dashboard', icon: BarChartIcon, label: 'ANALISIS', activeColor: 'bg-indigo-500' },
              { id: 'reports', icon: FileTextIcon, label: 'LAPORAN', activeColor: 'bg-sky-500' },
              { id: 'data', icon: DatabaseIcon, label: 'CLOUD', activeColor: 'bg-slate-700' }
            ].map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button 
                  key={item.id} 
                  onClick={() => setActiveTab(item.id as Tab)} 
                  className={`relative flex flex-col items-center gap-1.5 transition-all duration-300 px-3 py-2 rounded-2xl ${isActive ? `${item.activeColor} text-white shadow-lg scale-110` : 'text-slate-500'}`}
                >
                  <item.icon size={isActive ? 20 : 18} strokeWidth={isActive ? 2.5 : 2} />
                  <span className={`text-[7px] font-black tracking-[0.15em] transition-opacity ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </main>
    </div>
  );
};

export default App;
