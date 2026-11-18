import React from 'react';
import { 
  Columns3, 
  Columns2, 
  Square, 
  Settings, 
  BookOpen, 
  GraduationCap, 
  Cpu, 
  Key,
  FolderPlus
} from 'lucide-react';
import { AudienceLevel } from '../types';

interface HeaderProps {
  audienceLevel: AudienceLevel | null;
  onAudienceLevelChange: (level: AudienceLevel) => void;
  paneCount: number;
  onPaneCountChange: (count: number) => void;
  onOpenSettings: () => void;
  hasApiKey: boolean;
  onNewEmptyPane: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  audienceLevel,
  onAudienceLevelChange,
  paneCount,
  onPaneCountChange,
  onOpenSettings,
  hasApiKey,
  onNewEmptyPane,
}) => {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40 px-4 py-2.5 shadow-2xs">
      <div className="max-w-[1920px] mx-auto flex flex-wrap items-center justify-between gap-3">
        
        {/* Left: Branding */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20 text-white font-bold text-lg">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
                CodeFlow Lens
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                LINE-BY-LINE FLOW
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Paste or Upload Code — Instant Line Flow & Architectural "Why"
            </p>
          </div>
        </div>

        {/* Center: Persona / Level Selector (UNSELECTED BY DEFAULT AS REQUESTED) */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <span className="text-[11px] font-bold text-slate-500 px-2 uppercase tracking-wider hidden md:inline">
            {audienceLevel ? 'Level:' : '👉 Choose Level:'}
          </span>

          <button
            onClick={() => onAudienceLevelChange('beginner')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              audienceLevel === 'beginner'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
            }`}
            title="Plain English, fundamental logic, relatable analogies"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Beginner</span>
          </button>

          <button
            onClick={() => onAudienceLevelChange('intermediate')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              audienceLevel === 'intermediate'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
            }`}
            title="Idiomatic patterns, language features, data structures, state changes"
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Intermediate</span>
          </button>

          <button
            onClick={() => onAudienceLevelChange('advanced')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              audienceLevel === 'advanced'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
            }`}
            title="Systems architecture, Chesterton's fence, concurrency, memory models, trade-offs"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Senior / Architect</span>
          </button>
        </div>

        {/* Right: Add File, Splits & Settings */}
        <div className="flex items-center gap-2">
          
          {/* Add Another Split Code Button */}
          {paneCount < 3 && (
            <button
              onClick={onNewEmptyPane}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 rounded-lg border border-slate-300 shadow-2xs transition-colors"
              title="Add another code file side-by-side"
            >
              <FolderPlus className="w-3.5 h-3.5 text-blue-600" />
              <span>+ Add Split File</span>
            </button>
          )}

          {/* Pane split count toggle */}
          {paneCount > 0 && (
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => onPaneCountChange(1)}
                className={`p-1.5 rounded text-xs transition-colors ${
                  paneCount === 1 ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'
                }`}
                title="1 File View"
              >
                <Square className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onPaneCountChange(2)}
                className={`p-1.5 rounded text-xs transition-colors ${
                  paneCount === 2 ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'
                }`}
                title="2 Split Files (Side-by-side)"
              >
                <Columns2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onPaneCountChange(3)}
                className={`p-1.5 rounded text-xs transition-colors ${
                  paneCount === 3 ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'
                }`}
                title="3 Split Files (Side-by-side comparison)"
              >
                <Columns3 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Settings / API Key Button */}
          <button
            onClick={onOpenSettings}
            className={`p-2 rounded-lg border transition-colors relative shadow-2xs ${
              hasApiKey
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                : 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100'
            }`}
            title={hasApiKey ? 'Gemini API Connected' : 'Click to add free Gemini API Key for live AI'}
          >
            {hasApiKey ? <Key className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
            {!hasApiKey && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping" />
            )}
          </button>

        </div>
      </div>
    </header>
  );
};
