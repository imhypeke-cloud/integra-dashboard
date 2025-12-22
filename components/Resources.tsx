
import React, { useState, useMemo } from 'react';
import { useData } from '../services/DataContext';
import { WorkforceData } from '../types';
import { Users, HardHat, Plus, Trash2, Save, X, Edit2, Filter, UploadCloud, Search, Briefcase, Building2, ChevronDown, ChevronUp } from 'lucide-react';
import DataImportModal from './DataImportModal';

const Resources: React.FC = () => {
  const { workforce, addWorkforce, updateWorkforce, deleteWorkforce, isAdmin } = useData();
  
  // State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<WorkforceData>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [expandedOrgs, setExpandedOrgs] = useState<Set<string>>(new Set());
  
  const [newPerson, setNewPerson] = useState<Partial<WorkforceData>>({
    organization: 'Integra Construction',
    type: 'Рабочие',
    count: 1
  });

  // Filters
  const [filterOrg, setFilterOrg] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // --- Aggregation & Filtering Logic ---

  const uniqueOrgs = useMemo(() => Array.from(new Set(workforce.map(w => w.organization))).sort(), [workforce]);

  const filteredWorkforce = useMemo(() => {
    return workforce.filter(w => {
      const orgMatch = filterOrg === 'all' || w.organization === filterOrg;
      const typeMatch = filterType === 'all' || w.type === filterType;
      const searchMatch = searchTerm === '' || 
                          w.role.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          w.organization.toLowerCase().includes(searchTerm.toLowerCase());
      return orgMatch && typeMatch && searchMatch;
    });
  }, [workforce, filterOrg, filterType, searchTerm]);

  // Statistics
  const stats = useMemo(() => {
    const total = filteredWorkforce.reduce((acc, w) => acc + w.count, 0);
    const itr = filteredWorkforce.filter(w => w.type === 'ИТР').reduce((acc, w) => acc + w.count, 0);
    const workers = filteredWorkforce.filter(w => w.type === 'Рабочие').reduce((acc, w) => acc + w.count, 0);
    return { total, itr, workers };
  }, [filteredWorkforce]);

  // Grouping by Organization
  const groupedData = useMemo(() => {
    const groups: Record<string, { itr: number, workers: number, items: WorkforceData[] }> = {};
    
    filteredWorkforce.forEach(item => {
        if (!groups[item.organization]) {
            groups[item.organization] = { itr: 0, workers: 0, items: [] };
        }
        groups[item.organization].items.push(item);
        if (item.type === 'ИТР') groups[item.organization].itr += item.count;
        else groups[item.organization].workers += item.count;
    });

    // Sort items inside groups (ITR first, then by name)
    Object.values(groups).forEach(g => {
        g.items.sort((a, b) => {
            if (a.type === b.type) return a.role.localeCompare(b.role);
            return a.type === 'ИТР' ? -1 : 1;
        });
    });

    return Object.entries(groups).sort((a, b) => (b[1].itr + b[1].workers) - (a[1].itr + a[1].workers)); // Sort orgs by total count descending
  }, [filteredWorkforce]);

  // Handlers
  const toggleOrg = (org: string) => {
    setExpandedOrgs(prev => {
        const next = new Set(prev);
        if (next.has(org)) next.delete(org);
        else next.add(org);
        return next;
    });
  };

  const handleEditClick = (person: WorkforceData) => {
    setEditingId(person.id);
    setEditForm(person);
  };

  const handleSave = () => {
    if (editingId) {
      updateWorkforce(editingId, editForm);
      setEditingId(null);
    }
  };

  const handleCreate = () => {
    if (newPerson.role && newPerson.organization) {
      addWorkforce({ ...newPerson, id: Date.now().toString() } as WorkforceData);
      setIsAdding(false);
      setNewPerson({ organization: 'Integra Construction', type: 'Рабочие', count: 1 });
    }
  };

  return (
    <div className="p-6 min-h-screen bg-slate-50">
      
      {/* --- HEADER & FILTERS --- */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-4">
        <div>
            <h2 className="text-3xl font-bold text-slate-800">Людские ресурсы</h2>
            <p className="text-slate-500 text-sm mt-1">Сводная информация по персоналу на площадке</p>
        </div>
        
        <div className="flex gap-2 flex-wrap items-center w-full xl:w-auto">
           <div className="flex items-center gap-2 bg-white px-3 py-2.5 rounded-xl border border-slate-200 shadow-sm flex-1 xl:flex-none min-w-[200px]">
             <Search size={18} className="text-slate-400"/>
             <input 
                className="bg-transparent text-sm outline-none text-slate-600 placeholder:text-slate-400 w-full"
                placeholder="Поиск должности..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
             />
           </div>

           <div className="bg-white px-3 py-2.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
             <Filter size={18} className="text-slate-400"/>
             <select 
               className="bg-transparent text-sm outline-none text-slate-600 max-w-[150px] cursor-pointer" 
               value={filterOrg} 
               onChange={e => setFilterOrg(e.target.value)}
             >
                <option value="all">Все организации</option>
                {uniqueOrgs.map(o => <option key={o} value={o}>{o}</option>)}
             </select>
           </div>

           {isAdmin && (
             <>
               <button 
                  onClick={() => setShowImportModal(true)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors font-medium text-sm"
                >
                  <UploadCloud size={18} /> Импорт
                </button>
               <button 
                  onClick={() => setIsAdding(!isAdding)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors shadow-sm text-sm font-medium"
               >
                  <Plus size={18}/> Добавить
               </button>
             </>
           )}
        </div>
      </div>

      <DataImportModal 
        isOpen={showImportModal} 
        onClose={() => setShowImportModal(false)} 
        title="Загрузка данных (Персонал)"
      />

      {/* --- ADD NEW FORM --- */}
      {isAdding && isAdmin && (
         <div className="bg-white p-6 rounded-2xl shadow-lg border border-blue-100 mb-8 animate-fade-in-down">
            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                <Plus className="bg-blue-100 text-blue-600 rounded p-0.5" size={20}/> Добавить сотрудника/группу
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
               <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Организация</label>
                  <input 
                    className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
                    value={newPerson.organization} 
                    onChange={e => setNewPerson({...newPerson, organization: e.target.value})} 
                    placeholder="Название компании" 
                    list="org-list"
                  />
                  <datalist id="org-list">
                      {uniqueOrgs.map(o => <option key={o} value={o}/>)}
                  </datalist>
               </div>
               <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Должность / Специальность</label>
                  <input 
                    className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
                    value={newPerson.role} 
                    onChange={e => setNewPerson({...newPerson, role: e.target.value})} 
                    placeholder="Например: Сварщик 5р" 
                  />
               </div>
               <div className="flex gap-4">
                   <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Тип</label>
                      <select 
                        className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white" 
                        value={newPerson.type} 
                        onChange={e => setNewPerson({...newPerson, type: e.target.value as any})}
                      >
                        <option value="Рабочие">Рабочие</option>
                        <option value="ИТР">ИТР</option>
                      </select>
                   </div>
                   <div className="w-24">
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Кол-во</label>
                      <input 
                        type="number" 
                        className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
                        value={newPerson.count} 
                        onChange={e => setNewPerson({...newPerson, count: Number(e.target.value)})} 
                      />
                   </div>
               </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setIsAdding(false)} className="px-5 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors text-sm font-medium">Отмена</button>
                <button onClick={handleCreate} className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm text-sm font-medium">Сохранить</button>
            </div>
         </div>
      )}

      {/* --- STATS CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
         <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between relative overflow-hidden">
            <div className="relative z-10">
               <p className="text-slate-500 font-medium mb-1">Всего персонала</p>
               <h3 className="text-4xl font-black text-slate-800">{stats.total}</h3>
            </div>
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 relative z-10">
               <Users size={28} strokeWidth={2}/>
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-blue-50 rounded-full opacity-50"></div>
         </div>

         <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center">
            <div className="flex justify-between items-end mb-2">
               <div>
                  <p className="text-slate-500 font-medium text-xs uppercase tracking-wide">ИТР Состав</p>
                  <h3 className="text-2xl font-bold text-indigo-600">{stats.itr} <span className="text-sm text-slate-400 font-normal">чел.</span></h3>
               </div>
               <Briefcase size={20} className="text-indigo-200 mb-1"/>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
               <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${stats.total > 0 ? (stats.itr/stats.total)*100 : 0}%` }}></div>
            </div>
         </div>

         <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center">
            <div className="flex justify-between items-end mb-2">
               <div>
                  <p className="text-slate-500 font-medium text-xs uppercase tracking-wide">Рабочий Состав</p>
                  <h3 className="text-2xl font-bold text-orange-500">{stats.workers} <span className="text-sm text-slate-400 font-normal">чел.</span></h3>
               </div>
               <HardHat size={20} className="text-orange-200 mb-1"/>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
               <div className="bg-orange-500 h-full rounded-full" style={{ width: `${stats.total > 0 ? (stats.workers/stats.total)*100 : 0}%` }}></div>
            </div>
         </div>
      </div>

      {/* --- ORGANIZATION LIST --- */}
      <div className="space-y-4">
         {groupedData.length === 0 && (
            <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
               <Users size={48} className="mx-auto text-slate-300 mb-4"/>
               <p className="text-slate-500">Данные не найдены</p>
            </div>
         )}

         {groupedData.map(([orgName, groupData]) => {
            const isExpanded = expandedOrgs.has(orgName);
            const totalInOrg = groupData.itr + groupData.workers;
            
            return (
               <div key={orgName} className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-300 ${isExpanded ? 'ring-1 ring-blue-200 shadow-md' : 'hover:shadow-md'}`}>
                  
                  {/* EXPANDABLE HEADER / BUTTON */}
                  <div 
                     onClick={() => toggleOrg(orgName)}
                     className={`w-full p-5 cursor-pointer transition-colors flex flex-col md:flex-row items-center justify-between gap-4 ${isExpanded ? 'bg-slate-50/50' : 'hover:bg-slate-50'}`}
                  >
                     <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className={`w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center transition-colors ${isExpanded ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-100 text-slate-500'}`}>
                           <Building2 size={24} />
                        </div>
                        <div>
                           <h3 className="font-bold text-slate-800 text-lg leading-tight">{orgName}</h3>
                           <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                              <span className="font-medium bg-slate-200 px-2 py-0.5 rounded text-slate-700">Всего: {totalInOrg}</span>
                           </div>
                        </div>
                     </div>

                     <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-slate-100 pt-4 md:pt-0">
                        {/* Stats Pills */}
                        <div className="flex gap-4 mr-4">
                           <div className="text-right">
                              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">ИТР</div>
                              <div className="font-bold text-indigo-600 text-lg leading-none">{groupData.itr}</div>
                           </div>
                           <div className="w-px h-8 bg-slate-200"></div>
                           <div className="text-right">
                              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Рабочие</div>
                              <div className="font-bold text-orange-500 text-lg leading-none">{groupData.workers}</div>
                           </div>
                        </div>

                        {/* Chevron */}
                        <div className={`p-2 rounded-full transition-all duration-300 ${isExpanded ? 'bg-blue-100 text-blue-600 rotate-180' : 'bg-slate-100 text-slate-400'}`}>
                           <ChevronDown size={20}/>
                        </div>
                     </div>
                  </div>

                  {/* EXPANDED CONTENT - TABLE */}
                  {isExpanded && (
                     <div className="border-t border-slate-100 animate-fade-in origin-top">
                        <div className="overflow-x-auto">
                           <table className="w-full text-left text-sm">
                              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 uppercase text-xs">
                                 <tr>
                                    <th className="px-6 py-3 font-semibold w-1/2">Должность / Специальность</th>
                                    <th className="px-6 py-3 font-semibold">Категория</th>
                                    <th className="px-6 py-3 font-semibold text-center">Количество</th>
                                    {isAdmin && <th className="px-6 py-3 font-semibold text-right w-24">Действия</th>}
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                 {groupData.items.map(person => {
                                    const isEditing = editingId === person.id;
                                    return (
                                       <tr key={person.id} className="hover:bg-blue-50/30 transition-colors group">
                                          <td className="px-6 py-3 font-medium text-slate-700">
                                             {isEditing ? (
                                                <input 
                                                   className="border p-1.5 rounded w-full text-sm outline-none focus:ring-2 ring-blue-500" 
                                                   value={editForm.role} 
                                                   onChange={e => setEditForm({...editForm, role: e.target.value})} 
                                                   autoFocus
                                                />
                                             ) : person.role}
                                          </td>
                                          <td className="px-6 py-3">
                                             {isEditing ? (
                                                <select 
                                                   className="border p-1.5 rounded w-full text-sm bg-white" 
                                                   value={editForm.type} 
                                                   onChange={e => setEditForm({...editForm, type: e.target.value as any})}
                                                >
                                                   <option value="ИТР">ИТР</option>
                                                   <option value="Рабочие">Рабочие</option>
                                                </select>
                                             ) : (
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${person.type === 'ИТР' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-orange-50 text-orange-700 border border-orange-100'}`}>
                                                   <div className={`w-1.5 h-1.5 rounded-full ${person.type === 'ИТР' ? 'bg-indigo-500' : 'bg-orange-500'}`}></div>
                                                   {person.type}
                                                </span>
                                             )}
                                          </td>
                                          <td className="px-6 py-3 text-center">
                                             {isEditing ? (
                                                <input 
                                                   type="number" 
                                                   className="border p-1.5 rounded w-16 text-center text-sm font-bold" 
                                                   value={editForm.count} 
                                                   onChange={e => setEditForm({...editForm, count: Number(e.target.value)})} 
                                                />
                                             ) : (
                                                <span className="font-bold text-slate-800">{person.count}</span>
                                             )}
                                          </td>
                                          {isAdmin && (
                                             <td className="px-6 py-3 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                   {isEditing ? (
                                                      <>
                                                         <button onClick={handleSave} className="p-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200"><Save size={14}/></button>
                                                         <button onClick={() => setEditingId(null)} className="p-1.5 bg-slate-100 text-slate-500 rounded hover:bg-slate-200"><X size={14}/></button>
                                                      </>
                                                   ) : (
                                                      <>
                                                         <button onClick={() => handleEditClick(person)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"><Edit2 size={14}/></button>
                                                         <button onClick={() => deleteWorkforce(person.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"><Trash2 size={14}/></button>
                                                      </>
                                                   )}
                                                </div>
                                             </td>
                                          )}
                                       </tr>
                                    );
                                 })}
                              </tbody>
                           </table>
                        </div>
                     </div>
                  )}
               </div>
            );
         })}
      </div>
    </div>
  );
};

export default Resources;
