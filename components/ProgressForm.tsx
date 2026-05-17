
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Save, ChevronDown, Search, User, Plus, Minus, LayoutGrid, 
  CheckCircle, RotateCcw, Loader2, Sparkles, Calendar, BookOpen, 
  CheckCircle2, AlertCircle, Clock, Hash, GraduationCap
} from 'lucide-react';
import { READING_TYPES } from '../constants';
import { Student, ReadingRecord, ReadingType, ClassOption, ReadingStatus } from '../types';

interface ProgressFormProps {
  onSave: (record: ReadingRecord) => void;
  getLatestRecord: (studentId: string) => ReadingRecord | undefined;
  students: Student[]; 
  allRecords: ReadingRecord[];
  availableClasses: ClassOption[];
  isInitialLoading?: boolean;
  isDarkMode?: boolean;
}

const calculateJuzuk = (pageText: string): number => {
  const page = parseInt(pageText);
  if (isNaN(page) || page <= 0) return 1;
  if (page >= 604) return 30;
  // Pembahagian juzuk Al-Quran standard
  return Math.min(30, Math.floor((page - 2) / 20) + 1);
};

const ProgressForm: React.FC<ProgressFormProps> = ({ onSave, getLatestRecord, students, allRecords, availableClasses, isInitialLoading, isDarkMode }) => {
  const [selectedClassName, setSelectedClassName] = useState<string>(() => localStorage.getItem('last_selected_class') || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [readingType, setReadingType] = useState<ReadingType>('Iqra 1');
  const [readingStatus, setReadingStatus] = useState<ReadingStatus>('LANCAR');
  const [page, setPage] = useState<string>('1');
  const [juzuk, setJuzuk] = useState<number>(1);
  const [isKhatam, setIsKhatam] = useState<boolean>(false);

  useEffect(() => { 
    if (selectedClassName) localStorage.setItem('last_selected_class', selectedClassName); 
  }, [selectedClassName]);

  useEffect(() => { 
    if (readingType === 'Al-Quran') {
      setJuzuk(calculateJuzuk(page)); 
    }
  }, [page, readingType]);

  const filteredStudents = useMemo(() => {
    if (!selectedClassName) return [];
    const normalizedSelected = selectedClassName.trim().toUpperCase();
    
    return students
      .filter(s => s.STATUS_MURID === 'AKTIF' && s.KELAS.trim().toUpperCase() === normalizedSelected)
      .filter(s => !searchTerm || s.NAMA_MURID.toLowerCase().includes(searchTerm.toLowerCase()) || s.ID_MURID.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => a.NAMA_MURID.localeCompare(b.NAMA_MURID));
  }, [selectedClassName, students, searchTerm]);

  const handleExpand = (studentId: string) => {
    if (expandedStudentId === studentId) {
      setExpandedStudentId(null);
    } else {
      const last = getLatestRecord(studentId);
      if (last) {
        setReadingType(last.readingType); 
        setReadingStatus(last.readingStatus || 'LANCAR');
        setPage(last.page); 
        setJuzuk(last.juzuk || calculateJuzuk(last.page));
        setIsKhatam(last.isKhatam);
      } else {
        setReadingType('Iqra 1'); 
        setReadingStatus('LANCAR'); 
        setPage('1'); 
        setJuzuk(1); 
        setIsKhatam(false);
      }
      setExpandedStudentId(studentId);
    }
  };

  const handleSubmit = async (e: React.FormEvent, student: Student) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    
    onSave({
      id: `REC-${Date.now()}-${student.ID_MURID}`,
      studentId: student.ID_MURID,
      studentName: student.NAMA_MURID,
      className: student.KELAS,
      readingType, 
      readingStatus, 
      page,
      juzuk: readingType === 'Al-Quran' ? juzuk : undefined,
      isKhatam, 
      timestamp: new Date().toISOString(), 
      teacherId: 'GURU-SERQI'
    });

    setTimeout(() => { 
      setIsSaving(false); 
      setExpandedStudentId(null); 
    }, 500);
  };

  const classStats = useMemo(() => {
    const statsMap = new Map<string, { total: number; filled: number }>();
    
    // Get latest records for each student to check if they have any record
    const studentsWithRecords = new Set(allRecords.map(r => r.studentId));

    availableClasses.forEach(c => {
      const classStudents = students.filter(s => s.STATUS_MURID === 'AKTIF' && s.KELAS === c.name);
      const total = classStudents.length;
      const filled = classStudents.filter(s => studentsWithRecords.has(s.ID_MURID)).length;
      statsMap.set(c.name, { total, filled });
    });
    return statsMap;
  }, [students, allRecords, availableClasses]);

  return (
    <div className="space-y-6 pb-24">
      <div className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} p-5 rounded-[2.5rem] border-2 shadow-sm transition-colors`}>
        <label className={`text-[9px] font-black ${isDarkMode ? 'text-slate-500' : 'text-slate-400'} uppercase tracking-widest mb-3 block flex items-center`}><LayoutGrid className="w-3.5 h-3.5 mr-2" /> PILIH KELAS</label>
        <div className="relative">
          <select 
            value={selectedClassName} 
            onChange={(e) => { setSelectedClassName(e.target.value); setExpandedStudentId(null); }} 
            className={`w-full p-4 ${isDarkMode ? 'bg-slate-800 text-white focus:ring-indigo-500' : 'bg-slate-50 text-slate-800 focus:ring-emerald-500'} rounded-2xl font-black text-sm appearance-none outline-none focus:ring-2 transition-all`}
          >
            <option value="">-- PILIH KELAS --</option>
            {availableClasses.map(c => {
              const stats = classStats.get(c.name);
              const isComplete = stats && stats.filled === stats.total && stats.total > 0;
              const indicator = stats 
                ? isComplete 
                  ? `[LENGKAP]` 
                  : `[BELUM LENGKAP: ${stats.total - stats.filled} MURID]`
                : '';
              return (
                <option key={c.id} value={c.name}>
                  {c.name} {indicator}
                </option>
              );
            })}
          </select>
          <ChevronDown className={`absolute right-5 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-slate-600' : 'text-slate-300'}`} size={18} />
        </div>
      </div>

      {selectedClassName ? (
        <div className="space-y-4">
          <div className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} p-4 rounded-[2rem] border shadow-sm relative transition-colors`}>
            <input 
              type="text" 
              placeholder="Cari nama murid..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className={`w-full p-3 pl-10 ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-800'} border-none rounded-xl outline-none font-bold text-xs`} 
            />
            <Search className={`absolute left-7 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-slate-600' : 'text-slate-300'} w-4 h-4`} />
          </div>

          <div className="grid grid-cols-1 gap-3">
            {filteredStudents.map(student => {
              const isExpanded = expandedStudentId === student.ID_MURID;
              const last = getLatestRecord(student.ID_MURID);
              const lastDate = last ? new Date(last.timestamp).toLocaleDateString('ms-MY', { day: '2-digit', month: '2-digit' }) : null;

              return (
                <div key={student.ID_MURID} className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} rounded-[2rem] border transition-all ${isExpanded ? (isDarkMode ? 'border-indigo-500 shadow-xl ring-4 ring-indigo-500/10' : 'border-emerald-500 shadow-xl ring-4 ring-emerald-50') : 'shadow-sm'}`}>
                  <button onClick={() => handleExpand(student.ID_MURID)} className="w-full p-5 flex flex-col gap-3 text-left">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isExpanded ? (isDarkMode ? 'bg-indigo-600 text-white shadow-lg' : 'bg-emerald-600 text-white shadow-lg') : (isDarkMode ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400')}`}>
                          <User className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                           <h4 className={`font-black text-xs uppercase ${isDarkMode ? 'text-white' : 'text-slate-900'} truncate`}>{student.NAMA_MURID}</h4>
                           <p className={`text-[7px] font-black ${isDarkMode ? 'text-slate-600' : 'text-slate-300'} mt-1 uppercase tracking-widest`}>{student.ID_MURID}</p>
                        </div>
                      </div>
                      <ChevronDown className={`w-5 h-5 ${isDarkMode ? 'text-slate-600' : 'text-slate-300'} transition-transform ${isExpanded ? `rotate-180 ${isDarkMode ? 'text-indigo-500' : 'text-emerald-500'}` : ''}`} />
                    </div>
                    
                    {!isExpanded && last && (
                      <div className={`flex flex-wrap items-center gap-2.5 pt-4 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-50'}`}>
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'} rounded-xl text-[11px] font-black uppercase`}>
                          <Clock size={12} className={isDarkMode ? 'text-slate-500' : 'text-slate-400'} /> {lastDate}
                        </div>
                        <div className={`flex items-center gap-1 px-3 py-1.5 ${isDarkMode ? 'bg-indigo-900/30 text-indigo-400' : 'bg-indigo-50 text-indigo-600'} rounded-xl text-[11px] font-black uppercase`}>
                          {last.readingType}
                        </div>
                        <div className={`flex items-center gap-1 px-3 py-1.5 ${isDarkMode ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-50 text-amber-600'} rounded-xl text-[11px] font-black uppercase`}>
                          MS {last.page}
                        </div>
                        {last.readingType === 'Al-Quran' && last.juzuk && (
                          <div className={`flex items-center gap-1 px-3 py-1.5 ${isDarkMode ? 'bg-sky-900/30 text-sky-400' : 'bg-sky-50 text-sky-600'} rounded-xl text-[11px] font-black uppercase`}>
                            JUZ {last.juzuk}
                          </div>
                        )}
                        <div className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase ${last.readingStatus === 'LANCAR' ? (isDarkMode ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-100 text-emerald-700') : (isDarkMode ? 'bg-rose-900/30 text-rose-400' : 'bg-rose-100 text-rose-700')}`}>
                          {last.readingStatus || 'LANCAR'}
                        </div>
                        {last.isKhatam && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white rounded-xl text-[11px] font-black uppercase shadow-md animate-pulse">
                            <GraduationCap size={13} /> KHATAM
                          </div>
                        )}
                      </div>
                    )}
                  </button>

                  {isExpanded && (
                    <div className={`p-6 pt-0 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-50'}`}>
                      <form onSubmit={(e) => handleSubmit(e, student)} className="mt-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-4">
                            <label className={`text-[10px] font-black ${isDarkMode ? 'text-slate-500' : 'text-slate-400'} uppercase tracking-widest block px-1`}>Tahap Bacaan</label>
                            <div className="grid grid-cols-3 gap-2">
                              {READING_TYPES.map(type => {
                                const isSelected = readingType === type;
                                const isAlQuran = type === 'Al-Quran';
                                return (
                                  <button 
                                    key={type} 
                                    type="button" 
                                    onClick={() => setReadingType(type)} 
                                    className={`py-4 md:py-5 rounded-2xl border-2 font-black text-[10px] uppercase transition-all duration-200 ${isAlQuran ? 'col-span-3' : ''} ${isSelected ? (isDarkMode ? 'border-indigo-600 bg-indigo-600 text-white shadow-lg scale-[1.02]' : 'border-emerald-600 bg-emerald-600 text-white shadow-lg scale-[1.02]') : (isDarkMode ? 'border-slate-800 bg-slate-800 text-slate-500 hover:bg-slate-700' : 'border-slate-100 bg-slate-50 text-slate-400 hover:bg-slate-100')}`}
                                  >
                                    {type}
                                  </button>
                                );
                              })}
                            </div>
                            <button 
                              type="button" 
                              onClick={() => setIsKhatam(!isKhatam)} 
                              className={`w-full py-5 rounded-2xl border-2 flex items-center justify-center gap-3 transition-all ${isKhatam ? 'bg-amber-500 border-amber-500 text-white shadow-lg' : (isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-500' : 'bg-slate-50 border-slate-100 text-slate-400')}`}
                            >
                               <GraduationCap size={20} />
                               <span className="text-[11px] font-black uppercase tracking-[0.15em]">{isKhatam ? 'SUDAH KHATAM!' : 'TANDA KHATAM?'}</span>
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-3">
                              <label className={`text-[10px] font-black ${isDarkMode ? 'text-slate-500' : 'text-slate-400'} uppercase tracking-widest block px-1`}>Kualiti</label>
                              <div className="flex flex-col gap-2">
                                <button type="button" onClick={() => setReadingStatus('LANCAR')} className={`py-5 rounded-2xl border-2 font-black text-[10px] uppercase transition-all ${readingStatus === 'LANCAR' ? (isDarkMode ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-emerald-600 border-emerald-600 text-white shadow-lg') : (isDarkMode ? 'bg-slate-800 border-transparent text-slate-500 hover:bg-slate-700' : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100')}`}>LANCAR</button>
                                <button type="button" onClick={() => setReadingStatus('ULANG SEMULA')} className={`py-5 rounded-2xl border-2 font-black text-[10px] uppercase transition-all ${readingStatus === 'ULANG SEMULA' ? (isDarkMode ? 'bg-rose-600 border-rose-600 text-white shadow-lg' : 'bg-rose-600 border-rose-600 text-white shadow-lg') : (isDarkMode ? 'bg-slate-800 border-transparent text-slate-500 hover:bg-slate-700' : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100')}`}>ULANG</button>
                              </div>
                            </div>
                            <div className="space-y-3 text-center">
                              <label className={`text-[10px] font-black ${isDarkMode ? 'text-slate-500' : 'text-slate-400'} uppercase tracking-widest block`}>Muka Surat</label>
                              <div className={`p-4 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'} rounded-3xl border shadow-inner`}>
                                <button type="button" onClick={() => setPage((parseInt(page)+1).toString())} className={`w-full py-3 ${isDarkMode ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-white text-slate-600 hover:bg-slate-50'} rounded-xl shadow-sm font-black transition-colors`}>+</button>
                                <div className="py-4">
                                  <input type="text" inputMode="numeric" value={page} onChange={(e) => setPage(e.target.value.replace(/\D/g,''))} className={`bg-transparent text-center font-black text-3xl ${isDarkMode ? 'text-white' : 'text-slate-800'} outline-none w-full`} />
                                  {readingType === 'Al-Quran' && <p className={`text-[9px] font-black ${isDarkMode ? 'text-sky-400' : 'text-sky-500'} uppercase mt-2 tracking-widest`}>Juzuk {juzuk}</p>}
                                </div>
                                <button type="button" onClick={() => setPage((Math.max(1, parseInt(page)-1)).toString())} className={`w-full py-3 ${isDarkMode ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-white text-slate-600 hover:bg-slate-50'} rounded-xl shadow-sm font-black transition-colors`}>-</button>
                              </div>
                            </div>
                          </div>
                        </div>
                        <button type="submit" disabled={isSaving} className={`w-full py-6 rounded-[2rem] shadow-xl font-black text-[11px] uppercase tracking-[0.25em] flex items-center justify-center gap-3 transition-all ${isSaving ? 'bg-slate-200 text-slate-400' : (isDarkMode ? 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95' : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95')}`}>
                          {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />} SIMPAN REKOD
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className={`py-32 text-center ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} rounded-[3.5rem] border-2 border-dashed transition-colors`}>
           <Sparkles className={`${isDarkMode ? 'text-indigo-500/30' : 'text-emerald-500/30'} mx-auto mb-6`} size={32} />
           <h3 className={`font-black ${isDarkMode ? 'text-white' : 'text-slate-900'} text-xs uppercase`}>Pilih Kelas Dahulu</h3>
           <p className={`text-[9px] font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'} uppercase mt-2`}>Sistem sedia untuk input data</p>
        </div>
      )}
    </div>
  );
};

export default ProgressForm;
