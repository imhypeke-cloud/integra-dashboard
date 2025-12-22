import { supabase } from '../supabaseClient'
import React, { useEffect, useState, useMemo } from 'react'
import { useData } from '../services/DataContext';
import { TitleData, Status, Section } from '../types';
import { Edit2, Save, X, Plus, Trash2, Filter, UploadCloud, Search, RotateCcw, ChevronRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import DataImportModal from './DataImportModal';

const Titles: React.FC = () => {
  const { titles, updateTitle, deleteTitle, addTitle, calculateStatus, isAdmin } = useData();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<TitleData>>({});
  
  // Filters state
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSection, setFilterSection] = useState<string>('all');
  const [filterManager, setFilterManager] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState<Partial<TitleData>>({
    section: Section.KZH,
    totalVolume: 0,
    completedVolume: 0,
    deadline: new Date().toISOString().split('T')[0]
  });

  const uniqueManagers = useMemo(() => {
    const mgrs = new Set(titles.map(t => t.manager).filter(m => m && m.trim().length > 0));
    return Array.from(mgrs).sort();
  }, [titles]);

  // Area mapping (same as in ProjectSections for consistency)
  const areaManagers = useMemo(() => {
    return uniqueManagers.map((managerName: string) => {
        let label = managerName;
        let order = 100;
        if (managerName.includes('Попивнухин')) { label = 'Уч. 1'; order = 1; }
        else if (managerName.includes('Махмудов')) { label = 'Уч. 2'; order = 2; }
        else if (managerName.includes('Алдамуратов')) { label = 'Уч. 3'; order = 3; }
        else if (managerName.includes('Абилькасимов')) { label = 'Уч. 4'; order = 4; }
        return { name: managerName, label, order };
    }).sort((a, b) => a.order - b.order);
  }, [uniqueManagers]);

  const filteredTitles = useMemo(() => {
    return titles.filter(t => {
      const status = calculateStatus(t);
      const statusMatch = filterStatus === 'all' || status === filterStatus;
      const sectionMatch = filterSection === 'all' || t.section === filterSection;
      const managerMatch = filterManager === 'all' || t.manager === filterManager;
      const searchMatch = searchTerm === '' || 
                          t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.id.toLowerCase().includes(searchTerm.toLowerCase());
      return statusMatch && sectionMatch && managerMatch && searchMatch;
    });
  }, [titles, filterStatus, filterSection, filterManager, searchTerm, calculateStatus]);

  const resetFilters = () => {
    setFilterStatus('all');
    setFilterSection('all');
    setFilterManager('all');
    setSearchTerm('');
  };

  const filteredTotals = useMemo(() => {
    return filteredTitles.reduce((acc, t) => ({
       total: acc.total + t.totalVolume,
       completed: acc.completed + t.completedVolume
    }), { total: 0, completed: 0 });
  }, [filteredTitles]);

  const statusData = useMemo(() => {
    const counts = { [Status.ON_TRACK]: 0, [Status.RISK]: 0, [Status.DELAYED]: 0, [Status.COMPLETED]: 0, [Status.NOT_STARTED]: 0 };
    filteredTitles.forEach(t => {
      const s = calculateStatus(t);
      if(counts[s] !== undefined) counts[s]++;
    });
    return [
      { name: 'В графике', value: counts[Status.ON_TRACK], color: '#22c55e' },
      { name: 'Риск', value: counts[Status.RISK], color: '#eab308' },
      { name: 'Отставание', value: counts[Status.DELAYED], color: '#ef4444' },
      { name: 'Завершено', value: counts[Status.COMPLETED], color: '#94a3b8' },
    ].filter(d => d.value > 0);
  }, [filteredTitles, calculateStatus]);

  const handleEditClick = (title: TitleData) => {
    setEditingId(title.id);
    setEditForm(title);
  };

  const handleSave = () => {
    if (editingId) {
      updateTitle(editingId, editForm);
      setEditingId(null);
    }
  };

  const handleCreate = () => {
    if (newTitle.id) {
      addTitle({ ...newTitle, name: newTitle.name || `Титул ${newTitle.id}` } as TitleData);
      setShowAddForm(false);
      setNewTitle({ section: Section.KZH, totalVolume: 0, completedVolume: 0, deadline: new Date().toISOString().split('T')[0] });
    }
  };

  const getStatusBadge = (status: Status) => {
    switch (status) {
      case Status.ON_TRACK: return <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-lg text-xs font-bold border border-green-200">В графике</span>;
      case Status.RISK: return <span className="bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-lg text-xs font-bold border border-yellow-200">Риск</span>;
      case Status.DELAYED: return <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-lg text-xs font-bold border border-red-200">Отставание</span>;
      case Status.COMPLETED: return <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-200">Завершено</span>;
      default: return <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-lg text-xs font-bold border border-blue-200">{status}</span>;
    }
  };

  // Fixed the error by adding getSectionBadge helper function
  const getSectionBadge = (section: string) => {
    let color = 'bg-slate-100 text-slate-600 border-slate-200';
    if (section.includes('КЖ')) color = 'bg-blue-50 text-blue-700 border-blue-200';
    else if (section.includes('КМ')) color = 'bg-orange-50 text-orange-700 border-orange-200';
    else if (section.includes('АР') || section.includes('АС')) color = 'bg-indigo-50 text-indigo-700 border-indigo-200';
    else if (section.includes('ТХ')) color = 'bg-purple-50 text-purple-700 border-purple-200';
    
    return (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${color} whitespace-nowrap uppercase tracking-wider`}>
            {String(section)}
        </span>
    );
  };

  return (
    <div className="p-6 min-h-screen bg-slate-50 font-sans">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Реестр титулов</h2>
          <p className="text-slate-500 text-sm font-medium mt-1">Управление физическими объемами по всему проекту</p>
        </div>
        
        <div className="flex flex-wrap gap-2 items-center w-full xl:w-auto">
           {/* Area Quick Filters */}
           <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <button 
                onClick={() => setFilterManager('all')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${filterManager === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                Все
              </button>
              {areaManagers.map(area => (
                 <button 
                    key={area.name}
                    onClick={() => setFilterManager(area.name)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${filterManager === area.name ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                 >
                    {area.label}
                 </button>
              ))}
           </div>

           <div className="h-8 w-px bg-slate-200 mx-1 hidden md:block"></div>

           <div className="flex items-center gap-2 bg-white px-3 py-2.5 rounded-xl border border-slate-200 shadow-sm flex-1 md:flex-none">
             <Search size={18} className="text-slate-400"/>
             <input 
                className="bg-transparent text-sm outline-none text-slate-600 placeholder:text-slate-400 w-full md:w-48"
                placeholder="Поиск по ID или названию..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
             />
           </div>

           <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm">
             <Filter size={16} className="text-slate-400"/>
             <select className="bg-transparent text-sm font-bold outline-none text-slate-700 cursor-pointer" value={filterSection} onChange={e => setFilterSection(e.target.value)}>
                <option value="all">Раздел: Все</option>
                {Object.values(Section).map(s => <option key={s} value={s}>{s}</option>)}
             </select>
           </div>
           
           <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm">
             <Filter size={16} className="text-slate-400"/>
             <select className="bg-transparent text-sm font-bold outline-none text-slate-700 cursor-pointer" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="all">Статус: Все</option>
                {Object.values(Status).map(s => <option key={s} value={s}>{s}</option>)}
             </select>
           </div>

           <button 
             onClick={resetFilters}
             className="p-2.5 bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl border border-slate-200 shadow-sm transition-all"
             title="Сбросить фильтры"
           >
             <RotateCcw size={18} />
           </button>

          {isAdmin && (
            <div className="flex gap-2 ml-auto">
               <button 
                onClick={() => setShowImportModal(true)}
                className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors shadow-lg text-sm font-bold"
              >
                <UploadCloud size={18} /> Импорт
              </button>
              <button 
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors shadow-lg text-sm font-bold"
              >
                <Plus size={18} /> Добавить
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Info Graphic Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
         <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 h-56 w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie 
                     data={statusData} 
                     cx="50%" cy="50%" 
                     innerRadius={65} outerRadius={90} 
                     paddingAngle={5} 
                     dataKey="value"
                     cornerRadius={8}
                   >
                     {statusData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                   </Pie>
                   <Tooltip 
                     contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                   />
                   <Legend 
                     layout="vertical" verticalAlign="middle" align="right"
                     iconType="circle"
                     formatter={(value, entry: any) => (
                        <span className="text-slate-600 font-bold ml-2 text-xs">{value}: {entry.payload.value}</span>
                     )}
                   />
                 </PieChart>
               </ResponsiveContainer>
            </div>
            <div className="w-full md:w-px h-px md:h-32 bg-slate-100"></div>
            <div className="w-full md:w-64 space-y-4">
               <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Отобрано титулов</div>
                  <div className="text-3xl font-black text-slate-800">{filteredTitles.length}</div>
               </div>
               <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Общий прогресс</div>
                  <div className="text-2xl font-black text-blue-600">
                     {filteredTotals.total > 0 ? ((filteredTotals.completed / filteredTotals.total) * 100).toFixed(1) : 0}%
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">
                     {filteredTotals.completed.toLocaleString()} из {filteredTotals.total.toLocaleString()} м³/тн
                  </div>
               </div>
            </div>
         </div>

         <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl shadow-xl shadow-blue-200 flex flex-col justify-between text-white relative overflow-hidden">
            <div className="relative z-10">
               <h3 className="font-bold text-lg mb-1 opacity-90">Текущий фильтр</h3>
               <div className="mt-4 space-y-2">
                  <div className="flex justify-between items-center bg-white/10 p-2 rounded-lg">
                     <span className="text-xs opacity-70">Участок:</span>
                     <span className="text-sm font-bold">{filterManager === 'all' ? 'Все' : filterManager}</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/10 p-2 rounded-lg">
                     <span className="text-xs opacity-70">Раздел:</span>
                     <span className="text-sm font-bold">{filterSection === 'all' ? 'Все' : filterSection}</span>
                  </div>
               </div>
            </div>
            <div className="mt-6 flex justify-between items-end relative z-10">
               <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest opacity-70">Отставание</div>
                  <div className="text-3xl font-black">{statusData.find(d => d.name === 'Отставание')?.value || 0}</div>
               </div>
               <div className="bg-white/20 p-2 rounded-lg">
                  <ChevronRight size={24}/>
               </div>
            </div>
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
         </div>
      </div>

      <DataImportModal 
        isOpen={showImportModal} 
        onClose={() => setShowImportModal(false)} 
        defaultImportMode='volumes'
        title="Загрузка данных (Титулы)"
      />

      {showAddForm && isAdmin && (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-blue-100 mb-8 animate-fade-in-down">
          <div className="flex justify-between items-center mb-6">
             <h3 className="font-black text-slate-800 uppercase flex items-center gap-2">
                <Plus className="bg-blue-100 text-blue-600 p-1 rounded-lg" size={24}/> Новый Титул
             </h3>
             <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
               <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">ID Титула</label>
               <input placeholder="напр. 1.1" className="w-full border border-slate-200 p-2.5 rounded-xl focus:ring-2 ring-blue-500 outline-none text-sm font-medium" value={newTitle.id || ''} onChange={e => setNewTitle({...newTitle, id: e.target.value})} />
            </div>
            <div className="space-y-1">
               <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Наименование</label>
               <input placeholder="Название титула" className="w-full border border-slate-200 p-2.5 rounded-xl focus:ring-2 ring-blue-500 outline-none text-sm font-medium" value={newTitle.name || ''} onChange={e => setNewTitle({...newTitle, name: e.target.value})} />
            </div>
            <div className="space-y-1">
               <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Раздел</label>
               <select className="w-full border border-slate-200 p-2.5 rounded-xl focus:ring-2 ring-blue-500 outline-none text-sm font-bold bg-white" value={newTitle.section} onChange={e => setNewTitle({...newTitle, section: e.target.value as Section})}>
                 {Object.values(Section).map(s => <option key={s} value={s}>{s}</option>)}
               </select>
            </div>
            <div className="space-y-1">
               <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Срок ГПР</label>
               <input type="date" className="w-full border border-slate-200 p-2.5 rounded-xl focus:ring-2 ring-blue-500 outline-none text-sm font-medium" value={newTitle.deadline} onChange={e => setNewTitle({...newTitle, deadline: e.target.value})} />
            </div>
            <div className="space-y-1">
               <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Общий объем</label>
               <input type="number" placeholder="0" className="w-full border border-slate-200 p-2.5 rounded-xl focus:ring-2 ring-blue-500 outline-none text-sm font-bold text-blue-600" value={newTitle.totalVolume} onChange={e => setNewTitle({...newTitle, totalVolume: Number(e.target.value)})} />
            </div>
            <div className="space-y-1">
               <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Выполнено (Факт)</label>
               <input type="number" placeholder="0" className="w-full border border-slate-200 p-2.5 rounded-xl focus:ring-2 ring-blue-500 outline-none text-sm font-bold text-green-600" value={newTitle.completedVolume} onChange={e => setNewTitle({...newTitle, completedVolume: Number(e.target.value)})} />
            </div>
            <div className="space-y-1">
               <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Ответственный</label>
               <input placeholder="ФИО" className="w-full border border-slate-200 p-2.5 rounded-xl focus:ring-2 ring-blue-500 outline-none text-sm font-medium" value={newTitle.manager || ''} onChange={e => setNewTitle({...newTitle, manager: e.target.value})} />
            </div>
            <div className="space-y-1">
               <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Субподрядчик</label>
               <input placeholder="Название компании" className="w-full border border-slate-200 p-2.5 rounded-xl focus:ring-2 ring-blue-500 outline-none text-sm font-medium" value={newTitle.subcontractor || ''} onChange={e => setNewTitle({...newTitle, subcontractor: e.target.value})} />
            </div>
          </div>
          <div className="mt-8 flex justify-end gap-3">
            <button onClick={() => setShowAddForm(false)} className="px-6 py-2.5 rounded-xl text-slate-500 hover:bg-slate-50 font-bold transition-colors">Отмена</button>
            <button onClick={handleCreate} className="px-8 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold shadow-lg shadow-blue-200 transition-all">Добавить титул</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-12">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-400 uppercase text-[10px] font-black tracking-widest border-b border-slate-100">
                <th className="p-4 w-20">ID</th>
                <th className="p-4">Наименование</th>
                <th className="p-4 w-32">Раздел</th>
                <th className="p-4 text-right">Прогресс (%)</th>
                <th className="p-4 text-right">Выполнено / План</th>
                <th className="p-4">Срок (ГПР)</th>
                <th className="p-4">Статус</th>
                <th className="p-4">Руководитель</th>
                {isAdmin && <th className="p-4 text-center w-24">Действия</th>}
              </tr>
            </thead>
            <tbody className="text-sm font-medium">
              {filteredTitles.length === 0 ? (
                <tr>
                   <td colSpan={isAdmin ? 9 : 8} className="p-20 text-center text-slate-400 font-medium italic">
                      Нет данных, соответствующих установленным фильтрам. <br/> Попробуйте сбросить параметры.
                   </td>
                </tr>
              ) : filteredTitles.map((title) => {
                const isEditing = editingId === title.id;
                const status = calculateStatus(title);
                const percent = title.totalVolume > 0 ? (title.completedVolume / title.totalVolume) * 100 : 0;

                return (
                  <tr key={title.id} className="hover:bg-slate-50/50 border-b border-slate-50 last:border-0 transition-colors group">
                    <td className="p-4 font-black text-slate-800">{title.id}</td>
                    <td className="p-4 min-w-[250px]">
                      {isEditing ? (
                        <input className="border border-blue-200 p-1.5 rounded-lg w-full mb-1 text-sm focus:ring-2 ring-blue-500 outline-none" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                      ) : (
                        <div className="font-bold text-slate-700">{title.name}</div>
                      )}
                      <div className="text-[10px] text-slate-400 italic">
                        {isEditing ? <input className="border border-slate-100 p-1 rounded w-full text-[10px]" placeholder="Комментарий" value={editForm.comment} onChange={e => setEditForm({...editForm, comment: e.target.value})} /> : title.comment}
                      </div>
                    </td>
                    <td className="p-4">
                       {isEditing ? (
                          <select className="border border-blue-200 p-1.5 rounded-lg w-full text-xs font-bold outline-none bg-white" value={editForm.section} onChange={e => setEditForm({...editForm, section: e.target.value as Section})}>
                             {Object.values(Section).map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                       ) : (
                         <div className="flex">{getSectionBadge(String(title.section))}</div>
                       )}
                    </td>
                    <td className="p-4 text-right">
                        <div className={`font-black ${percent >= 100 ? 'text-green-600' : percent >= 50 ? 'text-blue-600' : 'text-slate-700'}`}>
                           {percent.toFixed(1)}%
                        </div>
                        <div className="w-16 h-1 bg-slate-100 rounded-full mt-1 ml-auto">
                            <div className={`h-full rounded-full ${percent >= 100 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(percent, 100)}%` }}></div>
                        </div>
                    </td>
                    <td className="p-4 text-right font-mono text-xs text-slate-500 whitespace-nowrap">
                       {isEditing ? (
                          <div className="flex flex-col gap-1 items-end">
                            <input type="number" className="border border-blue-200 p-1 rounded-lg w-20 text-right text-xs font-bold text-green-600" value={editForm.completedVolume} onChange={e => setEditForm({...editForm, completedVolume: Number(e.target.value)})} />
                            <input type="number" className="border border-blue-200 p-1 rounded-lg w-20 text-right text-xs font-bold text-blue-600" value={editForm.totalVolume} onChange={e => setEditForm({...editForm, totalVolume: Number(e.target.value)})} />
                          </div>
                       ) : (
                          <>
                             <span className="font-bold text-slate-700">{title.completedVolume.toLocaleString()}</span>
                             <span className="mx-1">/</span>
                             <span>{title.totalVolume.toLocaleString()}</span>
                          </>
                       )}
                    </td>
                    <td className="p-4 text-slate-500 font-bold whitespace-nowrap">
                      {isEditing ? (
                         <input type="date" className="border border-blue-200 p-1 rounded-lg w-full text-xs" value={editForm.deadline} onChange={e => setEditForm({...editForm, deadline: e.target.value})} />
                      ) : (
                        <span>{new Date(title.deadline).toLocaleDateString('ru-RU')}</span>
                      )}
                    </td>
                    <td className="p-4">{getStatusBadge(status)}</td>
                    <td className="p-4 text-slate-600 text-xs">
                      {isEditing ? <input className="border border-blue-200 p-1.5 rounded-lg w-full text-xs" value={editForm.manager} onChange={e => setEditForm({...editForm, manager: e.target.value})} /> : title.manager}
                    </td>
                    {isAdmin && (
                      <td className="p-4">
                        <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {isEditing ? (
                            <>
                              <button onClick={handleSave} className="text-green-600 hover:bg-green-50 p-2 rounded-lg transition-colors" title="Сохранить"><Save size={18} /></button>
                              <button onClick={() => setEditingId(null)} className="text-slate-400 hover:bg-slate-100 p-2 rounded-lg transition-colors" title="Отмена"><X size={18} /></button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => handleEditClick(title)} className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition-colors" title="Редактировать"><Edit2 size={16} /></button>
                              <button onClick={() => deleteTitle(title.id)} className="text-slate-300 hover:text-red-500 p-2 rounded-lg transition-colors" title="Удалить"><Trash2 size={16} /></button>
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-100/80 backdrop-blur font-black text-slate-800 border-t border-slate-200">
               <tr>
                  <td colSpan={4} className="p-5 text-right uppercase text-[10px] tracking-widest text-slate-400">Итого по выборке:</td>
                  <td className="p-5 text-right whitespace-nowrap">
                     <div className="text-sm font-black">{filteredTotals.completed.toLocaleString()} / {filteredTotals.total.toLocaleString()}</div>
                  </td>
                  <td colSpan={isAdmin ? 4 : 3} className="p-5">
                     <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                           <div className="h-full bg-blue-600" style={{width: `${filteredTotals.total > 0 ? (filteredTotals.completed / filteredTotals.total) * 100 : 0}%`}}></div>
                        </div>
                        <span className="text-xs text-blue-600">
                           {filteredTotals.total > 0 ? ((filteredTotals.completed / filteredTotals.total) * 100).toFixed(1) : 0}%
                        </span>
                     </div>
                  </td>
               </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Titles;
