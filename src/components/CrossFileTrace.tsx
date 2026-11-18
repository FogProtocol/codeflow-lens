import React from 'react';
import { GitBranch, ArrowRight, Compass, ShieldCheck } from 'lucide-react';
import { FilePaneData } from '../types';

interface CrossFileTraceProps {
  panes: FilePaneData[];
  onNavigateToLine: (fileName: string, line: number) => void;
}

export const CrossFileTrace: React.FC<CrossFileTraceProps> = ({ panes, onNavigateToLine }) => {
  return (
    <div className="bg-slate-100 border-t border-slate-200 px-4 py-2 text-xs text-slate-600 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Compass className="w-3.5 h-3.5 text-blue-600" />
        <span>Cross-File Workspace: Inspecting {panes.length} open code panes side-by-side.</span>
      </div>
      <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold">
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>Verify flow & architecture before committing</span>
      </div>
    </div>
  );
};
