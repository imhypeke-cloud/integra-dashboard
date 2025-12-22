
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useData } from '../services/DataContext';
import { 
  LayoutDashboard, 
  Users, 
  HardHat, 
  Truck, 
  LogOut,
  LogIn,
  Lock,
  Map,
  X,
  Database,
  ClipboardList,
  Settings,
  Eye,
  EyeOff,
  Layers,
  FileText
} from 'lucide-react';
import DataImportModal from './DataImportModal';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { isAdmin, login, logout, hiddenSections, toggleSection } = useData();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const navClass = ({ isActive }: { isActive: boolean }) => 
    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
      isActive 
        ? 'bg-blue-600 text-white shadow-md' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(password)) {
      setShowLoginModal(false);
      setPassword('');
      setError(false);
    } else {
      setError(true);
    }
  };

  const NAV_ITEMS = [
    { path: "/dashboard", label: "Общий статус", icon: <LayoutDashboard size={20} /> },
    { path: "/execution-summary", label: "Сводка выполнения", icon: <FileText size={20} /> },
    { path: "/genplan", label: "Генплан (Карта)", icon: <Map size={20} /> },
    { path: "/sections", label: "Титулы", icon: <Layers size={20} /> },
    { path: "/weekly", label: "Недельный план", icon: <ClipboardList size={20} /> },
    { path: "/resources", label: "Людские ресурсы", icon: <Users size={20} /> },
    { path: "/subcontractors", label: "Субподрядчики", icon: <HardHat size={20} /> },
    { path: "/machinery", label: "Техника", icon: <Truck size={20} /> },
  ];

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={onClose}
      />

      <div 
        className={`fixed top-0 left-0 bottom-0 w-64 bg-slate-900 h-screen flex flex-col flex-shrink-0 text-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* LOGO HEADER */}
        <div className="p-5 border-b border-slate-700 bg-slate-900 flex justify-between items-start">
          <div className="flex flex-col w-full">
             {/* Image Logo Section */}
             <div className="mb-3">
                <img 
                  src="logo.png" 
                  alt="INTEGRA CONSTRUCTION" 
                  className="h-14 w-auto object-contain max-w-[180px]"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fallback = document.getElementById('logo-fallback');
                    if (fallback) fallback.classList.remove('hidden');
                  }}
                />
                <div id="logo-fallback" className="hidden text-xl font-black text-white tracking-wide">
                  INTEGRA CONSTRUCTION
                </div>
             </div>
             
             {/* Subtitle Section */}
             <div>
                <div className="h-px w-full bg-slate-700 mb-2"></div>
                <span className="text-[10px] text-blue-500 font-bold uppercase tracking-wider block">ПГУ Туркестан</span>
             </div>
          </div>
          <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white mt-1 ml-2"><X size={24} /></button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          {NAV_ITEMS.map((item) => {
             const isHidden = hiddenSections.includes(item.path);
             // If not admin and hidden, don't show
             if (!isAdmin && isHidden) return null;
             
             return (
               <div key={item.path} className="relative group">
                 <NavLink to={item.path} className={({isActive}) => `${navClass({isActive})} ${isHidden ? 'opacity-50' : ''}`} onClick={onClose}>
                    {item.icon}
                    <span>{item.label}</span>
                 </NavLink>
                 {isAdmin && isHidden && (
                    <span className="absolute right-3 top-3 text-red-500 pointer-events-none">
                       <EyeOff size={16}/>
                    </span>
                 )}
               </div>
             );
          })}
        </nav>

        <div className="p-4 border-t border-slate-700 bg-slate-900 space-y-2">
          {isAdmin ? (
            <>
              <button onClick={() => setShowSettingsModal(true)} className="flex items-center gap-3 px-4 py-2 w-full text-left text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition-colors text-sm">
                <Settings size={18} /><span>Настройка разделов</span>
              </button>
              <button onClick={() => setShowDataModal(true)} className="flex items-center gap-3 px-4 py-2 w-full text-left text-blue-400 hover:bg-slate-800 rounded-lg transition-colors text-sm">
                <Database size={18} /><span>Управление данными</span>
              </button>
              <button onClick={() => { logout(); onClose(); }} className="flex items-center gap-3 px-4 py-2 w-full text-left text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-sm">
                <LogOut size={18} /><span>Выйти (Админ)</span>
              </button>
            </>
          ) : (
            <button onClick={() => setShowLoginModal(true)} className="flex items-center gap-3 px-4 py-3 w-full text-left text-slate-400 hover:bg-slate-800 rounded-lg transition-colors">
              <LogIn size={20} /><span>Вход (Редактор)</span>
            </button>
          )}
        </div>
      </div>

      {showLoginModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-sm border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Lock size={20} className="text-blue-600"/> Вход в систему</h3>
              <button onClick={() => setShowLoginModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">✕</button>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <input type="password" className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none" value={password} onChange={e => setPassword(e.target.value)} autoFocus placeholder="Введите пароль (admin)" />
              {error && <p className="text-red-500 text-sm">Неверный пароль</p>}
              <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium">Войти</button>
            </form>
          </div>
        </div>
      )}

      {showSettingsModal && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70]">
            <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md border border-slate-200">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Settings size={20} className="text-slate-600"/> Видимость разделов</h3>
                  <button onClick={() => setShowSettingsModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">✕</button>
               </div>
               <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  {NAV_ITEMS.map(item => {
                     const isHidden = hiddenSections.includes(item.path);
                     return (
                        <div key={item.path} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 hover:bg-slate-100 transition-colors">
                           <div className="flex items-center gap-3 text-slate-700">
                              {item.icon}
                              <span className="font-medium">{item.label}</span>
                           </div>
                           <button 
                             onClick={() => toggleSection(item.path)}
                             className={`p-2 rounded-lg transition-colors ${isHidden ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}
                             title={isHidden ? "Показать" : "Скрыть"}
                           >
                              {isHidden ? <EyeOff size={18} /> : <Eye size={18} />}
                           </button>
                        </div>
                     )
                  })}
               </div>
               <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-400 text-center">
                  Скрытые разделы доступны только в режиме администратора.
               </div>
            </div>
         </div>
      )}

      {/* Reusable Data Import Modal */}
      <DataImportModal 
        isOpen={showDataModal} 
        onClose={() => setShowDataModal(false)} 
      />
    </>
  );
};

export default Sidebar;
