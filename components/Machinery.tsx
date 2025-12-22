
import React, { useState, useMemo } from 'react';
import { useData } from '../services/DataContext';
import { MachineryData } from '../types';
import { Truck, Plus, Trash2, Save, X, Edit2, UploadCloud, Search, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import DataImportModal from './DataImportModal';

const Machinery: React.FC = () => {
  const { machinery, addMachinery, updateMachinery, deleteMachinery, isAdmin } = useData();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<MachineryData>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [newMachine, setNewMachine] = useState<Partial<MachineryData>>({ count: 1 });
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocation, setFilterLocation] = useState('all');

  const uniqueLocations = useMemo(() => {
    return Array.from(new Set(machinery.map(m => m.location).filter(l => l && l.trim() !== ''))).sort();
  }, [machinery]);

  const filteredMachinery = useMemo(() => {
    return machinery.filter(m => {
      const searchMatch = searchTerm === '' || 
                          m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (m.notes && m.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      const locMatch = filterLocation === 'all' || m.location === filterLocation;
      return searchMatch && locMatch;
    });
  }, [machinery, searchTerm, filterLocation]);

  const chartData = filteredMachinery.map(m => ({ name: m.name, count: m.count }));

  const handleCreate = () => {
    if (newMachine.name && newMachine.count) {
      addMachinery({ ...newMachine, id: Date.now().toString(), notes: newMachine.notes || '' } as MachineryData);
      setIsAdding(false);
      setNewMachine({ count: 1 });
    }
  };

  const handleEditClick = (machine: MachineryData) => {
    setEditingId(machine.id);
    setEditForm(machine);
  };

  const handleSave = () => {
    if(editingId) {
      updateMachinery(editingId, editForm);
      setEditingId(null);
    }
  }

  return (
    <div className="p-6 min-h-screen bg-slate-50">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
         <h2 className="text-3xl font-bold text-slate-800">Техника и Оборудование</h2>
         
         <div className="flex gap-2 flex-wrap items-center">
             {/* Search */}
             <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm">
                <Search size={16} className="text-slate-400"/>
                <input 
                    className="bg-transparent text-sm outline-none text-slate-600 placeholder:text-slate-400 w-32 md:w-48"
                    placeholder="Поиск техники..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
             </div>

             {/* Location Filter */}
             <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm">
                 <Filter size={16} className="text-slate-400"/>
                 <select 
                   className="bg-transparent text-sm outline-none text-slate-600"
                   value={filterLocation}
                   onChange={e => setFilterLocation(e.target.value)}
                 >
                    <option value="all">Все локации</option>
                    {uniqueLocations.map(l => <option key={l} value={l}>{l}</option>)}
                 </select>
             </div>

             {isAdmin && (
                 <button 
                    onClick={() => setShowImportModal(true)}
                    className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm text-sm"
                  >
                    <UploadCloud size={18} /> Импорт
                  </button>
             )}
         </div>
      </div>

      <DataImportModal 
        isOpen={showImportModal} 
        onClose={() => setShowImportModal(false)} 
        title="Загрузка данных"
      />

      {/* Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
        <h3 className="text-lg font-semibold text-slate-700 mb-4">Распределение техники (по фильтру)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{bottom: 20}}>
              <XAxis dataKey="name" stroke="#94a3b8" angle={-45} textAnchor="end" height={60} interval={0} fontSize={12} />
              <YAxis stroke="#94a3b8" />
              <Tooltip cursor={{fill: '#f1f5f9'}} />
              <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]}>
                 {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#f59e0b' : '#d97706'} />
                 ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-slate-700">Список техники</h3>
        {isAdmin && (
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
          >
            <Plus size={18} /> Добавить
          </button>
        )}
      </div>

      {isAdding && isAdmin && (
         <div className="bg-white p-4 rounded-lg shadow mb-4 border border-blue-100 flex gap-4 flex-wrap items-end animate-fade-in">
            <div className="flex flex-col gap-1 flex-grow">
              <label className="text-xs font-semibold text-slate-500">Название</label>
              <input className="border p-2 rounded w-full" value={newMachine.name || ''} onChange={e => setNewMachine({...newMachine, name: e.target.value})} placeholder="например, Экскаватор" />
            </div>
            <div className="flex flex-col gap-1 w-24">
              <label className="text-xs font-semibold text-slate-500">Кол-во</label>
              <input type="number" className="border p-2 rounded" value={newMachine.count} onChange={e => setNewMachine({...newMachine, count: Number(e.target.value)})} />
            </div>
            <div className="flex flex-col gap-1 flex-grow">
              <label className="text-xs font-semibold text-slate-500">Дислокация</label>
              <input className="border p-2 rounded w-full" value={newMachine.location || ''} onChange={e => setNewMachine({...newMachine, location: e.target.value})} placeholder="где находится" />
            </div>
            <div className="flex flex-col gap-1 flex-grow">
              <label className="text-xs font-semibold text-slate-500">Примечание</label>
              <input className="border p-2 rounded w-full" value={newMachine.notes || ''} onChange={e => setNewMachine({...newMachine, notes: e.target.value})} placeholder="примечание" />
            </div>
            <button onClick={handleCreate} className="bg-green-600 text-white px-4 py-2 rounded h-10 hover:bg-green-700">Сохранить</button>
            <button onClick={() => setIsAdding(false)} className="bg-slate-200 text-slate-700 px-4 py-2 rounded h-10 hover:bg-slate-300">Отмена</button>
         </div>
      )}

      {/* Table View */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 uppercase text-xs font-bold tracking-wider">
                <th className="p-4 border-b">Наименование</th>
                <th className="p-4 border-b text-center w-24">Кол-во</th>
                <th className="p-4 border-b">Дислокация</th>
                <th className="p-4 border-b">Примечание</th>
                {isAdmin && <th className="p-4 border-b text-center w-32">Действия</th>}
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredMachinery.length === 0 ? (
                <tr>
                   <td colSpan={5} className="p-8 text-center text-slate-500">Техника не найдена по заданным критериям.</td>
                </tr>
              ) : filteredMachinery.map((machine) => {
                const isEditing = editingId === machine.id;
                return (
                  <tr key={machine.id} className="hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors">
                    <td className="p-4 font-medium text-slate-800">
                      {isEditing ? (
                        <input className="border p-1 rounded w-full" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                      ) : (
                        <div className="flex items-center gap-3">
                           <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                              <Truck size={18} />
                           </div>
                           {machine.name}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {isEditing ? (
                        <input type="number" className="border p-1 rounded w-16 text-center" value={editForm.count} onChange={e => setEditForm({...editForm, count: Number(e.target.value)})} />
                      ) : (
                        <span className="font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full">{machine.count}</span>
                      )}
                    </td>
                    <td className="p-4 text-slate-600">
                      {isEditing ? (
                        <input className="border p-1 rounded w-full" value={editForm.location} onChange={e => setEditForm({...editForm, location: e.target.value})} />
                      ) : (
                        machine.location || '-'
                      )}
                    </td>
                    <td className="p-4 text-slate-500 italic">
                      {isEditing ? (
                        <input className="border p-1 rounded w-full text-xs" value={editForm.notes} onChange={e => setEditForm({...editForm, notes: e.target.value})} />
                      ) : (
                        machine.notes || ''
                      )}
                    </td>
                    {isAdmin && (
                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-2">
                          {isEditing ? (
                            <>
                              <button onClick={handleSave} className="text-green-600 hover:bg-green-50 p-2 rounded"><Save size={16} /></button>
                              <button onClick={() => setEditingId(null)} className="text-slate-400 hover:bg-slate-100 p-2 rounded"><X size={16} /></button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => handleEditClick(machine)} className="text-blue-600 hover:bg-blue-50 p-2 rounded"><Edit2 size={16} /></button>
                              <button onClick={() => deleteMachinery(machine.id)} className="text-red-400 hover:bg-red-50 p-2 rounded"><Trash2 size={16} /></button>
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-50 font-bold text-slate-700 border-t border-slate-200">
               <tr>
                  <td className="p-4 text-right uppercase text-xs tracking-wider">Итого (ед.):</td>
                  <td className="p-4 text-center text-lg">{filteredMachinery.reduce((acc, m) => acc + m.count, 0)}</td>
                  <td colSpan={3}></td>
               </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Machinery;
