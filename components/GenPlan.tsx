
import React, { useState, useRef, useMemo } from 'react';
import { useData } from '../services/DataContext';
import { Status, MapObject, TitleData } from '../types';
import { ZoomIn, ZoomOut, Maximize, Map as MapIcon, X, Info, Layers } from 'lucide-react';

// Comprehensive schematic map of all 53 titles
// Coordinates are relative % (0-100) on a schematic canvas
const MAP_CONFIG: MapObject[] = [
  // --- MAIN POWER BLOCK (CENTER) ---
  { id: '1.1', type: 'rect', x: 30, y: 40, width: 20, height: 15 }, // Turbo Compressor / Main Corps
  { id: '1.2', type: 'rect', x: 51, y: 40, width: 10, height: 15 }, // Gas Turbine Hall
  { id: '1.3', type: 'rect', x: 30, y: 33, width: 20, height: 6 },  // Steam Turbine
  { id: '35', type: 'rect', x: 62, y: 40, width: 5, height: 15 },   // Turbine-Transformer Pump Station

  // --- COOLING SYSTEMS (TOP LEFT) ---
  { id: '2.1', type: 'rect', x: 10, y: 10, width: 12, height: 10 }, // Cooling Tower
  { id: '2.2', type: 'rect', x: 10, y: 22, width: 6, height: 6 },    // Circ Water Pump
  { id: '7.1', type: 'rect', x: 25, y: 10, width: 5, height: 5 },     // Dry Cooling Tower 1
  { id: '7.2', type: 'rect', x: 31, y: 10, width: 5, height: 5 },     // Dry Cooling Tower 2

  // --- WATER TREATMENT & TANKS (TOP CENTER) ---
  { id: '10,11', type: 'rect', x: 40, y: 15, width: 10, height: 8 },  // WTP
  { id: '12.1', type: 'circle', x: 55, y: 15, r: 2.5 }, // Fire Pump
  { id: '12.2', type: 'circle', x: 60, y: 15, r: 2.5 }, // Tank 1
  { id: '12.3', type: 'circle', x: 65, y: 15, r: 2.5 }, // Tank 2
  { id: '13.2 - 13.3', type: 'rect', x: 70, y: 12, width: 6, height: 4 }, // Liquid Fuel Pump
  { id: '13.4', type: 'circle', x: 75, y: 18, r: 2 }, // Diesel Tank

  // --- FUEL & OIL ECONOMY (TOP RIGHT) ---
  { id: '15.1', type: 'rect', x: 82, y: 12, width: 5, height: 5 }, // Emergency Diesel
  { id: '15.4-15.5', type: 'rect', x: 88, y: 12, width: 5, height: 5 }, // Fuel Tanks
  { id: '22.1-22.6', type: 'rect', x: 82, y: 20, width: 10, height: 4 }, // Diesel Unloading
  { id: '23.1.1-23.1.2', type: 'circle', x: 94, y: 20, r: 1.5 }, // Oil drain
  { id: '31', type: 'rect', x: 90, y: 26, width: 4, height: 4 }, // Gas Station

  // --- SWITCHYARDS (BOTTOM) ---
  { id: '43-КЖ', type: 'rect', x: 25, y: 65, width: 18, height: 20 }, // ORU 220kV
  { id: '44-КЖ', type: 'rect', x: 45, y: 65, width: 18, height: 20 }, // ORU 500kV
  { id: '41', type: 'rect', x: 65, y: 70, width: 5, height: 5 },      // KTP 10/0.4

  // --- ADMIN & BUILDINGS (RIGHT) ---
  { id: '8.1', type: 'rect', x: 80, y: 40, width: 10, height: 12 }, // Admin Building
  { id: '8.2', type: 'rect', x: 91, y: 40, width: 6, height: 8 },   // Canteen
  { id: '30', type: 'rect', x: 85, y: 55, width: 6, height: 6 },    // Main Gate
  { id: '48', type: 'rect', x: 92, y: 65, width: 4, height: 4 },    // KPP

  // --- AUXILIARY BUILDINGS (SCATTERED) ---
  { id: '3', type: 'rect', x: 15, y: 45, width: 5, height: 5 },    // Foundations Misc
  { id: '9', type: 'rect', x: 70, y: 40, width: 6, height: 8 },    // Workshop
  { id: '24', type: 'rect', x: 68, y: 55, width: 8, height: 6 },   // KRUE Building
  { id: '27', type: 'rect', x: 60, y: 30, width: 5, height: 5 },   // Air Compressor
  { id: '28', type: 'rect', x: 66, y: 30, width: 4, height: 4 },   // Nitrogen Storage
  { id: '50', type: 'rect', x: 50, y: 25, width: 8, height: 6 },   // Rebar Shop
  { id: '21', type: 'rect', x: 15, y: 55, width: 5, height: 5 },   // Rain Pump
  { id: '45.1', type: 'rect', x: 20, y: 88, width: 4, height: 4 }, // Sewage Pump
  { id: '45.2', type: 'rect', x: 25, y: 88, width: 4, height: 4 }, // Treatment Plant

  // --- INFRASTRUCTURE (LINES) ---
  // Using very thin rects to simulate pipe racks/roads
  { id: '16', type: 'rect', x: 28, y: 58, width: 40, height: 2 }, // Pipe Rack 1
  { id: '18', type: 'rect', x: 70, y: 30, width: 2, height: 20 }, // Pipe Rack 2
  { id: '19', type: 'rect', x: 25, y: 60, width: 45, height: 1 }, // Cable Rack
  { id: '32', type: 'rect', x: 40, y: 30, width: 2, height: 8 },  // Pipe Rack vertical

  // --- MISC / NOT STARTED / PLACEHOLDERS ---
  { id: '4.1-4.2', type: 'rect', x: 53, y: 56, width: 4, height: 3 }, // Transformers
  { id: '5.1-5.4', type: 'rect', x: 58, y: 56, width: 4, height: 3 }, // Equipment Fdns
  { id: '6.1-6.4', type: 'rect', x: 63, y: 56, width: 4, height: 3 }, // Aux Fdns
  { id: '38', type: 'rect', x: 35, y: 45, width: 10, height: 5 },     // Scaffolding Zone
  { id: '42', type: 'rect', x: 45, y: 50, width: 5, height: 5 },      // GTU Foundation
  { id: '47.1', type: 'rect', x: 80, y: 80, width: 5, height: 5 },    // Treatment
  { id: '49', type: 'rect', x: 10, y: 80, width: 100, height: 1 },    // Fence (Symbolic)
];

const GenPlan: React.FC = () => {
  const { titles, calculateStatus } = useData();
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Group Titles by Map Object ID
  // Example: MapObject "1.1" matches titles "1.1-KZH", "1.1-KM", "1.1-AR"
  const getLinkedTitles = (mapId: string) => {
    // Normalize logic: exact match OR starts with id + punctuation
    return titles.filter(t => 
       t.id === mapId || 
       t.id.startsWith(mapId + '-') || 
       t.id.startsWith(mapId + '.') ||
       t.id.startsWith(mapId + ',')
    );
  };

  // Determine aggregate status for a map object
  const getAggregateStatus = (mapId: string): Status => {
    const linked = getLinkedTitles(mapId);
    if (linked.length === 0) return Status.NOT_STARTED;

    // Hierarchy of severity: DELAYED > RISK > ON_TRACK > COMPLETED > NOT_STARTED
    const statuses = linked.map(t => calculateStatus(t));
    if (statuses.includes(Status.DELAYED)) return Status.DELAYED;
    if (statuses.includes(Status.RISK)) return Status.RISK;
    if (statuses.some(s => s === Status.ON_TRACK)) return Status.ON_TRACK;
    if (statuses.every(s => s === Status.COMPLETED)) return Status.COMPLETED;
    
    return Status.NOT_STARTED;
  };

  const getFillColor = (status: Status) => {
    switch (status) {
      case Status.ON_TRACK: return '#22c55e'; // Green
      case Status.RISK: return '#eab308';     // Yellow
      case Status.DELAYED: return '#ef4444';  // Red
      case Status.COMPLETED: return '#94a3b8'; // Gray
      case Status.NOT_STARTED: return '#3b82f6'; // Blue
      default: return '#cbd5e1';
    }
  };

  // Zoom Controls
  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.2, 4));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));

  // Drag Logic
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };
  
  const handleMouseUp = () => setIsDragging(false);

  // Prepare detailed data for the selected object
  const selectedDetails = useMemo(() => {
    if (!selectedMapId) return null;
    const linkedTitles = getLinkedTitles(selectedMapId);
    if (linkedTitles.length === 0) return null;

    const totalPlan = linkedTitles.reduce((acc, t) => acc + t.totalVolume, 0);
    const totalFact = linkedTitles.reduce((acc, t) => acc + t.completedVolume, 0);
    const progress = totalPlan > 0 ? (totalFact / totalPlan) * 100 : 0;
    const mainTitle = linkedTitles[0]; // Use first title for generic info like manager
    const aggStatus = getAggregateStatus(selectedMapId);

    return {
      id: selectedMapId,
      name: mainTitle.name, // Assuming name is consistent or we take the first
      manager: mainTitle.manager,
      subcontractor: mainTitle.subcontractor,
      totalPlan,
      totalFact,
      progress,
      status: aggStatus,
      sections: linkedTitles.map(t => ({
        section: t.section,
        progress: t.totalVolume > 0 ? (t.completedVolume / t.totalVolume) * 100 : 0,
        status: calculateStatus(t),
        plan: t.totalVolume,
        fact: t.completedVolume
      }))
    };
  }, [selectedMapId, titles, calculateStatus]);

  return (
    <div className="h-screen flex flex-col bg-slate-900 overflow-hidden relative">
      {/* Header Toolbar */}
      <div className="absolute top-4 left-4 z-20 bg-white/90 backdrop-blur rounded-xl shadow-lg p-2 flex gap-2">
         <div className="flex items-center gap-2 px-2 border-r border-slate-300 mr-2">
             <MapIcon size={20} className="text-blue-600"/>
             <span className="font-bold text-slate-800 hidden md:block">Генплан (Схема)</span>
         </div>
         <button onClick={handleZoomOut} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"><ZoomOut size={20}/></button>
         <span className="flex items-center text-xs font-mono w-12 justify-center">{(scale * 100).toFixed(0)}%</span>
         <button onClick={handleZoomIn} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"><ZoomIn size={20}/></button>
         <div className="w-px h-6 bg-slate-300 mx-1 self-center"></div>
         <button onClick={() => { setScale(1); setPosition({x:0, y:0}); }} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600" title="Сброс"><Maximize size={20}/></button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-20 bg-white/90 backdrop-blur rounded-xl shadow-lg p-4 text-xs font-medium text-slate-700 space-y-2">
         <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500"></div> В графике</div>
         <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500"></div> Риск</div>
         <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div> Отставание</div>
         <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div> Не начато</div>
         <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-400"></div> Завершено</div>
      </div>

      {/* Map Container */}
      <div 
        ref={containerRef}
        className="flex-1 w-full h-full cursor-move overflow-hidden relative bg-[#eef2f6]"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div 
           className="w-full h-full relative transition-transform duration-75 origin-center"
           style={{ transform: `translate(${position.x}px, ${position.y}px) scale(${scale})` }}
        >
           {/* Background Grid */}
           <div className="absolute inset-0 border-2 border-slate-300 m-10 rounded-3xl opacity-20 pointer-events-none bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:20px_20px]"></div>
           
           {/* SVG Overlay */}
           <svg 
              viewBox="0 0 100 100" 
              className="w-full h-full absolute inset-0 pointer-events-none" 
              preserveAspectRatio="xMidYMid meet"
           >
              {/* Context roads/borders */}
              <rect x="5" y="5" width="90" height="90" fill="none" stroke="#94a3b8" strokeWidth="0.5" rx="2" />
              <path d="M 25 5 L 25 95" stroke="#cbd5e1" strokeWidth="0.5" fill="none" strokeDasharray="2 1"/>
              <path d="M 5 62 L 95 62" stroke="#cbd5e1" strokeWidth="0.5" fill="none" strokeDasharray="2 1"/>

              {MAP_CONFIG.map((obj, idx) => {
                const status = getAggregateStatus(obj.id);
                const fill = getFillColor(status);
                const isSelected = selectedMapId === obj.id;
                
                const commonProps = {
                  className: `pointer-events-auto cursor-pointer transition-all duration-300 hover:opacity-100 ${isSelected ? 'stroke-white stroke-[0.5] shadow-2xl' : 'stroke-black/10 stroke-[0.1]'}`,
                  fill: fill,
                  opacity: isSelected ? 1 : 0.85,
                  onClick: (e: React.MouseEvent) => {
                    e.stopPropagation();
                    setSelectedMapId(obj.id);
                  },
                  filter: isSelected ? "drop-shadow(0px 0px 2px rgba(0,0,0,0.5))" : ""
                };

                if (obj.type === 'rect') {
                   return (
                     <g key={idx} transform={`rotate(${obj.rotation || 0} ${obj.x + (obj.width||0)/2} ${obj.y + (obj.height||0)/2})`}>
                       <rect 
                         x={obj.x} y={obj.y} width={obj.width} height={obj.height} 
                         rx={0.5}
                         {...commonProps}
                       />
                       {/* Label */}
                       <text x={obj.x + (obj.width||0)/2} y={obj.y + (obj.height||0)/2} fontSize={Math.min((obj.width||0)/2, 2)} textAnchor="middle" dominantBaseline="middle" fill="white" className="pointer-events-none font-bold select-none drop-shadow-md" style={{textShadow: '0px 0px 2px rgba(0,0,0,0.8)'}}>
                         {obj.id}
                       </text>
                     </g>
                   );
                }
                
                if (obj.type === 'circle') {
                   return (
                     <g key={idx}>
                       <circle 
                         cx={obj.x} cy={obj.y} r={obj.r} 
                         {...commonProps}
                       />
                       <text x={obj.x} y={obj.y} fontSize={Math.min((obj.r||0), 1.5)} textAnchor="middle" dominantBaseline="middle" fill="white" className="pointer-events-none font-bold select-none drop-shadow-md" style={{textShadow: '0px 0px 2px rgba(0,0,0,0.8)'}}>
                         {obj.id}
                       </text>
                     </g>
                   );
                }
                
                return null;
              })}
           </svg>
        </div>
      </div>

      {/* Detail Card Overlay */}
      {selectedMapId && (
        <div className="absolute top-20 right-4 w-96 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-slide-in-right z-30 flex flex-col max-h-[80vh]">
           <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-start shrink-0">
              <div>
                 <h3 className="font-bold text-lg text-slate-800 leading-tight">
                    {selectedDetails?.name || `Титул ${selectedMapId}`}
                 </h3>
                 <span className="text-xs text-slate-500 font-mono">ID: {selectedMapId}</span>
              </div>
              <button onClick={() => setSelectedMapId(null)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
           </div>
           
           <div className="overflow-y-auto p-4 space-y-5 custom-scrollbar">
             {selectedDetails ? (
               <>
                 {/* Top Level Metrics */}
                 <div className="grid grid-cols-2 gap-3">
                   <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <div className="text-xs text-slate-500 uppercase font-bold mb-1">Общий Статус</div>
                      <div className="font-bold text-sm flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{backgroundColor: getFillColor(selectedDetails.status)}}></div>
                        {selectedDetails.status}
                      </div>
                   </div>
                   <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <div className="text-xs text-slate-500 uppercase font-bold mb-1">Прогресс</div>
                      <div className="font-bold text-lg text-blue-600">
                        {selectedDetails.progress.toFixed(1)}%
                      </div>
                   </div>
                 </div>

                 {/* Key Info */}
                 <div className="space-y-3 text-sm">
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                       <span className="text-slate-500">Ответственный:</span>
                       <span className="font-medium text-slate-800">{selectedDetails.manager || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                       <span className="text-slate-500">Субподрядчик:</span>
                       <span className="font-medium text-slate-800">{selectedDetails.subcontractor || '-'}</span>
                    </div>
                    <div className="flex justify-between pb-1">
                       <span className="text-slate-500">Объем (Факт/План):</span>
                       <span className="font-medium text-slate-800">
                         {selectedDetails.totalFact.toLocaleString()} / {selectedDetails.totalPlan.toLocaleString()}
                       </span>
                    </div>
                 </div>

                 {/* Sections Breakdown */}
                 <div>
                    <h4 className="text-xs uppercase font-bold text-slate-500 mb-3 flex items-center gap-2">
                       <Layers size={14}/> Разделы работ
                    </h4>
                    <div className="space-y-3">
                      {selectedDetails.sections.map((sec, idx) => (
                        <div key={idx} className="bg-white border border-slate-100 rounded-lg p-3 shadow-sm">
                           <div className="flex justify-between items-center mb-2">
                              <span className="font-semibold text-slate-700 text-sm">{sec.section}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                 sec.status === Status.ON_TRACK ? 'bg-green-100 text-green-700' :
                                 sec.status === Status.RISK ? 'bg-yellow-100 text-yellow-700' :
                                 sec.status === Status.DELAYED ? 'bg-red-100 text-red-700' :
                                 'bg-slate-100 text-slate-600'
                              }`}>
                                {sec.status}
                              </span>
                           </div>
                           <div className="w-full bg-slate-100 rounded-full h-1.5 mb-1">
                              <div 
                                className="h-1.5 rounded-full bg-blue-500 transition-all duration-500" 
                                style={{width: `${Math.min(sec.progress, 100)}%`}}
                              ></div>
                           </div>
                           <div className="text-xs text-right text-slate-400">
                              {sec.progress.toFixed(1)}% ({sec.fact.toLocaleString()} / {sec.plan.toLocaleString()})
                           </div>
                        </div>
                      ))}
                    </div>
                 </div>
               </>
             ) : (
               <div className="p-4 text-center text-slate-400">
                  <Info size={32} className="mx-auto mb-2 opacity-50"/>
                  <p>Нет детальных данных по этому объекту в базе.</p>
               </div>
             )}
           </div>
        </div>
      )}
    </div>
  );
};

export default GenPlan;
