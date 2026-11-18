import React, { useState, useRef } from 'react';
import { 
  Lightbulb, 
  MessageSquare, 
  Send, 
  Sparkles, 
  HelpCircle,
  CornerDownRight
} from 'lucide-react';
import { LineByLineExplanation, WhyBuiltRationale, AudienceLevel, BlockQuery } from '../types';
import { askBlockQueryWithGemini } from '../services/gemini';

interface DualStreamViewProps {
  fileName: string;
  content: string;
  language: string;
  lineExplanations: LineByLineExplanation[];
  whyBuiltRationales: WhyBuiltRationale[];
  queries: BlockQuery[];
  activeLineHighlight: number | null;
  onLineClick: (line: number) => void;
  audienceLevel: AudienceLevel | null;
  onAddQuery?: (query: BlockQuery) => void;
}

export const DualStreamView: React.FC<DualStreamViewProps> = ({
  fileName,
  content,
  language,
  lineExplanations,
  whyBuiltRationales,
  queries,
  activeLineHighlight,
  onLineClick,
  audienceLevel,
  onAddQuery,
}) => {
  const [hoveredLineId, setHoveredLineId] = useState<string | null>(null);
  const [activeLineId, setActiveLineId] = useState<string | null>(null);

  // In-card query input state
  const [questionInput, setQuestionInput] = useState('');
  const [isAsking, setIsAsking] = useState(false);

  // Refs for smooth bi-directional scrolling
  const codeContainerRef = useRef<HTMLDivElement>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);
  const codeLineRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const explanationRowRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const isAutoScrollingRef = useRef(false);

  const lines = content.split('\n');

  // Map each line number to its corresponding explanation object
  const lineToExplanationMap = React.useMemo(() => {
    const map = new Map<number, LineByLineExplanation>();
    lineExplanations.forEach(exp => {
      for (let l = exp.lineNumber; l <= exp.endLineNumber; l++) {
        map.set(l, exp);
      }
    });
    return map;
  }, [lineExplanations]);

  // Scroll code line to the EXACT center of the left frame
  const scrollToCodeLine = (lineNum: number) => {
    if (isAutoScrollingRef.current) return;
    const lineEl = codeLineRefs.current.get(lineNum);
    if (lineEl && codeContainerRef.current) {
      isAutoScrollingRef.current = true;
      lineEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => { isAutoScrollingRef.current = false; }, 350);
    }
  };

  // Scroll explanation card to the EXACT center of the right frame (in the middle!)
  const scrollToExplanationRow = (rowId: string) => {
    if (isAutoScrollingRef.current) return;
    const expEl = explanationRowRefs.current.get(rowId);
    if (expEl && cardsContainerRef.current) {
      isAutoScrollingRef.current = true;
      expEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => { isAutoScrollingRef.current = false; }, 350);
    }
  };

  const handleExplanationMouseEnter = (exp: LineByLineExplanation) => {
    setHoveredLineId(exp.id);
    setActiveLineId(exp.id);
    scrollToCodeLine(exp.lineNumber);
  };

  const handleCodeLineMouseEnter = (lineNum: number) => {
    const exp = lineToExplanationMap.get(lineNum);
    if (exp) {
      setHoveredLineId(exp.id);
      setActiveLineId(exp.id);
      scrollToExplanationRow(exp.id);
    }
  };

  const handleCodeLineClick = (lineNum: number) => {
    onLineClick(lineNum);
    const exp = lineToExplanationMap.get(lineNum);
    if (exp) {
      setActiveLineId(exp.id);
      scrollToExplanationRow(exp.id);
    }
  };

  const handleAskQuestion = async (customQ?: string) => {
    const q = (customQ || questionInput).trim();
    if (!q) return;

    setIsAsking(true);
    setQuestionInput('');

    try {
      const answer = await askBlockQueryWithGemini(
        content.slice(0, 1500),
        fileName,
        q,
        lineExplanations.map(e => e.explanation).join('; ')
      );

      const newQ: BlockQuery = {
        id: `q-${Date.now()}`,
        question: q,
        answer: answer,
      };

      onAddQuery?.(newQ);
    } catch (err: any) {
      onAddQuery?.({
        id: `q-${Date.now()}`,
        question: q,
        answer: `Note: ${err.message || 'Could not fetch response. Enter API key in settings or try again.'}`,
      });
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 bg-white h-full overflow-hidden">
      
      {/* ================= LEFT COLUMN: CODE STREAM ================= */}
      <div 
        ref={codeContainerRef}
        className="h-full overflow-y-auto overflow-x-auto p-4 bg-slate-50/60 font-mono text-xs selection:bg-blue-100 scroll-smooth"
      >
        {/* Generous bottom padding so even the last lines can easily be centered in the viewport */}
        <div className="min-w-max pb-[50vh]">
          {lines.map((lineText, idx) => {
            const lineNum = idx + 1;
            const exp = lineToExplanationMap.get(lineNum);
            const isHovered = hoveredLineId && exp?.id === hoveredLineId;
            const isLineActive = (activeLineId && exp?.id === activeLineId) || (activeLineHighlight === lineNum);

            return (
              <div
                key={lineNum}
                ref={(el) => {
                  if (el) codeLineRefs.current.set(lineNum, el);
                  else codeLineRefs.current.delete(lineNum);
                }}
                onClick={() => handleCodeLineClick(lineNum)}
                onMouseEnter={() => handleCodeLineMouseEnter(lineNum)}
                className={`code-line group flex items-start px-2 py-0.5 rounded cursor-pointer transition-all duration-150 ${
                  isHovered || isLineActive
                    ? 'bg-blue-100/90 border-l-4 border-blue-600 shadow-xs font-semibold'
                    : 'hover:bg-slate-100 border-l-4 border-transparent'
                }`}
              >
                {/* Line Number */}
                <span className={`w-8 shrink-0 select-none text-right pr-3 text-[11px] font-medium transition-colors ${
                  isHovered || isLineActive ? 'text-blue-700 font-bold' : 'text-slate-400'
                }`}>
                  {lineNum}
                </span>

                {/* Code Text with clean light syntax highlighting */}
                <span className={`whitespace-pre flex-1 ${
                  lineText.trim().startsWith('#') || lineText.trim().startsWith('//')
                    ? 'text-slate-400 italic font-normal'
                    : lineText.trim().startsWith('from ') || lineText.trim().startsWith('import ')
                    ? 'text-indigo-600 font-semibold'
                    : lineText.trim().startsWith('def ') || lineText.trim().startsWith('class ') || lineText.trim().startsWith('function ')
                    ? 'text-blue-700 font-bold'
                    : lineText.includes('return ') || lineText.includes('if ') || lineText.includes('for ') || lineText.includes('while ')
                    ? 'text-purple-700 font-semibold'
                    : lineText.includes('"') || lineText.includes("'")
                    ? 'text-emerald-700 font-medium'
                    : 'text-slate-900'
                }`}>
                  {lineText || ' '}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= RIGHT COLUMN: LINE-BY-LINE EXPLANATIONS ================= */}
      <div 
        ref={cardsContainerRef}
        className="h-full overflow-y-auto p-4 bg-white space-y-3 scroll-smooth"
      >
        {lineExplanations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center p-6 text-slate-500">
            <HelpCircle className="w-10 h-10 mb-2 text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">Analyzing code...</p>
            <p className="text-xs mt-1 text-slate-500 max-w-xs">
              Line-by-line flow and architecture will appear here automatically.
            </p>
          </div>
        ) : (
          /* Generous bottom padding so any line (including line 63 or the last line) is centered right in the middle */
          <div className="pb-[50vh] space-y-2">
            
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1 flex items-center justify-between pb-1">
              <span>Line-by-Line Flow & Meaning</span>
              {audienceLevel && (
                <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  {audienceLevel.toUpperCase()}
                </span>
              )}
            </div>

            {/* 1. LINE-BY-LINE LIST (CENTERED VERTICALLY IN FRAME ON HOVER) */}
            {lineExplanations.map((exp) => {
              const isHovered = hoveredLineId === exp.id;
              const isActive = activeLineId === exp.id;

              return (
                <div
                  key={exp.id}
                  ref={(el) => {
                    if (el) explanationRowRefs.current.set(exp.id, el);
                    else explanationRowRefs.current.delete(exp.id);
                  }}
                  onMouseEnter={() => handleExplanationMouseEnter(exp)}
                  onMouseLeave={() => setHoveredLineId(null)}
                  className={`flex items-start gap-3 p-2.5 rounded-xl border transition-all duration-150 cursor-pointer ${
                    isHovered || isActive
                      ? 'bg-blue-50/90 border-blue-500 ring-2 ring-blue-400/30 shadow-md translate-x-1'
                      : 'bg-slate-50/50 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {/* Line badge */}
                  <div className={`shrink-0 font-mono text-[11px] font-bold px-2 py-0.5 rounded shadow-2xs transition-colors ${
                    isHovered || isActive ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
                  }`}>
                    {exp.lineNumber === exp.endLineNumber ? `L${exp.lineNumber}` : `L${exp.lineNumber}-${exp.endLineNumber}`}
                  </div>

                  {/* Direct plain-spoken explanation */}
                  <div className={`flex-1 text-xs font-sans leading-relaxed pt-0.5 ${
                    isHovered || isActive ? 'text-blue-950 font-medium' : 'text-slate-800'
                  }`}>
                    {exp.explanation}
                  </div>
                </div>
              );
            })}

            {/* 2. WHY BUILT IN SUCH WAY RATIONALE SECTION */}
            {whyBuiltRationales.length > 0 && (
              <div className="mt-8 pt-4 border-t border-slate-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1 rounded-md bg-amber-100 text-amber-800">
                    <Lightbulb className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Architectural Rationale: Why Built In Such Way?
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Why specific constructs and design patterns were chosen over alternatives
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {whyBuiltRationales.map((rationale, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/90 space-y-1"
                    >
                      <div className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
                        <span>{rationale.topic}</span>
                      </div>
                      <p className="text-xs text-amber-900 leading-relaxed font-sans pl-3">
                        {rationale.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. IN-CARD QUERY BOX */}
            <div className="mt-8 pt-4 border-t border-slate-200">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 mb-2">
                <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                <span>Ask a Question About Any Line or Function:</span>
              </div>

              {queries && queries.length > 0 && (
                <div className="space-y-2 mb-3">
                  {queries.map((q) => (
                    <div key={q.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1.5">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="text-blue-600 font-mono">Q:</span>
                        <span>{q.question}</span>
                      </div>
                      <div className="text-slate-700 flex items-start gap-1.5 pl-2 border-l-2 border-emerald-500 pt-0.5">
                        <CornerDownRight className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{q.answer}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Suggestions */}
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                <button
                  type="button"
                  onClick={() => handleAskQuestion("Why was this approach chosen instead of a simpler method?")}
                  className="text-[10px] px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors font-medium"
                >
                  Why choose this approach?
                </button>
                <button
                  type="button"
                  onClick={() => handleAskQuestion("What packages or libraries are used here?")}
                  className="text-[10px] px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors font-medium"
                >
                  What packages are used?
                </button>
              </div>

              {/* Input */}
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={questionInput}
                  onChange={(e) => setQuestionInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAskQuestion();
                    }
                  }}
                  placeholder="Ask any question about this code..."
                  className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => handleAskQuestion()}
                  disabled={isAsking}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors disabled:opacity-50"
                >
                  {isAsking ? (
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Ask</span>
                </button>
              </div>

            </div>

          </div>
        )}
      </div>

    </div>
  );
};
