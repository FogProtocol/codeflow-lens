export type AudienceLevel = 'beginner' | 'intermediate' | 'advanced';

export type SupportedLanguage = 
  | 'python' 
  | 'javascript' 
  | 'typescript' 
  | 'c' 
  | 'cpp' 
  | 'csharp' 
  | 'java' 
  | 'go' 
  | 'rust' 
  | 'yaml' 
  | 'json' 
  | 'sql' 
  | 'bash' 
  | 'dockerfile'
  | 'html' 
  | 'css';

export interface CrossFileReference {
  targetFileName: string;
  targetSymbol: string;
  targetLine?: number;
  note?: string;
}

export interface BlockQuery {
  id: string;
  question: string;
  answer: string;
  isLoading?: boolean;
}

export interface LineByLineExplanation {
  id: string;
  lineNumber: number;
  endLineNumber: number;
  codeSnippet: string;
  explanation: string;         // Plain, direct, raw explanation like handwritten notes
}

export interface WhyBuiltRationale {
  topic: string;              // e.g. "Why for-loop instead of while or do-while?"
  explanation: string;        // In-depth architectural / choice rationale
}

export interface FilePaneData {
  id: string;
  fileName: string;
  language: SupportedLanguage;
  content: string;
  summary?: string;
  lineExplanations: LineByLineExplanation[];
  whyBuiltRationales: WhyBuiltRationale[];
  queries: BlockQuery[];
  isAnalyzing: boolean;
  error?: string;
}

export interface SampleProject {
  id: string;
  title: string;
  subtitle: string;
  ecosystem: string;
  tags: string[];
  files: {
    fileName: string;
    language: SupportedLanguage;
    content: string;
    summary: Record<AudienceLevel, string>;
    lineExplanations: Record<AudienceLevel, LineByLineExplanation[]>;
    whyBuiltRationales: Record<AudienceLevel, WhyBuiltRationale[]>;
  }[];
}
