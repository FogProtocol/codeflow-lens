import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { FilePane } from './components/FilePane';
import { SettingsModal } from './components/SettingsModal';
import { AudienceLevel, FilePaneData, SupportedLanguage } from './types';
import { analyzeCodeWithGemini, getStoredApiKey } from './services/gemini';
import { UploadCloud, FileCode, Sparkles, BookOpen, GraduationCap, Cpu } from 'lucide-react';

export function App() {
  // Level unselected by default as requested!
  const [audienceLevel, setAudienceLevel] = useState<AudienceLevel | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [activeLineNumber, setActiveLineNumber] = useState<number | null>(null);

  // Panes array starts completely empty by default!
  const [panes, setPanes] = useState<FilePaneData[]>([]);

  // Track relative width percentages for resizable panes (e.g. [50, 50] or [33.3, 33.3, 33.3])
  const [paneWidths, setPaneWidths] = useState<number[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Dropzone drag state
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [initialPasteText, setInitialPasteText] = useState('');

  useEffect(() => {
    setHasApiKey(Boolean(getStoredApiKey()));
  }, []);

  // Update widths whenever pane count changes
  useEffect(() => {
    if (panes.length === 0) {
      setPaneWidths([]);
    } else if (panes.length === 1) {
      setPaneWidths([100]);
    } else if (panes.length === 2) {
      setPaneWidths([50, 50]);
    } else if (panes.length === 3) {
      setPaneWidths([33.33, 33.33, 33.34]);
    }
  }, [panes.length]);

  // Resizing divider mouse handler
  const handleStartResize = (dividerIndex: number, e: React.MouseEvent) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;

    const startX = e.clientX;
    const containerWidth = container.getBoundingClientRect().width;
    const initialWidths = [...paneWidths];

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaPercent = (deltaX / containerWidth) * 100;

      const newWidths = [...initialWidths];
      const minWidth = 15; // Minimum 15% width per pane

      const leftWidth = initialWidths[dividerIndex] + deltaPercent;
      const rightWidth = initialWidths[dividerIndex + 1] - deltaPercent;

      if (leftWidth >= minWidth && rightWidth >= minWidth) {
        newWidths[dividerIndex] = leftWidth;
        newWidths[dividerIndex + 1] = rightWidth;
        setPaneWidths(newWidths);
      }
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  // Run automatic analysis immediately upon code paste or upload
  const triggerAutoAnalysis = async (
    targetPaneId: string, 
    codeContent: string, 
    fileName: string, 
    language: SupportedLanguage,
    levelOverride?: AudienceLevel
  ) => {
    const levelToUse = levelOverride || audienceLevel;
    if (!levelToUse) {
      // Do NOT auto-describe if the user has not chosen their hardness level yet!
      setPanes(prev => prev.map(p => p.id === targetPaneId ? {
        ...p,
        content: codeContent,
        fileName,
        language,
        isAnalyzing: false,
      } : p));
      return;
    }

    setPanes(prev => prev.map(p => p.id === targetPaneId ? { ...p, isAnalyzing: true, error: undefined } : p));

    try {
      const mockPane: FilePaneData = {
        id: targetPaneId,
        fileName,
        language,
        content: codeContent,
        lineExplanations: [],
        whyBuiltRationales: [],
        queries: [],
        isAnalyzing: true,
      };

      const result = await analyzeCodeWithGemini(mockPane, panes, levelToUse);

      setPanes(prev => prev.map(p => p.id === targetPaneId ? {
        ...p,
        content: codeContent,
        fileName,
        language,
        summary: result.summary,
        lineExplanations: result.lineExplanations,
        whyBuiltRationales: result.whyBuiltRationales,
        isAnalyzing: false,
        isEditingCode: false,
      } : p));
    } catch (err: any) {
      setPanes(prev => prev.map(p => p.id === targetPaneId ? {
        ...p,
        isAnalyzing: false,
        error: err.message || 'Auto-analysis failed.',
      } : p));
    }
  };

  // Handle Level Selection
  const handleAudienceLevelChange = (newLevel: AudienceLevel) => {
    setAudienceLevel(newLevel);
    // Re-run analysis automatically for all existing panes with the newly selected level
    panes.forEach(pane => {
      if (pane.content.trim()) {
        triggerAutoAnalysis(pane.id, pane.content, pane.fileName, pane.language, newLevel);
      }
    });
  };

  // Create pane from text
  const handleCreatePaneWithCode = (codeText: string, fileName = 'code.py', levelOverride?: AudienceLevel) => {
    if (!codeText.trim()) return;

    const newPaneId = `pane-${Date.now()}`;
    const newPane: FilePaneData = {
      id: newPaneId,
      fileName,
      language: fileName.endsWith('.js') || fileName.endsWith('.ts') ? 'javascript' : 'python',
      content: codeText,
      lineExplanations: [],
      whyBuiltRationales: [],
      queries: [],
      isAnalyzing: false,
      isEditingCode: false,
    };

    setPanes(prev => [...prev.slice(0, 2), newPane]); // Up to 3 panes max

    const targetLevel = levelOverride || audienceLevel;
    if (targetLevel) {
      triggerAutoAnalysis(newPaneId, codeText, fileName, newPane.language, targetLevel);
    }
  };

  // Add new empty split pane with identical paste/upload interface
  const handleAddNewEmptyPane = () => {
    if (panes.length >= 3) return;
    const newIndex = panes.length + 1;
    const newPaneId = `pane-${Date.now()}`;
    const newPane: FilePaneData = {
      id: newPaneId,
      fileName: `file_${newIndex}.py`,
      language: 'python',
      content: '',
      lineExplanations: [],
      whyBuiltRationales: [],
      queries: [],
      isAnalyzing: false,
      isEditingCode: true, // starts in paste/input mode!
    };
    setPanes(prev => [...prev, newPane]);
  };

  // Handle file drop on empty canvas
  const handleDropFiles = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);

    const files = Array.from(e.dataTransfer.files).slice(0, 3);
    if (files.length === 0) return;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        handleCreatePaneWithCode(text, file.name);
      };
      reader.readAsText(file);
    });
  };

  const handleUpdatePane = (paneId: string, updated: Partial<FilePaneData>) => {
    setPanes(prev => prev.map(p => p.id === paneId ? { ...p, ...updated } : p));
  };

  const handleClosePane = (paneId: string) => {
    setPanes(prev => prev.filter(p => p.id !== paneId));
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
      
      {/* Top Header */}
      <Header
        audienceLevel={audienceLevel}
        onAudienceLevelChange={handleAudienceLevelChange}
        paneCount={panes.length}
        onPaneCountChange={(count) => {
          if (count < panes.length) setPanes(prev => prev.slice(0, count));
          else if (count > panes.length) handleAddNewEmptyPane();
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        hasApiKey={hasApiKey}
        onNewEmptyPane={handleAddNewEmptyPane}
      />

      {/* Level Selection Warning Banner if user hasn't selected yet */}
      {!audienceLevel && panes.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-50 to-orange-500/10 border-b-2 border-amber-300 px-4 py-2.5 text-xs shadow-2xs">
          <div className="max-w-[1920px] mx-auto flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-amber-200 text-amber-900 font-bold text-xs">🎯</span>
              <div>
                <span className="font-bold text-amber-950">Select Hardness Level to Generate Explanation:</span>
                <span className="text-amber-800 ml-2 hidden sm:inline">Choose your experience level to reveal tailored line flow and mental models.</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleAudienceLevelChange('beginner')}
                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-2xs transition-colors"
              >
                🟢 Beginner (Easy)
              </button>
              <button
                onClick={() => handleAudienceLevelChange('intermediate')}
                className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-2xs transition-colors"
              >
                🟠 Intermediate
              </button>
              <button
                onClick={() => handleAudienceLevelChange('advanced')}
                className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-2xs transition-colors"
              >
                🟣 Senior / Architect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Workspace */}
      <main className="flex-1 overflow-hidden p-3 relative">
        {panes.length === 0 ? (
          /* ================= EMPTY CANVAS ON LOAD ================= */
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
            onDragLeave={() => setIsDraggingOver(false)}
            onDrop={handleDropFiles}
            className={`h-full w-full flex flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all p-6 ${
              isDraggingOver
                ? 'border-blue-500 bg-blue-50/50'
                : 'border-slate-300 bg-white shadow-xs'
            }`}
          >
            <div className="max-w-xl w-full text-center space-y-4">
              
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-xs border border-blue-100">
                <UploadCloud className="w-8 h-8" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Paste or Upload Code
                </h2>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Upload up to 3 files to inspect side-by-side with resizable frames. Code will be analyzed line-by-line automatically.
                </p>
              </div>

              {/* Paste Textbox */}
              <div className="relative text-left">
                <textarea
                  value={initialPasteText}
                  onChange={(e) => setInitialPasteText(e.target.value)}
                  placeholder={`Paste any code here...\n\nint a, b\na = input("Enter first number: ")\nb = input("Enter second number: ")\ndef add(a, b):\n    return (a + b)\nprint(add(a, b))`}
                  rows={6}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3.5 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none shadow-inner"
                />

                <div className="flex items-center justify-between mt-3">
                  {/* File Upload Input */}
                  <label className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer border border-slate-300 transition-colors">
                    <FileCode className="w-4 h-4 text-blue-600" />
                    <span>Upload File(s)</span>
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []).slice(0, 3);
                        files.forEach(f => {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            const text = ev.target?.result as string;
                            handleCreatePaneWithCode(text, f.name);
                          };
                          reader.readAsText(f);
                        });
                      }}
                    />
                  </label>

                  {/* Submit Paste */}
                  <button
                    onClick={() => handleCreatePaneWithCode(initialPasteText, 'main.py')}
                    disabled={!initialPasteText.trim()}
                    className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all disabled:opacity-40"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Analyze Code Instantly</span>
                  </button>
                </div>
              </div>

              {/* Quick Preset: Starter Demos with Deep Dive Mental Models */}
              <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-center gap-2">
                <span className="text-xs text-slate-400">Or try starter demos:</span>
                <button
                  onClick={() => {
                    const sampleCode = `while True:\n    num = input("\\nEnter ID number (or type 'exit' to quit): ").strip()\n\n    if num.lower() == "exit":\n        print("Exiting program.")\n        break\n\n    if len(num) == 6 and num.isdigit():\n        if num.startswith("25") or num.startswith("26"):\n            print(f"Accepted: {num}")\n        else:\n            print(f"Rejected: Must start with 25 or 26.")\n    else:\n        print("Rejected: Must be exactly 6 numeric digits.")`;
                    handleCreatePaneWithCode(sampleCode, 'id_validator.py');
                  }}
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                >
                  ID Validator Loop
                </button>
                <button
                  onClick={() => {
                    const sampleCode = `int a, b\na = input("Enter first number: ")\nb = input("Enter second number: ")\n\ndef add(a, b):\n    return (a + b)\n\nprint(add(a, b))`;
                    handleCreatePaneWithCode(sampleCode, 'calculator.py');
                  }}
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
                >
                  Arithmetic Calculator
                </button>
                <button
                  onClick={() => {
                    const sampleCode = `# CVE-Bin-Tool: Safe Subprocess Archive Extractor\nimport asyncio\nfrom pathlib import Path\nfrom cve_bin_tool.extractor import Extractor\n\nSTATIC_INVALID_KEY = "cve-bin-tool-non-free-password"\n\ndef async_wrap(func):\n    """Wraps a CPU/IO blocking function into an async coroutine on a worker thread pool."""\n    async def run(*args, **kwargs):\n        loop = asyncio.get_running_loop()\n        return await loop.run_in_executor(None, func, *args, **kwargs)\n    return run\n\nrpmextract = async_wrap(rpmextract)\n\nasync def unzip_file(file_path: Path, output_dir: Path):\n    """Safely extracts zip archive without hanging headless CI/CD servers."""\n    cmd = ["unzip", "-q", "-P", STATIC_INVALID_KEY, str(file_path), "-d", str(output_dir)]\n    proc = await asyncio.create_subprocess_exec(\n        *cmd,\n        stdout=asyncio.subprocess.PIPE,\n        stderr=asyncio.subprocess.PIPE\n    )\n    stdout, stderr = await proc.communicate()\n    return proc.returncode == 0`;
                    handleCreatePaneWithCode(sampleCode, 'extractor_worker.py');
                  }}
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors"
                >
                  Safe Async Extractor (CVE Tooling)
                </button>
                <button
                  onClick={() => {
                    const sampleCode = `with Extractor(logger=self.logger, error_mode=self.error_mode) as ectx:\n    if Path(scan_path).is_dir():\n        for filepath in self.walker([scan_path]):\n            self.file_stack.append(filepath)\n            yield from self.scan_and_or_extract_file(ectx, filepath)\n            self.file_stack.pop()\n    elif Path(scan_path).is_file():\n        self.file_stack.append(scan_path)\n        yield from self.scan_and_or_extract_file(ectx, scan_path)\n        self.file_stack.pop()`;
                    handleCreatePaneWithCode(sampleCode, 'version_scanner.py');
                  }}
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors"
                >
                  Recursive File Walker (Zero-RAM Generator)
                </button>
              </div>

            </div>
          </div>
        ) : (
          /* ================= RESIZABLE MULTI-PANE WORKSPACE ================= */
          <div 
            ref={containerRef}
            className="flex h-full w-full select-none"
          >
            {panes.map((pane, idx) => (
              <React.Fragment key={pane.id}>
                {/* Resizable Pane Container */}
                <div
                  style={{ width: `${paneWidths[idx] || 100 / panes.length}%` }}
                  className="h-full min-w-[200px] flex-shrink-0"
                >
                  <FilePane
                    pane={pane}
                    onUpdatePane={(updated) => handleUpdatePane(pane.id, updated)}
                    onClosePane={() => handleClosePane(pane.id)}
                    onAutoAnalyzeFile={(content, fileName, language, levelOverride) => {
                      triggerAutoAnalysis(pane.id, content, fileName, language, levelOverride);
                    }}
                    canClose={panes.length > 0}
                    audienceLevel={audienceLevel}
                    onSelectAudienceLevel={handleAudienceLevelChange}
                    activeLine={activeLineNumber}
                    onLineClick={(line) => setActiveLineNumber(line)}
                  />
                </div>

                {/* Draggable Divider Bar between panes */}
                {idx < panes.length - 1 && (
                  <div
                    onMouseDown={(e) => handleStartResize(idx, e)}
                    className="w-2.5 h-full cursor-col-resize hover:bg-blue-400 active:bg-blue-600 transition-colors flex items-center justify-center group shrink-0"
                    title="Drag left or right to resize pane widths"
                  >
                    <div className="w-1 h-8 rounded-full bg-slate-300 group-hover:bg-white group-active:bg-white transition-colors" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onKeySaved={() => setHasApiKey(Boolean(getStoredApiKey()))}
      />

    </div>
  );
}

export default App;
