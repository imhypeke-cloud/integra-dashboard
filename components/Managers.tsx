
import React, { useState, useMemo } from 'react';
import { useData } from '../services/DataContext';
import { Briefcase, Filter, ChevronRight, BarChart2, Search } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { Status, Section } from '../types';

const Managers: React.FC = () => {
  const { titles, calculateStatus } = useData();
  const [filterManager, setFilterManager] = useState<string>('all');
  const [filterSection, setFilterSection] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // 1. First, filter the titles based on global filters
  const filteredTitles = useMemo(() => {
    return titles.filter(t => {
       const status = calculateStatus(t);
       const statusMatch = filterStatus === 'all' || status === filterStatus;
       const sectionMatch = filterSection === 'all' || t.section === filterSection;
       const searchMatch = searchTerm === '' || 
                           t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           t.id.toLowerCase().includes(searchTerm.toLowerCase());
       return statusMatch && sectionMatch && searchMatch;
    });
  }, [titles, filterStatus, filterSection, searchTerm, calculateStatus]);

  // 2. Aggregate logic based on FILTERED titles
  const managersData = useMemo(() => {
    const map: Record<string, { 
      name: string; 
      count: number; 
      totalVol: number; 
      doneVol: number; 
      statusCounts: Record<Status, number>
      titles: typeof titles;
    }> = {};

    filteredTitles.forEach(t => {
      const mgr = t.manager && t.manager.trim() !== '' ? t.manager : 'Не назначен';
      if (!map[mgr]) {
        map[mgr] = { 
          name: mgr, 
          count: 0, 
          totalVol: 0, 
          doneVol: 0, 
          statusCounts: { 
            [Status.ON_TRACK]: 0, 
            [Status.RISK]: 0, 
            [Status.DELAYED]: 0,
            [Status.COMPLETED]: 0,
            [Status.NOT_STARTED]: 0
          },
          titles: []
        };
      }
      
      const st = calculateStatus(t);
      map[mgr].count++;
      map[mgr].totalVol += t.totalVolume;
      map[mgr].doneVol += t.completedVolume;
      map[mgr].statusCounts[st]++;
      map[mgr].titles.push(t);
    });

    return Object.values(map);
  }, [filteredTitles, calculateStatus]);

  // Chart Data Preparation
  const chartData = managersData.map(m => ({
    name: m.name.split(' ')[0], // Short name for X-axis
    fullName: m.name,
    progress: m.totalVol > 0 ? (m.doneVol / m.totalVol) * 100 : 0,
    count: m.count
  })).sort((a, b) => b.progress - a.progress);

  // Active Manager selection (dependent on existing managers in the filtered set)
  const activeManager = useMemo(() => {
    return filterManager === 'all' ? null : managersData.find(m => m.name === filterManager);
  }, [filterManager, managersData]);

  const displayedManagers = filterManager === 'all' ? managersData : (activeManager ? [activeManager] : []);

  const getStatusColor = (status: Status) => {
    switch (status) {
      case Status.ON_TRACK: return 'bg-green-100 text-green-700';
      case Status.RISK: return 'bg-yellow-100 text-yellow-700';
      case Status.DELAYED: return 'bg-red-100 text-red-700';
      case Status.COMPLETED: return 'bg-slate-100 text-slate-700';
      default: return 'bg-blue-50 text-blue-600';
    }
  };

  return (
    <div className="p-6 min-h-screen bg-slate-50">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4">
        <h2 className="text-3xl font-bold text-slate-800">Руководители проектов</h2>
        
        <div className="flex items-center gap-2 flex-wrap">
           {/* Search */}
           <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm">
             <Search size={16} className="text-slate-400"/>
             <input 
                 className="bg-transparent text-sm outline-none text-slate-600 placeholder:text-slate-400 w-32 md:w-48"
                 placeholder="Поиск титула..."
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
             />
           </div>

           {/* Section Filter */}
           <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200">
             <Filter size={16} className="text-slate-400"/>
             <select className="bg-transparent text-sm outline-none text-slate-600" value={filterSection} onChange={e => setFilterSection(e.target.value)}>
                <option value="all">Все разделы</option>
                {Object.values(Section).map(s => <option key={s} value={s}>{s}</option>)}
             </select>
           </div>
           
           {/* Status Filter */}
           <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200">
             <Filter size={16} className="text-slate-400"/>
             <select className="bg-transparent text-sm outline-none text-slate-600" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="all">Все статусы</option>
                {Object.values(Status).map(s => <option key={s} value={s}>{s}</option>)}
             </select>
           </div>

           {/* Manager Filter */}
           <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm">
              <Filter size={16} className="text-slate-400"/>
              <select 
                className="bg-transparent text-sm outline-none text-slate-600 min-w-[200px]"
                value={filterManager} 
                onChange={e => setFilterManager(e.target.value)}
              >
                 <option value="all">Все руководители</option>
                 {/* Map over ALL titles managers to populate dropdown even if filtered out currently? No, better show available. */}
                 {/* Actually, let's show all managers present in the filtered set + the current selection if hidden */}
                 {managersData.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
              </select>
           </div>
        </div>
      </div>

      {/* Charts Section - Only show in 'All' view or if specifically requested */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
         <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
               <BarChart2 size={20}/> Прогресс выполнения (Физический объем по фильтру)
            </h3>
            <div className="h-64">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0"/>
                    <XAxis dataKey="name" stroke="#94a3b8" tick={{fontSize: 12}} />
                    <YAxis stroke="#94a3b8" unit="%" domain={[0, 100]} />
                    <Tooltip 
                      cursor={{fill: '#f8fafc'}}
                      contentStyle={{borderRadius: '8px', border: '1px solid #e2e8f0'}}
                      formatter={(val: number) => [`${val.toFixed(1)}%`, 'Прогресс']}
                    />
                    <Bar dataKey="progress" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.progress > 80 ? '#22c55e' : entry.progress > 40 ? '#3b82f6' : '#f59e0b'} />
                      ))}
                    </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Summary Card */}
         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-center">
            {activeManager ? (
               <div className="text-center">
                  <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                     <Briefcase size={32}/>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">{activeManager.name}</h3>
                  <p className="text-slate-500 mb-4">{activeManager.count} Титулов (отобрано)</p>
                  <div className="text-4xl font-bold text-slate-800 mb-1">
                     {activeManager.totalVol > 0 ? ((activeManager.doneVol / activeManager.totalVol)*100).toFixed(1) : 0}%
                  </div>
                  <p className="text-xs text-slate-400">Общий прогресс выборки</p>
               </div>
            ) : (
               <div className="text-center text-slate-500">
                  <Briefcase size={48} className="mx-auto mb-4 opacity-20"/>
                  <p>Выберите конкретного руководителя для просмотра досье</p>
               </div>
            )}
         </div>
      </div>

      {/* Detailed List */}
      <div className="space-y-6">
        {displayedManagers.length === 0 && (
           <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
              Данные не найдены по заданным фильтрам.
           </div>
        )}

        {displayedManagers.map((mgr) => (
          <div key={mgr.name} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold">
                      {mgr.name.charAt(0)}
                   </div>
                   <div>
                      <h3 className="font-bold text-slate-800">{mgr.name}</h3>
                      <div className="flex gap-3 text-xs mt-1">
                         <span className="text-slate-500">Всего: {mgr.count}</span>
                         <span className="text-red-500 font-medium">Просрочено: {mgr.statusCounts[Status.DELAYED]}</span>
                         <span className="text-green-600 font-medium">В графике: {mgr.statusCounts[Status.ON_TRACK]}</span>
                      </div>
                   </div>
                </div>
                <div className="hidden md:block w-32">
                   <div className="text-right text-xs font-bold text-slate-700 mb-1">
                      {mgr.totalVol > 0 ? ((mgr.doneVol/mgr.totalVol)*100).toFixed(0) : 0}% Вып.
                   </div>
                   <div className="w-full bg-slate-200 rounded-full h-1.5">
                      <div className="bg-blue-600 h-1.5 rounded-full" style={{width: `${mgr.totalVol > 0 ? (mgr.doneVol/mgr.totalVol)*100 : 0}%`}}></div>
                   </div>
                </div>
             </div>
             
             <div className="p-0">
               <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                     <tr>
                        <th className="px-5 py-3 font-semibold">ID</th>
                        <th className="px-5 py-3 font-semibold">Наименование</th>
                        <th className="px-5 py-3 font-semibold text-right">Объем</th>
                        <th className="px-5 py-3 font-semibold text-right">Прогресс</th>
                        <th className="px-5 py-3 font-semibold">Статус</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {mgr.titles.map(t => {
                        const pct = t.totalVolume > 0 ? (t.completedVolume/t.totalVolume)*100 : 0;
                        const status = calculateStatus(t);
                        return (
                           <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-5 py-3 font-medium text-slate-600">{t.id}</td>
                              <td className="px-5 py-3 text-slate-800">{t.name}</td>
                              <td className="px-5 py-3 text-right text-slate-500">{t.totalVolume.toLocaleString()}</td>
                              <td className="px-5 py-3 text-right">
                                 <div className="font-bold text-slate-700">{pct.toFixed(0)}%</div>
                              </td>
                              <td className="px-5 py-3">
                                 <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(status)}`}>
                                    {status}
                                 </span>
                              </td>
                           </tr>
                        );
                     })}
                  </tbody>
               </table>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Managers;
