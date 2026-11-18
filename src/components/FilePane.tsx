import React, { useRef } from 'react';
import { 
  FileCode, 
  Upload, 
  X, 
  AlertTriangle 
} from 'lucide-react';
import { FilePaneData, SupportedLanguage, AudienceLevel, BlockQuery } from '../types';
import { DualStreamView } from './DualStreamView';

const SUPPORTED_LANGUAGES: { value: SupportedLanguage; label: string }[] = [
  { value: 'python', label: 'Python (Django / FastAPI)' },
  { value: 'typescript', label: 'TypeScript (React / Node)' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C# (.NET)' },
  { value: 'java', label: 'Java (Spring / Android)' },
  { value: 'go', label: 'Go (Golang)' },
  { value: 'rust', label: 'Rust' },
  { value: 'yaml', label: 'Kubernetes / YAML' },
  { value: 'dockerfile', label: 'Dockerfile' },
  { value: 'bash', label: 'Bash / Shell' },
  { value: 'sql', label: 'SQL' },
  { value: 'json', label: 'JSON' },
];

function detectLanguageFromFileName(name: string): SupportedLanguage {
  const ext = name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'py': return 'python';
    case 'ts':
    case 'tsx': return 'typescript';
    case 'js':
    case 'jsx': return 'javascript';
    case 'c':
    case 'h': return 'c';
    case 'cpp':
    case 'hpp':
    case 'cc': return 'cpp';
    case 'cs': return 'csharp';
    case 'java': return 'java';
    case 'go': return 'go';
    case 'rs': return 'rust';
    case 'yaml':
    case 'yml': return 'yaml';
    case 'sh': return 'bash';
    case 'sql': return 'sql';
    case 'json': return 'json';
    default: return 'python';
  }
}

interface FilePaneProps {
  pane: FilePaneData;
  onUpdatePane: (updated: Partial<FilePaneData>) => void;
  onClosePane?: () => void;
  onAutoAnalyzeFile: (content: string, fileName: string, language: SupportedLanguage) => void;
  canClose: boolean;
  audienceLevel: AudienceLevel | null;
  activeLine?: number | null;
  onLineClick?: (line: number) => void;
}

export const FilePane: React.FC<FilePaneProps> = ({
  pane,
  onUpdatePane,
  onClosePane,
  onAutoAnalyzeFile,
  canClose,
  audienceLevel,
  activeLine = null,
  onLineClick = () => {},
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const detectedLang = detectLanguageFromFileName(file.name);
      onUpdatePane({
        fileName: file.name,
        language: detectedLang,
        content: text,
      });
      // Immediately analyze automatically upon upload!
      onAutoAnalyzeFile(text, file.name, detectedLang);
    };
    reader.readAsText(file);
  };

  const handleAddQuery = (newQuery: BlockQuery) => {
    onUpdatePane({ queries: [...pane.queries, newQuery] });
  };

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-shadow">
      
      {/* PANE TOP BAR */}
      <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 bg-slate-100/90 border-b border-slate-200">
        
        {/* Left: File name & Language */}
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <FileCode className="w-4 h-4 text-blue-600 shrink-0" />
          <input
            type="text"
            value={pane.fileName}
            onChange={(e) => onUpdatePane({ fileName: e.target.value })}
            className="bg-transparent text-xs font-bold text-slate-900 hover:bg-white focus:bg-white px-2 py-1 rounded border border-transparent focus:border-slate-300 focus:outline-none w-44 transition-all"
            placeholder="filename.py"
          />

          <select
            value={pane.language}
            onChange={(e) => onUpdatePane({ language: e.target.value as SupportedLanguage })}
            className="text-[11px] bg-white text-slate-700 border border-slate-300 rounded-md px-2 py-1 focus:outline-none focus:border-blue-500 font-mono shadow-2xs"
          >
            {SUPPORTED_LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </div>

        {/* Right Controls: Upload & Close */}
        <div className="flex items-center gap-1.5">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 rounded-lg transition-colors border border-slate-300 shadow-2xs font-medium"
            title="Upload code file from computer"
          >
            <Upload className="w-3.5 h-3.5 text-slate-600" />
            <span>Upload New File</span>
          </button>

          {canClose && onClosePane && (
            <button
              onClick={onClosePane}
              className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors ml-1"
              title="Close this split pane"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>

      {/* ERROR NOTICE (IF ANY) */}
      {pane.error && (
        <div className="px-4 py-2 bg-red-50 border-b border-red-200 text-red-700 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{pane.error}</span>
          </div>
          <button
            onClick={() => onUpdatePane({ error: undefined })}
            className="text-red-600 hover:underline font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* DUAL STREAM VIEW (CODE LEFT + ALIGNED EXPLANATION RIGHT) */}
      <div className="flex-1 overflow-hidden relative">
        <DualStreamView
          fileName={pane.fileName}
          content={pane.content}
          language={pane.language}
          lineExplanations={pane.lineExplanations}
          whyBuiltRationales={pane.whyBuiltRationales}
          queries={pane.queries}
          activeLineHighlight={activeLine}
          onLineClick={onLineClick}
          audienceLevel={audienceLevel}
          onAddQuery={handleAddQuery}
        />
      </div>

    </div>
  );
};
