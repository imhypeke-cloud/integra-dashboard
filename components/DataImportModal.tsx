
import React, { useState, useRef } from 'react';
import { useData } from '../services/DataContext';
import { Database, Download, Loader2 } from 'lucide-react';
import { Section, TitleData } from '../types';

interface DataImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultImportMode?: 'auto' | 'volumes' | 'gpr';
  title?: string;
}

const DataImportModal: React.FC<DataImportModalProps> = ({ isOpen, onClose, defaultImportMode = 'auto', title = 'Управление данными' }) => {
  const { importData, titles, workforce, machinery, sections, weeklyRecords } = useData();
  const [activeTab, setActiveTab] = useState<'file' | 'json'>('file');
  const [jsonText, setJsonText] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [importStatus, setImportStatus] = useState<{msg: string, type: 'success' | 'error' | 'loading'} | null>(null);
  
  const [importMode, setImportMode] = useState<'auto' | 'volumes' | 'gpr'>(defaultImportMode);
  const [targetSection, setTargetSection] = useState<string>('auto');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExport = () => {
    const data = { titles, sections, workforce, machinery, weeklyRecords };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pgu_data_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const cleanNumber = (val: any): number => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const str = String(val).replace(/\s/g, '').replace(',', '.');
    const cleanStr = str.replace(/[\u200B-\u200D\uFEFF]/g, ''); 
    const num = parseFloat(cleanStr);
    return isNaN(num) ? 0 : num;
  };

  const parseExcelDate = (val: any): string | undefined => {
    if (!val) return undefined;
    if (typeof val === 'number') {
      const date = new Date(Math.round((val - 25569) * 86400 * 1000));
      return !isNaN(date.getTime()) ? date.toISOString().split('T')[0] : undefined;
    }
    const str = String(val).trim();
    if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(str)) {
       const [d, m, y] = str.split('.');
       return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    return undefined;
  };

  const parseExcel = async (file: File) => {
    setImportStatus({ msg: 'Загрузка библиотеки Excel...', type: 'loading' });
    try {
      const XLSX = await import('xlsx');
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

          if (!jsonData || jsonData.length === 0) throw new Error("Файл пуст");

          let headerIdx = -1;
          for (let i = 0; i < Math.min(jsonData.length, 50); i++) {
              const rowStr = (jsonData[i] || []).map(cell => String(cell || '').toLowerCase()).join(' ');
              if (rowStr.includes('титул') || rowStr.includes('наименование')) {
                  headerIdx = i;
                  break;
              }
          }

          if (headerIdx === -1) throw new Error("Не найдены заголовки");

          const headerRow = jsonData[headerIdx].map(x => String(x || '').toLowerCase().trim());
          const colMap = {
              id: headerRow.findIndex(h => h.includes('титул')),
              name: headerRow.findIndex(h => h.includes('наименование')),
              kzhTotal: headerRow.findIndex(h => h.includes('кж') && (h.includes('всего') || h.includes('кол-во'))),
              kzhDone: headerRow.findIndex(h => h.includes('кж') && (h.includes('вып') || h.includes('факт'))),
              start: headerRow.findIndex(h => h.includes('старт') || h.includes('начало')),
              end: headerRow.findIndex(h => h.includes('финиш') || h.includes('срок') || h.includes('заверш'))
          };

          const extractedItems: Partial<TitleData>[] = [];
          for (let i = headerIdx + 1; i < jsonData.length; i++) {
              const row = jsonData[i];
              if (!row) continue;
              const rawId = String(row[colMap.id] || '').trim();
              if (!rawId || rawId.toLowerCase().includes('итого')) continue;

              extractedItems.push({
                id: rawId,
                name: String(row[colMap.name] || ''),
                section: targetSection === 'auto' ? Section.KZH : targetSection as Section,
                totalVolume: cleanNumber(row[colMap.kzhTotal]),
                completedVolume: cleanNumber(row[colMap.kzhDone]),
                startDate: parseExcelDate(row[colMap.start]) || '2025-01-01',
                deadline: parseExcelDate(row[colMap.end]) || '2025-12-31'
              });
          }
          importData({ sections: extractedItems });
          setImportStatus({ msg: `Загружено ${extractedItems.length} записей`, type: 'success' });
        } catch (err: any) {
          setImportStatus({ msg: `Ошибка: ${err.message}`, type: 'error' });
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err: any) {
       setImportStatus({ msg: `Ошибка загрузки модуля: ${err.message}`, type: 'error' });
    }
  };

  const parsePDF = async (file: File) => {
    setImportStatus({ msg: 'Инициализация PDF...', type: 'loading' });
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
      
      const buffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      let fullText = "";

      for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const textContent = await page.getTextContent();
        fullText += textContent.items.map((i: any) => i.str).join(" ") + "\n";
      }

      setImportStatus({ msg: 'Текст PDF извлечен, обработка...', type: 'loading' });
      // Упрощенная логика парсинга для демонстрации
      const extracted: Partial<TitleData>[] = [];
      const lines = fullText.split('\n');
      lines.forEach(line => {
        const match = line.match(/^(\d+(\.\d+)*)\s+(.+?)\s+(\d+[\d\s,.]*)\s+(\d+[\d\s,.]*)/);
        if (match) {
          extracted.push({
            id: match[1],
            name: match[3],
            totalVolume: cleanNumber(match[4]),
            completedVolume: cleanNumber(match[5]),
            section: Section.KZH,
            startDate: '2025-01-01',
            deadline: '2025-12-31'
          });
        }
      });

      importData({ sections: extracted });
      setImportStatus({ msg: `Найдено ${extracted.length} записей в PDF`, type: 'success' });
    } catch (err: any) {
      setImportStatus({ msg: `Ошибка PDF: ${err.message}`, type: 'error' });
    }
  };

  const handleFiles = (files: FileList) => {
    if (files.length === 0) return;
    const file = files[0];
    setImportStatus(null);
    if (file.name.match(/\.xlsx?$/i)) {
      parseExcel(file);
    } else if (file.name.match(/\.pdf$/i)) {
      parsePDF(file);
    } else {
      setImportStatus({ msg: 'Формат не поддерживается', type: 'error' });
    }
  };

  const handleImportJson = () => {
    try {
      importData(JSON.parse(jsonText));
      setJsonText('');
      setImportStatus({ msg: 'JSON успешно загружен', type: 'success' });
    } catch (e) {
      setImportStatus({ msg: 'Ошибка формата JSON', type: 'error' });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70]">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Database size={20} className="text-blue-600"/> {title}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
        </div>
        <div className="p-6 flex-1 overflow-y-auto">
            <button onClick={handleExport} className="w-full mb-6 flex items-center justify-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 px-4 py-3 rounded-xl border border-green-200 transition-colors font-bold">
                <Download size={20}/> Скачать Резервную Копию (JSON)
            </button>
            
            <div className="flex border-b mb-4">
                <button className={`px-4 py-2 text-sm font-bold border-b-2 ${activeTab === 'file' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-400'}`} onClick={() => setActiveTab('file')}>Файл (Excel/PDF)</button>
                <button className={`px-4 py-2 text-sm font-bold border-b-2 ${activeTab === 'json' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-400'}`} onClick={() => setActiveTab('json')}>JSON Текст</button>
            </div>

            {activeTab === 'file' ? (
                <div 
                  className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:bg-slate-50'}`}
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFiles(e.dataTransfer.files); }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input ref={fileInputRef} type="file" className="hidden" accept=".xlsx,.xls,.pdf" onChange={(e) => e.target.files && handleFiles(e.target.files)} />
                  <p className="text-slate-600 font-bold mb-1 text-lg">Выберите файл .xlsx или .pdf</p>
                  <p className="text-sm text-slate-400">или перетащите его в эту область</p>
                </div>
            ) : (
                <div className="flex flex-col h-64">
                  <textarea className="w-full flex-1 border rounded-lg p-3 font-mono text-xs mb-3 resize-none outline-none focus:ring-2 ring-blue-500" placeholder='{"titles": [...], "sections": [...] }' value={jsonText} onChange={e => setJsonText(e.target.value)}></textarea>
                  <button onClick={handleImportJson} className="bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors">Загрузить данные</button>
                </div>
            )}

            {importStatus && (
                <div className={`mt-4 p-4 rounded-lg flex items-center gap-3 text-sm font-semibold shadow-sm ${importStatus.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : importStatus.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
                    {importStatus.type === 'loading' && <Loader2 size={18} className="animate-spin" />}
                    {importStatus.msg}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default DataImportModal;
