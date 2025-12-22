
import React, { useState, useMemo } from 'react';
import { useData } from '../services/DataContext';
import { Calendar, Search, Save, ChevronDown, CheckCircle2, ChevronLeft, ChevronRight, Plus, X, Trash2, Printer } from 'lucide-react';
import { WeeklyRecord, TitleData } from '../types';

const WeeklyGPR: React.FC = () => {
  const { titles, weeklyRecords, activeWeek, setActiveWeek, updateWeeklyRecord, deleteWeeklyRecord, isAdmin } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  // All groups collapsed by default as requested
  const [expandedManagers, setExpandedManagers] = useState<Set<string>>(new Set());
  const [isAddingTask, setIsAddingTask] = useState<string | null>(null); 
  
  const [newTask, setNewTask] = useState<Partial<WeeklyRecord>>({});

  // Navigation Logic for Week string "DD.MM - DD.MM"
  const navigateWeek = (direction: number) => {
    try {
        const parts = activeWeek.split(' - ');
        if (parts.length !== 2) return;

        const parseDate = (str: string) => {
            const [d, m] = str.split('.').map(Number);
            const date = new Date();
            // We use a fixed year to avoid issues with wrap-around, 
            // but for a real app we might want to store actual Date objects.
            date.setMonth(m - 1);
            date.setDate(d);
            return date;
        };

        const startDate = parseDate(parts[0]);
        const endDate = parseDate(parts[1]);

        startDate.setDate(startDate.getDate() + (direction * 7));
        endDate.setDate(endDate.getDate() + (direction * 7));

        const formatDate = (d: Date) => {
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            return `${day}.${month}`;
        };

        setActiveWeek(`${formatDate(startDate)} - ${formatDate(endDate)}`);
        // Optionally clear expanded state when changing weeks
        setExpandedManagers(new Set());
    } catch (e) {
        console.error("Failed to parse week string", e);
    }
  };

  const currentWeekData = useMemo(() => {
    return weeklyRecords.filter(r => r.weekId === activeWeek);
  }, [weeklyRecords, activeWeek]);

  const groupedData = useMemo(() => {
    const groups: Record<string, WeeklyRecord[]> = {};

    currentWeekData.forEach(record => {
       let manager = record.manager;
       if (!manager) {
           const parentTitle = titles.find(t => t.id === record.titleId);
           manager = parentTitle?.manager || 'Не назначен';
       }
       
       if (searchTerm) {
           const searchLower = searchTerm.toLowerCase();
           if (!record.taskName.toLowerCase().includes(searchLower) && 
               !record.titleId.toLowerCase().includes(searchLower) &&
               !manager.toLowerCase().includes(searchLower)) {
               return;
           }
       }

       if (!groups[manager]) groups[manager] = [];
       groups[manager].push(record);
    });

    return groups;
  }, [currentWeekData, titles, searchTerm]);

  const sortedManagers = useMemo(() => Object.keys(groupedData).sort(), [groupedData]);

  const toggleManager = (mgr: string) => {
    setExpandedManagers(prev => {
        const next = new Set(prev);
        if (next.has(mgr)) next.delete(mgr);
        else next.add(mgr);
        return next;
    });
  };

  const handleUpdate = (record: WeeklyRecord, field: keyof WeeklyRecord, value: any) => {
      const updated = { ...record, [field]: value };
      updateWeeklyRecord(updated);
  };

  const handleAddNewTask = (manager: string) => {
      if (!newTask.titleId || !newTask.taskName) return;
      
      const record: WeeklyRecord = {
          weekId: activeWeek,
          titleId: newTask.titleId,
          taskName: newTask.taskName,
          unit: newTask.unit || 'ед',
          plan: Number(newTask.plan) || 0,
          fact: Number(newTask.fact) || 0,
          problems: newTask.problems || '',
          manager: manager 
      };
      
      updateWeeklyRecord(record);
      setNewTask({});
      setIsAddingTask(null);
  };

  const handleDelete = (record: WeeklyRecord) => {
      if (confirm('Удалить эту запись из плана?')) {
          deleteWeeklyRecord(record.weekId, record.titleId, record.taskName);
      }
  };

  const getDeltaColor = (plan: number, fact: number) => {
      const delta = fact - plan;
      if (delta >= 0) return 'text-green-700 bg-green-100 font-bold';
      return 'text-red-600 bg-red-100 font-bold';
  };

  return (
    <div className="p-6 min-h-screen bg-slate-50 font-sans">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
         <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
               <Calendar className="text-blue-600" /> Недельный план
            </h2>
            <p className="text-slate-500 text-sm mt-1">Детальный суточно-недельный график работ</p>
         </div>

         {/* Week Navigator */}
         <div className="flex items-center gap-4 bg-slate-100 p-2 rounded-xl border border-slate-200">
            <button 
                onClick={() => navigateWeek(-1)}
                className="p-2 hover:bg-white rounded-lg text-slate-500 transition-all shadow-sm"
                title="Предыдущая неделя"
            >
                <ChevronLeft size={20}/>
            </button>
            <div className="flex flex-col items-center px-4">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Период</span>
                <input 
                    className="bg-transparent text-center font-bold text-lg text-slate-800 outline-none w-40 placeholder:text-slate-300"
                    placeholder="ДД.ММ - ДД.ММ"
                    value={activeWeek}
                    onChange={(e) => setActiveWeek(e.target.value)}
                />
            </div>
            <button 
                onClick={() => navigateWeek(1)}
                className="p-2 hover:bg-white rounded-lg text-slate-500 transition-all shadow-sm"
                title="Следующая неделя"
            >
                <ChevronRight size={20}/>
            </button>
         </div>

         <div className="flex gap-2">
            <div className="relative">
                <Search size={18} className="absolute left-3 top-3 text-slate-400"/>
                <input 
                    className="pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm w-64 outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Поиск по работам..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
            <button 
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors font-medium text-sm"
                onClick={() => window.print()}
            >
                <Printer size={18}/> Печать
            </button>
         </div>
      </div>

      {/* CONTENT AREA */}
      <div className="space-y-8 pb-20">
         {sortedManagers.length === 0 && (
             <div className="text-center py-20 text-slate-400 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                 Нет данных за период {activeWeek}. <br/> 
                 <span className="text-sm">Используйте стрелки сверху или добавьте новую запись.</span>
                 {isAdmin && (
                    <div className="mt-4">
                        <button 
                            onClick={() => { setIsAddingTask('Новый руководитель'); setNewTask({ plan: 0, fact: 0, problems: '' }); }}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Создать запись
                        </button>
                    </div>
                 )}
             </div>
         )}

         {sortedManagers.map(manager => {
             const records = groupedData[manager];
             const isExpanded = expandedManagers.has(manager);
             
             return (
                 <div key={manager} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in print:break-inside-avoid">
                     {/* Manager Header */}
                     <div 
                        onClick={() => toggleManager(manager)}
                        className="bg-slate-50 px-6 py-4 flex justify-between items-center cursor-pointer hover:bg-slate-100 transition-colors border-b border-slate-200"
                     >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-blue-200 shadow-lg">
                                {manager.charAt(0)}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">{manager}</h3>
                                <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">Ответственный</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-slate-500 font-medium">{records.length} позиций</span>
                            <ChevronDown size={20} className={`text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}/>
                        </div>
                     </div>

                     {isExpanded && (
                         <div className="p-0 overflow-x-auto">
                             <table className="w-full text-left border-collapse">
                                 <thead>
                                     <tr className="bg-white text-xs text-slate-400 uppercase font-extrabold tracking-wider border-b border-slate-100">
                                         <th className="px-6 py-4 w-16 text-center">№</th>
                                         <th className="px-6 py-4 w-32">Титул</th>
                                         <th className="px-6 py-4">Наименование работ</th>
                                         <th className="px-6 py-4 w-24 text-center">Ед. изм.</th>
                                         <th className="px-6 py-4 w-32 text-center text-blue-600">План</th>
                                         <th className="px-6 py-4 w-32 text-center text-green-600">Факт</th>
                                         <th className="px-6 py-4 w-32 text-center">Отклонение</th>
                                         <th className="px-6 py-4 w-1/4">Проблемные вопросы</th>
                                         {isAdmin && <th className="px-6 py-4 w-16"></th>}
                                     </tr>
                                 </thead>
                                 <tbody className="text-sm font-medium">
                                     {records.map((row, idx) => (
                                         <tr key={`${row.titleId}_${row.taskName}_${idx}`} className="hover:bg-slate-50 transition-colors group border-b border-slate-50 last:border-0">
                                             <td className="px-6 py-4 text-center text-slate-400 font-mono">{idx + 1}</td>
                                             <td className="px-6 py-4 text-slate-800 font-bold">{row.titleId}</td>
                                             <td className="px-6 py-4 text-slate-600">
                                                 {isAdmin ? (
                                                     <input 
                                                        className="w-full bg-transparent border-b border-transparent focus:border-blue-300 outline-none transition-colors"
                                                        value={row.taskName}
                                                        onChange={(e) => handleUpdate(row, 'taskName', e.target.value)}
                                                     />
                                                 ) : row.taskName}
                                             </td>
                                             <td className="px-6 py-4 text-center text-slate-500">{row.unit}</td>
                                             
                                             <td className="px-6 py-4 text-center bg-blue-50/20">
                                                 <input 
                                                    type="number"
                                                    className="w-20 text-center font-bold text-blue-700 bg-transparent border border-transparent hover:border-blue-300 rounded focus:bg-white focus:border-blue-500 outline-none transition-all"
                                                    value={row.plan}
                                                    onChange={(e) => handleUpdate(row, 'plan', Number(e.target.value))}
                                                    disabled={!isAdmin}
                                                 />
                                             </td>

                                             <td className="px-6 py-4 text-center bg-green-50/20">
                                                 <input 
                                                    type="number"
                                                    className="w-20 text-center font-bold text-green-700 bg-transparent border border-transparent hover:border-blue-300 rounded focus:bg-white focus:border-blue-500 outline-none transition-all"
                                                    value={row.fact}
                                                    onChange={(e) => handleUpdate(row, 'fact', Number(e.target.value))}
                                                    disabled={!isAdmin}
                                                 />
                                             </td>

                                             <td className="px-6 py-4 text-center">
                                                 <span className={`px-3 py-1 rounded-lg text-xs ${getDeltaColor(row.plan, row.fact)}`}>
                                                     {Number((row.fact - row.plan).toFixed(2)) > 0 ? '+' : ''}{Number((row.fact - row.plan).toFixed(2))}
                                                 </span>
                                             </td>

                                             <td className="px-6 py-4">
                                                 <input 
                                                    className={`w-full text-xs px-3 py-1.5 rounded-lg border transition-all ${
                                                        row.problems 
                                                            ? 'bg-red-50 border-red-200 text-red-700 font-semibold' 
                                                            : 'bg-transparent border-transparent hover:border-slate-200 text-slate-500'
                                                    }`}
                                                    value={row.problems}
                                                    placeholder="Нет замечаний"
                                                    onChange={(e) => handleUpdate(row, 'problems', e.target.value)}
                                                    disabled={!isAdmin}
                                                 />
                                             </td>

                                             {isAdmin && (
                                                 <td className="px-6 py-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                                                     <button onClick={() => handleDelete(row)} className="text-slate-300 hover:text-red-500 transition-colors">
                                                         <Trash2 size={16}/>
                                                     </button>
                                                 </td>
                                             )}
                                         </tr>
                                     ))}

                                     {isAddingTask === manager && (
                                         <tr className="bg-blue-50/30 animate-fade-in border-l-4 border-blue-500">
                                             <td className="px-6 py-4 text-center text-blue-500 font-bold">+</td>
                                             <td className="px-6 py-4">
                                                 <input 
                                                    className="w-full p-2 bg-white border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 outline-none shadow-sm" 
                                                    placeholder="№ Титула"
                                                    value={newTask.titleId || ''} 
                                                    onChange={e => setNewTask({...newTask, titleId: e.target.value})}
                                                    autoFocus
                                                 />
                                             </td>
                                             <td className="px-6 py-4">
                                                 <input 
                                                    className="w-full p-2 bg-white border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 outline-none shadow-sm" 
                                                    placeholder="Описание работ..."
                                                    value={newTask.taskName || ''} 
                                                    onChange={e => setNewTask({...newTask, taskName: e.target.value})}
                                                 />
                                             </td>
                                             <td className="px-6 py-4">
                                                 <input 
                                                    className="w-full p-2 bg-white border border-blue-200 rounded-lg text-sm text-center focus:ring-2 focus:ring-blue-400 outline-none shadow-sm" 
                                                    placeholder="ед."
                                                    value={newTask.unit || ''} 
                                                    onChange={e => setNewTask({...newTask, unit: e.target.value})}
                                                 />
                                             </td>
                                             <td className="px-6 py-4"><input type="number" className="w-full p-2 bg-white border border-blue-200 rounded-lg text-sm text-center font-bold text-blue-600 focus:ring-2 focus:ring-blue-400 outline-none shadow-sm" placeholder="0" value={newTask.plan} onChange={e => setNewTask({...newTask, plan: Number(e.target.value)})}/></td>
                                             <td className="px-6 py-4"><input type="number" className="w-full p-2 bg-white border border-blue-200 rounded-lg text-sm text-center font-bold text-green-600 focus:ring-2 focus:ring-blue-400 outline-none shadow-sm" placeholder="0" value={newTask.fact} onChange={e => setNewTask({...newTask, fact: Number(e.target.value)})}/></td>
                                             <td className="px-6 py-4 text-center text-slate-400">-</td>
                                             <td className="px-6 py-4">
                                                 <div className="flex gap-2">
                                                     <input 
                                                        className="w-full p-2 bg-white border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 outline-none shadow-sm" 
                                                        placeholder="Проблемы..."
                                                        value={newTask.problems || ''} 
                                                        onChange={e => setNewTask({...newTask, problems: e.target.value})}
                                                     />
                                                     <button onClick={() => handleAddNewTask(manager)} className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 shadow-sm transition-colors"><Save size={16}/></button>
                                                     <button onClick={() => setIsAddingTask(null)} className="bg-white text-slate-500 border border-slate-200 p-2 rounded-lg hover:bg-slate-100 shadow-sm transition-colors"><X size={16}/></button>
                                                 </div>
                                             </td>
                                             <td></td>
                                         </tr>
                                     )}
                                 </tbody>
                             </table>
                             
                             {isAdmin && !isAddingTask && (
                                 <button 
                                    onClick={() => { setIsAddingTask(manager); setNewTask({ plan: 0, fact: 0, problems: '' }); }}
                                    className="w-full py-3 bg-slate-50 hover:bg-blue-50 text-blue-600 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border-t border-slate-100 transition-colors"
                                 >
                                     <Plus size={16}/> Добавить позицию для {manager}
                                 </button>
                             )}
                         </div>
                     )}
                 </div>
             )
         })}
      </div>
    </div>
  );
};

export default WeeklyGPR;
