
import React, { useState, useMemo } from 'react';
import { useData } from '../services/DataContext';
import { Section, Status, TitleData } from '../types';
import { Search, Filter, Layers, UploadCloud, Users, ChevronDown, Plus, Edit2, Save, X, Trash2, RotateCcw } from 'lucide-react';
import DataImportModal from './DataImportModal';

const ProjectSections: React.FC = () => {
  const { sections, titles, calculateStatus, isAdmin, addSection, updateSection, deleteSection } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  
  // Filter States
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSection, setFilterSection] = useState<string>('all');
  const [filterManager, setFilterManager] = useState<string>('all');
  
  const [showImportModal, setShowImportModal] = useState(false);

  // Edit States
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<TitleData>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSection, setNewSection] = useState<Partial<TitleData>>({
    id: '', name: '', section: Section.KZH, totalVolume: 0, completedVolume: 0, unit: 'м3'
  });

  // Dynamic Manager List for Area Buttons
  const areaManagers = useMemo(() => {
      const managers = Array.from(new Set(sections.map(s => String(s.manager || '')).filter(m => m.trim() !== '')));
      
      const mapped = managers.map((managerName: string) => {
          let label = managerName;
          let order = 100;

          if (managerName.includes('Попивнухин')) { label = 'Уч. 1'; order = 1; }
          else if (managerName.includes('Махмудов')) { label = 'Уч. 2'; order = 2; }
          else if (managerName.includes('Алдамуратов')) { label = 'Уч. 3'; order = 3; }
          else if (managerName.includes('Абилькасимов')) { label = 'Уч. 4'; order = 4; }
          else if (managerName.includes('Рахматулла')) { label = 'Электрика'; order = 5; }
          else if (managerName.includes('Тлеулесов')) { label = 'Механика'; order = 6; }
          
          return { name: managerName, label, order };
      });

      return mapped.sort((a, b) => a.order - b.order || a.label.localeCompare(b.label));
  }, [sections]);

  // Group data logic
  const groupedData = useMemo(() => {
    const groups: Record<string, { 
      baseId: string;
      name: string;
      items: TitleData[];
      progress: number;
      status: Status;
      manager: string;
    }> = {};

    sections.forEach(t => {
      const status = calculateStatus(t);
      
      // Applying filters
      if (filterStatus !== 'all' && status !== filterStatus) return;
      if (filterSection !== 'all' && t.section !== filterSection) return;
      if (filterManager !== 'all' && String(t.manager || '') !== filterManager) return;

      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const nameMatch = String(t.name || '').toLowerCase().includes(searchLower);
        const idMatch = String(t.id || '').toLowerCase().includes(searchLower);
        if (!nameMatch && !idMatch) return;
      }

      const baseId = String(t.id || '');
      
      if (!groups[baseId]) {
        const titleInfo = titles.find(title => title.id === baseId);
        groups[baseId] = {
          baseId,
          name: String(titleInfo?.name || t.name || `Титул ${baseId}`),
          items: [],
          progress: 0,
          status: Status.NOT_STARTED,
          manager: String(t.manager || 'Не назначен')
        };
      }
      groups[baseId].items.push(t);
    });

    Object.values(groups).forEach(g => {
        let total = 0;
        let done = 0;
        const statuses: Status[] = [];
        
        g.items.forEach(i => {
            total += (Number(i.totalVolume) || 0);
            done += (Number(i.completedVolume) || 0);
            statuses.push(calculateStatus(i));
        });

        g.progress = total > 0 ? (done / total) * 100 : 0;
        
        if (statuses.includes(Status.DELAYED)) g.status = Status.DELAYED;
        else if (statuses.includes(Status.RISK)) g.status = Status.RISK;
        else if (statuses.every(s => s === Status.COMPLETED)) g.status = Status.COMPLETED;
        else if (statuses.some(s => s === Status.ON_TRACK)) g.status = Status.ON_TRACK;
        else g.status = Status.NOT_STARTED;
    });

    return Object.values(groups).sort((a, b) => a.baseId.localeCompare(b.baseId, undefined, { numeric: true }));
  }, [sections, titles, searchTerm, filterStatus, filterSection, filterManager, calculateStatus]);

  const resetFilters = () => {
    setFilterStatus('all');
    setFilterSection('all');
    setFilterManager('all');
    setSearchTerm('');
  };

  const toggleGroup = (baseId: string) => {
    setExpandedGroups(prev => {
        const next = new Set(prev);
        if (next.has(baseId)) next.delete(baseId);
        else next.add(baseId);
        return next;
    });
  };

  const formatDate = (dateStr: string) => {
      if (!dateStr) return '-';
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? String(dateStr) : d.toLocaleDateString('ru-RU');
  };

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

  const getStatusColor = (status: Status) => {
      switch(status) {
          case Status.DELAYED: return 'text-red-600 bg-red-50 border-red-100';
          case Status.RISK: return 'text-yellow-600 bg-yellow-50 border-yellow-100';
          case Status.ON_TRACK: return 'text-green-600 bg-green-50 border-green-100';
          case Status.COMPLETED: return 'text-slate-600 bg-slate-100 border-slate-200';
          default: return 'text-blue-600 bg-blue-50 border-blue-100';
      }
  };

  const handleEditClick = (item: TitleData) => {
    setEditingId(`${item.id}_${item.section}`);
    setEditForm(item);
  };

  const handleSaveEdit = (originalId: string, originalSection: string) => {
    if (editForm.id && editForm.section) {
      updateSection(originalId, originalSection, editForm);
      setEditingId(null);
    }
  };

  const handleCreateSection = () => {
    if(newSection.id && newSection.section) {
      addSection({
        ...newSection,
        startDate: String(newSection.startDate || ''),
        deadline: String(newSection.deadline || ''),
        manager: String(newSection.manager || ''),
        subcontractor: '',
        comment: ''
      } as TitleData);
      setShowAddModal(false);
      setNewSection({ id: '', name: '', section: Section.KZH, totalVolume: 0, completedVolume: 0, unit: 'м3' });
    }
  };

  return (
    <div className="p-6 min-h-screen bg-slate-50">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-6">
        <div>
            <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Реестр Титулов</h2>
            <p className="text-slate-500 text-sm font-medium mt-1">Детализированная информация по физическим объемам</p>
        </div>
        
        <div className="flex flex-wrap gap-2 items-center w-full xl:w-auto">
           {/* Search Bar */}
           <div className="flex items-center gap-2 bg-white px-3 py-2.5 rounded-xl border border-slate-200 shadow-sm flex-1 md:flex-none">
             <Search size={18} className="text-slate-400"/>
             <input 
                className="bg-transparent text-sm outline-none text-slate-600 placeholder:text-slate-400 w-full md:w-48"
                placeholder="Поиск по ID или названию..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
             />
           </div>

           {/* Section Dropdown */}
           <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm">
             <Filter size={16} className="text-slate-400"/>
             <select 
                className="bg-transparent text-sm font-bold outline-none text-slate-700 cursor-pointer" 
                value={filterSection} 
                onChange={e => setFilterSection(e.target.value)}
             >
                <option value="all">Раздел: Все</option>
                {Object.values(Section).map(s => <option key={s} value={s}>{s}</option>)}
             </select>
           </div>

           {/* Reset Filters */}
           <button 
             onClick={resetFilters}
             className="p-2.5 bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl border border-slate-200 shadow-sm transition-all"
             title="Сбросить все фильтры"
           >
             <RotateCcw size={18} />
           </button>
           
           {isAdmin && (
              <div className="flex gap-2 ml-auto">
                <button onClick={() => setShowImportModal(true)} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors shadow-lg text-sm font-bold">
                  <UploadCloud size={18} /> Импорт
                </button>
                <button onClick={() => setShowAddModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors shadow-lg text-sm font-bold">
                  <Plus size={18} /> Добавить
                </button>
              </div>
           )}
        </div>
      </div>

      {/* Quick Filter Bars */}
      <div className="space-y-3 mb-8">
          {/* Status Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">Статус:</span>
             <button
               onClick={() => setFilterStatus('all')}
               className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                 filterStatus === 'all' ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
               }`}
             >
               Все
             </button>
             <button
               onClick={() => setFilterStatus(Status.ON_TRACK)}
               className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 ${
                 filterStatus === Status.ON_TRACK ? 'bg-green-600 text-white' : 'bg-white text-green-600 border border-green-200 hover:bg-green-50'
               }`}
             >
               <div className={`w-1.5 h-1.5 rounded-full ${filterStatus === Status.ON_TRACK ? 'bg-white' : 'bg-green-600'}`}></div>
               В графике
             </button>
             <button
               onClick={() => setFilterStatus(Status.DELAYED)}
               className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 ${
                 filterStatus === Status.DELAYED ? 'bg-red-600 text-white' : 'bg-white text-red-600 border border-red-200 hover:bg-red-50'
               }`}
             >
               <div className={`w-1.5 h-1.5 rounded-full ${filterStatus === Status.DELAYED ? 'bg-white' : 'bg-red-600'}`}></div>
               Отставание
             </button>
             <button
               onClick={() => setFilterStatus(Status.RISK)}
               className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 ${
                 filterStatus === Status.RISK ? 'bg-yellow-500 text-white' : 'bg-white text-yellow-600 border border-yellow-200 hover:bg-yellow-50'
               }`}
             >
               <div className={`w-1.5 h-1.5 rounded-full ${filterStatus === Status.RISK ? 'bg-white' : 'bg-yellow-600'}`}></div>
               Риск
             </button>
          </div>

          {/* Area Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">Участок:</span>
             <button
               onClick={() => setFilterManager('all')}
               className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                 filterManager === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
               }`}
             >
               Все
             </button>
             {areaManagers.map((area, idx) => (
               <button
                 key={idx}
                 onClick={() => setFilterManager(area.name)}
                 className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                   filterManager === area.name ? 'bg-blue-600 text-white' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                 }`}
               >
                 {String(area.label)}
               </button>
             ))}
          </div>
      </div>

      <DataImportModal isOpen={showImportModal} onClose={() => setShowImportModal(false)} defaultImportMode='volumes' title="Обновление объемов" />

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[80]">
           <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-lg">
              <h3 className="text-xl font-bold text-slate-800 mb-4">Добавить раздел работ</h3>
              <div className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <input className="border p-2 rounded-lg text-sm" placeholder="ID (напр. 1.1)" value={String(newSection.id)} onChange={e => setNewSection({...newSection, id: e.target.value})} />
                    <select className="border p-2 rounded-lg text-sm bg-white" value={String(newSection.section)} onChange={e => setNewSection({...newSection, section: e.target.value})}>
                       {Object.values(Section).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                 </div>
                 <input className="border p-2 rounded-lg text-sm w-full" placeholder="Наименование работ" value={String(newSection.name)} onChange={e => setNewSection({...newSection, name: e.target.value})} />
                 <div className="grid grid-cols-3 gap-4">
                    <input type="number" className="border p-2 rounded-lg text-sm" placeholder="План" value={Number(newSection.totalVolume)} onChange={e => setNewSection({...newSection, totalVolume: Number(e.target.value)})} />
                    <input type="number" className="border p-2 rounded-lg text-sm" placeholder="Факт" value={Number(newSection.completedVolume)} onChange={e => setNewSection({...newSection, completedVolume: Number(e.target.value)})} />
                    <input className="border p-2 rounded-lg text-sm" placeholder="Ед. изм." value={String(newSection.unit)} onChange={e => setNewSection({...newSection, unit: e.target.value})} />
                 </div>
                 <input className="border p-2 rounded-lg text-sm w-full" placeholder="ФИО Ответственного" value={String(newSection.manager || '')} onChange={e => setNewSection({...newSection, manager: e.target.value})} />
                 <div className="flex justify-end gap-2 pt-4">
                    <button onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium">Отмена</button>
                    <button onClick={handleCreateSection} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium shadow-md">Добавить</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      <div className="space-y-3 pb-20">
        {groupedData.length === 0 && (
            <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
               <Layers size={48} className="mx-auto text-slate-200 mb-4"/>
               <p className="text-slate-400 font-medium italic">Титулы не найдены по заданным фильтрам.</p>
               <button onClick={resetFilters} className="mt-4 text-blue-600 hover:underline text-sm font-bold">Сбросить фильтры</button>
            </div>
        )}

        {groupedData.map(group => {
            const isExpanded = expandedGroups.has(group.baseId);
            return (
                <div key={group.baseId} className="group-container">
                    <div 
                        onClick={() => toggleGroup(group.baseId)}
                        className={`relative w-full bg-white rounded-xl border p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${isExpanded ? 'border-blue-300 shadow-md ring-1 ring-blue-50 mb-1' : 'border-slate-200 shadow-sm mb-3'}`}
                    >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4 flex-1">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm ${isExpanded ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{String(group.baseId)}</div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 leading-tight mb-1">{String(group.name)}</h3>
                                    <div className="flex items-center gap-4 text-xs text-slate-500">
                                        <div className="flex items-center gap-1"><Users size={12}/> <span className="font-semibold">{String(group.manager)}</span></div>
                                        <div className="flex items-center gap-1"><Layers size={12}/> <span>{group.items.length} разделов</span></div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="flex flex-col w-32 md:w-48">
                                    <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider">
                                        <span>Прогресс</span>
                                        <span>{group.progress.toFixed(0)}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden shadow-inner">
                                        <div className={`h-full rounded-full transition-all duration-700 ${group.status === Status.DELAYED ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-blue-500'}`} style={{width: `${Math.min(group.progress, 100)}%`}}></div>
                                    </div>
                                </div>
                                <div className={`px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest ${getStatusColor(group.status)}`}>{String(group.status)}</div>
                                <ChevronDown size={20} className={`text-slate-300 transition-transform ${isExpanded ? 'rotate-180 text-blue-500' : ''}`}/>
                            </div>
                        </div>
                    </div>

                    {isExpanded && (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-4 animate-fade-in origin-top">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 text-slate-400 uppercase font-black tracking-widest border-b border-slate-100">
                                    <tr>
                                        <th className="px-5 py-3 w-16">Раздел</th>
                                        <th className="px-5 py-3">Работы</th>
                                        <th className="px-5 py-3">Прогресс (факт / план)</th>
                                        <th className="px-5 py-3 text-center">Ед.</th>
                                        <th className="px-5 py-3 text-center">Срок</th>
                                        <th className="px-5 py-3 text-center">Статус</th>
                                        {isAdmin && <th className="px-5 py-3 text-right">Действия</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 text-sm font-medium">
                                    {group.items.map((item, idx) => {
                                        const progress = (Number(item.totalVolume) || 0) > 0 ? (item.completedVolume / item.totalVolume) * 100 : 0;
                                        const itemStatus = calculateStatus(item);
                                        const isEditing = editingId === `${item.id}_${item.section}`;
                                        
                                        return (
                                        <tr key={idx} className="hover:bg-blue-50/20 transition-colors group/row">
                                            <td className="px-5 py-3">
                                                {isEditing ? <input className="border p-1 rounded w-12" value={String(editForm.section)} onChange={e => setEditForm({...editForm, section: e.target.value})}/> : getSectionBadge(String(item.section))}
                                            </td>
                                            <td className="px-5 py-3 font-bold text-slate-700">
                                                {isEditing ? <input className="border p-1 rounded w-full" value={String(editForm.name)} onChange={e => setEditForm({...editForm, name: e.target.value})}/> : String(item.name)}
                                            </td>
                                            <td className="px-5 py-3">
                                                {isEditing ? (
                                                    <div className="flex gap-1 items-center">
                                                        <input className="border p-1 rounded w-16 text-right font-bold" type="number" value={Number(editForm.completedVolume)} onChange={e => setEditForm({...editForm, completedVolume: Number(e.target.value)})}/>
                                                        <span>/</span>
                                                        <input className="border p-1 rounded w-16 text-right font-bold" type="number" value={Number(editForm.totalVolume)} onChange={e => setEditForm({...editForm, totalVolume: Number(e.target.value)})}/>
                                                    </div>
                                                ) : (
                                                <div className="flex flex-col gap-1 w-full max-w-[150px]">
                                                    <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                                                        <span>{(Number(item.completedVolume) || 0).toLocaleString()} / {(Number(item.totalVolume) || 0).toLocaleString()}</span>
                                                        <span className="text-blue-600">{progress.toFixed(1)}%</span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                                                        <div className={`h-full ${progress >= 100 ? 'bg-green-500' : 'bg-blue-500'}`} style={{width: `${Math.min(progress, 100)}%`}}></div>
                                                    </div>
                                                </div>
                                                )}
                                            </td>
                                            <td className="px-5 py-3 text-center text-slate-500">
                                                {isEditing ? <input className="border p-1 rounded w-10 text-center" value={String(editForm.unit)} onChange={e => setEditForm({...editForm, unit: e.target.value})}/> : String(item.unit || '-') }
                                            </td>
                                            <td className="px-5 py-3 text-center whitespace-nowrap text-slate-600 font-bold">
                                                {isEditing ? <input type="date" className="border p-1 rounded text-[10px]" value={String(editForm.deadline)} onChange={e => setEditForm({...editForm, deadline: e.target.value})}/> : formatDate(item.deadline)}
                                            </td>
                                            <td className="px-5 py-3 text-center">
                                                <div className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${getStatusColor(itemStatus)}`}>{String(itemStatus)}</div>
                                            </td>
                                            {isAdmin && (
                                                <td className="px-5 py-3 text-right">
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover/row:opacity-100 transition-opacity">
                                                        {isEditing ? (
                                                            <>
                                                                <button onClick={() => handleSaveEdit(item.id, String(item.section))} className="text-green-600 hover:bg-green-50 p-1.5 rounded-lg border border-green-200"><Save size={14}/></button>
                                                                <button onClick={() => setEditingId(null)} className="text-slate-400 hover:bg-slate-100 p-1.5 rounded-lg border border-slate-200"><X size={14}/></button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button onClick={() => handleEditClick(item)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg border border-blue-100 transition-colors"><Edit2 size={14}/></button>
                                                                <button onClick={() => deleteSection(item.id, String(item.section))} className="text-red-400 hover:bg-red-50 p-1.5 rounded-lg border border-red-100 transition-colors"><Trash2 size={14}/></button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    )})}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            );
        })}
      </div>
    </div>
  );
};

export default ProjectSections;
