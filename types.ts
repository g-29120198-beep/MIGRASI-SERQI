
export type ReadingType = 'Iqra 1' | 'Iqra 2' | 'Iqra 3' | 'Iqra 4' | 'Iqra 5' | 'Iqra 6' | 'Al-Quran';
export type ReadingStatus = 'LANCAR' | 'ULANG SEMULA' | 'TIDAK DINYATAKAN';

export interface Student {
  ID_MURID: string;      // Format M0001
  NAMA_MURID: string;
  KELAS: string;
  TAHAP: number;         // Tahun 1-6
  STATUS_MURID: 'AKTIF' | 'TIDAK_AKTIF'; 
}

export interface ReadingRecord {
  id: string;
  studentId: string;     
  studentName: string; 
  className: string;   
  readingType: ReadingType;
  readingStatus?: ReadingStatus;
  page: string;
  juzuk?: number;
  isKhatam: boolean;
  timestamp: string;
  teacherId: string;
}

export interface ClassOption {
  id: string;
  name: string;
  grade: number;
}

export interface CloudConfig {
  isEnabled: boolean;
  projectUrl: string;
  appUrl?: string;
  apiKey: string;
  lastSync: string | null;
}
