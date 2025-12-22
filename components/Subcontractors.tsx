
import React, { useState, useMemo } from 'react';
import { useData } from '../services/DataContext';
import { Status, WorkforceData, TitleData } from '../types';
import { ChevronDown, User, Users, HardHat, FileText, Search, Plus, Edit2, Trash2, Save, X, Check, Phone, FileSignature, Calendar, Briefcase } from 'lucide-react';

// Static metadata extracted from PDF
interface SubcontractorMeta {
    contact: string;
    phone?: string;
    contractNo?: string;
    contractDate?: string;
    status: 'Подписан' | 'В работе' | 'Не подписан';
    subject?: string;
}

const SUBCONTRACTOR_DETAILS: Record<string, SubcontractorMeta> = {
    'ИП Рахим': { contact: 'Рахим Нұртай Ержанұлы', phone: '8 701 944 77 99', contractNo: 'б/н', contractDate: '17.09.2025', status: 'Подписан', subject: 'засыпка фрезированного' },
    'ТОО IST-Q': { contact: 'Рахим Нұртай Ержанұлы', phone: '8 701 944 77 99', contractNo: '859-РП', contractDate: '30.09.2025', status: 'Подписан', subject: 'металлоконструкция' },
    'ТОО Baibol': { contact: 'МОЛДАБЕКОВ КАНАТБЕК', contractNo: '16/10-01', contractDate: '16.10.2025', status: 'Подписан', subject: 'бетонная подготовка' },
    'ТОО ЕвроСтройТехнология': { contact: 'ТЕМІРБЕК ҚУАТ АНАРБЕКҰЛЫ', contractNo: '16/10-02', contractDate: '16.10.2025', status: 'Подписан', subject: 'монолитные работы титул 1.1' },
    'ТОО АТАМЕКЕН-ҚС': { contact: 'АДИЛЬБЕКОВ ПОЛАТБЕК', contractNo: '914-РП', contractDate: '17.10.2025', status: 'Подписан', subject: 'устройство ж/б монолит' },
    'ТОО Q17 CONSTRUCTION': { contact: 'ЕШЕНОВ ДАУРЕНБЕК', contractNo: '918-рп', contractDate: '20.10.2025', status: 'Подписан', subject: 'изготовление и монтаж' },
    'ТОО SST Building Co.': { contact: 'МОМИНОВ АСАН', contractNo: '29/10-02', contractDate: '29.10.2025', status: 'Подписан', subject: 'монолитные работы титул 42' },
    'ТОО «KTB Partners»': { contact: 'ТЁ ЛАРИСА АФАНАСЬЕВНА', contractNo: '1005-РП', contractDate: '20.11.2025', status: 'Подписан', subject: 'Титул под ключ' },
    'ТОО QPARK group': { contact: 'АМАНКЕЛДІ КАХАРМАН', contractNo: '1007-РП', contractDate: '20.11.2025', status: 'Подписан', subject: 'Титул 24 под ключ' },
    'ТОО Адал Жарық Құрылыс': { contact: 'УТЕПБЕРГЕНОВ АРДАК', contractNo: '1008-РП', contractDate: '20.11.2025', status: 'Подписан', subject: 'Титул 38 под ключ' },
    'ТОО NUR-AKHMED GROUP': { contact: 'АСТАНАКУЛОВ НУРЖАН', contractNo: '1009-РП', contractDate: '20.11.2025', status: 'Подписан', subject: 'Титул 48 под ключ' },
    'ТОО Ancon': { contact: 'МАМЫТОВ НУРЖАН', contractNo: '29/10-01', contractDate: '29.10.2025', status: 'Подписан', subject: 'монолитные работы титул 1.2' },
    'ТОО KazBuildPartner': { contact: 'ТАУКЕЕВ НУРТАС', contractNo: '961-РП', contractDate: '31.10.2025', status: 'Подписан', subject: 'изготовление и монтаж' },
    'ИП Жігер': { contact: 'АЙТЖАНОВА МАЙРА', contractNo: '05/11-01', contractDate: '05.11.2025', status: 'Подписан', subject: 'алмазное сверление' },
    'ТОО Центр противопожарных': { contact: 'ГАСАНОВА ГУЛСАХАР', contractNo: '07/10-02', contractDate: '07.10.2025', status: 'Подписан', subject: 'покраска м/к' },
    'ТОО Блиц-Монтаж': { contact: 'БИЖАНОВ САНЖАРХАН', contractNo: '24/11-01', contractDate: '24.11.2025', status: 'Подписан', subject: 'монолитные работы' },
};

const Subcontractors: React.FC = () => {
  const { titles, workforce, calculateStatus, isAdmin, renameSubcontractor, deleteSubcontractor, addWorkforce } = useData();
  const [expandedSubs, setExpandedSubs] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  
  // Management State
  const [isAdding, setIsAdding] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [editingSub, setEditingSub] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState('');

  // Aggregate Data
  const subsMap: Record<string, { 
    total: number, 
    completed: number, 
    count: number, 
    delayed: number,
    titles: TitleData[],
    managers: Set<string>
  }> = {};

  // 1. Process Titles
  titles.forEach(t => {
    const sub = t.subcontractor && t.subcontractor.trim() !== '' ? t.subcontractor : 'Не назначен';
    if (!subsMap[sub]) {
      subsMap[sub] = { 
        total: 0, 
        completed: 0, 
        count: 0, 
        delayed: 0,
        titles: [],
        managers: new Set<string>()
      };
    }
    subsMap[sub].total += t.totalVolume;
    subsMap[sub].completed += t.completedVolume;
    subsMap[sub].count += 1;
    subsMap[sub].titles.push(t);
    if (t.manager) subsMap[sub].managers.add(t.manager);

    if (calculateStatus(t) === Status.DELAYED) {
      subsMap[sub].delayed += 1;
    }
  });

  // 2. Process Workforce
  workforce.forEach(w => {
     const org = w.organization && w.organization.trim() !== '' ? w.organization : 'Неизвестно';
     if (!subsMap[org]) {
        subsMap[org] = {
           total: 0, 
           completed: 0, 
           count: 0, 
           delayed: 0,
           titles: [],
           managers: new Set<string>()
        };
     }
  });

  const subsList = Object.entries(subsMap).map(([name, data]) => ({ name, ...data }));

  const filteredSubs = useMemo(() => {
    return subsList.filter(s => {
       const meta = SUBCONTRACTOR_DETAILS[s.name];
       const searchLower = searchTerm.toLowerCase();
       return s.name.toLowerCase().includes(searchLower) || 
              (meta && meta.contact.toLowerCase().includes(searchLower)) ||
              (meta && meta.contractNo?.toLowerCase().includes(searchLower));
    }).sort((a,b) => {
        // Sort by Contract date if available, else by volume
        const dateA = SUBCONTRACTOR_DETAILS[a.name]?.contractDate?.split('.').reverse().join('-');
        const dateB = SUBCONTRACTOR_DETAILS[b.name]?.contractDate?.split('.').reverse().join('-');
        if (dateA && dateB) return dateB.localeCompare(dateA);
        return b.total - a.total;
    });
  }, [subsList, searchTerm]);

  const getWorkforceStats = (subName: string) => {
    const relevant = workforce.filter(w => 
       w.organization.toLowerCase() === subName.toLowerCase() || 
       subName.toLowerCase().includes(w.organization.toLowerCase())
    );

    const itr = relevant.filter(w => w.type === 'ИТР').reduce((acc, c) => acc + c.count, 0);
    const workers = relevant.filter(w => w.type === 'Рабочие').reduce((acc, c) => acc + c.count, 0);
    return { itr, workers };
  };

  const getStatusColor = (status: Status) => {
    switch(status) {
      case Status.ON_TRACK: return 'text-green-600 bg-green-50';
      case Status.RISK: return 'text-yellow-600 bg-yellow-50';
      case Status.DELAYED: return 'text-red-600 bg-red-50';
      case Status.COMPLETED: return 'text-slate-600 bg-slate-100';
      default: return 'text-slate-500 bg-slate-50';
    }
  };

  const toggleExpand = (name: string) => {
    setExpandedSubs(prev => {
        const next = new Set(prev);
        if (next.has(name)) next.delete(name);
        else next.add(name);
        return next;
    });
  };

  // --- Handlers ---

  const handleAddSub = () => {
     if (newSubName.trim()) {
        const placeholder: WorkforceData = {
           id: Date.now().toString(),
           organization: newSubName.trim(),
           role: 'Основной состав',
           type: 'Рабочие',
           count: 0
        };
        addWorkforce(placeholder);
        setNewSubName('');
        setIsAdding(false);
     }
  };

  const startEditing = (name: string, e: React.MouseEvent) => {
     e.stopPropagation();
     setEditingSub(name);
     setEditNameValue(name);
  };

  const saveEditing = (oldName: string, e: React.MouseEvent) => {
     e.stopPropagation();
     if (editNameValue.trim() && editNameValue !== oldName) {
        renameSubcontractor(oldName, editNameValue.trim());
     }
     setEditingSub(null);
  };

  const cancelEditing = (e: React.MouseEvent) => {
     e.stopPropagation();
     setEditingSub(null);
  };

  const handleDelete = (name: string, e: React.MouseEvent) => {
     e.stopPropagation();
     if (window.confirm(`Вы уверены, что хотите удалить субподрядчика "${name}"? Это очистит привязку у всех титулов и удалит персонал.`)) {
        deleteSubcontractor(name);
     }
  };

  return (
    <div className="p-6 min-h-screen bg-slate-50">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
         <h2 className="text-3xl font-bold text-slate-800">Реестр Субподрядчиков</h2>
         
         <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm">
               <Search size={16} className="text-slate-400"/>
               <input 
                   className="bg-transparent text-sm outline-none text-slate-600 placeholder:text-slate-400 w-48 md:w-64"
                   placeholder="Поиск по названию, договору..."
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
               />
            </div>
            
            {isAdmin && (
               <button 
                  onClick={() => setIsAdding(!isAdding)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm text-sm"
               >
                  <Plus size={18}/> Добавить
               </button>
            )}
         </div>
      </div>

      {isAdding && isAdmin && (
         <div className="max-w-xl mx-auto mb-6 bg-white p-4 rounded-xl shadow-sm border border-blue-100 flex items-center gap-4 animate-fade-in">
            <div className="flex-1">
               <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Название организации</label>
               <input 
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Введите название..."
                  value={newSubName}
                  onChange={e => setNewSubName(e.target.value)}
                  autoFocus
               />
            </div>
            <div className="flex gap-2 mt-5">
               <button onClick={handleAddSub} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium">Сохранить</button>
               <button onClick={() => setIsAdding(false)} className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium">Отмена</button>
            </div>
         </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredSubs.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
               <p>Субподрядчики не найдены</p>
            </div>
        )}

        {filteredSubs.map((sub) => {
          const progress = sub.total > 0 ? (sub.completed / sub.total) * 100 : 0;
          const isExpanded = expandedSubs.has(sub.name);
          const isEditing = editingSub === sub.name;
          const { itr, workers } = getWorkforceStats(sub.name);
          const meta = SUBCONTRACTOR_DETAILS[sub.name];
          
          return (
            <div key={sub.name} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow">
               {/* Card Header */}
               <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-start">
                   <div className="flex-1 mr-2">
                       {isEditing ? (
                           <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                              <input 
                                 className="w-full border border-blue-300 rounded px-2 py-1 text-sm font-bold text-slate-800 outline-none focus:ring-2 ring-blue-500"
                                 value={editNameValue}
                                 onChange={e => setEditNameValue(e.target.value)}
                                 autoFocus
                              />
                              <button onClick={(e) => saveEditing(sub.name, e)} className="p-1 bg-green-100 text-green-700 rounded hover:bg-green-200"><Check size={14}/></button>
                              <button onClick={(e) => cancelEditing(e)} className="p-1 bg-slate-100 text-slate-500 rounded hover:bg-slate-200"><X size={14}/></button>
                           </div>
                       ) : (
                          <div className="group flex items-center gap-2">
                             <h3 className="font-bold text-lg text-slate-800 leading-tight">{sub.name}</h3>
                             {isAdmin && (
                                <button onClick={(e) => startEditing(sub.name, e)} className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-blue-600 transition-opacity">
                                   <Edit2 size={12}/>
                                </button>
                             )}
                          </div>
                       )}
                       {meta?.subject && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-1" title={meta.subject}>{meta.subject}</p>
                       )}
                   </div>
                   <div className="shrink-0 flex flex-col items-end gap-1">
                      {meta ? (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${meta.status === 'Подписан' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-yellow-50 text-yellow-700 border-yellow-100'}`}>
                             {meta.status}
                          </span>
                      ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border bg-slate-50 text-slate-500 border-slate-100">Нет данных</span>
                      )}
                      {isAdmin && !isEditing && (
                         <button onClick={(e) => handleDelete(sub.name, e)} className="text-slate-300 hover:text-red-500 transition-colors p-1" title="Удалить"><Trash2 size={14}/></button>
                      )}
                   </div>
               </div>

               {/* Card Body */}
               <div className="p-4 flex-1 space-y-4">
                  {/* Contract Info */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                     <div className="bg-blue-50/50 p-2 rounded border border-blue-50">
                        <div className="text-slate-400 mb-0.5 flex items-center gap-1"><FileSignature size={10}/> Договор</div>
                        <div className="font-semibold text-slate-700">{meta?.contractNo || '-'}</div>
                     </div>
                     <div className="bg-blue-50/50 p-2 rounded border border-blue-50">
                        <div className="text-slate-400 mb-0.5 flex items-center gap-1"><Calendar size={10}/> Дата</div>
                        <div className="font-semibold text-slate-700">{meta?.contractDate || '-'}</div>
                     </div>
                  </div>

                  {/* Contact Info */}
                  <div>
                      <div className="flex items-center gap-2 mb-1">
                          <User size={14} className="text-slate-400"/>
                          <span className="text-sm font-medium text-slate-700 truncate">{meta?.contact || 'Контакт не указан'}</span>
                      </div>
                      {meta?.phone && (
                          <div className="flex items-center gap-2">
                             <Phone size={14} className="text-slate-400"/>
                             <span className="text-sm text-slate-600">{meta.phone}</span>
                          </div>
                      )}
                  </div>
                  
                  {/* Progress Bar */}
                  <div>
                      <div className="flex justify-between text-xs mb-1">
                         <span className="text-slate-500">Прогресс работ</span>
                         <span className="font-bold text-slate-800">{progress.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                         <div className={`h-full ${sub.delayed > 0 ? 'bg-red-500' : 'bg-blue-600'}`} style={{width: `${Math.min(progress, 100)}%`}}></div>
                      </div>
                      <div className="flex justify-between mt-1 text-[10px] text-slate-400">
                          <span>{sub.count} Титулов</span>
                          {sub.delayed > 0 && <span className="text-red-500 font-bold">{sub.delayed} Просрочено</span>}
                      </div>
                  </div>
                  
                  {/* Staff Pills */}
                  <div className="flex gap-2 pt-2 border-t border-slate-50">
                     <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 text-xs font-medium text-slate-600">
                        <HardHat size={12}/> {itr} ИТР
                     </span>
                     <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 text-xs font-medium text-slate-600">
                        <Users size={12}/> {workers} Раб.
                     </span>
                  </div>
               </div>

               {/* Footer / Expansion */}
               <div>
                 <button 
                    onClick={() => toggleExpand(sub.name)}
                    className={`w-full py-2 text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-1 hover:bg-slate-50 transition-colors border-t border-slate-100 ${isExpanded ? 'text-blue-600 bg-slate-50' : 'text-slate-500'}`}
                 >
                    {isExpanded ? 'Скрыть титулы' : 'Показать титулы'}
                    <ChevronDown size={14} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}/>
                 </button>
                 
                 {isExpanded && (
                    <div className="bg-slate-50 p-3 border-t border-slate-100 max-h-60 overflow-y-auto custom-scrollbar">
                       {sub.titles.length > 0 ? (
                           <ul className="space-y-2">
                              {sub.titles.map(t => {
                                 const st = calculateStatus(t);
                                 return (
                                    <li key={t.id} className="bg-white p-2 rounded border border-slate-100 text-xs shadow-sm">
                                       <div className="flex justify-between items-start mb-1">
                                          <span className="font-bold text-slate-700">{t.id}</span>
                                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                              st === Status.DELAYED ? 'bg-red-100 text-red-600' : 
                                              st === Status.ON_TRACK ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'
                                          }`}>{st}</span>
                                       </div>
                                       <div className="text-slate-600 line-clamp-2 mb-1">{t.name}</div>
                                       <div className="text-slate-400 text-[10px]">Срок: {new Date(t.deadline).toLocaleDateString()}</div>
                                    </li>
                                 )
                              })}
                           </ul>
                       ) : (
                           <div className="text-center text-xs text-slate-400 py-2">Нет привязанных титулов</div>
                       )}
                    </div>
                 )}
               </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Subcontractors;
