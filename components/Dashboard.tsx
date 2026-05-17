
import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { ReadingRecord, Student } from '../types';
import { BookOpen, Users, Target, TrendingUp, Percent, Layers, Trophy, CheckCircle2, AlertCircle, UserMinus, Calendar, Download, Loader2 } from 'lucide-react';

interface DashboardProps {
  records: ReadingRecord[];
  students: Student[];
  isDarkMode?: boolean;
  logoUrl?: string;
}

const COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16', '#10B981', '#06B6D4', '#3B82F6', '#6366F1', '#A855F7'
];

const Dashboard: React.FC<DashboardProps> = ({ records, students, isDarkMode, logoUrl }) => {
  // State untuk pemilihan bulan statistik sejarah
  const [selectedMonth, setSelectedMonth] = useState('');
  // State untuk pemilihan kelas Murid Perkasa
  const [selectedPerkasaClass, setSelectedPerkasaClass] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const stats = useMemo(() => {
    const latestRecordsMap = new Map<string, ReadingRecord>();
    [...records].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()).forEach(r => {
      latestRecordsMap.set(r.studentId, r);
    });

    const totalStudents = students.length || 0;
    const studentsWithRecords = new Set(records.map(r => r.studentId)).size;
    const coveragePercent = totalStudents > 0 ? ((studentsWithRecords / totalStudents) * 100).toFixed(1) : "0";
    
    const year6Students = students.filter(s => s.TAHAP === 6);
    const year6KhatamCount = year6Students.filter(s => latestRecordsMap.get(s.ID_MURID)?.isKhatam).length;
    const year6Total = year6Students.length || 0;
    const year6KhatamPercent = year6Total > 0 ? ((year6KhatamCount / year6Total) * 100) : 0;
    
    const targetPercent = 60;
    const progressToTarget = Math.min(100, (year6KhatamPercent / targetPercent) * 100);
    const isTargetAchieved = year6KhatamPercent >= targetPercent;

    return {
      totalRecords: records.length,
      totalStudents,
      studentsWithRecords,
      coveragePercent,
      year6KhatamPercent: year6KhatamPercent.toFixed(1),
      year6KhatamCount,
      year6Total,
      year6TargetPercent: targetPercent,
      progressToTarget,
      isTargetAchieved,
      activeToday: new Set(records.filter(r => r.timestamp.startsWith(new Date().toISOString().split('T')[0])).map(r => r.studentId)).size
    };
  }, [records, students]);

  // Fungsi utiliti untuk proses data carta berdasarkan filter masa
  const processChartData = (recordsToProcess: ReadingRecord[], studentList: Student[]) => {
    const latestRecordsMap = new Map<string, ReadingRecord>();
    
    // Sort ikut masa untuk pastikan rekod paling akhir disimpan dalam map
    [...recordsToProcess]
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .forEach(r => {
        latestRecordsMap.set(r.studentId, r);
      });

    return [1, 2, 3, 4, 5, 6].map(grade => {
      const studentsInGrade = studentList.filter(s => s.TAHAP === grade);
      const totalInGrade = studentsInGrade.length || 1;
      const gradeRecords = studentsInGrade.map(s => latestRecordsMap.get(s.ID_MURID)).filter(Boolean) as ReadingRecord[];
      
      const counts = {
        'Iqra 1': gradeRecords.filter(r => r.readingType === 'Iqra 1').length,
        'Iqra 2': gradeRecords.filter(r => r.readingType === 'Iqra 2').length,
        'Iqra 3': gradeRecords.filter(r => r.readingType === 'Iqra 3').length,
        'Iqra 4': gradeRecords.filter(r => r.readingType === 'Iqra 4').length,
        'Iqra 5': gradeRecords.filter(r => r.readingType === 'Iqra 5').length,
        'Iqra 6': gradeRecords.filter(r => r.readingType === 'Iqra 6').length,
        'Juz 1-10': gradeRecords.filter(r => r.readingType === 'Al-Quran' && r.juzuk! <= 10 && !r.isKhatam).length,
        'Juz 11-20': gradeRecords.filter(r => r.readingType === 'Al-Quran' && r.juzuk! > 10 && r.juzuk! <= 20 && !r.isKhatam).length,
        'Juz 21-30': gradeRecords.filter(r => r.readingType === 'Al-Quran' && r.juzuk! > 20 && !r.isKhatam).length,
        'Khatam': gradeRecords.filter(r => r.isKhatam).length,
      };

      const percentages: any = {};
      Object.entries(counts).forEach(([key, value]) => {
        percentages[`${key}_pct`] = ((value / totalInGrade) * 100).toFixed(1);
      });

      return {
        grade: `T${grade}`,
        ...counts,
        ...percentages,
        total: totalInGrade
      };
    });
  };

  // 1. Live Data (Status Terkini Mutlak)
  const rumusanData = useMemo(() => processChartData(records, students), [records, students]);

  // 2. Monthly Data (Status pada akhir bulan yang dipilih)
  const monthlyRumusanData = useMemo(() => {
    if (!selectedMonth) return [];
    
    // Cari tarikh akhir bulan yang dipilih (e.g. 2024-02-29T23:59:59)
    const [year, month] = selectedMonth.split('-').map(Number);
    const lastDay = new Date(year, month, 0, 23, 59, 59, 999).toISOString();
    
    // Filter rekod yang berlaku pada atau sebelum tarikh tersebut sahaja
    const filteredRecords = records.filter(r => r.timestamp <= lastDay);
    
    return processChartData(filteredRecords, students);
  }, [records, students, selectedMonth]);

  // 3. Murid Perkasa Al-Quran (Tahun 6, Iqra 1-3)
  const perkasaData = useMemo(() => {
    const latestRecordsMap = new Map<string, ReadingRecord>();
    [...records].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()).forEach(r => {
      latestRecordsMap.set(r.studentId, r);
    });

    const year6Students = students.filter(s => s.TAHAP === 6);
    const perkasaList = year6Students.filter(s => {
      const lastRec = latestRecordsMap.get(s.ID_MURID);
      if (!lastRec) return true; // Anggap Iqra 1 jika tiada rekod? Atau abaikan? 
      // Mengikut arahan: Iqra 1-3 sahaja
      return ['Iqra 1', 'Iqra 2', 'Iqra 3'].includes(lastRec.readingType);
    }).map(s => ({
      ...s,
      readingType: latestRecordsMap.get(s.ID_MURID)?.readingType || 'Tiada Rekod'
    }));

    const classes = Array.from(new Set(perkasaList.map(s => s.KELAS))).sort();

    return {
      allPerkasa: perkasaList,
      availableClasses: classes
    };
  }, [records, students]);

  const filteredPerkasa = useMemo(() => {
    if (!selectedPerkasaClass) return [];
    return perkasaData.allPerkasa.filter(s => s.KELAS === selectedPerkasaClass);
  }, [perkasaData, selectedPerkasaClass]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-white/10 backdrop-blur-xl max-w-[200px]">
          <p className="font-black text-[8px] uppercase tracking-widest text-slate-400 mb-2 border-b border-white/5 pb-1">{label}</p>
          <div className="space-y-1.5">
            {payload.map((entry: any, index: number) => {
              if (entry.value === 0) return null;
              const percentage = entry.payload[`${entry.name}_pct`];
              return (
                <div key={index} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                    <span className="text-[8px] font-bold uppercase tracking-tight truncate">{entry.name}</span>
                  </div>
                  <span className="text-[8px] font-black shrink-0">{entry.value} <span className="text-emerald-400">({percentage}%)</span></span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  const handleExportPDF = async (title: string, data: any[]) => {
    setIsGenerating(true);
    const dateStr = new Date().toLocaleString('ms-MY', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const currentYear = new Date().getFullYear();

    const tableRows = data.map((d, idx) => `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 10px; font-size: 9px; text-align: center;">${d.grade}</td>
        <td style="padding: 10px; font-size: 9px; text-align: center;">${d['Iqra 1']}</td>
        <td style="padding: 10px; font-size: 9px; text-align: center;">${d['Iqra 2']}</td>
        <td style="padding: 10px; font-size: 9px; text-align: center;">${d['Iqra 3']}</td>
        <td style="padding: 10px; font-size: 9px; text-align: center;">${d['Iqra 4']}</td>
        <td style="padding: 10px; font-size: 9px; text-align: center;">${d['Iqra 5']}</td>
        <td style="padding: 10px; font-size: 9px; text-align: center;">${d['Iqra 6']}</td>
        <td style="padding: 10px; font-size: 9px; text-align: center;">${d['Juz 1-10']}</td>
        <td style="padding: 10px; font-size: 9px; text-align: center;">${d['Juz 11-20']}</td>
        <td style="padding: 10px; font-size: 9px; text-align: center;">${d['Juz 21-30']}</td>
        <td style="padding: 10px; font-size: 9px; text-align: center; font-weight: bold; color: #059669;">${d['Khatam']}</td>
        <td style="padding: 10px; font-size: 9px; text-align: center; font-weight: bold;">${d.total}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <div style="width: 210mm; min-height: 297mm; padding: 20mm; margin: 0 auto; background: white; box-sizing: border-box; font-family: sans-serif; position: relative; color: #0f172a;">
        <div style="display: flex; align-items: center; gap: 20px; padding-bottom: 20px; border-bottom: 3px solid #6366f1; margin-bottom: 30px;">
          <img src="${logoUrl}" style="width: 60px; height: auto;" />
          <div>
            <h1 style="margin: 0; font-size: 18px; color: #0f172a;">SK BUKIT RAMBAI</h1>
            <h2 style="margin: 4px 0; font-size: 11px; color: #6366f1;">LAPORAN ANALISIS STATISTIK (SERQI)</h2>
            <p style="margin: 0; font-size: 9px; color: #64748b; text-transform: uppercase;">${title} | TAHUN: ${currentYear}</p>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <thead>
            <tr style="background: #f8fafc;">
              <th style="padding: 8px; font-size: 7px; color: #6366f1; text-transform: uppercase; border: 1px solid #f1f5f9;">ALIRAN</th>
              <th style="padding: 8px; font-size: 7px; color: #6366f1; text-transform: uppercase; border: 1px solid #f1f5f9;">IQ1</th>
              <th style="padding: 8px; font-size: 7px; color: #6366f1; text-transform: uppercase; border: 1px solid #f1f5f9;">IQ2</th>
              <th style="padding: 8px; font-size: 7px; color: #6366f1; text-transform: uppercase; border: 1px solid #f1f5f9;">IQ3</th>
              <th style="padding: 8px; font-size: 7px; color: #6366f1; text-transform: uppercase; border: 1px solid #f1f5f9;">IQ4</th>
              <th style="padding: 8px; font-size: 7px; color: #6366f1; text-transform: uppercase; border: 1px solid #f1f5f9;">IQ5</th>
              <th style="padding: 8px; font-size: 7px; color: #6366f1; text-transform: uppercase; border: 1px solid #f1f5f9;">IQ6</th>
              <th style="padding: 8px; font-size: 7px; color: #6366f1; text-transform: uppercase; border: 1px solid #f1f5f9;">J1-10</th>
              <th style="padding: 8px; font-size: 7px; color: #6366f1; text-transform: uppercase; border: 1px solid #f1f5f9;">J11-20</th>
              <th style="padding: 8px; font-size: 7px; color: #6366f1; text-transform: uppercase; border: 1px solid #f1f5f9;">J21-30</th>
              <th style="padding: 8px; font-size: 7px; color: #6366f1; text-transform: uppercase; border: 1px solid #f1f5f9;">KHATAM</th>
              <th style="padding: 8px; font-size: 7px; color: #6366f1; text-transform: uppercase; border: 1px solid #f1f5f9;">JUMLAH</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>

        <div style="position: absolute; bottom: 20mm; left: 20mm; right: 20mm; text-align: center; font-size: 8px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 10px;">
          TARIKH DATA DI DOWNLOAD: ${dateStr} | SERQI DIGITAL SYSTEM © ${currentYear}
        </div>
      </div>
    `;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    document.body.appendChild(tempDiv);

    const opt = {
      margin: 0,
      filename: `SERQI_STATISTIK_${title.replace(/\s+/g, '_')}_${Date.now()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      // @ts-ignore
      await html2pdf().set(opt).from(tempDiv).save();
    } catch (err) {
      console.error("PDF Generation Error:", err);
      alert("Ralat menjana PDF.");
    } finally {
      document.body.removeChild(tempDiv);
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-20">
      {/* LOADING OVERLAY */}
      {isGenerating && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-center p-10 text-center">
           <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center shadow-2xl mb-6">
              <Loader2 className="text-indigo-600 animate-spin" size={40} />
           </div>
           <h3 className="text-white font-black text-lg uppercase tracking-tight">Menjana Fail PDF...</h3>
           <p className="text-indigo-300 text-[10px] font-black uppercase tracking-widest mt-2 animate-pulse">Sila tunggu sebentar, fail akan dimuat turun secara automatik</p>
        </div>
      )}

      {/* KPI Section */}
      <div className="bg-slate-900 p-6 md:p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
           <Trophy size={120} className="text-white" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-slate-900 shadow-lg shadow-amber-500/20">
              <Target size={20} />
            </div>
            <div>
              <h3 className="text-white font-black text-xs md:text-sm uppercase tracking-tight">SASARAN KHATAM TAHUN 6 (KPI 60%)</h3>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Sk Bukit Rambai • Sesi Semasa</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-4xl md:text-5xl font-black text-white tracking-tighter">{stats.year6KhatamPercent}%</span>
                  <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest ml-3">Pencapaian Semasa</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-slate-300 tracking-tight">{stats.year6KhatamCount} / {stats.year6Total}</span>
                  <p className="text-[7px] font-bold text-slate-500 uppercase tracking-widest">Bilangan Murid</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/10 p-0.5">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ease-out relative ${stats.isTargetAchieved ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]'}`}
                    style={{ width: `${stats.progressToTarget}%` }}
                  >
                  </div>
                </div>
              </div>
            </div>

            <div className={`p-5 rounded-2xl border-2 flex items-center gap-4 transition-all ${stats.isTargetAchieved ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-slate-800 border-slate-700'}`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${stats.isTargetAchieved ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-500'}`}>
                {stats.isTargetAchieved ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
              </div>
              <div>
                <h4 className={`font-black text-[10px] uppercase tracking-widest ${stats.isTargetAchieved ? 'text-emerald-400' : 'text-slate-300'}`}>
                  {stats.isTargetAchieved ? 'SASARAN DICAPAI!' : 'BELUM MENCAPAI SASARAN'}
                </h4>
                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1 leading-relaxed">
                  {stats.isTargetAchieved 
                    ? 'Tahniah! KPI 60% untuk murid Tahun 6 telah berjaya dipenuhi.' 
                    : `Lagi ${(60 - parseFloat(stats.year6KhatamPercent)).toFixed(1)}% diperlukan untuk mencapai sasaran KPI tahun ini.`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: 'Jumlah Murid', val: stats.totalStudents, icon: Users, color: isDarkMode ? 'bg-blue-500' : 'bg-blue-600' },
          { label: 'Jumlah Rekod', val: stats.totalRecords, icon: BookOpen, color: isDarkMode ? 'bg-indigo-500' : 'bg-indigo-600' },
          { label: 'Liputan Rekod', val: `${stats.coveragePercent}%`, icon: Percent, color: isDarkMode ? 'bg-emerald-500' : 'bg-emerald-600' },
          { label: 'Tiada Rekod', val: stats.totalStudents - stats.studentsWithRecords, icon: UserMinus, color: isDarkMode ? 'bg-rose-500' : 'bg-rose-600' },
        ].map((item, i) => (
          <div key={i} className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} p-4 md:p-6 rounded-2xl md:rounded-[2rem] shadow-sm border group transition-all`}>
            <div className={`w-8 h-8 md:w-10 md:h-10 ${item.color} rounded-xl flex items-center justify-center text-white mb-3 md:mb-4 shadow-md group-hover:scale-110 transition-transform`}>
              <item.icon className="w-4 h-4 md:w-5 md:h-5" />
            </div>
            <p className={`text-[7px] md:text-[8px] font-black ${isDarkMode ? 'text-slate-500' : 'text-slate-400'} uppercase tracking-widest mb-0.5`}>{item.label}</p>
            <p className={`text-lg md:text-2xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'} tracking-tight`}>{item.val}</p>
          </div>
        ))}
      </div>

      {/* CARTA 1: LIVE DATA */}
      <div className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} p-4 md:p-10 rounded-2xl md:rounded-[2.5rem] shadow-xl border`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 md:mb-10">
           <div className="flex items-center gap-3">
              <h3 className={`font-black ${isDarkMode ? 'text-white' : 'text-slate-900'} uppercase tracking-tighter text-sm md:text-lg flex items-center gap-2`}>
                 <TrendingUp className="text-emerald-600 w-4 h-4 md:w-6 md:h-6" /> Statistik Aliran (Terkini)
              </h3>
              <button 
                onClick={() => handleExportPDF('Statistik Aliran Terkini', rumusanData)}
                className={`p-2 rounded-lg ${isDarkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'} transition-all flex items-center gap-2 border ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}
                title="Save PDF"
              >
                <Download size={14} />
                <span className="text-[8px] font-black uppercase">PDF</span>
              </button>
           </div>
           <div className={`flex items-center gap-2 px-3 py-1.5 ${isDarkMode ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-100'} rounded-lg border w-fit`}>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className={`text-[8px] font-black ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'} uppercase tracking-widest`}>Live Data</span>
           </div>
        </div>
        
        <div className="h-[300px] md:h-[450px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rumusanData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#1e293b' : '#f1f5f9'} />
              <XAxis dataKey="grade" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 800, fill: isDarkMode ? '#64748b' : '#94a3b8'}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 8, fontWeight: 800, fill: isDarkMode ? '#475569' : '#cbd5e1'}} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: isDarkMode ? '#1e293b' : '#f8fafc', radius: 10 }} />
              <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '7px', fontWeight: '900', textTransform: 'uppercase', paddingBottom: '20px' }} />
              <Bar dataKey="Iqra 1" stackId="a" fill={COLORS[0]} />
              <Bar dataKey="Iqra 2" stackId="a" fill={COLORS[1]} />
              <Bar dataKey="Iqra 3" stackId="a" fill={COLORS[2]} />
              <Bar dataKey="Iqra 4" stackId="a" fill={COLORS[3]} />
              <Bar dataKey="Iqra 5" stackId="a" fill={COLORS[4]} />
              <Bar dataKey="Iqra 6" stackId="a" fill={COLORS[5]} />
              <Bar dataKey="Juz 1-10" stackId="a" fill={COLORS[6]} />
              <Bar dataKey="Juz 11-20" stackId="a" fill={COLORS[7]} />
              <Bar dataKey="Juz 21-30" stackId="a" fill={COLORS[8]} />
              <Bar dataKey="Khatam" stackId="a" fill={COLORS[9]} radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CARTA 2: MONTHLY DATA (TAMBAHAN) */}
      <div className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} p-4 md:p-10 rounded-2xl md:rounded-[2.5rem] shadow-xl border border-t-4 ${isDarkMode ? 'border-t-indigo-600' : 'border-t-indigo-500'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-10">
           <div className="flex items-center gap-3">
              <div>
                <h3 className={`font-black ${isDarkMode ? 'text-white' : 'text-slate-900'} uppercase tracking-tighter text-sm md:text-lg flex items-center gap-2`}>
                   <Calendar className="text-indigo-600 w-4 h-4 md:w-6 md:h-6" /> Statistik Aliran Bulanan
                </h3>
                <p className={`text-[8px] font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'} uppercase tracking-widest mt-1`}>Rujukan data prestasi bulan lepas</p>
              </div>
              {selectedMonth && (
                <button 
                  onClick={() => handleExportPDF(`Statistik Aliran Bulanan (${selectedMonth})`, monthlyRumusanData)}
                  className={`p-2 rounded-lg ${isDarkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'} transition-all flex items-center gap-2 border ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}
                  title="Save PDF"
                >
                  <Download size={14} />
                  <span className="text-[8px] font-black uppercase">PDF</span>
                </button>
              )}
           </div>
           
           <div className="relative group">
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)}
                className={`appearance-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-600'} rounded-xl px-4 py-3 pr-10 font-black text-[9px] uppercase tracking-widest outline-none focus:border-indigo-300 transition-all cursor-pointer shadow-inner`}
              >
                <option value="">-- PILIH BULAN --</option>
                {/* Janakan senarai bulan bermula dari Januari 2026 */}
                {(() => {
                  const options = [];
                  const currentDate = new Date();
                  const startYear = 2026;
                  const startMonth = 0; // Januari
                  
                  let y = currentDate.getFullYear();
                  let m = currentDate.getMonth();
                  
                  // Fallback jika tarikh sistem sebelum 2026
                  if (y < startYear) {
                    const val = `${y}-${String(m + 1).padStart(2, '0')}`;
                    const label = currentDate.toLocaleDateString('ms-MY', { month: 'long', year: 'numeric' }).toUpperCase();
                    return <option value={val}>{label}</option>;
                  }

                  while (y > startYear || (y === startYear && m >= startMonth)) {
                    const val = `${y}-${String(m + 1).padStart(2, '0')}`;
                    const d = new Date(y, m, 15); // Guna hari ke-15 untuk elak isu zon masa
                    const label = d.toLocaleDateString('ms-MY', { month: 'long', year: 'numeric' }).toUpperCase();
                    options.push(<option key={val} value={val}>{label}</option>);
                    
                    m--;
                    if (m < 0) {
                      m = 11;
                      y--;
                    }
                  }
                  return options;
                })()}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-400">
                <Calendar size={14} />
              </div>
           </div>
        </div>
        
        <div className="h-[300px] md:h-[450px] flex items-center justify-center">
          {selectedMonth ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyRumusanData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#1e293b' : '#f1f5f9'} />
                <XAxis dataKey="grade" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 800, fill: isDarkMode ? '#64748b' : '#94a3b8'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 8, fontWeight: 800, fill: isDarkMode ? '#475569' : '#cbd5e1'}} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: isDarkMode ? '#1e293b' : '#f8fafc', radius: 10 }} />
                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '7px', fontWeight: '900', textTransform: 'uppercase', paddingBottom: '20px' }} />
                <Bar dataKey="Iqra 1" stackId="b" fill={COLORS[0]} />
                <Bar dataKey="Iqra 2" stackId="b" fill={COLORS[1]} />
                <Bar dataKey="Iqra 3" stackId="b" fill={COLORS[2]} />
                <Bar dataKey="Iqra 4" stackId="b" fill={COLORS[3]} />
                <Bar dataKey="Iqra 5" stackId="b" fill={COLORS[4]} />
                <Bar dataKey="Iqra 6" stackId="b" fill={COLORS[5]} />
                <Bar dataKey="Juz 1-10" stackId="b" fill={COLORS[6]} />
                <Bar dataKey="Juz 11-20" stackId="b" fill={COLORS[7]} />
                <Bar dataKey="Juz 21-30" stackId="b" fill={COLORS[8]} />
                <Bar dataKey="Khatam" stackId="b" fill={COLORS[9]} radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center space-y-4 animate-pulse">
              <div className={`w-16 h-16 ${isDarkMode ? 'bg-indigo-500/10' : 'bg-indigo-50'} rounded-full flex items-center justify-center mx-auto`}>
                <Calendar className={isDarkMode ? 'text-indigo-400' : 'text-indigo-300'} size={32} />
              </div>
              <div>
                <p className={`text-[10px] font-black ${isDarkMode ? 'text-white' : 'text-slate-900'} uppercase tracking-widest`}>Sila Pilih Bulan</p>
                <p className={`text-[8px] font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'} uppercase tracking-widest mt-1`}>Pilih bulan di atas untuk melihat statistik aliran</p>
              </div>
            </div>
          )}
        </div>
        
        <div className={`mt-8 p-4 ${isDarkMode ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-indigo-50/50 border-indigo-100'} rounded-2xl border flex items-start gap-3`}>
           <Percent size={14} className="text-indigo-500 mt-0.5 shrink-0" />
           <p className={`text-[9px] font-bold ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'} uppercase tracking-wide leading-relaxed`}>
             Data di atas menunjukkan status bacaan murid pada <b>hari terakhir</b> bulan yang dipilih. Jika murid belum mempunyai rekod pada bulan tersebut, status terakhir sebelum tarikh tersebut akan digunakan.
           </p>
        </div>
      </div>

      {/* SEKSYEN MURID PERKASA AL-QURAN */}
      <div className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} p-4 md:p-10 rounded-2xl md:rounded-[2.5rem] shadow-xl border border-t-4 ${isDarkMode ? 'border-t-rose-600' : 'border-t-rose-500'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-10">
           <div>
              <h3 className={`font-black ${isDarkMode ? 'text-white' : 'text-slate-900'} uppercase tracking-tighter text-sm md:text-lg flex items-center gap-2`}>
                 <Trophy className="text-rose-600 w-4 h-4 md:w-6 md:h-6" /> Murid Perkasa Al-Quran (Tahun 6)
              </h3>
              <p className={`text-[8px] font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'} uppercase tracking-widest mt-1`}>Senarai murid Tahun 6 yang masih di tahap Iqra 1-3</p>
           </div>
           
           <div className="flex items-center gap-4">
             <div className={`${isDarkMode ? 'bg-rose-500/10 border-rose-500/20' : 'bg-rose-50 border-rose-100'} px-4 py-2 rounded-xl border`}>
                <span className={`text-[10px] font-black ${isDarkMode ? 'text-rose-400' : 'text-rose-600'} uppercase tracking-widest`}>{perkasaData.allPerkasa.length} Murid</span>
             </div>
             <div className="relative">
                <select 
                  value={selectedPerkasaClass} 
                  onChange={(e) => setSelectedPerkasaClass(e.target.value)}
                  className={`appearance-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-600'} rounded-xl px-4 py-3 pr-10 font-black text-[9px] uppercase tracking-widest outline-none focus:border-rose-300 transition-all cursor-pointer shadow-inner`}
                >
                  <option value="">-- PILIH KELAS --</option>
                  {perkasaData.availableClasses.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-rose-400">
                  <Layers size={14} />
                </div>
             </div>
           </div>
        </div>

        {selectedPerkasaClass ? (
          filteredPerkasa.length > 0 ? (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full border-collapse">
                <thead>
                  <tr className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'} border-b-2`}>
                    <th className={`px-4 py-4 text-left text-[9px] font-black ${isDarkMode ? 'text-slate-500' : 'text-slate-400'} uppercase tracking-widest w-16`}>Bil</th>
                    <th className={`px-4 py-4 text-left text-[9px] font-black ${isDarkMode ? 'text-slate-500' : 'text-slate-400'} uppercase tracking-widest`}>Nama Murid</th>
                    <th className={`px-4 py-4 text-left text-[9px] font-black ${isDarkMode ? 'text-slate-500' : 'text-slate-400'} uppercase tracking-widest`}>Tahap Bacaan</th>
                    <th className={`px-4 py-4 text-left text-[9px] font-black ${isDarkMode ? 'text-slate-500' : 'text-slate-400'} uppercase tracking-widest`}>Kelas</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-50'}`}>
                  {filteredPerkasa.map((s, idx) => (
                    <tr key={s.ID_MURID} className={`${isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50/50'} transition-colors`}>
                      <td className={`px-4 py-4 text-[10px] font-black ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>{idx + 1}</td>
                      <td className={`px-4 py-4 text-[10px] font-black ${isDarkMode ? 'text-white' : 'text-slate-900'} uppercase tracking-tight`}>{s.NAMA_MURID}</td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 ${isDarkMode ? 'bg-rose-900/30 text-rose-400' : 'bg-rose-100 text-rose-600'} rounded-md text-[8px] font-black uppercase tracking-widest`}>
                          {s.readingType}
                        </span>
                      </td>
                      <td className={`px-4 py-4 text-[10px] font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-500'} uppercase tracking-widest`}>{s.KELAS}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-20 text-center">
              <div className={`w-16 h-16 ${isDarkMode ? 'bg-emerald-500/10' : 'bg-emerald-50'} rounded-full flex items-center justify-center mx-auto mb-4`}>
                <CheckCircle2 className="text-emerald-500" size={32} />
              </div>
              <p className={`text-[10px] font-black ${isDarkMode ? 'text-white' : 'text-slate-900'} uppercase tracking-widest`}>Tiada Murid Perkasa</p>
              <p className={`text-[8px] font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'} uppercase tracking-widest mt-1`}>Semua murid Tahun 6 di kelas ini telah melepasi Iqra 3</p>
            </div>
          )
        ) : (
          <div className="py-20 text-center space-y-4 animate-pulse">
            <div className={`w-16 h-16 ${isDarkMode ? 'bg-rose-500/10' : 'bg-rose-50'} rounded-full flex items-center justify-center mx-auto`}>
              <Layers className={isDarkMode ? 'text-rose-400' : 'text-rose-300'} size={32} />
            </div>
            <div>
              <p className={`text-[10px] font-black ${isDarkMode ? 'text-white' : 'text-slate-900'} uppercase tracking-widest`}>Sila Pilih Kelas</p>
              <p className={`text-[8px] font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'} uppercase tracking-widest mt-1`}>Pilih kelas untuk melihat senarai Murid Perkasa</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
