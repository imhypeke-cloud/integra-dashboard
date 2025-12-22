
import React, { useMemo, useState } from 'react';
import { useData } from '../services/DataContext';
import { Status, Section, TitleData } from '../types';
import { Filter, UploadCloud, Search } from 'lucide-react';
import DataImportModal from './DataImportModal';

const GPR: React.FC = () => {
  const { titles, calculateStatus, isAdmin } = useData();
  const [filterSection, setFilterSection] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);

  const filteredTitles = useMemo(() => {
    return titles.filter(t => {
      const status = calculateStatus(t);
      const statusMatch = filterStatus === 'all' || status === filterStatus;
      const sectionMatch = filterSection === 'all' || t.section === filterSection;
      const searchMatch = searchTerm === '' || 
                          t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.id.toLowerCase().includes(searchTerm.toLowerCase());
      return statusMatch && sectionMatch && searchMatch;
    }).sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
  }, [titles, filterStatus, filterSection, searchTerm, calculateStatus]);

  // Determine timeline boundaries
  const { minDate, maxDate, totalDays } = useMemo(() => {
    let min = new Date('2025-05-01').getTime(); // Default min
    let max = new Date('2026-12-31').getTime(); // Default max

    titles.forEach(t => {
      const start = new Date(t.startDate).getTime();
      const end = new Date(t.deadline).getTime();
      if (!isNaN(start) && start < min) min = start;
      if (!isNaN(end) && end > max) max = end;
    });

    // Add padding
    min -= 15 * 24 * 60 * 60 * 1000;
    max += 15 * 24 * 60 * 60 * 1000;

    return { 
      minDate: min, 
      maxDate: max, 
      totalDays: (max - min) / (1000 * 60 * 60 * 24) 
    };
  }, [titles]);

  // Generate Months for Header
  const months = useMemo(() => {
    const result = [];
    const current = new Date(minDate);
    const end = new Date(maxDate);
    
    // Normalize to first day of month
    current.setDate(1);
    
    while (current <= end) {
      const year = current.getFullYear();
      const month = current.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const monthName = current.toLocaleString('ru-RU', { month: 'short' });
      
      result.push({
        label: `${monthName} ${year}`,
        days: daysInMonth,
        widthPercent: (daysInMonth / totalDays) * 100
      });
      current.setMonth(current.getMonth() + 1);
    }
    return result;
  }, [minDate, maxDate, totalDays]);

  // Helper to calculate bar position
  const getBarStyles = (start: string, end: string) => {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const left = ((startTime - minDate) / (1000 * 60 * 60 * 24 * totalDays)) * 100;
    const width = ((endTime - startTime) / (1000 * 60 * 60 * 24 * totalDays)) * 100;
    return { left: `${Math.max(0, left)}%`, width: `${width}%` };
  };

  const getStatusColor = (status: Status) => {
    switch(status) {
      case Status.ON_TRACK: return 'bg-blue-500';
      case Status.RISK: return 'bg-yellow-500';
      case Status.DELAYED: return 'bg-red-500';
      default: return 'bg-slate-400';
    }
  };

  return (
    <div className="p-6 h-screen flex flex-col bg-slate-50 overflow-hidden">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 shrink-0 gap-4">
        <h2 className="text-3xl font-bold text-slate-800">График Производства Работ (ГПР)</h2>
        
        <div className="flex gap-2 items-center flex-wrap">
           {/* Search */}
           <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm">
              <Search size={16} className="text-slate-400"/>
              <input 
                  className="bg-transparent text-sm outline-none text-slate-600 placeholder:text-slate-400 w-32 md:w-48"
                  placeholder="Поиск..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
              />
           </div>

           <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200">
             <Filter size={16} className="text-slate-400"/>
             <select className="bg-transparent text-sm outline-none text-slate-600" value={filterSection} onChange={e => setFilterSection(e.target.value)}>
                <option value="all">Все разделы</option>
                {Object.values(Section).map(s => <option key={s} value={s}>{s}</option>)}
             </select>
           </div>
           
           <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200">
             <Filter size={16} className="text-slate-400"/>
             <select className="bg-transparent text-sm outline-none text-slate-600" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="all">Все статусы</option>
                {Object.values(Status).map(s => <option key={s} value={s}>{s}</option>)}
             </select>
           </div>

           {isAdmin && (
              <button 
                onClick={() => setShowImportModal(true)}
                className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm text-sm"
              >
                <UploadCloud size={18} /> Загрузить ГПР
              </button>
           )}
        </div>
      </div>

      <DataImportModal 
        isOpen={showImportModal} 
        onClose={() => setShowImportModal(false)} 
        defaultImportMode='gpr'
        title="Загрузка Графика (ГПР)"
      />

      {/* Gantt Chart Container */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
        
        {/* Header Row */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-slate-600 text-xs font-bold shrink-0">
           <div className="w-64 p-3 border-r border-slate-200 shrink-0 sticky left-0 bg-slate-50 z-10 shadow-sm">
             Наименование
           </div>
           <div className="flex-1 flex relative overflow-hidden h-10 items-center">
             {months.map((m, idx) => (
               <div key={idx} style={{ width: `${m.widthPercent}%` }} className="text-center border-r border-slate-200 last:border-0 truncate px-1">
                 {m.label}
               </div>
             ))}
           </div>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1 custom-scrollbar">
           {filteredTitles.map((title) => {
             const { left, width } = getBarStyles(title.startDate, title.deadline);
             const status = calculateStatus(title);
             const percent = title.totalVolume > 0 ? (title.completedVolume / title.totalVolume) * 100 : 0;

             return (
               <div key={title.id} className="flex border-b border-slate-100 hover:bg-slate-50 group">
                 {/* Fixed Title Column */}
                 <div className="w-64 p-3 border-r border-slate-200 shrink-0 sticky left-0 bg-white group-hover:bg-slate-50 z-10 text-sm flex flex-col justify-center">
                    <div className="font-medium text-slate-700 truncate" title={title.name}>
                       <span className="font-bold mr-2 text-slate-500">{title.id}</span>
                       {title.name}
                    </div>
                    <div className="text-xs text-slate-400 flex justify-between mt-1">
                      <span>{title.section}</span>
                      <span>{percent.toFixed(0)}%</span>
                    </div>
                 </div>

                 {/* Timeline Column */}
                 <div className="flex-1 relative h-16 min-w-[800px]">
                    {/* Month Grid Lines */}
                    <div className="absolute inset-0 flex pointer-events-none">
                      {months.map((m, idx) => (
                        <div key={idx} style={{ width: `${m.widthPercent}%` }} className="border-r border-slate-100 h-full"></div>
                      ))}
                    </div>

                    {/* Progress Bar */}
                    <div 
                      className={`absolute top-1/2 -translate-y-1/2 h-6 rounded-md shadow-sm ${getStatusColor(status)} bg-opacity-20 border border-opacity-50 flex items-center px-2 text-xs text-slate-700 whitespace-nowrap overflow-hidden transition-all duration-300 hover:h-8 hover:z-20 cursor-pointer`}
                      style={{ left, width, borderColor: 'currentColor' }}
                      title={`${new Date(title.startDate).toLocaleDateString()} - ${new Date(title.deadline).toLocaleDateString()}`}
                    >
                      {/* Inner Fill for Actual Progress */}
                      <div 
                         className={`absolute top-0 left-0 h-full ${getStatusColor(status)} opacity-80`}
                         style={{ width: `${Math.min(percent, 100)}%` }}
                      ></div>
                      
                      {/* Label on top */}
                      <span className="relative z-10 mix-blend-multiply font-semibold px-1">{percent.toFixed(0)}%</span>
                    </div>
                 </div>
               </div>
             );
           })}
        </div>
      </div>
    </div>
  );
};

export default GPR;
