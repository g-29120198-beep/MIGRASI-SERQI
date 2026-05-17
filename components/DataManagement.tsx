
import React, { useState, useMemo } from 'react';
import { 
  Search, CloudDownload, Zap, ArrowUpCircle, 
  UserCheck, Database, Archive, RotateCcw, UserMinus, Trash, Loader2,
  UserPlus, X, Save, GraduationCap, LayoutGrid, ShieldCheck, Lock, Unlock, KeyRound, AlertCircle, Info, HardDriveDownload
} from 'lucide-react';
import { Student, ReadingRecord, CloudConfig, ClassOption } from '../types';
import { forceId } from '../App';

interface DataManagementProps {
  students: Student[];
  records: ReadingRecord[];
  cloudConfig: CloudConfig;
  onUpdateStudents: (students: Student[]) => void;
  onUpdateRecords: (records: ReadingRecord[]) => void;
  onUpdateCloudConfig: (config: CloudConfig) => void;
  onSyncPull: () => void;
  onSyncPush: () => void;
  onClearData: () => void;
  onDeleteStudent: (id: string) => void;
  onRestoreStudent: (id: string) => void;
  onHardDeleteStudent: (id: string) => void;
  onAddStudent: (student: Omit<Student, 'ID_MURID' | 'STATUS_MURID'>) => void;
  availableClasses: ClassOption[];
  isSyncing?: boolean;
}

const DataManagement: React.FC<DataManagementProps> = ({ 
  students = [], cloudConfig, onUpdateCloudConfig,
  onSyncPull, onSyncPush, isSyncing = false,
  onDeleteStudent, onRestoreStudent, onHardDeleteStudent, onClearData,
  onAddStudent, availableClasses
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'cloud' | 'students' | 'archive'>('cloud');
  const [studentSearch, setStudentSearch] = useState('');
  const [procId, setProcId] = useState<string | null>(null);
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passError, setPassError] = useState(false);
  
  const ADMIN_PASSWORD = "SERQI789"; 

  const [showAddModal, setShowAddModal] = useState(false);
  const [newStudent, setNewStudent] = useState({
    NAMA_MURID: '',
    KELAS: '',
    TAHAP: 1
  });

  const activeStds = useMemo(() => {
    return (students || [])
      .filter(s => s && (s.STATUS_MURID === 'AKTIF' || !s.STATUS_MURID))
      .filter(s => !studentSearch || s.NAMA_MURID.toLowerCase().includes(studentSearch.toLowerCase()) || forceId(s.ID_MURID).includes(forceId(studentSearch)))
      .sort((a, b) => (a.NAMA_MURID || '').localeCompare(b.NAMA_MURID || ''));
  }, [students, studentSearch]);

  const archiveStds = useMemo(() => {
    // Sesuai arahan: Murid TIDAK_AKTIF diletakkan di Arkib
    return (students || [])
      .filter(s => s && s.STATUS_MURID === 'TIDAK_AKTIF')
      .filter(s => !studentSearch || s.NAMA_MURID.toLowerCase().includes(studentSearch.toLowerCase()) || forceId(s.ID_MURID).includes(forceId(studentSearch)))
      .sort((a, b) => (a.NAMA_MURID || '').localeCompare(b.NAMA_MURID || ''));
  }, [students, studentSearch]);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setPassError(false);
      setPasswordInput('');
    } else {
      setPassError(true);
      setTimeout(() => setPassError(false), 2000);
    }
  };

  const handleArchive = (s: Student) => {
    const tid = forceId(s.ID_MURID);
    if (confirm(`PINDAHKAN KE ARKIB PINDAH?\n${s.NAMA_MURID} (ID: ${tid})`)) {
      setProcId(tid);
      onDeleteStudent(tid);
      setTimeout(() => setProcId(null), 800);
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.NAMA_MURID || !newStudent.KELAS) {
      alert("Sila isi nama dan kelas murid.");
      return;
    }
    onAddStudent({
      NAMA_MURID: newStudent.NAMA_MURID.toUpperCase().trim(),
      KELAS: newStudent.KELAS.toUpperCase().trim(),
      TAHAP: newStudent.TAHAP
    });
    setNewStudent({ NAMA_MURID: '', KELAS: '', TAHAP: 1 });
    setShowAddModal(false);
  };

  const isRestrictedTab = activeSubTab === 'students' || activeSubTab === 'archive';
  
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24 relative">
      <div className="flex p-1.5 bg-slate-100 rounded-2xl gap-1 shadow-inner">
        {[
          {id:'cloud',label:'Sync Cloud',icon:Zap, restricted: false},
          {id:'students',label:'Master Murid',icon:UserCheck, restricted: true},
          {id:'archive',label:'Arkib Pindah',icon:Archive, restricted: true}
        ].map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveSubTab(tab.id as any)} 
            className={`flex-1 py-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeSubTab === tab.id ? 'bg-white text-slate-900 shadow-md scale-[1.02]' : 'text-slate-400'}`}
          >
            <tab.icon size={14} /> 
            {tab.label}
            {tab.restricted && !isAdmin && <Lock size={10} className="text-rose-400 ml-1" />}
          </button>
        ))}
      </div>

      {isRestrictedTab && !isAdmin ? (
        <div className="bg-white p-10 rounded-[3.5rem] shadow-xl border border-slate-100 text-center animate-in zoom-in duration-300">
           <div className="w-24 h-24 bg-rose-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-rose-500 shadow-inner">
              <KeyRound size={48} />
           </div>
           <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Kawasan Terhad</h3>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 mb-8 px-10">Sila masukkan kata laluan admin untuk menguruskan pangkalan data murid.</p>
           
           <form onSubmit={handleAdminLogin} className="max-w-xs mx-auto space-y-4">
              <div className="relative">
                <input 
                  type="password" 
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="PASSWORD ADMIN"
                  className={`w-full p-6 bg-slate-50 border-2 rounded-[1.5rem] text-center font-black text-sm outline-none transition-all ${passError ? 'border-rose-500 animate-shake' : 'border-slate-100 focus:border-indigo-500'}`}
                />
                {passError && <AlertCircle className="absolute right-5 top-1/2 -translate-y-1/2 text-rose-500" size={20} />}
              </div>
              <button type="submit" className="w-full py-6 bg-slate-900 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 transition-all active:scale-95">
                SAHKAN AKSES
              </button>
           </form>
        </div>
      ) : (
        <>
          {activeSubTab === 'cloud' && (
            <div className="space-y-6 animate-in fade-in">
              {/* SAFEGUARD PANEL */}
              <div className="bg-emerald-600 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                 <div className="absolute -right-10 -top-10 opacity-10 rotate-12"><ShieldCheck size={200} /></div>
                 <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                        <HardDriveDownload size={20} />
                      </div>
                      <h4 className="text-xl font-black uppercase tracking-tight">SafeSync Guard</h4>
                    </div>
                    
                    <div className="space-y-4 mb-8">
                       <div className="flex items-start gap-3 bg-white/10 p-4 rounded-2xl border border-white/10">
                          <div className="w-5 h-5 bg-white text-emerald-600 rounded-full flex items-center justify-center font-black text-[10px] shrink-0">1</div>
                          <p className="text-[10px] font-bold leading-relaxed uppercase tracking-wide">Tekan <b>AMBIL DATA (PULL)</b> untuk menyelaraskan UI dengan pangkalan data Cloud.</p>
                       </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                       <div>
                          <p className="text-[8px] font-black text-white/50 uppercase tracking-widest">Status Cloud Master</p>
                          <p className="text-[10px] font-black uppercase tracking-widest">{cloudConfig.lastSync ? new Date(cloudConfig.lastSync).toLocaleString('ms-MY') : 'BELUM SINKRON'}</p>
                       </div>
                       {isAdmin && (
                        <button onClick={() => setIsAdmin(false)} className="px-5 py-2.5 bg-rose-500 text-white rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg">
                          LOGOUT ADMIN
                        </button>
                      )}
                    </div>
                 </div>
              </div>

              <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 space-y-6">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Pautan WebApp SERQI</label>
                   <input type="text" value={cloudConfig.projectUrl} onChange={(e) => onUpdateCloudConfig({...cloudConfig, projectUrl: e.target.value.trim(), isEnabled: true})} placeholder="PASTE URL WEBAPP DI SINI" className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-xs text-indigo-600 outline-none focus:border-indigo-300 shadow-inner" />
                 </div>
                 <div className="grid grid-cols-1 gap-4">
                    <button onClick={onSyncPull} disabled={isSyncing || !cloudConfig.projectUrl} className="py-6 bg-indigo-600 text-white rounded-3xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl hover:bg-indigo-700 transition-all disabled:opacity-30 active:scale-95">
                      {isSyncing ? <Loader2 size={24} className="animate-spin" /> : <CloudDownload size={24} />} MUAT TURUN DATA CLOUD (PULL)
                    </button>
                 </div>
                 <button onClick={onClearData} className="w-full py-4 text-[9px] font-black text-rose-400 uppercase tracking-[0.2em] hover:text-rose-600 transition-all">Padam Cache Peranti Saja</button>
              </div>
            </div>
          )}

          {activeSubTab === 'students' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-white p-6 rounded-[3.5rem] shadow-xl border border-slate-100 space-y-6">
                <div className="flex items-center justify-between px-2">
                   <h3 className="font-black text-slate-900 uppercase text-xs flex items-center gap-2">
                     <Unlock size={14} className="text-emerald-500" /> Senarai Murid Aktif
                   </h3>
                   <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-emerald-700 shadow-lg transition-all active:scale-95"><UserPlus size={14} /> Tambah Murid</button>
                </div>
                <div className="relative">
                  <input type="text" value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} placeholder="Cari nama atau ID murid..." className="w-full p-6 pl-14 bg-slate-50 rounded-2xl font-bold text-xs outline-none border border-transparent focus:border-indigo-200 shadow-inner" />
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {activeStds.length > 0 ? activeStds.map(s => (
                      <div key={s.ID_MURID} className={`p-5 rounded-[2rem] flex items-center justify-between border transition-all duration-500 ${procId === forceId(s.ID_MURID) ? 'opacity-0 scale-90 translate-x-10' : 'bg-slate-50/50 border-slate-100 hover:bg-white hover:shadow-md'}`}>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 font-black text-[10px] shrink-0 uppercase shadow-sm">{forceId(s.ID_MURID).slice(-4)}</div>
                            <div>
                              <p className="font-black text-[11px] uppercase text-slate-800 truncate max-w-[150px]">{s.NAMA_MURID}</p>
                              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{s.KELAS}</p>
                            </div>
                        </div>
                        <button onClick={() => handleArchive(s)} disabled={!!procId || isSyncing} className="p-4 text-slate-300 hover:text-rose-500 transition-all hover:bg-rose-50 rounded-2xl"><UserMinus size={22} /></button>
                      </div>
                    )) : <div className="col-span-full py-20 text-center text-slate-300 font-black text-[10px] uppercase tracking-widest">Tiada murid aktif ditemui</div>}
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'archive' && (
            <div className="bg-white p-6 rounded-[3.5rem] shadow-xl border border-slate-100 space-y-6 animate-in fade-in">
               <div className="flex items-center justify-between px-4">
                  <h3 className="font-black text-slate-900 uppercase text-xs flex items-center gap-2"><Unlock size={14} className="text-rose-500" /> Arkib Pindah (TIDAK AKTIF)</h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{archiveStds.length} MURID</p>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[550px] overflow-y-auto pr-2 custom-scrollbar">
                  {archiveStds.length > 0 ? archiveStds.map(s => (
                    <div key={s.ID_MURID} className="p-5 rounded-[2rem] flex items-center justify-between border border-rose-100 bg-rose-50/20">
                       <div className="flex items-center gap-4 min-w-0">
                          <div className="w-12 h-12 rounded-2xl bg-slate-400 flex items-center justify-center text-white font-black text-[10px] shrink-0 uppercase">{forceId(s.ID_MURID).slice(-4)}</div>
                          <div className="min-w-0">
                            <p className="font-black text-[11px] uppercase text-slate-800 truncate">{s.NAMA_MURID}</p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{s.KELAS}</p>
                          </div>
                       </div>
                       <div className="flex gap-2">
                          <button onClick={() => onRestoreStudent(s.ID_MURID)} disabled={isSyncing} className="p-4 bg-white text-emerald-600 border border-emerald-100 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"><RotateCcw size={18} /></button>
                       </div>
                    </div>
                  )) : <div className="col-span-full py-24 text-center"><Archive size={48} className="mx-auto text-slate-100 mb-6" /><p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Tiada rekod dalam arkib</p></div>}
               </div>
            </div>
          )}
        </>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-10">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowAddModal(false)}></div>
           <div className="relative bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
              <div className="bg-emerald-600 p-8 text-white relative">
                 <button onClick={() => setShowAddModal(false)} className="absolute right-6 top-6 p-2 hover:bg-white/10 rounded-full transition-all"><X size={20} /></button>
                 <UserPlus size={32} className="mb-4" />
                 <h3 className="text-xl font-black uppercase tracking-tight leading-tight">Daftar Murid Baru</h3>
              </div>
              <form onSubmit={handleAddSubmit} className="p-8 space-y-6">
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Nama Penuh Murid</label>
                    <input type="text" required value={newStudent.NAMA_MURID} onChange={(e) => setNewStudent({...newStudent, NAMA_MURID: e.target.value})} placeholder="CONTOH: AHMAD BIN ALI" className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-xs text-slate-800 outline-none focus:border-emerald-500 shadow-inner uppercase" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Tahap</label>
                       <select value={newStudent.TAHAP} onChange={(e) => setNewStudent({...newStudent, TAHAP: parseInt(e.target.value)})} className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-xs text-slate-800 outline-none appearance-none shadow-inner">
                          {[1,2,3,4,5,6].map(t => <option key={t} value={t}>TAHUN {t}</option>)}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Kelas</label>
                       <input list="class-suggestions" required type="text" value={newStudent.KELAS} onChange={(e) => setNewStudent({...newStudent, KELAS: e.target.value})} placeholder="KELAS" className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-xs text-slate-800 outline-none focus:border-emerald-500 shadow-inner uppercase" />
                       <datalist id="class-suggestions">{availableClasses.map(c => <option key={c.id} value={c.name} />)}</datalist>
                    </div>
                 </div>
                 <button type="submit" disabled={isSyncing} className="w-full py-6 bg-emerald-600 text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-3">
                   {isSyncing ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} SIMPAN KE CLOUD
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default DataManagement;
