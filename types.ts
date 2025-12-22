
export enum Status {
  ON_TRACK = 'В графике',
  RISK = 'Риск',
  DELAYED = 'Отставание',
  COMPLETED = 'Завершено',
  NOT_STARTED = 'Не начато'
}

export enum Section {
  KZH = 'КЖ',
  KZH2 = 'КЖ2',
  KM = 'КМ',
  AR = 'АР',
  TX = 'ТХ',
  VK = 'ВК',
  OV = 'ОВ',
  EM = 'ЭМ',
  ATX = 'АТХ',
  NETWORKS = 'Сети',
  OTHER = 'Прочее',
  TM = 'ТМ',
  GP = 'ГТ',
  AS = 'АС',
  ES = 'ЭС',
  SPO = 'СПО',
  NEO = 'НЭО',
  EHZ = 'ЭХЗ',
  GS = 'ГС',
  AGPT = 'АГПТ',
  GSN = 'ГСН',
  SO = 'СЭО',
  VKTX = 'ВК.ТХ',
  GO = 'ГО',
  NVK = 'НВК',
  TK = 'ТК'
}

export interface WeeklyRecord {
  weekId: string; // e.g., "08.12 - 14.12"
  titleId: string; // Links to TitleData.id
  taskName: string; // Specific task description for this week
  unit: string;
  plan: number;
  fact: number;
  problems: string;
  manager?: string; // Optional override for grouping, otherwise taken from Title
}

export interface TitleData {
  id: string;
  name: string;
  section: Section | string;
  totalVolume: number;
  completedVolume: number;
  unit?: string;
  rdDate?: string;
  startDate: string;
  deadline: string;
  duration?: number;
  manager: string;
  subcontractor: string;
  comment: string;
  
  // Legacy fields kept for compatibility
  targetWeek?: string; 
  weeklyPlan?: number;
  weeklyFact?: number;
  weeklyAnalysis?: string; 
  weeklyProblems?: string; 
  weeklyComment?: string; 
}

export interface WorkforceData {
  id: string;
  organization: string;
  role: string;
  count: number;
  type: 'ИТР' | 'Рабочие';
}

export interface MachineryData {
  id: string;
  name: string;
  count: number;
  location: string;
  notes: string;
}

export interface MapObject {
  id: string;
  type: 'rect' | 'circle' | 'poly';
  x: number;
  y: number;
  width?: number;
  height?: number;
  r?: number;
  points?: string;
  rotation?: number;
}
