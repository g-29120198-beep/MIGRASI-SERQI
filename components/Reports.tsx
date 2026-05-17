
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search, Calendar, FileDown, FileText, Layers, Hash as HashIcon, LayoutGrid, X, Loader2, CheckCircle, Printer, Download, Eye
} from 'lucide-react';
import { ReadingRecord, Student, ClassOption } from '../types';

interface ReportsProps {
  records: ReadingRecord[];
  students: Student[];
  availableClasses: ClassOption[];
  logoUrl?: string;
  isDarkMode?: boolean;
}

interface PreviewData {
  students: Student[];
  mode: 'MONTH' | 'YEAR' | 'DATA_BACAAN';
  month: string;
}

const Reports: React.FC<ReportsProps> = ({ records, students, availableClasses, logoUrl, isDarkMode }) => {
  const [reportType, setReportType] = useState<'SLIP' | 'DATA_BACAAN'>('SLIP');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); 
  const [searchTerm, setSearchTerm] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  
  const reportContainerRef = useRef<HTMLDivElement>(null);

  const filteredStudentsInClass = useMemo(() => {
    if (!selectedClassId) return [];
    const className = availableClasses.find(c => c.id === selectedClassId)?.name;
    return students.filter(s => s.KELAS === className && (s.STATUS_MURID || 'AKTIF') === 'AKTIF')
      .filter(s => !searchTerm || s.NAMA_MURID.toLowerCase().includes(searchTerm.toLowerCase()) || s.ID_MURID.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => a.NAMA_MURID.localeCompare(b.NAMA_MURID));
  }, [students, selectedClassId, searchTerm, availableClasses]);

  const toggleStudentSelection = (id: string) => {
    setSelectedStudentIds((prev: string[]) => 
      prev.includes(id) ? prev.filter((sid: string) => sid !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedStudentIds.length === filteredStudentsInClass.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudentsInClass.map((s: Student) => s.ID_MURID));
    }
  };

  const openPreview = (studentId: string | 'BATCH' | 'ALL_CLASSES', mode: 'MONTH' | 'YEAR' | 'DATA_BACAAN') => {
    let targetStudents: Student[] = [];
    
    if (mode === 'DATA_BACAAN') {
      if (studentId === 'ALL_CLASSES') {
        targetStudents = students.filter(s => (s.STATUS_MURID || 'AKTIF') === 'AKTIF')
          .sort((a, b) => a.KELAS.localeCompare(b.KELAS) || a.NAMA_MURID.localeCompare(b.NAMA_MURID));
      } else {
        targetStudents = filteredStudentsInClass;
      }
    } else if (studentId === 'BATCH') {
      targetStudents = filteredStudentsInClass.filter((s: Student) => selectedStudentIds.includes(s.ID_MURID));
      if (targetStudents.length === 0) {
        alert("Sila pilih sekurang-kurangnya satu murid untuk cetakan pukal.");
        return;
      }
    } else {
      const student = students.find((s: Student) => s.ID_MURID === studentId);
      if (student) targetStudents = [student];
    }

    if (targetStudents.length === 0) return;

    setPreviewData({
      students: targetStudents,
      mode,
      month: selectedMonth
    });
  };

  const renderDataBacaanHTML = (targetStudents: Student[]) => {
    const currentYear = new Date().getFullYear();
    const dateStr = new Date().toLocaleString('ms-MY', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    
    // Group by class if multiple classes
    const classesMap: Record<string, Student[]> = {};
    targetStudents.forEach(s => {
      if (!classesMap[s.KELAS]) classesMap[s.KELAS] = [];
      classesMap[s.KELAS].push(s);
    });

    const latestRecordsMap = new Map<string, ReadingRecord>();
    [...records].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()).forEach(r => {
      latestRecordsMap.set(r.studentId, r);
    });

    return Object.entries(classesMap).sort((a, b) => a[0].localeCompare(b[0])).map(([className, classStudents]) => {
      const rows = classStudents.sort((a, b) => a.NAMA_MURID.localeCompare(b.NAMA_MURID)).map((s, idx) => {
        const lastRec = latestRecordsMap.get(s.ID_MURID);
        const readingDisplay = lastRec ? (lastRec.readingType === 'Al-Quran' ? `AL-QURAN (J${lastRec.juzuk}, MS${lastRec.page})` : `${lastRec.readingType} (MS${lastRec.page})`) : 'TIADA REKOD';
        const khatamDisplay = lastRec?.isKhatam ? 'YA' : 'TIDAK';
        
        return `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px; font-size: 9px; text-align: center;">${idx + 1}</td>
            <td style="padding: 10px; font-size: 9px; text-transform: uppercase;">${s.NAMA_MURID}</td>
            <td style="padding: 10px; font-size: 9px; text-align: center;">${readingDisplay}</td>
            <td style="padding: 10px; font-size: 9px; text-align: center; font-weight: bold; color: ${lastRec?.isKhatam ? '#059669' : '#64748b'};">${khatamDisplay}</td>
            <td style="padding: 10px; font-size: 9px; text-align: center;">${s.KELAS}</td>
          </tr>
        `;
      }).join('');

      return `
        <div style="width: 210mm; min-height: 297mm; padding: 20mm; margin: 0 auto; background: white; box-sizing: border-box; font-family: sans-serif; page-break-after: always; position: relative; color: #0f172a;">
          <div style="display: flex; align-items: center; gap: 20px; padding-bottom: 20px; border-bottom: 3px solid #6366f1; margin-bottom: 30px;">
            <img src="${logoUrl}" style="width: 60px; height: auto;" />
            <div>
              <h1 style="margin: 0; font-size: 18px; color: #0f172a;">SK BUKIT RAMBAI</h1>
              <h2 style="margin: 4px 0; font-size: 11px; color: #6366f1;">LAPORAN DATA BACAAN MURID (SERQI)</h2>
              <p style="margin: 0; font-size: 9px; color: #64748b; text-transform: uppercase;">KELAS: ${className} | TAHUN: ${currentYear}</p>
            </div>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
            <thead>
              <tr style="background: #f8fafc;">
                <th style="padding: 12px; font-size: 8px; color: #6366f1; text-transform: uppercase; border: 1px solid #f1f5f9; width: 30px;">BIL</th>
                <th style="padding: 12px; font-size: 8px; color: #6366f1; text-transform: uppercase; border: 1px solid #f1f5f9; text-align: left;">NAMA MURID</th>
                <th style="padding: 12px; font-size: 8px; color: #6366f1; text-transform: uppercase; border: 1px solid #f1f5f9;">TAHAP BACAAN</th>
                <th style="padding: 12px; font-size: 8px; color: #6366f1; text-transform: uppercase; border: 1px solid #f1f5f9; width: 60px;">KHATAM</th>
                <th style="padding: 12px; font-size: 8px; color: #6366f1; text-transform: uppercase; border: 1px solid #f1f5f9; width: 80px;">KELAS</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>

          <div style="position: absolute; bottom: 20mm; left: 20mm; right: 20mm; text-align: center; font-size: 8px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 10px;">
            TARIKH DATA DI DOWNLOAD: ${dateStr} | SERQI DIGITAL SYSTEM © ${currentYear}
          </div>
        </div>
      `;
    }).join('');
  };

  const renderSlipHTML = (student: Student, mode: 'MONTH' | 'YEAR' | 'DATA_BACAAN', month: string) => {
    if (mode === 'DATA_BACAAN') return ''; // Handled by renderDataBacaanHTML
    const studentRecords = records.filter((r: ReadingRecord) => r.studentId === student.ID_MURID);
    const latestRec = studentRecords[0]; 
    const isKhatam = studentRecords.some((r: ReadingRecord) => r.isKhatam);
    const isAlQuran = latestRec?.readingType === 'Al-Quran';
    const currentYear = new Date().getFullYear();
    
    let themeColor = '#2563eb'; 
    let categoryName = 'IQRA';
    
    if (isKhatam) {
      themeColor = '#f97316'; 
      categoryName = 'KHATAM';
    } else if (isAlQuran) {
      themeColor = '#059669'; 
      categoryName = 'AL-QURAN';
    }

    const verifyId = `SQ-${currentYear}${month.replace('-','')}-${student.ID_MURID}`;
    let tableRows = '';
    let tableHeaders = '';
    let periodLabel = '';
    let reportTitle = mode === 'MONTH' ? 'Laporan Prestasi Bacaan Bulanan Murid' : 'Laporan Prestasi Bacaan Tahunan Murid';

    if (mode === 'MONTH') {
      const monthRecs = studentRecords.filter((r: ReadingRecord) => r.timestamp.startsWith(month))
        .sort((a: ReadingRecord, b: ReadingRecord) => a.timestamp.localeCompare(b.timestamp));
      
      periodLabel = new Date(month).toLocaleDateString('ms-MY', { month: 'long', year: 'numeric' }).toUpperCase();
      
      tableHeaders = `
        <tr style="background: #f8fafc;">
          <th style="text-align: left; padding: 12px; font-size: 9px; color: ${themeColor}; text-transform: uppercase;">Tarikh</th>
          <th style="text-align: left; padding: 12px; font-size: 9px; color: ${themeColor}; text-transform: uppercase;">Jenis Bacaan</th>
          <th style="text-align: left; padding: 12px; font-size: 9px; color: ${themeColor}; text-transform: uppercase;">Muka Surat</th>
          <th style="text-align: left; padding: 12px; font-size: 9px; color: ${themeColor}; text-transform: uppercase;">Kualiti</th>
        </tr>
      `;

      tableRows = monthRecs.map((r: ReadingRecord) => {
        const readingDisplay = r.readingType === 'Al-Quran' ? `AL-QURAN (JUZUK ${r.juzuk || '-'})` : r.readingType;
        return `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px; font-size: 10px;">${new Date(r.timestamp).toLocaleDateString('ms-MY', { day: '2-digit', month: '2-digit' })}</td>
            <td style="padding: 10px; font-size: 10px;">${readingDisplay}</td>
            <td style="padding: 10px; font-size: 10px;">MS ${r.page}</td>
            <td style="padding: 10px; font-size: 10px; color: ${themeColor}; font-weight: bold;">${r.readingStatus || 'LANCAR'}</td>
          </tr>
        `;
      }).join('');
    } else {
      const year = new Date().getFullYear().toString();
      const yearRecs = studentRecords.filter((r: ReadingRecord) => r.timestamp.startsWith(year));
      periodLabel = `TAHUN ${year}`;
      
      tableHeaders = `
        <tr style="background: #f8fafc;">
          <th style="text-align: left; padding: 12px; font-size: 9px; color: ${themeColor}; text-transform: uppercase;">Bulan</th>
          <th style="text-align: left; padding: 12px; font-size: 9px; color: ${themeColor}; text-transform: uppercase;">Kemajuan Bacaan</th>
          <th style="text-align: left; padding: 12px; font-size: 9px; color: ${themeColor}; text-transform: uppercase;">Kualiti</th>
          <th style="text-align: left; padding: 12px; font-size: 9px; color: ${themeColor}; text-transform: uppercase;">Jumlah</th>
        </tr>
      `;

      const months: Record<string, ReadingRecord[]> = {};
      yearRecs.forEach((r: ReadingRecord) => {
        const m = r.timestamp.slice(0, 7);
        if (!months[m]) months[m] = [];
        months[m].push(r);
      });

      tableRows = Object.entries(months).sort((a, b) => a[0].localeCompare(b[0])).map(([mKey, mRecs]) => {
        const sorted = mRecs.sort((a: ReadingRecord, b: ReadingRecord) => a.timestamp.localeCompare(b.timestamp));
        const mName = new Date(mKey).toLocaleDateString('ms-MY', { month: 'long' }).toUpperCase();
        
        const start = sorted[0];
        const end = sorted[sorted.length - 1];
        
        const formatReading = (r: ReadingRecord) => {
          if (r.readingType === 'Al-Quran') return `AL-QURAN JUZ ${r.juzuk || '-'} (MS${r.page})`;
          return `${r.readingType} (MS${r.page})`;
        };

        const progress = `${formatReading(start)} - ${formatReading(end)}`;

        // Calculate Quality Summary
        const lancarCount = mRecs.filter(r => r.readingStatus === 'LANCAR' || !r.readingStatus).length;
        const ulangCount = mRecs.filter(r => r.readingStatus === 'ULANG SEMULA').length;
        const total = mRecs.length;

        let qualityLabel = 'SEDERHANA';
        let qualityColor = '#f59e0b'; // Amber

        if (lancarCount > ulangCount) {
          qualityLabel = 'BAIK';
          qualityColor = '#10b981'; // Emerald
        } else if (ulangCount > total * 0.6) {
          qualityLabel = 'LEMAH';
          qualityColor = '#ef4444'; // Red
        }

        return `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px; font-size: 10px;">${mName}</td>
            <td style="padding: 10px; font-size: 10px;">${progress}</td>
            <td style="padding: 10px; font-size: 10px; font-weight: bold; color: ${qualityColor};">${qualityLabel}</td>
            <td style="padding: 10px; font-size: 10px; font-weight: bold; color: #64748b;">${total} REKOD</td>
          </tr>
        `;
      }).join('');
    }

    if (!tableRows) return `<div style="padding: 40px; text-align: center; color: #94a3b8; font-size: 12px; font-family: sans-serif; page-break-after: always;">Tiada rekod bacaan untuk ${student.NAMA_MURID} pada tempoh ini.</div>`;

    return `
      <div style="width: 210mm; min-height: 297mm; padding: 20mm; margin: 0 auto; background: white; box-sizing: border-box; font-family: sans-serif; page-break-after: always; position: relative; color: #0f172a;">
        <div style="display: flex; align-items: center; gap: 20px; padding-bottom: 20px; border-bottom: 3px solid ${themeColor}; margin-bottom: 30px;">
          <img src="${logoUrl}" style="width: 60px; height: auto;" />
          <div>
            <h1 style="margin: 0; font-size: 20px; color: #0f172a;">SK BUKIT RAMBAI</h1>
            <h2 style="margin: 4px 0; font-size: 12px; color: ${themeColor};">SISTEM PEREKODAN PINTAR (SERQI)</h2>
            <p style="margin: 0; font-size: 9px; color: #64748b; text-transform: uppercase;">${reportTitle}</p>
          </div>
          <div style="margin-left: auto; font-size: 8px; color: #cbd5e1; border: 1px solid #f1f5f9; padding: 4px 8px; border-radius: 6px;">ID: ${verifyId}</div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
          <div style="border: 1px solid #f1f5f9; padding: 15px; border-radius: 12px;">
            <span style="font-size: 8px; color: #94a3b8; display: block; margin-bottom: 5px;">NAMA MURID</span>
            <div style="font-size: 14px; font-weight: bold; color: #0f172a;">${student.NAMA_MURID}</div>
            <div style="font-size: 11px; color: #334155;">${student.KELAS}</div>
          </div>
          <div style="border: 1px solid #f1f5f9; padding: 15px; border-radius: 12px;">
            <span style="font-size: 8px; color: #94a3b8; display: block; margin-bottom: 5px;">PERIOD & TAHAP</span>
            <div style="font-size: 14px; font-weight: bold; color: #0f172a;">${periodLabel}</div>
            <div style="font-size: 11px; color: ${themeColor}">${isKhatam ? '★ KHATAM AL-QURAN ★' : 'KATEGORI: ' + categoryName}</div>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <thead>${tableHeaders}</thead>
          <tbody>${tableRows}</tbody>
        </table>

        <div style="position: absolute; bottom: 20mm; left: 20mm; right: 20mm; padding: 20px; border-radius: 12px; text-align: center; background: #f8fafc; border: 1px dashed ${themeColor}">
           <p style="margin: 0; font-size: 9px; color: #64748b;">Fail PDF ini dijana secara automatik untuk simpanan digital. Kod: ${verifyId}</p>
           <p style="margin: 4px 0 0 0; font-size: 8px; color: #94a3b8; font-weight: bold;">TARIKH JANA: ${new Date().toLocaleString('ms-MY', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
           <div style="margin-top: 8px; font-size: 8px; color: #cbd5e1; text-transform: uppercase; letter-spacing: 2px;">SERQI DIGITAL SYSTEM © ${currentYear}</div>
        </div>
      </div>
    `;
  };

  const handlePrint = () => {
    const printContent = document.getElementById('preview-content');
    if (!printContent) return;

    const originalContent = document.body.innerHTML;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Cetak Slip SERQI</title>
            <style>
              body { margin: 0; padding: 0; }
              @page { size: A4; margin: 0; }
              @media print {
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
            <script>
              window.onload = function() {
                window.print();
                window.onafterprint = function() { window.close(); };
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleSavePDF = async () => {
    if (!previewData) return;
    setIsGenerating(true);
    
    let htmlContent = '';
    if (previewData.mode === 'DATA_BACAAN') {
      htmlContent = renderDataBacaanHTML(previewData.students);
    } else {
      const slips = previewData.students.map(s => renderSlipHTML(s, previewData.mode, previewData.month));
      htmlContent = slips.join('');
    }
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    document.body.appendChild(tempDiv);

    const fileName = previewData.mode === 'DATA_BACAAN'
      ? `SERQI_DATA_BACAAN_${selectedClassId || 'SEMUA'}_${Date.now()}.pdf`
      : (previewData.students.length > 1 
          ? `SERQI_PUKAL_${selectedClassId}_${Date.now()}.pdf` 
          : `SERQI_${previewData.students[0].ID_MURID}_${Date.now()}.pdf`);

    const opt = {
      margin: 0,
      filename: fileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      // @ts-ignore - html2pdf provided via CDN
      await html2pdf().set(opt).from(tempDiv).save();
    } catch (err) {
      console.error("PDF Generation Error:", err);
      alert("Ralat menjana PDF. Sila cuba lagi.");
    } finally {
      document.body.removeChild(tempDiv);
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 pb-32">
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

      {/* PREVIEW MODAL */}
      {previewData && (
        <div className="fixed inset-0 z-[90] bg-slate-900/95 backdrop-blur-xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white">
                <Eye size={20} />
              </div>
              <div>
                <h3 className="text-white font-black text-sm uppercase tracking-tight">Preview Laporan</h3>
                <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest">
                  {previewData.mode === 'DATA_BACAAN' ? 'Laporan Data Bacaan' : `${previewData.students.length} Murid | ${previewData.mode === 'MONTH' ? 'Bulanan' : 'Tahunan'}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handlePrint} className={`px-6 py-3 ${isDarkMode ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-white text-slate-900 hover:bg-slate-100'} rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all`}>
                <Printer size={16} /> Print
              </button>
              <button onClick={handleSavePDF} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 transition-all">
                <Download size={16} /> Save PDF
              </button>
              <button onClick={() => setPreviewData(null)} className={`p-3 ${isDarkMode ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-white/5 text-white hover:bg-white/10'} rounded-xl transition-all`}>
                <X size={20} />
              </button>
            </div>
          </div>
          <div className={`flex-1 overflow-y-auto p-8 ${isDarkMode ? 'bg-slate-950' : 'bg-slate-800'} custom-scrollbar`}>
            <div id="preview-content" className="max-w-[210mm] mx-auto space-y-8 shadow-2xl">
              {previewData.mode === 'DATA_BACAAN' ? (
                <div dangerouslySetInnerHTML={{ __html: renderDataBacaanHTML(previewData.students) }} />
              ) : (
                previewData.students.map((s: Student) => (
                  <div key={s.ID_MURID} dangerouslySetInnerHTML={{ __html: renderSlipHTML(s, previewData.mode, previewData.month) }} />
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* REPORT TYPE SELECTOR */}
      <div className={`flex gap-4 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} p-2 rounded-3xl shadow-sm border w-fit mx-auto`}>
        <button 
          onClick={() => setReportType('SLIP')}
          className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${reportType === 'SLIP' ? (isDarkMode ? 'bg-indigo-600 text-white shadow-xl' : 'bg-slate-900 text-white shadow-xl') : (isDarkMode ? 'text-slate-500 hover:bg-slate-800' : 'text-slate-400 hover:bg-slate-50')}`}
        >
          Slip Prestasi
        </button>
        <button 
          onClick={() => setReportType('DATA_BACAAN')}
          className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${reportType === 'DATA_BACAAN' ? (isDarkMode ? 'bg-indigo-600 text-white shadow-xl' : 'bg-slate-900 text-white shadow-xl') : (isDarkMode ? 'text-slate-500 hover:bg-slate-800' : 'text-slate-400 hover:bg-slate-50')}`}
        >
          Data Bacaan Murid
        </button>
      </div>

      <div className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} p-6 md:p-10 rounded-[3rem] shadow-xl border space-y-8`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-3">
            <label className={`text-[10px] font-black ${isDarkMode ? 'text-slate-500' : 'text-slate-400'} uppercase tracking-widest px-1 flex items-center gap-2`}><HashIcon size={12}/> Pilih Kelas</label>
            <select value={selectedClassId} onChange={(e) => { setSelectedClassId(e.target.value); setSelectedStudentIds([]); }} className={`w-full p-5 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-800'} border-2 rounded-2xl font-black text-xs focus:border-indigo-300 outline-none transition-all`}>
              <option value="">-- PILIH KELAS --</option>
              {availableClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {reportType === 'SLIP' && (
            <>
              <div className="space-y-3">
                <label className={`text-[10px] font-black ${isDarkMode ? 'text-slate-500' : 'text-slate-400'} uppercase tracking-widest px-1 flex items-center gap-2`}><Calendar size={12}/> Pilih Bulan</label>
                <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className={`w-full p-5 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-800'} border-2 rounded-2xl font-black text-xs focus:border-indigo-300 outline-none transition-all`} />
              </div>
              <div className="space-y-3">
                <label className={`text-[10px] font-black ${isDarkMode ? 'text-slate-500' : 'text-slate-400'} uppercase tracking-widest px-1 flex items-center gap-2`}><Search size={12}/> Cari Murid</label>
                <input type="text" placeholder="Nama murid..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`w-full p-5 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-800'} border-2 rounded-2xl font-black text-xs focus:border-indigo-300 outline-none transition-all`} />
              </div>
            </>
          )}
        </div>

        {reportType === 'SLIP' ? (
          selectedClassId && (
            <div className={`pt-8 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-50'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Layers size={14} className="text-indigo-500" />
                  <h4 className={`text-[10px] font-black ${isDarkMode ? 'text-white' : 'text-slate-900'} uppercase tracking-widest`}>Cetak Pukal ({selectedStudentIds.length} dipilih)</h4>
                </div>
                <button onClick={toggleSelectAll} className="text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:underline">
                  {selectedStudentIds.length === filteredStudentsInClass.length ? 'Nyahpilih Semua' : 'Pilih Semua'}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button onClick={() => openPreview('BATCH', 'MONTH')} disabled={selectedStudentIds.length === 0} className="py-5 bg-slate-900 text-white rounded-2xl font-black text-[9px] uppercase tracking-[0.15em] flex items-center justify-center gap-3 hover:bg-slate-800 disabled:opacity-30 transition-all shadow-xl">
                  <Printer size={18} /> PREVIEW SLIP BULANAN (PUKAL)
                </button>
                <button onClick={() => openPreview('BATCH', 'YEAR')} disabled={selectedStudentIds.length === 0} className="py-5 bg-indigo-600 text-white rounded-2xl font-black text-[9px] uppercase tracking-[0.15em] flex items-center justify-center gap-3 hover:bg-indigo-700 disabled:opacity-30 transition-all shadow-xl">
                  <Printer size={18} /> PREVIEW SLIP TAHUNAN (PUKAL)
                </button>
              </div>
            </div>
          )
        ) : (
          <div className={`pt-8 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-50'} space-y-6`}>
            <div className="flex items-center gap-2">
              <Layers size={14} className="text-indigo-500" />
              <h4 className={`text-[10px] font-black ${isDarkMode ? 'text-white' : 'text-slate-900'} uppercase tracking-widest`}>Eksport Data Bacaan</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={() => openPreview('BATCH', 'DATA_BACAAN')} 
                disabled={!selectedClassId}
                className="py-5 bg-slate-900 text-white rounded-2xl font-black text-[9px] uppercase tracking-[0.15em] flex items-center justify-center gap-3 hover:bg-slate-800 disabled:opacity-30 transition-all shadow-xl"
              >
                <Printer size={18} /> PRINT DATA BACAAN (KELAS)
              </button>
              <button 
                onClick={() => openPreview('ALL_CLASSES', 'DATA_BACAAN')} 
                className="py-5 bg-indigo-600 text-white rounded-2xl font-black text-[9px] uppercase tracking-[0.15em] flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all shadow-xl"
              >
                <Printer size={18} /> PRINT PUKAL (SEMUA KELAS)
              </button>
            </div>
          </div>
        )}
      </div>

      {reportType === 'SLIP' ? (
        selectedClassId ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredStudentsInClass.map((student: Student) => {
              const studentRecs = records.filter((r: ReadingRecord) => r.studentId === student.ID_MURID);
              const latest = studentRecs[0];
              const hasData = studentRecs.length > 0;
              const isKhatam = studentRecs.some((r: ReadingRecord) => r.isKhatam);
              const isAlQuran = latest?.readingType === 'Al-Quran';
              const isSelected = selectedStudentIds.includes(student.ID_MURID);

              let accentClass = "bg-blue-600";
              let lightBg = isDarkMode ? "bg-blue-500/10" : "bg-blue-50";
              let textClass = isDarkMode ? "text-blue-400" : "text-blue-600";
              
              if (isKhatam) {
                accentClass = "bg-orange-500";
                lightBg = isDarkMode ? "bg-orange-500/10" : "bg-orange-50";
                textClass = isDarkMode ? "text-orange-400" : "text-orange-600";
              } else if (isAlQuran) {
                accentClass = "bg-emerald-600";
                lightBg = isDarkMode ? "bg-emerald-500/10" : "bg-emerald-50";
                textClass = isDarkMode ? "text-emerald-400" : "text-emerald-600";
              }

              return (
                <div key={student.ID_MURID} className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} rounded-[2.5rem] border ${isSelected ? (isDarkMode ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-indigo-500 ring-2 ring-indigo-50') : ''} p-8 flex flex-col gap-6 shadow-sm hover:shadow-md transition-all group relative`}>
                  <div className="absolute top-6 right-6">
                    <input 
                      type="checkbox" 
                      checked={isSelected} 
                      onChange={() => toggleStudentSelection(student.ID_MURID)}
                      className={`w-6 h-6 rounded-lg border-2 ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200'} text-indigo-600 focus:ring-indigo-500 cursor-pointer`}
                    />
                  </div>
                  
                  <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xs shadow-lg transition-transform group-hover:rotate-6 ${hasData ? accentClass : (isDarkMode ? 'bg-slate-800 text-slate-600' : 'bg-slate-200')}`}>
                      {student.ID_MURID.slice(-2)}
                    </div>
                    <div className="min-w-0">
                      <h4 className={`font-black ${isDarkMode ? 'text-white' : 'text-slate-900'} uppercase text-xs truncate pr-8`}>{student.NAMA_MURID}</h4>
                      <p className={`text-[8px] font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'} uppercase tracking-widest mt-1`}>{student.KELAS}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => openPreview(student.ID_MURID, 'MONTH')} disabled={!hasData} className={`flex-1 py-4 ${lightBg} ${textClass} rounded-xl font-black text-[8px] uppercase tracking-widest hover:opacity-80 transition-all disabled:opacity-30 flex items-center justify-center gap-2`}>
                      <Eye size={14} /> Slip Bulan
                    </button>
                    <button onClick={() => openPreview(student.ID_MURID, 'YEAR')} disabled={!hasData} className={`flex-1 py-4 ${isDarkMode ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-slate-900 text-white hover:bg-slate-800'} rounded-xl font-black text-[8px] uppercase tracking-widest transition-all disabled:opacity-30 flex items-center justify-center gap-2`}>
                      <Eye size={14} /> Slip Tahun
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={`py-40 text-center ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} rounded-[4rem] border-2 border-dashed`}>
             <div className={`w-20 h-20 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'} rounded-full flex items-center justify-center mx-auto mb-6`}>
                <LayoutGrid className={isDarkMode ? 'text-slate-700' : 'text-slate-200'} size={32} />
             </div>
             <h3 className={`font-black ${isDarkMode ? 'text-white' : 'text-slate-900'} text-sm uppercase tracking-tight`}>Sila Pilih Kelas Terlebih Dahulu</h3>
             <p className={`text-[10px] font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'} uppercase mt-2 tracking-widest`}>Pilih kelas di bahagian atas untuk menjana fail PDF</p>
          </div>
        )
      ) : (
        selectedClassId ? (
          <div className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} p-6 md:p-10 rounded-[3rem] shadow-xl border overflow-hidden`}>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full border-collapse">
                <thead>
                  <tr className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'} border-b-2`}>
                    <th className={`px-4 py-4 text-left text-[9px] font-black ${isDarkMode ? 'text-slate-500' : 'text-slate-400'} uppercase tracking-widest w-16`}>Bil</th>
                    <th className={`px-4 py-4 text-left text-[9px] font-black ${isDarkMode ? 'text-slate-500' : 'text-slate-400'} uppercase tracking-widest`}>Nama Murid</th>
                    <th className={`px-4 py-4 text-center text-[9px] font-black ${isDarkMode ? 'text-slate-500' : 'text-slate-400'} uppercase tracking-widest`}>Tahap Bacaan</th>
                    <th className={`px-4 py-4 text-center text-[9px] font-black ${isDarkMode ? 'text-slate-500' : 'text-slate-400'} uppercase tracking-widest`}>Khatam</th>
                    <th className={`px-4 py-4 text-center text-[9px] font-black ${isDarkMode ? 'text-slate-500' : 'text-slate-400'} uppercase tracking-widest`}>Kelas</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-50'}`}>
                  {filteredStudentsInClass.map((s, idx) => {
                    const latestRecordsMap = new Map<string, ReadingRecord>();
                    [...records].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()).forEach(r => {
                      latestRecordsMap.set(r.studentId, r);
                    });
                    const lastRec = latestRecordsMap.get(s.ID_MURID);
                    const readingDisplay = lastRec ? (lastRec.readingType === 'Al-Quran' ? `AL-QURAN (J${lastRec.juzuk}, MS${lastRec.page})` : `${lastRec.readingType} (MS${lastRec.page})`) : 'TIADA REKOD';
                    
                    return (
                      <tr key={s.ID_MURID} className={`${isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50/50'} transition-colors`}>
                        <td className={`px-4 py-4 text-[10px] font-black ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>{idx + 1}</td>
                        <td className={`px-4 py-4 text-[10px] font-black ${isDarkMode ? 'text-white' : 'text-slate-900'} uppercase tracking-tight`}>{s.NAMA_MURID}</td>
                        <td className="px-4 py-4 text-center">
                          <span className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest ${lastRec ? (isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600') : (isDarkMode ? 'bg-slate-800 text-slate-600' : 'bg-slate-100 text-slate-400')}`}>
                            {readingDisplay}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest ${lastRec?.isKhatam ? (isDarkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600') : (isDarkMode ? 'bg-slate-800 text-slate-600' : 'bg-slate-100 text-slate-400')}`}>
                            {lastRec?.isKhatam ? 'YA' : 'TIDAK'}
                          </span>
                        </td>
                        <td className={`px-4 py-4 text-center text-[10px] font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-500'} uppercase tracking-widest`}>{s.KELAS}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className={`py-40 text-center ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} rounded-[4rem] border-2 border-dashed`}>
             <div className={`w-20 h-20 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'} rounded-full flex items-center justify-center mx-auto mb-6`}>
                <LayoutGrid className={isDarkMode ? 'text-slate-700' : 'text-slate-200'} size={32} />
             </div>
             <h3 className={`font-black ${isDarkMode ? 'text-white' : 'text-slate-900'} text-sm uppercase tracking-tight`}>Sila Pilih Kelas Terlebih Dahulu</h3>
             <p className={`text-[10px] font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'} uppercase mt-2 tracking-widest`}>Pilih kelas di bahagian atas untuk memaparkan data bacaan</p>
          </div>
        )
      )}
    </div>
  );
};

export default Reports;
