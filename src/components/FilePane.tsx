import React, { useRef, useState, useEffect } from 'react';
import { 
  FileCode, 
  Upload, 
  X, 
  AlertTriangle,
  Sparkles,
  Code,
  Layers
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
  onAutoAnalyzeFile: (content: string, fileName: string, language: SupportedLanguage, levelOverride?: AudienceLevel) => void;
  canClose: boolean;
  audienceLevel: AudienceLevel | null;
  onSelectAudienceLevel?: (level: AudienceLevel) => void;
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
  onSelectAudienceLevel,
  activeLine = null,
  onLineClick = () => {},
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draftCode, setDraftCode] = useState(pane.content || '');

  // Keep draftCode synced with pane content if updated from outside
  useEffect(() => {
    if (pane.content && !draftCode) {
      setDraftCode(pane.content);
    }
  }, [pane.content]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const detectedLang = detectLanguageFromFileName(file.name);
      setDraftCode(text);
      onUpdatePane({
        fileName: file.name,
        language: detectedLang,
        content: text,
        isEditingCode: false,
      });

      // If audience level is already chosen, analyze immediately; otherwise wait for user to select level
      if (audienceLevel) {
        onAutoAnalyzeFile(text, file.name, detectedLang, audienceLevel);
      }
    };
    reader.readAsText(file);
  };

  const handleAddQuery = (newQuery: BlockQuery) => {
    onUpdatePane({ queries: [...pane.queries, newQuery] });
  };

  const handleAnalyzeDraft = (levelOverride?: AudienceLevel) => {
    const codeToAnalyze = draftCode.trim();
    if (!codeToAnalyze) return;

    const targetLevel = levelOverride || audienceLevel;

    onUpdatePane({
      content: codeToAnalyze,
      isEditingCode: false,
    });

    if (targetLevel) {
      onAutoAnalyzeFile(codeToAnalyze, pane.fileName, pane.language, targetLevel);
    }
  };

  // Determine if this pane should show the paste/input interface
  const isInputMode = Boolean(
    pane.isEditingCode || 
    !pane.content.trim() || 
    (pane.lineExplanations.length === 0 && !pane.isAnalyzing)
  );

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

        {/* Right Controls: Edit, Upload & Close */}
        <div className="flex items-center gap-1.5">
          {/* Edit / Paste Code Toggle button if already in view mode */}
          {!isInputMode && (
            <button
              onClick={() => {
                setDraftCode(pane.content);
                onUpdatePane({ isEditingCode: true });
              }}
              className="flex items-center gap-1 px-2.5 py-1 text-xs text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200 shadow-2xs font-semibold"
              title="Edit or paste new code into this split pane"
            >
              <Code className="w-3.5 h-3.5 text-blue-600" />
              <span>Edit / Paste Code</span>
            </button>
          )}

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

      {/* BODY: SPLIT INPUT/PASTE VIEW vs DUAL STREAM EXPLANATION VIEW */}
      {isInputMode ? (
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/70 flex flex-col items-center justify-center">
          <div className="max-w-xl w-full bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                  <FileCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Paste or Edit Code for {pane.fileName}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Type or paste code below to generate its line-by-line flow and mental models
                  </p>
                </div>
              </div>

              {pane.content.trim() && (
                <button
                  type="button"
                  onClick={() => onUpdatePane({ isEditingCode: false })}
                  className="text-xs text-slate-500 hover:text-slate-800 underline font-medium"
                >
                  Back to Flow
                </button>
              )}
            </div>

            {/* Paste Textarea */}
            <div className="relative">
              <textarea
                value={draftCode}
                onChange={(e) => setDraftCode(e.target.value)}
                placeholder={`Paste your code here...\n\nwhile True:\n    num = input("\\nEnter ID number: ").strip()\n    if num.lower() == "exit":\n        break\n    if len(num) == 6 and num.isdigit():\n        if num.startswith("25"):\n            print(f"Accepted: {num}")`}
                rows={9}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3.5 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none shadow-inner"
              />
            </div>

            {/* Level selection prompt if audienceLevel is not chosen yet */}
            {!audienceLevel && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-amber-900">
                  <span>👉 Step 1: Select your hardness level to generate description:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectAudienceLevel?.('beginner');
                      handleAnalyzeDraft('beginner');
                    }}
                    className="p-2.5 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-300 text-left transition-all group"
                  >
                    <div className="font-bold text-emerald-800 text-xs">🟢 Beginner (Easy)</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Everyday analogies & zero jargon</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectAudienceLevel?.('intermediate');
                      handleAnalyzeDraft('intermediate');
                    }}
                    className="p-2.5 rounded-xl bg-white hover:bg-amber-50 border border-amber-300 text-left transition-all group"
                  >
                    <div className="font-bold text-amber-800 text-xs">🟠 Intermediate</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">API contracts, idiomatic flow</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectAudienceLevel?.('advanced');
                      handleAnalyzeDraft('advanced');
                    }}
                    className="p-2.5 rounded-xl bg-white hover:bg-purple-50 border border-purple-300 text-left transition-all group"
                  >
                    <div className="font-bold text-purple-800 text-xs">🟣 Senior / Architect</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Memory invariants, sys trade-offs</div>
                  </button>
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer border border-slate-300 transition-colors">
                <Upload className="w-3.5 h-3.5 text-blue-600" />
                <span>Upload Code File</span>
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>

              <button
                type="button"
                onClick={() => handleAnalyzeDraft()}
                disabled={!draftCode.trim()}
                className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all disabled:opacity-40 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Analyze Code Now</span>
              </button>
            </div>

            {/* Starter Presets inside the Split Pane */}
            <div className="pt-3 border-t border-slate-200">
              <span className="text-[11px] font-semibold text-slate-400">Or load a starter demo:</span>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    const sample = `while True:\n    num = input("\\nEnter ID number (or type 'exit' to quit): ").strip()\n\n    if num.lower() == "exit":\n        print("Exiting program.")\n        break\n\n    if len(num) == 6 and num.isdigit():\n        if num.startswith("25") or num.startswith("26"):\n            print(f"Accepted: {num}")\n        else:\n            print(f"Rejected: Must start with 25 or 26.")\n    else:\n        print("Rejected: Must be exactly 6 numeric digits.")`;
                    setDraftCode(sample);
                    onUpdatePane({ fileName: 'id_validator.py', language: 'python' });
                  }}
                  className="text-[10px] px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-medium transition-colors"
                >
                  ID Validator Loop
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const sample = `int a, b\na = input("Enter first number: ")\nb = input("Enter second number: ")\n\ndef add(a, b):\n    return (a + b)\n\nprint(add(a, b))`;
                    setDraftCode(sample);
                    onUpdatePane({ fileName: 'calculator.py', language: 'python' });
                  }}
                  className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-medium transition-colors"
                >
                  Arithmetic Calculator
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const sample = `# CVE-Bin-Tool: Safe Subprocess Archive Extractor\nimport asyncio\nfrom pathlib import Path\nfrom cve_bin_tool.extractor import Extractor\n\nSTATIC_INVALID_KEY = "cve-bin-tool-non-free-password"\n\ndef async_wrap(func):\n    """Wraps a CPU/IO blocking function into an async coroutine on a worker thread pool."""\n    async def run(*args, **kwargs):\n        loop = asyncio.get_running_loop()\n        return await loop.run_in_executor(None, func, *args, **kwargs)\n    return run\n\nrpmextract = async_wrap(rpmextract)\n\nasync def unzip_file(file_path: Path, output_dir: Path):\n    """Safely extracts zip archive without hanging headless CI/CD servers."""\n    cmd = ["unzip", "-q", "-P", STATIC_INVALID_KEY, str(file_path), "-d", str(output_dir)]\n    proc = await asyncio.create_subprocess_exec(\n        *cmd,\n        stdout=asyncio.subprocess.PIPE,\n        stderr=asyncio.subprocess.PIPE\n    )\n    stdout, stderr = await proc.communicate()\n    return proc.returncode == 0`;
                    setDraftCode(sample);
                    onUpdatePane({ fileName: 'extractor_worker.py', language: 'python' });
                  }}
                  className="text-[10px] px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-medium transition-colors"
                >
                  Safe Async Extractor
                </button>
              </div>
            </div>

          </div>
        </div>
      ) : (
        /* DUAL STREAM VIEW (CODE LEFT + ALIGNED EXPLANATION RIGHT) */
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
      )}

    </div>
  );
};
