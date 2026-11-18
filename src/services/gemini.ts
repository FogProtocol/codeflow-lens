import { AudienceLevel, LineByLineExplanation, WhyBuiltRationale, FilePaneData } from '../types';

const STORAGE_KEY = 'codeflow_gemini_api_key';

export function getStoredApiKey(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(STORAGE_KEY) || (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
  }
  return '';
}

export function setStoredApiKey(key: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, key.trim());
  }
}

export function clearStoredApiKey(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export interface AnalysisResponse {
  summary: string;
  lineExplanations: LineByLineExplanation[];
  whyBuiltRationales: WhyBuiltRationale[];
}

export async function analyzeCodeWithGemini(
  targetFile: FilePaneData,
  allFiles: FilePaneData[],
  level: AudienceLevel,
  apiKeyOverride?: string
): Promise<AnalysisResponse> {
  const apiKey = (apiKeyOverride || getStoredApiKey()).trim();

  // If no API key is provided, provide a rich local line-by-line breakdown adapted to the selected level
  if (!apiKey) {
    return generateLocalFallbackAnalysis(targetFile, level);
  }

  const prompt = buildAnalysisPrompt(targetFile, allFiles, level);
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json',
    }
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
    throw new Error(`Gemini API Error: ${message}`);
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error('Gemini returned an empty response. Please try again.');
  }

  try {
    const parsed = JSON.parse(rawText);
    return {
      summary: parsed.summary || 'Code analysis complete.',
      lineExplanations: Array.isArray(parsed.lineExplanations) ? parsed.lineExplanations : [],
      whyBuiltRationales: Array.isArray(parsed.whyBuiltRationales) ? parsed.whyBuiltRationales : []
    };
  } catch (err) {
    throw new Error(`Failed to parse AI structured response: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function askBlockQueryWithGemini(
  codeSnippet: string,
  fileName: string,
  question: string,
  existingMeaning: string,
  apiKeyOverride?: string
): Promise<string> {
  const apiKey = (apiKeyOverride || getStoredApiKey()).trim();

  if (!apiKey) {
    return getOfflineQueryResponse(codeSnippet, question);
  }

  const prompt = `You are CodeFlow Lens, an empathetic senior code mentor explaining open source code.

Code snippet from "${fileName}":
\`\`\`
${codeSnippet}
\`\`\`

Existing explanation:
"${existingMeaning}"

User's question:
"${question}"

Provide a direct, plain-spoken, easily understood answer in 1 to 3 short sentences. Explain what functions, methods, and variables actually do under the hood and why. Avoid vague generic boilerplate.`;

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3 }
    })
  });

  if (!response.ok) {
    throw new Error('Could not fetch answer from AI. Please check your API key.');
  }

  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "No explanation returned.";
}

function getOfflineQueryResponse(snippet: string, question: string): string {
  const q = question.toLowerCase();
  if (q.includes('yield') || q.includes('generator')) {
    return "'yield from' delegates to another generator function, streaming results piece-by-piece to the caller without creating an expensive in-memory list.";
  }
  if (q.includes('stack') || q.includes('append') || q.includes('pop')) {
    return "The file_stack maintains the breadcrumb trail of directories and nested archives currently being scanned so error handlers can report the exact parent archive.";
  }
  if (q.includes('extractor') || q.includes('with')) {
    return "'with Extractor(...) as ectx:' is a context manager: it creates a temporary sandbox folder for extracted files and automatically wipes the temporary files from disk when done.";
  }
  if (q.includes('path') || q.includes('is_dir') || q.includes('is_file')) {
    return "Pathlib provides cross-platform path validation: .is_dir() checks if the target is a folder to scan recursively, while .is_file() handles individual files directly.";
  }
  if (q.includes('lower')) {
    return ".lower() converts all letters to lowercase so that user inputs like 'EXIT', 'Exit', or 'exit' all match identically.";
  }
  if (q.includes('strip')) {
    return ".strip() removes any accidental leading or trailing spaces, tabs, or newlines.";
  }
  return `Regarding "${question}": This handles "${snippet.split('\n')[0].trim()}" cleanly at this execution step.`;
}

function buildAnalysisPrompt(
  targetFile: FilePaneData,
  allFiles: FilePaneData[],
  level: AudienceLevel
): string {
  const levelGuidelines = {
    beginner: `
- AUDIENCE: Complete Beginner.
- VOCABULARY & STYLE: Use conversational, everyday words and simple analogies (e.g. 'a waiting list', 'a reminder card').
- TONE: Warm, clear, zero intimidating jargon. Explain what each tool does in plain English.`,
    intermediate: `
- AUDIENCE: Working Developer / Contributor.
- VOCABULARY & STYLE: Standard developer language. Explain API contracts, data flow, functions, and state transitions.
- TONE: Practical, clean, developer-to-developer.`,
    advanced: `
- AUDIENCE: Senior Systems Architect / Maintainer.
- VOCABULARY & STYLE: Focus on systems invariants, memory bounds ($O(1)$ RAM), exception boundaries, concurrency safety, RAII resource lifecycles, and architectural trade-offs.
- TONE: High-rigor systems engineering.`
  }[level];

  return `You are CodeFlow Lens, an expert software architect and educator.
Your task: Break down this code line-by-line tailored strictly to the "${level.toUpperCase()}" level.

AUDIENCE LEVEL REQUIREMENTS:
${levelGuidelines}

STRICT RULE ON EXPLANATIONS:
- NEVER say "checks condition: if true, executes the indented code block below" or "processes statement".
- ALWAYS explain specifically:
  1. What function or method is used.
  2. What it actually does with the variables written inside it.
  3. The core reason/logic why it was written in this way, using terminology suited to ${level.toUpperCase()}.

IN THE "whyBuiltRationales" SECTION AT THE END:
Provide 4 to 6 deeply relevant architectural rationales suited for the ${level.toUpperCase()} level:
1. Why was a generator (yield / yield from) used instead of returning a collected list?
2. Why is file_stack updated with append() and pop()?
3. Why was a context manager ('with Extractor(...)') used?
4. Why pathlib instead of os.path?
5. Any loops, error modes, or early return guards in the code.

Target File: "${targetFile.fileName}" (${targetFile.language})
\`\`\`${targetFile.language}
${targetFile.content}
\`\`\`

OUTPUT FORMAT REQUIREMENTS:
Return a single JSON object strictly matching this schema:
{
  "summary": "Direct overview tailored to the ${level} level.",
  "lineExplanations": [
    {
      "id": "line-1",
      "lineNumber": 1,
      "endLineNumber": 1,
      "codeSnippet": "code on line",
      "explanation": "Explanation written specifically for ${level} level"
    }
  ],
  "whyBuiltRationales": [
    {
      "topic": "Why was X used instead of Y?",
      "explanation": "Rationale tailored to ${level} level"
    }
  ]
}

Ensure lineExplanations cover every meaningful line sequentially.`;
}

/**
 * Deep local fallback parser:
 * Explicitly adapts descriptions and rationales to Beginner vs Intermediate vs Advanced!
 */
function generateLocalFallbackAnalysis(
  targetFile: FilePaneData,
  level: AudienceLevel
): AnalysisResponse {
  const lines = targetFile.content.split('\n');
  const lineExplanations: LineByLineExplanation[] = [];
  const rationales: WhyBuiltRationale[] = [];

  // Semantic tracking flags for the file
  let hasYieldFrom = false;
  let hasYield = false;
  let hasFileStack = false;
  let hasContextManager = false;
  let hasPathlib = false;
  let hasLogger = false;
  let hasNoScan = false;
  let hasWhileTrue = false;
  let hasLower = false;
  let hasStrip = false;
  let hasIsDigit = false;
  let hasLen = false;
  let hasStartsWith = false;
  let hasBreak = false;
  let hasForLoop = false;
  let hasFunction = false;

  let i = 0;
  while (i < lines.length) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    const startLineNum = i + 1;
    let endLineNum = startLineNum;
    let combinedSnippet = rawLine;

    // Multi-line parentheses accumulator
    let openParens = (trimmed.match(/\(/g) || []).length - (trimmed.match(/\)/g) || []).length;
    let openBrackets = (trimmed.match(/\[/g) || []).length - (trimmed.match(/\]/g) || []).length;
    let openBraces = (trimmed.match(/\{/g) || []).length - (trimmed.match(/\}/g) || []).length;

    while ((openParens > 0 || openBrackets > 0 || openBraces > 0) && i + 1 < lines.length) {
      i++;
      const nextLine = lines[i];
      combinedSnippet += '\n' + nextLine;
      const nextTrimmed = nextLine.trim();
      openParens += (nextTrimmed.match(/\(/g) || []).length - (nextTrimmed.match(/\)/g) || []).length;
      openBrackets += (nextTrimmed.match(/\[/g) || []).length - (nextTrimmed.match(/\]/g) || []).length;
      openBraces += (nextTrimmed.match(/\{/g) || []).length - (nextTrimmed.match(/\}/g) || []).length;
      endLineNum = i + 1;
    }

    const cleanCombined = combinedSnippet.replace(/\s+/g, ' ').trim();
    let explanation = '';

    // 0. Docstrings & Comments
    if (trimmed.startsWith('"""') || trimmed.startsWith("'''")) {
      const doc = cleanCombined.replace(/^"""|'''|"""$|'''$/g, '').trim();
      explanation = level === 'beginner' 
        ? `documentation note: explains in simple terms "${doc || 'what this tool does'}"`
        : level === 'intermediate'
        ? `docstring: describes method contract "${doc}"`
        : `API interface docstring: specifies invariant contracts and generator yields for "${doc}"`;
    } else if (trimmed.startsWith('#') || trimmed.startsWith('//')) {
      const commentText = trimmed.replace(/^#+\s*|^\/\/+\s*/, '');
      explanation = `developer note: ${commentText}`;
    }

    // 1. Context Managers: with Extractor(...) as ectx:
    else if (cleanCombined.startsWith('with ') && cleanCombined.includes(' as ')) {
      hasContextManager = true;
      const parts = cleanCombined.replace('with ', '').replace(/:$/, '').split(' as ');
      const ctx = parts[0]?.trim();
      const alias = parts[1]?.trim();
      explanation = level === 'beginner'
        ? `starts up the Extractor tool into '${alias}' and guarantees it will automatically clean up and delete temporary unpacked files when done`
        : level === 'intermediate'
        ? `initializes '${ctx}' context manager as '${alias}': establishes unpacking sandbox and guarantees automatic disk cleanup on exit`
        : `scoped RAII context manager: binds '${ctx}' to '${alias}' to isolate archive unpacking and guarantee deterministic disk reclamation`;
    }

    // 2. Generator Yield From & Yield
    else if (cleanCombined.startsWith('yield from ')) {
      hasYieldFrom = true;
      const target = cleanCombined.replace('yield from ', '').trim();
      explanation = level === 'beginner'
        ? `hands work over to '${target}' and delivers each result one-by-one as it is found, so your computer memory doesn't get overloaded`
        : level === 'intermediate'
        ? `delegates to sub-generator '${target}' via 'yield from' to lazily stream findings to the caller without creating a massive list in RAM`
        : `coroutine delegation via 'yield from': pipelines results from '${target}' directly to consumer, preserving O(1) memory bound`;
    } else if (cleanCombined.startsWith('yield ')) {
      hasYield = true;
      const target = cleanCombined.replace('yield ', '').trim();
      explanation = level === 'beginner'
        ? `hands '${target}' to the caller and pauses here until the next result is asked for`
        : level === 'intermediate'
        ? `yields '${target}' lazily to caller, maintaining generator stream state`
        : `emits '${target}' across generator boundary; defers subsequent evaluation until next iteration tick`;
    }

    // 3. Stack Operations (.append & .pop)
    else if (cleanCombined.includes('file_stack.append(')) {
      hasFileStack = true;
      const itemMatch = cleanCombined.match(/append\((.*?)\)/);
      const item = itemMatch ? itemMatch[1].trim() : 'item';
      explanation = level === 'beginner'
        ? `adds '${item}' to a reminder stack so the program remembers which file or nested archive it is currently looking inside`
        : level === 'intermediate'
        ? `pushes '${item}' onto file_stack to maintain the active breadcrumb hierarchy during nested archive exploration`
        : `pushes '${item}' onto call stack frame: preserves nested provenance chain for exploit detection and error unwinding`;
    } else if (cleanCombined.includes('file_stack.pop()')) {
      hasFileStack = true;
      explanation = level === 'beginner'
        ? `crosses the finished file off the reminder stack now that scanning inside it is complete`
        : level === 'intermediate'
        ? `removes the finished path from file_stack via .pop(), cleanly restoring the parent directory state`
        : `pops topmost stack frame upon scan completion, maintaining deterministic stack depth invariant`;
    }

    // 4. Pathlib Directory & File Checks
    else if (cleanCombined.includes('.is_dir()')) {
      hasPathlib = true;
      const pathMatch = cleanCombined.match(/Path\((.*?)\)/);
      const targetPath = pathMatch ? pathMatch[1] : 'scan_path';
      explanation = level === 'beginner'
        ? `checks if '${targetPath}' is a folder so it knows to walk inside and check all its files`
        : level === 'intermediate'
        ? `uses Path().is_dir() to verify if '${targetPath}' is a directory before launching recursive folder exploration`
        : `filesystem node inspection: queries inode directory metadata via Pathlib to branch into recursive traversal`;
    } else if (cleanCombined.includes('.is_file()')) {
      hasPathlib = true;
      const pathMatch = cleanCombined.match(/Path\((.*?)\)/);
      const targetPath = pathMatch ? pathMatch[1] : 'scan_path';
      explanation = level === 'beginner'
        ? `checks if '${targetPath}' is a single standalone file so it can scan it directly without searching folders`
        : level === 'intermediate'
        ? `uses Path().is_file() to verify '${targetPath}' is a regular file and scan it immediately`
        : `path discrimination: validates '${targetPath}' as regular file leaf node, bypassing directory walk`;
    }

    // 5. Early Exit Flags (if self.no_scan:)
    else if (cleanCombined.includes('self.no_scan') || cleanCombined.includes('no_scan:')) {
      hasNoScan = true;
      explanation = level === 'beginner'
        ? `checks if 'self.no_scan' is turned on: if the user asked not to scan, it skips the heavy work completely`
        : level === 'intermediate'
        ? `evaluates 'self.no_scan' flag: skips CVE scanning when no-scan mode was requested via CLI flags`
        : `fail-fast short-circuit: checks 'self.no_scan' guard to prevent unnecessary extraction sandbox initialization`;
    }

    // 6. Logging
    else if (cleanCombined.includes('LOGGER.info(') || cleanCombined.includes('logger.info(')) {
      hasLogger = true;
      const msgMatch = cleanCombined.match(/info\((.*?)\)/s);
      const msg = msgMatch ? msgMatch[1].trim() : 'status';
      explanation = level === 'beginner'
        ? `prints informative message ${msg} so the user knows what the scanner is doing`
        : level === 'intermediate'
        ? `emits log info ${msg} via LOGGER.info() for status tracking and automation`
        : `structured logging: writes informational event ${msg} to logging pipeline for audit telemetry`;
    }

    // 7. Directory Walker Loop
    else if (cleanCombined.startsWith('for ') && cleanCombined.includes('self.walker(')) {
      hasForLoop = true;
      explanation = level === 'beginner'
        ? `loops through every single file found inside the folder, saving each file path to 'filepath'`
        : level === 'intermediate'
        ? `passes path to self.walker() to iterate through every discovered file sequentially as 'filepath'`
        : `traverses directory generator stream from self.walker(), binding each discovered path to 'filepath'`;
    }

    // 8. While True / Loops
    else if (cleanCombined.startsWith('while True:') || cleanCombined.startsWith('while true:')) {
      hasWhileTrue = true;
      explanation = level === 'beginner'
        ? `starts an infinite loop that keeps repeating continuously until you specifically type 'exit'`
        : level === 'intermediate'
        ? `runs an infinite while loop: repeats indefinitely until an explicit 'break' statement is executed`
        : `continuous polling event loop with explicit sentinel break termination`;
    }

    // 9. Loop controls
    else if (cleanCombined === 'break' || cleanCombined.startsWith('break ')) {
      hasBreak = true;
      explanation = level === 'beginner'
        ? `immediately stops the loop from repeating and exits`
        : level === 'intermediate'
        ? `breaks out of the enclosing loop, jumping immediately to subsequent statements`
        : `terminates loop control flow immediately, bypassing remaining iterations`;
    }

    // 10. User Input & Cleaning
    else if (cleanCombined.includes('input(') && cleanCombined.includes('.strip()')) {
      hasStrip = true;
      const varName = cleanCombined.split('=')[0].trim();
      explanation = level === 'beginner'
        ? `asks user for input and uses .strip() to trim any accidental spaces or newlines before saving into '${varName}'`
        : level === 'intermediate'
        ? `captures user console input and sanitizes leading/trailing whitespace via .strip() into '${varName}'`
        : `reads stdin stream into '${varName}' with .strip() sanitization to prevent whitespace validation faults`;
    }

    // 11. String methods (.lower, isdigit, len, startswith)
    else if (cleanCombined.includes('.lower()') && (cleanCombined.includes('== "exit"') || cleanCombined.includes("== 'exit'"))) {
      hasLower = true;
      explanation = level === 'beginner'
        ? `converts all letters to lowercase so typing 'EXIT', 'Exit', or 'exit' all trigger quitting`
        : level === 'intermediate'
        ? `applies .lower() for case-insensitive matching to verify if user commanded 'exit'`
        : `normalizes input casing to lowercase for invariant sentinel quit comparison`;
    } else if (cleanCombined.includes('len(') && cleanCombined.includes('.isdigit()')) {
      hasLen = true;
      hasIsDigit = true;
      explanation = level === 'beginner'
        ? `checks two rules: confirms the length is exactly 6 characters and confirms all characters are numbers`
        : level === 'intermediate'
        ? `validates that character count equals 6 via len() and all characters are numeric via .isdigit()`
        : `composite invariant guard: enforces strict 6-character length and non-alphabetic digit constraint`;
    } else if (cleanCombined.includes('.startswith(')) {
      hasStartsWith = true;
      explanation = level === 'beginner'
        ? `checks if the ID number starts with the required starting digits`
        : level === 'intermediate'
        ? `uses .startswith() to inspect initial characters for valid prefix matching`
        : `prefix inspection: validates leading tokens without allocating intermediate substring slices`;
    }

    // 12. Else / Fallback
    else if (cleanCombined === 'else:') {
      explanation = level === 'beginner'
        ? `fallback branch: runs automatically if the checks above were not met`
        : level === 'intermediate'
        ? `else branch: executes when previous conditional branches evaluated to false`
        : `fallback control path: handles negative predicate branch`;
    }

    // 13. Print statements
    else if (cleanCombined.startsWith('print(')) {
      const msg = cleanCombined.replace('print(', '').replace(/\)$/, '').trim();
      explanation = level === 'beginner'
        ? `prints message ${msg} onto the screen for the user`
        : level === 'intermediate'
        ? `outputs ${msg} to console stdout`
        : `emits ${msg} to stdout stream`;
    }

    // 14. Method definitions with return types
    else if (cleanCombined.startsWith('def ') && cleanCombined.includes('->')) {
      hasFunction = true;
      const fnSig = cleanCombined.replace('def ', '').replace(/:$/, '').trim();
      explanation = level === 'beginner'
        ? `defines function '${fnSig}': accepts scan inputs and gives back results as a stream`
        : level === 'intermediate'
        ? `declares method '${fnSig}': generator function yielding typed ScanInfo results`
        : `declares generator method '${fnSig}': typed coroutine producing Iterator[ScanInfo] stream`;
    } else if (cleanCombined.startsWith('def ')) {
      hasFunction = true;
      const fnName = cleanCombined.split('(')[0].replace('def', '').trim();
      explanation = level === 'beginner'
        ? `creates a reusable function named '${fnName}'`
        : level === 'intermediate'
        ? `defines function '${fnName}' encapsulating modular logic`
        : `defines routine '${fnName}' establishing functional boundary`;
    } else if (cleanCombined.includes('=')) {
      const varName = cleanCombined.split('=')[0].trim();
      const val = cleanCombined.split('=').slice(1).join('=').trim();
      explanation = level === 'beginner'
        ? `stores value ${val} into variable '${varName}'`
        : level === 'intermediate'
        ? `assigns evaluated expression ${val} to '${varName}'`
        : `binds computed value ${val} to symbol '${varName}'`;
    } else {
      explanation = `executes: ${cleanCombined}`;
    }

    lineExplanations.push({
      id: `line-${startLineNum}`,
      lineNumber: startLineNum,
      endLineNumber: endLineNum,
      codeSnippet: combinedSnippet,
      explanation
    });

    i++;
  }

  // ================= DEEP ARCHITECTURAL RATIONALES (ADAPTED TO LEVEL) =================
  if (hasYieldFrom || hasYield) {
    rationales.push({
      topic: "Why use 'yield from' and a Generator instead of returning a list?",
      explanation: level === 'beginner'
        ? "Because scanning a computer with thousands of files all at once would freeze your system and use up all your computer memory. A generator hands you findings one file at a time smoothly as they are found."
        : level === 'intermediate'
        ? "CVE scanning explores deep directories with thousands of files. Returning a list buffers all findings in RAM, whereas 'yield from' streams results lazily with O(1) memory overhead and emits output immediately."
        : "Implements memory-bounded coroutine streaming: pipelining findings via 'yield from' enforces an O(1) space complexity bound, preventing Out-Of-Memory (OOM) faults on multi-gigabyte filesystems and allowing backpressure from consumers."
    });
  }

  if (hasFileStack) {
    rationales.push({
      topic: "Why maintain 'self.file_stack' using append() and pop()?",
      explanation: level === 'beginner'
        ? "Compressed archives can be nested (like a zip file inside another zip file). Pushing with append() and popping with pop() keeps a breadcrumb list of where the program is so it never gets lost."
        : level === 'intermediate'
        ? "Maintains an active call stack of currently unpacked files. If an extraction fails or a corrupted archive is encountered, the error logger reconstructs the exact parent-child extraction hierarchy."
        : "Maintains provenance call-stack invariant across recursive archive extractions. Preserves ancestor path state for deterministic error unwinding and mitigates zip-slip traversal exploits."
    });
  }

  if (hasContextManager) {
    rationales.push({
      topic: "Why wrap extraction in 'with Extractor(...) as ectx:'?",
      explanation: level === 'beginner'
        ? "When files are unpacked, they create temporary clutter on your hard drive. Using 'with' makes sure that even if the scan crashes or you stop it, all temporary files are automatically cleaned up and erased."
        : level === 'intermediate'
        ? "Implements a context manager for temporary directory sandboxing. Guarantees that extracted files are deterministically purged from disk upon exit, preventing storage leaks."
        : "RAII scoped lifetime encapsulation: isolates untrusted archive extraction into an ephemeral sandbox and guarantees disk cleanup invariants even under unhandled exceptions or SIGINT cancellation."
    });
  }

  if (hasPathlib) {
    rationales.push({
      topic: "Why use Path(scan_path).is_dir() from pathlib instead of os.path?",
      explanation: level === 'beginner'
        ? "Pathlib works properly on both Windows and Mac/Linux without breaking when slashes (\\ vs /) are different. .is_dir() cleanly checks if it's a folder."
        : level === 'intermediate'
        ? "Pathlib provides an object-oriented path interface. Calling .is_dir() cleanly distinguishes directories from files cross-platform without messy string manipulation."
        : "Type-safe POSIX/NT filesystem abstraction: eliminates platform-specific path separator bugs and provides uniform inode querying."
    });
  }

  if (hasLogger) {
    rationales.push({
      topic: "Why use LOGGER.info() instead of print()?",
      explanation: level === 'beginner'
        ? "Loggers let developers turn messages on or off easily, and add timestamps, rather than cluttering the screen with regular print statements."
        : level === 'intermediate'
        ? "Structured loggers allow configuring verbosity levels (--debug vs --quiet) and routing logs to monitoring tools in automated pipelines."
        : "Decouples presentation from telemetry: enables log level filtering, log rotation, and structured JSON output in headless CI/CD systems."
    });
  }

  if (hasNoScan) {
    rationales.push({
      topic: "Why check 'if self.no_scan:' early?",
      explanation: level === 'beginner'
        ? "If the user told the scanner not to scan, checking right away saves time and avoids doing any heavy computer work."
        : level === 'intermediate'
        ? "Early exit guard: avoids allocating the Extractor context or accessing disk when the user passed '--no-scan'."
        : "Short-circuit precondition guard: prevents extraneous I/O initialization and enforces command-line intent before resource acquisition."
    });
  }

  if (hasForLoop) {
    rationales.push({
      topic: "Why use a for-loop for directory walking instead of while or recursion?",
      explanation: level === 'beginner'
        ? "A for-loop looks through each file one by one in order without risking getting stuck in an endless loop."
        : level === 'intermediate'
        ? "The directory walker returns a generator sequence. A for-loop consumes each discovered path sequentially without manual index tracking."
        : "Bounded generator consumption: iterates over sequential file handles without risk of unbounded call stack exhaustion from recursive function calls."
    });
  }

  if (hasWhileTrue && hasBreak) {
    rationales.push({
      topic: "Why use 'while True:' with 'break' instead of a boolean flag?",
      explanation: level === 'beginner'
        ? "It keeps the program running interactively until the user types 'exit', exiting immediately without needing extra tracker variables."
        : level === 'intermediate'
        ? "Provides a clean event loop without maintaining a separate 'keep_running = True' flag."
        : "Infinite event loop with explicit sentinel termination, minimizing stateful boolean flag allocations."
    });
  }

  if (hasLower) {
    rationales.push({
      topic: "Why convert with 'num.lower() == \"exit\"'?",
      explanation: level === 'beginner'
        ? "So that typing 'EXIT', 'Exit', or 'exit' all work equally well and user isn't punished for capital letters."
        : level === 'intermediate'
        ? "Provides case-insensitive comparison, ensuring any capitalization of 'exit' triggers quitting."
        : "Normalizes input to lowercase, ensuring invariant sentinel matching across all character casing variations."
    });
  }

  if (hasStrip) {
    rationales.push({
      topic: "Why append '.strip()' to the input prompt?",
      explanation: level === 'beginner'
        ? "Removes accidental spaces before or after the input so accidental spaces don't cause an error."
        : level === 'intermediate'
        ? "Sanitizes input by trimming leading and trailing whitespace and newline characters."
        : "Input hygiene: strips control and whitespace bytes to prevent downstream validation faults."
    });
  }

  if (hasLen && hasIsDigit) {
    rationales.push({
      topic: "Why validate 'len(num) == 6 and num.isdigit()' before checking prefixes?",
      explanation: level === 'beginner'
        ? "Makes sure the input is exactly 6 digits first before checking what numbers it starts with, preventing errors."
        : level === 'intermediate'
        ? "Validates both length and digit criteria upfront, preventing IndexError and rejecting letters early."
        : "Precondition invariant: enforces 6-character length and digit-only constraints before performing substring operations."
    });
  }

  if (hasStartsWith) {
    rationales.push({
      topic: "Why use 'num.startswith(\"25\")' instead of array slicing 'num[:2] == \"25\"'?",
      explanation: level === 'beginner'
        ? "It is clearer to read and won't crash if someone enters a short word."
        : level === 'intermediate'
        ? "'.startswith()' is self-documenting and safe from indexing errors on short strings."
        : "Idiomatic prefix evaluation: avoids allocating slice objects and safely handles length edge cases."
    });
  }

  if (rationales.length === 0) {
    rationales.push({
      topic: "Why is the logic structured in early-exit guard clauses?",
      explanation: level === 'beginner'
        ? "Checking conditions first and finishing early keeps the code neat and prevents messy indentation."
        : level === 'intermediate'
        ? "Fail-fast pattern: checks guard conditions first to keep nested logic shallow."
        : "Reduces cyclomatic complexity and maintains shallow nesting through guard clauses."
    });
  }

  const summaries = {
    beginner: `Analyzed "${targetFile.fileName}" in Beginner Mode: Simple, clear explanations for every line with everyday analogies.`,
    intermediate: `Analyzed "${targetFile.fileName}" in Intermediate Mode: Standard developer breakdown covering data flow, APIs, and state.`,
    advanced: `Analyzed "${targetFile.fileName}" in Senior / Architect Mode: Deep systems engineering breakdown covering invariants, memory bounds, and lifecycles.`
  };

  return {
    summary: summaries[level],
    lineExplanations,
    whyBuiltRationales: rationales
  };
}
