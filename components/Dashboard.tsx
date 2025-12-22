import { supabase } from '../supabaseClient'
import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../services/DataContext';
import { Status, Section } from '../types';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend 
} from 'recharts';
import { AlertCircle, Users, Truck, FileCheck, Clock, AlertTriangle, CheckCircle, Briefcase } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [dbProgress, setDbProgress] = useState<number | null>(null)
  const { sections, workforce, machinery, calculateStatus, getProblemsForActiveWeek, activeWeek } = useData();
  const [currentDate, setCurrentDate] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
  const loadProgress = async () => {
    const { data, error } = await supabase
      .from('stats')
      .select('total_progress')
      .limit(1)
      .single()

    if (!error && data) {
      setDbProgress(data.total_progress)
    }
  }

  loadProgress()
}, [])

  // Metrics Calculation based on SECTIONS (Detailed Registry)
  const metrics = useMemo(() => {
    let totalVol = 0;
    let doneVol = 0;
    
    const kzh = { plan: 0, fact: 0 };
    const km = { plan: 0, fact: 0 };
    const other = { plan: 0, fact: 0 };

    const statusCounts = { [Status.ON_TRACK]: 0, [Status.RISK]: 0, [Status.DELAYED]: 0, [Status.COMPLETED]: 0, [Status.NOT_STARTED]: 0 };
    
    sections.forEach(t => {
      // Aggregation Logic
      if (t.section === Section.KZH || t.section === Section.KZH2 || t.section === 'КЖ' || t.section === 'КЖ2') {
        kzh.plan += t.totalVolume;
        kzh.fact += t.completedVolume;
      } else if (t.section === Section.KM || t.section === 'КМ') {
        km.plan += t.totalVolume;
        km.fact += t.completedVolume;
      } else {
        other.plan += t.totalVolume;
        other.fact += t.completedVolume;
      }

      const status = calculateStatus(t);
      if (statusCounts[status] !== undefined) {
        statusCounts[status]++;
      }
    });

    let totalProgressSum = 0;
    let itemsCount = 0;
    
    sections.forEach(t => {
        if (t.totalVolume > 0) {
            const p = Math.min(t.completedVolume / t.totalVolume, 1);
            totalProgressSum += p;
            itemsCount++;
        }
    });
    
    const overallProgress = itemsCount > 0 ? (totalProgressSum / itemsCount) * 100 : 0;

    const totalITR = workforce.filter(w => w.type === 'ИТР').reduce((acc, curr) => acc + curr.count, 0);
    const totalWorkers = workforce.filter(w => w.type === 'Рабочие').reduce((acc, curr) => acc + curr.count, 0);
    const totalStaff = totalITR + totalWorkers;

    const totalMachines = machinery.reduce((acc, curr) => acc + curr.count, 0);

    const kzhProgress = kzh.plan > 0 ? (kzh.fact / kzh.plan) * 100 : 0;
    const kmProgress = km.plan > 0 ? (km.fact / km.plan) * 100 : 0;

    return { 
      statusCounts, 
      totalStaff, totalITR, totalWorkers, totalMachines, 
      overallProgress, kzh, km,
      kzhProgress, kmProgress
    };
  }, [sections, workforce, machinery, calculateStatus]);

  // Pull problems strictly from the weekly records store for the ACTIVE WEEK only
  const problemItems = useMemo(() => getProblemsForActiveWeek(), [getProblemsForActiveWeek, activeWeek]);

  const statusData = [
    { name: 'В графике', value: metrics.statusCounts[Status.ON_TRACK], color: '#22c55e' },
    { name: 'Риск', value: metrics.statusCounts[Status.RISK], color: '#eab308' },
    { name: 'Отставание', value: metrics.statusCounts[Status.DELAYED], color: '#ef4444' },
  ];

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-2 gap-4">
        <h2 className="text-3xl font-bold text-slate-800">Обзор проекта</h2>
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200">
           <div className="p-2 bg-blue-50 rounded-full text-blue-600">
             <Clock size={20} />
           </div>
           <div className="text-right">
             <div className="text-xl font-bold text-slate-800 leading-none">
               {currentDate.toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'})}
             </div>
             <div className="text-xs text-slate-500 font-medium mt-1 uppercase tracking-wide">
               {currentDate.toLocaleDateString('ru-RU', {day: 'numeric', month: 'long', year: 'numeric'})}
             </div>
           </div>
        </div>
      </div>

      {/* Top Metrics Cards */}
      {/* Overall Progress */}
<div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
  <div>
    <p className="text-sm font-medium text-slate-500">Общий прогресс</p>
    <p className="text-3xl font-bold text-blue-600">
      {dbProgress !== null ? `${dbProgress.toFixed(1)}%` : '—'}
    </p>
  </div>
  <div className="p-3 bg-blue-50 rounded-full text-blue-600">
    <Briefcase size={24} />
  </div>
</div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* VOLUME DETAILS CARD (REPLACED OVERALL PROGRESS) */}
        <div 
          onClick={() => navigate('/sections')}
          className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors">Детализация объемов</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">КЖ (м³) + КМ (тн)</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-full text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
              <FileCheck size={24} />
            </div>
          </div>
          
          <div className="space-y-3 mt-1 pt-3 border-t border-slate-50">
             <div className="flex flex-col">
                <div className="flex justify-between items-center mb-1">
                   <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wide">Бетон (КЖ)</span>
                   <span className="text-xs font-bold text-blue-600">{metrics.kzhProgress.toFixed(1)}%</span>
                </div>
                <div className="text-[10px] text-slate-400 mb-1">
                  {metrics.kzh.fact.toLocaleString()} / {metrics.kzh.plan.toLocaleString()}
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full">
                    <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-700" style={{width: `${Math.min(metrics.kzhProgress, 100)}%`}}></div>
                </div>
             </div>
             
             <div className="flex flex-col">
                <div className="flex justify-between items-center mb-1">
                   <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wide">Металл (КМ)</span>
                   <span className="text-xs font-bold text-indigo-600">{metrics.kmProgress.toFixed(1)}%</span>
                </div>
                <div className="text-[10px] text-slate-400 mb-1">
                  {metrics.km.fact.toLocaleString()} / {metrics.km.plan.toLocaleString()}
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full">
                    <div className="bg-indigo-500 h-1.5 rounded-full transition-all duration-700" style={{width: `${Math.min(metrics.kmProgress, 100)}%`}}></div>
                </div>
             </div>
          </div>
        </div>

        {/* Workforce Card */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-sm font-medium text-slate-500">Людей на площадке</p>
              <p className="text-3xl font-bold text-slate-800">{metrics.totalStaff}</p>
            </div>
            <div className="p-3 bg-indigo-50 rounded-full text-indigo-600">
              <Users size={24} />
            </div>
          </div>
          <div className="flex items-center gap-4 mt-1 pt-3 border-t border-slate-50">
             <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wide">ИТР</span>
                <span className="text-sm font-bold text-indigo-600">{metrics.totalITR}</span>
             </div>
             <div className="w-px h-6 bg-slate-100"></div>
             <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wide">Рабочие</span>
                <span className="text-sm font-bold text-orange-500">{metrics.totalWorkers}</span>
             </div>
          </div>
        </div>

        {/* Machinery Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-sm font-medium text-slate-500">Техника</p>
            <p className="text-3xl font-bold text-slate-800">{metrics.totalMachines}</p>
          </div>
          <div className="p-3 bg-amber-50 rounded-full text-amber-600">
            <Truck size={24} />
          </div>
        </div>

        {/* Delayed Items Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-sm font-medium text-slate-500">Просрочено разделов</p>
            <p className={`text-3xl font-bold ${metrics.statusCounts[Status.DELAYED] > 0 ? 'text-red-500' : 'text-green-500'}`}>
              {metrics.statusCounts[Status.DELAYED]}
            </p>
          </div>
          <div className={`p-3 rounded-full ${metrics.statusCounts[Status.DELAYED] > 0 ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
            <AlertCircle size={24} />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Status Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-96 flex flex-col">
          <h3 className="text-lg font-semibold mb-4 text-slate-700">Статус по разделам</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Problems from Active Week */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col h-96">
          <h3 className="text-lg font-semibold mb-4 text-slate-700 flex items-center justify-between">
             <span className="flex items-center gap-2"><AlertTriangle className="text-red-500" size={20}/> Проблемные вопросы</span>
             <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-slate-400">Неделя:</span>
                <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">{activeWeek}</span>
             </div>
          </h3>
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
            {problemItems.length > 0 ? (
               <div className="space-y-3">
                 {problemItems.map((t, idx) => (
                   <div key={`${t.id}-${idx}`} className="p-3 bg-red-50 rounded-lg border border-red-100 text-sm animate-fade-in shadow-sm">
                      <div className="flex justify-between items-start mb-1">
                         <div className="font-bold text-slate-800 text-xs flex gap-1 items-center">
                            <span className="bg-white border border-red-200 px-1.5 rounded text-red-600">{t.id}</span>
                            <span>{t.name}</span>
                         </div>
                         <span className="text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 whitespace-nowrap ml-2">{t.manager}</span>
                      </div>
                      <div className="flex items-start gap-2 mt-2">
                         <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5"/>
                         <p className="text-red-800 text-xs leading-relaxed font-medium">
                            {t.problem}
                         </p>
                      </div>
                   </div>
                 ))}
               </div>
            ) : (
               <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <CheckCircle size={48} className="mb-4 text-green-500 opacity-20"/>
                  <p className="font-medium text-sm">Проблемных вопросов не зафиксировано</p>
                  <p className="text-xs text-slate-400 mt-1">Все работы идут в штатном режиме</p>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
