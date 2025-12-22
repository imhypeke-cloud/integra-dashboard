
import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider } from './services/DataContext';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Resources from './components/Resources';
import Machinery from './components/Machinery';
import Subcontractors from './components/Subcontractors';
import WeeklyGPR from './components/WeeklyGPR';
import GenPlan from './components/GenPlan';
import ProjectSections from './components/ProjectSections';
import ExecutionSummary from './components/ExecutionSummary';
import { Menu } from 'lucide-react';

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <DataProvider>
      <Router>
        <div className="flex h-screen w-full bg-slate-50 relative overflow-hidden">
          {/* Mobile Hamburger Button */}
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden absolute top-3 left-3 z-40 p-2 bg-slate-900 text-white rounded-lg shadow-lg hover:bg-slate-800 transition-colors"
          >
            <Menu size={24} />
          </button>

          <Sidebar 
            isOpen={isSidebarOpen} 
            onClose={() => setIsSidebarOpen(false)} 
          />
          
          <main className="flex-1 overflow-y-auto w-full min-w-0">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/execution-summary" element={<ExecutionSummary />} />
              <Route path="/genplan" element={<GenPlan />} />
              <Route path="/sections" element={<ProjectSections />} />
              <Route path="/weekly" element={<WeeklyGPR />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="/machinery" element={<Machinery />} />
              <Route path="/subcontractors" element={<Subcontractors />} />
            </Routes>
          </main>
        </div>
      </Router>
    </DataProvider>
  );
};

export default App;
