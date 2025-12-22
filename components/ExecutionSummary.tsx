
import React from 'react';
import { FileText, CheckCircle2, BarChart3, ArrowRight } from 'lucide-react';

interface ExecutionRow {
  no: string;
  name: string;
  unit: string;
  total: number;
  completed: number;
  remaining: number;
  integraCompleted: number;
  type: 'main' | 'sub';
}

const SUMMARY_DATA: ExecutionRow[] = [
  { no: '1', name: 'Раздел КЖ', unit: 'м3', total: 107815.16, completed: 76500, remaining: 31315.16, integraCompleted: 12636, type: 'main' },
  { no: '2', name: 'Вертикальная планировка: выемка грунта', unit: 'м3', total: 0, completed: 230204, remaining: 0, integraCompleted: 4365, type: 'sub' },
  { no: '3', name: 'Насыпь грунта', unit: 'м3', total: 256834, completed: 107232, remaining: 149602, integraCompleted: 1339, type: 'sub' },
  { no: '4', name: 'Разработка котлована', unit: 'м3', total: 0, completed: 477411, remaining: 0, integraCompleted: 50844, type: 'sub' },
  { no: '5', name: 'Обратная засыпка пазух котлованов', unit: 'м3', total: 0, completed: 275593, remaining: 0, integraCompleted: 59088, type: 'sub' },
  { no: '6', name: 'Раздел КМ', unit: 'тн.', total: 20632.48, completed: 4670.31, remaining: 15962.17, integraCompleted: 1277, type: 'main' },
  { no: '9', name: 'Монтаж Сэндвич панели', unit: 'м2', total: 55853, completed: 7778, remaining: 48075, integraCompleted: 4483, type: 'main' },
  { no: '10', name: 'Монтаж оцинкованный профлист', unit: 'м2', total: 0, completed: 3592, remaining: 0, integraCompleted: 3514, type: 'sub' },
];

const ExecutionSummary: React.FC = () => {
  // Вычисление прогресса для карточек
  const kzhProgress = (76500 / 107815.16) * 100;
  const kmProgress = (4670.31 / 20632.48) * 100;
  const sandwichProgress = (7778 / 55853) * 100;

  return (
    <div className="p-6 min-h-screen bg-slate-50 font-sans">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-600 text-white rounded-lg shadow-lg">
            <FileText size={24} />
          </div>
          <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Сводка выполнения</h2>
        </div>
        <p className="text-slate-500 font-medium ml-12">
          Данные по состоянию на <span className="text-blue-600 font-bold">12.12.2025г.</span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-1">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Выполнено КЖ</p>
                <span className="text-xs font-bold text-blue-600">{kzhProgress.toFixed(1)}%</span>
            </div>
            <h3 className="text-3xl font-black text-slate-800">76 500 <span className="text-sm font-normal text-slate-400">м³</span></h3>
          </div>
          <div className="mt-4 w-full bg-slate-100 h-2 rounded-full overflow-hidden shadow-inner">
            <div className="bg-blue-600 h-full transition-all duration-1000" style={{ width: `${kzhProgress}%` }}></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-1">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Выполнено КМ</p>
                <span className="text-xs font-bold text-orange-500">{kmProgress.toFixed(1)}%</span>
            </div>
            <h3 className="text-3xl font-black text-slate-800">4 670,3 <span className="text-sm font-normal text-slate-400">тн</span></h3>
          </div>
          <div className="mt-4 w-full bg-slate-100 h-2 rounded-full overflow-hidden shadow-inner">
            <div className="bg-orange-500 h-full transition-all duration-1000" style={{ width: `${kmProgress}%` }}></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-1">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Сэндвич панели</p>
                <span className="text-xs font-bold text-indigo-600">{sandwichProgress.toFixed(1)}%</span>
            </div>
            <h3 className="text-3xl font-black text-slate-800">7 778 <span className="text-sm font-normal text-slate-400">м²</span></h3>
          </div>
          <div className="mt-4 w-full bg-slate-100 h-2 rounded-full overflow-hidden shadow-inner">
            <div className="bg-indigo-600 h-full transition-all duration-1000" style={{ width: `${sandwichProgress}%` }}></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden shadow-lg">
        <div className="bg-slate-800 p-4 flex items-center justify-between">
          <h3 className="text-white font-bold flex items-center gap-2">
            <BarChart3 size={18} className="text-blue-400" />
            Выполненные работы с начала строительства
          </h3>
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-slate-700 px-3 py-1 rounded-full">
            integra construction kz
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-black tracking-widest border-b border-slate-200">
                <th className="p-4 w-16 text-center">№п/п</th>
                <th className="p-4">Наименование работ</th>
                <th className="p-4 text-center">ед.изм.</th>
                <th className="p-4 text-right">Общий объем</th>
                <th className="p-4 text-right bg-blue-50/30">Выполнено</th>
                <th className="p-4 text-right">Остаток</th>
                <th className="p-4 text-right bg-green-50/30">Выполнила Integra</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {SUMMARY_DATA.map((row, idx) => {
                const isMain = row.type === 'main';
                return (
                  <tr key={idx} className={`${isMain ? 'bg-white font-bold' : 'bg-slate-50/30 text-slate-600'} hover:bg-blue-50/50 border-b border-slate-100 transition-colors`}>
                    <td className="p-4 text-center text-slate-400 font-mono">{row.no}</td>
                    <td className="p-4 flex items-center gap-2">
                      {isMain && <CheckCircle2 size={14} className="text-blue-500" />}
                      {!isMain && <ArrowRight size={12} className="text-slate-300 ml-4" />}
                      {row.name}
                    </td>
                    <td className="p-4 text-center text-slate-500">{row.unit}</td>
                    <td className="p-4 text-right font-mono text-slate-700">
                      {row.total > 0 ? row.total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : '-'}
                    </td>
                    <td className="p-4 text-right font-mono text-blue-700 bg-blue-50/20">
                      {row.completed.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 text-right font-mono text-slate-400">
                      {row.remaining > 0 ? row.remaining.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : '-'}
                    </td>
                    <td className="p-4 text-right font-mono text-green-700 bg-green-50/20 font-black">
                      {row.integraCompleted.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-3">
        <div className="mt-0.5 text-amber-600">
          <CheckCircle2 size={18} />
        </div>
        <p className="text-xs text-amber-800 leading-relaxed font-medium">
          * Данная сводка актуализирована на основе официальной справки. 
          Колонка "Выполнила Integra" отображает собственный объем работ компании Integra Construction. 
          Все расчеты ведутся нарастающим итогом с начала строительства.
        </p>
      </div>
    </div>
  );
};

export default ExecutionSummary;
