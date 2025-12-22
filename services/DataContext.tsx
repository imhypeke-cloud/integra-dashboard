
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { TitleData, WorkforceData, MachineryData, Status, WeeklyRecord } from '../types';
import { INITIAL_TITLES, INITIAL_WORKFORCE, INITIAL_MACHINERY, INITIAL_SECTIONS, INITIAL_WEEKLY_RECORDS } from '../constants';

interface DataContextType {
  titles: TitleData[];
  sections: TitleData[]; 
  workforce: WorkforceData[];
  machinery: MachineryData[];
  
  // Weekly Logic
  weeklyRecords: WeeklyRecord[];
  activeWeek: string;
  setActiveWeek: (week: string) => void;
  updateWeeklyRecord: (record: WeeklyRecord) => void;
  deleteWeeklyRecord: (weekId: string, titleId: string, taskName: string) => void;
  getProblemsForActiveWeek: () => { id: string; name: string; problem: string; manager: string }[];

  isAdmin: boolean;
  hiddenSections: string[];
  login: (password: string) => boolean;
  logout: () => void;
  toggleSection: (path: string) => void;
  
  addTitle: (title: TitleData) => void;
  updateTitle: (id: string, updates: Partial<TitleData>) => void;
  deleteTitle: (id: string) => void;

  addSection: (section: TitleData) => void;
  updateSection: (id: string, section: string, updates: Partial<TitleData>) => void;
  deleteSection: (id: string, section: string) => void;

  addWorkforce: (person: WorkforceData) => void;
  updateWorkforce: (id: string, updates: Partial<WorkforceData>) => void;
  deleteWorkforce: (id: string) => void;

  addMachinery: (machine: MachineryData) => void;
  updateMachinery: (id: string, updates: Partial<MachineryData>) => void;
  deleteMachinery: (id: string) => void;

  calculateStatus: (title: TitleData) => Status;
  importData: (data: any) => void;
  renameSubcontractor: (oldName: string, newName: string) => void;
  deleteSubcontractor: (name: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [titles, setTitles] = useState<TitleData[]>(INITIAL_TITLES);
  const [sections, setSections] = useState<TitleData[]>(INITIAL_SECTIONS);
  const [workforce, setWorkforce] = useState<WorkforceData[]>(INITIAL_WORKFORCE);
  const [machinery, setMachinery] = useState<MachineryData[]>(INITIAL_MACHINERY);
  const [hiddenSections, setHiddenSections] = useState<string[]>([]);
  
  // Weekly GPR State
  const [activeWeek, setActiveWeek] = useState<string>('08.12 - 14.12');
  const [weeklyRecords, setWeeklyRecords] = useState<WeeklyRecord[]>(INITIAL_WEEKLY_RECORDS);

  const login = (password: string) => {
    if (password === 'admin') {
      setIsAdmin(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAdmin(false);
  };

  const toggleSection = (path: string) => {
    setHiddenSections(prev => 
      prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]
    );
  };

  const calculateStatus = (title: TitleData): Status => {
    if (!title.startDate || !title.deadline) return Status.NOT_STARTED;
    const now = new Date();
    const deadline = new Date(title.deadline);
    const start = new Date(title.startDate);
    const progress = title.totalVolume > 0 ? title.completedVolume / title.totalVolume : 0;

    if (progress >= 1) return Status.COMPLETED;
    if (title.completedVolume === 0 && now < start) return Status.NOT_STARTED;
    if (now > deadline && progress < 1) return Status.DELAYED;
    
    const daysLeft = (deadline.getTime() - now.getTime()) / (1000 * 3600 * 24);
    if (progress < 0.8 && daysLeft < 30 && daysLeft > 0) return Status.RISK;

    return Status.ON_TRACK;
  };

  // --- Weekly Record Management ---
  const updateWeeklyRecord = (newRecord: WeeklyRecord) => {
    setWeeklyRecords(prev => {
        // Remove existing record if matches (upsert logic)
        const filtered = prev.filter(r => 
            !(r.weekId === newRecord.weekId && r.titleId === newRecord.titleId && r.taskName === newRecord.taskName)
        );
        return [...filtered, newRecord];
    });
  };

  const deleteWeeklyRecord = (weekId: string, titleId: string, taskName: string) => {
      setWeeklyRecords(prev => prev.filter(r => 
          !(r.weekId === weekId && r.titleId === titleId && r.taskName === taskName)
      ));
  };

  const getProblemsForActiveWeek = () => {
      return weeklyRecords
          .filter(r => r.weekId === activeWeek && r.problems && r.problems.trim().length > 0)
          .map(r => {
              // Find manager from main titles list IF not in weekly record
              let manager = r.manager;
              if (!manager) {
                  const parentTitle = titles.find(t => t.id === r.titleId);
                  manager = parentTitle?.manager || 'Не назначен';
              }
              
              return {
                  id: r.titleId,
                  name: r.taskName,
                  problem: r.problems,
                  manager: manager || 'Не назначен'
              };
          });
  };

  // --- CRUD for TITLES ---
  const addTitle = (title: TitleData) => setTitles([...titles, title]);
  const updateTitle = (id: string, updates: Partial<TitleData>) => {
    setTitles(titles.map(t => t.id === id ? { ...t, ...updates } : t));
  };
  const deleteTitle = (id: string) => setTitles(titles.filter(t => t.id !== id));

  // --- CRUD for SECTIONS ---
  const addSection = (section: TitleData) => setSections([...sections, section]);
  const updateSection = (id: string, sectionName: string, updates: Partial<TitleData>) => {
    setSections(prev => prev.map(s => 
      (s.id === id && s.section === sectionName) ? { ...s, ...updates } : s
    ));
  };
  const deleteSection = (id: string, sectionName: string) => {
    setSections(prev => prev.filter(s => !(s.id === id && s.section === sectionName)));
  };

  // --- CRUD for RESOURCES ---
  const addWorkforce = (person: WorkforceData) => setWorkforce([...workforce, person]);
  const updateWorkforce = (id: string, updates: Partial<WorkforceData>) => {
    setWorkforce(workforce.map(w => w.id === id ? { ...w, ...updates } : w));
  };
  const deleteWorkforce = (id: string) => setWorkforce(workforce.filter(w => w.id !== id));

  // --- CRUD for MACHINERY ---
  const addMachinery = (machine: MachineryData) => setMachinery([...machinery, machine]);
  const updateMachinery = (id: string, updates: Partial<MachineryData>) => {
    setMachinery(machinery.map(m => m.id === id ? { ...m, ...updates } : m));
  };
  const deleteMachinery = (id: string) => setMachinery(machinery.filter(m => m.id !== id));

  const renameSubcontractor = (oldName: string, newName: string) => {
    if (!oldName || !newName) return;
    setTitles(prev => prev.map(t => t.subcontractor === oldName ? { ...t, subcontractor: newName } : t));
    setWorkforce(prev => prev.map(w => w.organization === oldName ? { ...w, organization: newName } : w));
  };

  const deleteSubcontractor = (name: string) => {
    setTitles(prev => prev.map(t => t.subcontractor === name ? { ...t, subcontractor: '' } : t));
    setWorkforce(prev => prev.filter(w => w.organization !== name));
  };

  const importData = (data: any) => {
    if (data.titles && Array.isArray(data.titles)) setTitles(data.titles);
    if (data.sections && Array.isArray(data.sections)) setSections(data.sections);
    if (data.workforce && Array.isArray(data.workforce)) setWorkforce(data.workforce);
    if (data.machinery && Array.isArray(data.machinery)) setMachinery(data.machinery);
    if (data.weeklyRecords && Array.isArray(data.weeklyRecords)) setWeeklyRecords(data.weeklyRecords);
  };

  return (
    <DataContext.Provider value={{
      titles, sections, workforce, machinery, isAdmin, hiddenSections, login, logout, toggleSection,
      activeWeek, setActiveWeek, weeklyRecords, updateWeeklyRecord, deleteWeeklyRecord, getProblemsForActiveWeek,
      addTitle, updateTitle, deleteTitle,
      addSection, updateSection, deleteSection,
      addWorkforce, updateWorkforce, deleteWorkforce,
      addMachinery, updateMachinery, deleteMachinery,
      calculateStatus, importData, renameSubcontractor, deleteSubcontractor
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within DataProvider");
  return context;
};
