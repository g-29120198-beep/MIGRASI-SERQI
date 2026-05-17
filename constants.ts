
import { ClassOption, ReadingType, Student } from './types';

// Senarai ini hanya sebagai 'Template' atau 'Fallback' jika data kosong
export const CLASSES: ClassOption[] = [
  { id: '1A', name: '1 Al-Farabi', grade: 1 },
  { id: '1B', name: '1 Al-Khawarizmi', grade: 1 },
];

export const READING_TYPES: ReadingType[] = [
  'Iqra 1', 'Iqra 2', 'Iqra 3', 'Iqra 4', 'Iqra 5', 'Iqra 6', 'Al-Quran'
];

export const MOCK_STUDENTS: Student[] = []; // Biarkan kosong supaya user boleh import data sendiri
