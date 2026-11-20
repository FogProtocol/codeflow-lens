import { AudienceLevel, LineByLineExplanation, WhyBuiltRationale, FilePaneData, DeepDiveInfo } from '../types';

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

  // If no API key is provided, provide a rich, deep local line-by-line breakdown with mental models
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
Your goal is to make code instantly clear even for beginners or developers who haven't read code in a long time.

Code snippet from "${fileName}":
\`\`\`
${codeSnippet}
\`\`\`

Existing explanation:
"${existingMeaning}"

User's question:
"${question}"

INSTRUCTIONS FOR YOUR ANSWER:
1. Provide a direct, plain-spoken, easily understood answer in 1 to 3 short sentences.
2. If applicable, use a quick real-world analogy (like a restaurant buzzer, an IKEA box, or a library loan).
3. Directly clarify common misconceptions (e.g. whether something bypasses permissions, runs as root, or prompts the user).
4. Explain what functions, methods, and variables actually do under the hood. Avoid dense academic jargon.`;

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
  
  if (q.includes('permission') || q.includes('bypass') || q.includes('security')) {
    return "No, it does NOT bypass operating system permissions or grant root/admin access. It runs under the exact same user account; it only bypasses the execution time freeze by offloading heavy work to a background thread.";
  }
  if (q.includes('unsafe') || q.includes('safe') || q.includes('risk')) {
    return "Merely extracting or reading an archive is much safer than installing it, because installation scripts do NOT execute and binaries do not run. The only real risks are Path Traversal ('Zip Slip' trying to write outside the folder) and Zip Bombs, which security tools specifically guard against.";
  }
  if (q.includes('list') || q.includes('array') || q.includes('command')) {
    return "Commands are passed as a list of separate strings to prevent Shell Injection (where malicious characters like ';' could execute unauthorized commands) and to automatically handle spaces in file paths without manual quoting.";
  }
  if (q.includes('prompt') || q.includes('interactive') || q.includes('input')) {
    return "It actually does NOT prompt the user! In fact, the entire purpose of supplying flags like '-P STATIC_KEY' and '-n' is to prevent interactive terminal prompts from freezing automated scripts in the background.";
  }
  if (q.includes('password') || q.includes('invalid_key') || q.includes('static_invalid_key')) {
    return "This is a clever anti-freeze trick: Automated servers have no human to type passwords. By deliberately feeding a dummy password upfront, password-protected files fail immediately with an error rather than freezing the program forever waiting for a keyboard response.";
  }
  if (q.includes('rpm') || q.includes('package') || q.includes('7z') || q.includes('unzip')) {
    return "An RPM or 7z file is essentially a compressed container holding software files and metadata. Tools like rpmextract or 7z unpack the raw files directly into a local folder for dormant inspection without installing them or altering system settings.";
  }
  if (q.includes('yield') || q.includes('generator')) {
    return "'yield from' delegates to another generator function, streaming results piece-by-piece to the caller without creating an expensive in-memory list.";
  }
  if (q.includes('stack') || q.includes('append') || q.includes('pop')) {
    return "The file_stack maintains the breadcrumb trail of directories and nested archives currently being scanned so error handlers can report the exact parent archive.";
  }
  if (q.includes('extractor') || q.includes('with')) {
    return "'with Extractor(...) as ectx:' is a context manager: it creates a temporary sandbox folder for extracted files and automatically wipes the temporary files from disk when done.";
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
- AUDIENCE: Complete Beginner or someone returning to code.
- VOCABULARY & STYLE: Use everyday analogies (restaurant buzzers, IKEA furniture boxes, library loans, conveyor belts).
- TONE: Warm, reassuring, zero intimidating jargon. Make the mental model click instantly.`,
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
Your task: Break down this code line-by-line and provide DEEP-DIVE core information and real-world analogies tailored strictly to the "${level.toUpperCase()}" level.

AUDIENCE LEVEL REQUIREMENTS:
${levelGuidelines}

STRICT RULE ON EXPLANATIONS — NO VAGUE OR LAME DESCRIPTIONS:
- NEVER say "checks condition: if true, executes the indented code block below" or "processes statement".
- ALWAYS explain specifically:
  1. What function, method, or statement is used.
  2. What it actually does with the variables written inside it.
  3. The core reason/logic why it was written in this way, using terminology suited to ${level.toUpperCase()}.

PROVIDE DEEP DIVE CORE INFORMATION FOR SIGNIFICANT LINES/BLOCKS:
Where appropriate, populate the 'deepDive' object with:
- "analogy": A relatable real-world metaphor (e.g. restaurant buzzer for async, IKEA box for unpacking without installing, conveyor belt for generators).
- "cleverTrick": What hidden pitfall, freeze, or vulnerability this code avoids (e.g. why STATIC_INVALID_KEY stops headless freezing; why lists prevent shell injection).
- "misconceptionClarified": Address common doubts (e.g. "Does this bypass permissions?", "Does this prompt the user?").
- "underTheHood": What the OS, memory, or runtime actually does.
- "suggestedQuestions": 2-3 quick questions a curious beginner would ask about this block.

IN THE "whyBuiltRationales" SECTION AT THE END:
Provide 4 to 6 deeply relevant architectural rationales answering:
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
      "explanation": "Clear explanation of what this line executes and why",
      "deepDive": {
        "analogy": "Everyday real-world metaphor",
        "cleverTrick": "The clever trick / pitfall avoided",
        "misconceptionClarified": "Clarifies common beginner doubt",
        "underTheHood": "OS / memory mechanics",
        "suggestedQuestions": ["Question 1?", "Question 2?"]
      }
    }
  ],
  "whyBuiltRationales": [
    {
      "topic": "Why was X used instead of Y?",
      "explanation": "Rationale tailored to ${level} level",
      "analogy": "Optional everyday analogy"
    }
  ]
}

Ensure lineExplanations cover every meaningful line sequentially.`;
}

/**
 * Deep local fallback parser:
 * Explicitly adapts descriptions, analogies, and clever-trick breakdowns to Beginner vs Intermediate vs Advanced!
 */
function generateLocalFallbackAnalysis(
  targetFile: FilePaneData,
  level: AudienceLevel
): AnalysisResponse {
  const lines = targetFile.content.split('\n');
  const lineExplanations: LineByLineExplanation[] = [];
  const rationales: WhyBuiltRationale[] = [];

  // Semantic tracking flags for the file
  let hasAsyncWrap = false;
  let hasAioRun = false;
  let hasStaticInvalidKey = false;
  let hasUnzip = false;
  let has7z = false;
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
    let deepDive: DeepDiveInfo | undefined = undefined;

    // 0. async_wrap pattern: e.g. rpmextract = async_wrap(rpmextract)
    if (cleanCombined.includes('async_wrap(')) {
      hasAsyncWrap = true;
      const targetMatch = cleanCombined.match(/async_wrap\((.*?)\)/);
      const targetFunc = targetMatch ? targetMatch[1].trim() : 'function';
      explanation = level === 'beginner'
        ? `wraps '${targetFunc}' so it runs in the background: converts a slow, freezing task into a non-blocking coroutine that can be used with 'await'`
        : level === 'intermediate'
        ? `converts synchronous function '${targetFunc}' to async using decorator wrapper, offloading blocking I/O to a worker thread`
        : `asynchronous coroutine adapter: wraps blocking callable '${targetFunc}' via thread executor to prevent event loop starvation`;

      deepDive = {
        analogy: "The Restaurant Buzzer: If a cashier stops taking orders to cook in the kitchen, the whole line freezes. Handing you a buzzer lets the cashier take orders while the chef cooks in the background. When ready, the buzzer alerts you (await).",
        cleverTrick: "Avoids freezing the entire asyncio event loop during heavy CPU/archive decompression by moving work onto a background worker thread.",
        misconceptionClarified: "Does NOT bypass file permissions or security controls! It runs under the exact same process and user permissions; it only bypasses the execution time freeze.",
        underTheHood: "Under the hood, wraps the function in a coroutine that delegates execution to asyncio.to_thread or run_in_executor.",
        suggestedQuestions: [
          "Does async_wrap bypass file permissions?",
          "Why would the application freeze without async_wrap?",
          "What does async_wrap look like under the hood?"
        ]
      };
    }

    // 1. aio_run_command / CLI command list execution
    else if (cleanCombined.includes('aio_run_command(') || (cleanCombined.includes('unzip') && cleanCombined.includes('STATIC_INVALID_KEY'))) {
      hasAioRun = true;
      hasStaticInvalidKey = cleanCombined.includes('STATIC_INVALID_KEY');
      hasUnzip = cleanCombined.includes('unzip');
      has7z = cleanCombined.includes('7z');

      const toolName = has7z ? '7-Zip (7z)' : 'unzip';
      explanation = level === 'beginner'
        ? `runs the '${toolName}' tool in the background to unpack files into the destination folder, using a dummy password so the program never halts waiting for keyboard input`
        : level === 'intermediate'
        ? `executes '${toolName}' command asynchronously with non-interactive flags and dummy password to suppress terminal prompt hangs`
        : `invokes subprocess '${toolName}' via argv list; supplies sentinel invalid key to force immediate error exit on password-encrypted archives`;

      deepDive = {
        analogy: "Pre-filling a form at the reception desk so they don't stop you: Intentionally passes a dummy password upfront so the program never halts waiting for someone to type at a keyboard.",
        cleverTrick: "The Dummy Password Anti-Freeze Trick: Automated servers don't have a human to type a password. Supplying STATIC_INVALID_KEY forces unzip/7z to fail immediately with an error rather than freezing the program forever.",
        misconceptionClarified: "Does NOT prompt the user for input! The command-line flags (-n, -y, -P) are explicitly designed to SUPPRESS interactive prompts so background tasks never hang.",
        underTheHood: "Passed as a Python list of arguments rather than a single string to prevent Shell Injection vulnerabilities (CWE-78) and safely preserve filenames containing spaces.",
        suggestedQuestions: [
          "Why is this command written as a list instead of a string?",
          "Why does it pass STATIC_INVALID_KEY?",
          "Does this command install the software or just extract it?"
        ]
      };
    }

    // 2. Docstrings & Comments
    else if (trimmed.startsWith('"""') || trimmed.startsWith("'''")) {
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

    // 3. Context Managers: with Extractor(...) as ectx:
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

      deepDive = {
        analogy: "Renting a workspace with an automatic cleanup crew: Whatever temporary clutter or unpacked files are generated during the scan are guaranteed to be erased the moment you leave the room.",
        cleverTrick: "Ensures that even if the scan crashes, times out, or raises an unhandled exception, all unpacked disk files are purged immediately to prevent filling up the server's hard drive.",
        misconceptionClarified: "Extracting is MUCH safer than installing. Installing an RPM/DEB runs root setup scripts; extracting with an Extractor only unpacks dormant bytes without executing any code.",
        underTheHood: "Implements Python's __enter__ and __exit__ dunder protocol (RAII resource acquisition).",
        suggestedQuestions: [
          "Why wrap this in a 'with' context manager?",
          "What is the difference between extracting an archive and installing it?",
          "Is extracting unknown archives safe?"
        ]
      };
    }

    // 4. Generator Yield From & Yield
    else if (cleanCombined.startsWith('yield from ')) {
      hasYieldFrom = true;
      const target = cleanCombined.replace('yield from ', '').trim();
      explanation = level === 'beginner'
        ? `hands work over to '${target}' and delivers each result one-by-one as it is found, so your computer memory doesn't get overloaded`
        : level === 'intermediate'
        ? `delegates to sub-generator '${target}' via 'yield from' to lazily stream findings to the caller without creating a massive list in RAM`
        : `coroutine delegation via 'yield from': pipelines results from '${target}' directly to consumer, preserving O(1) memory bound`;

      deepDive = {
        analogy: "A conveyor belt vs a giant moving truck: Rather than collecting 50,000 files in a giant box before handing it over, it places each finding on a conveyor belt one-by-one as soon as it's discovered.",
        cleverTrick: "Keeps memory usage at O(1). Without 'yield from', scanning a 100GB disk with thousands of files would allocate massive lists in RAM and crash with an Out-of-Memory (OOM) error.",
        misconceptionClarified: "The function does NOT finish all at once; it pauses and resumes transparently as the caller iterates through it.",
        underTheHood: "Python's yield from sets up a bidirectional communication channel between the sub-generator and the top-level consumer, transparently forwarding values, exceptions, and returns.",
        suggestedQuestions: [
          "Why use 'yield from' instead of returning a list?",
          "Does 'yield from' wait for everything to finish?",
          "How does lazy evaluation save computer memory?"
        ]
      };
    } else if (cleanCombined.startsWith('yield ')) {
      hasYield = true;
      const target = cleanCombined.replace('yield ', '').trim();
      explanation = level === 'beginner'
        ? `hands '${target}' to the caller and pauses here until the next result is asked for`
        : level === 'intermediate'
        ? `yields '${target}' lazily to caller, maintaining generator stream state`
        : `emits '${target}' across generator boundary; defers subsequent evaluation until next iteration tick`;
    }

    // 5. Stack Operations (.append & .pop)
    else if (cleanCombined.includes('file_stack.append(')) {
      hasFileStack = true;
      const itemMatch = cleanCombined.match(/append\((.*?)\)/);
      const item = itemMatch ? itemMatch[1].trim() : 'item';
      explanation = level === 'beginner'
        ? `adds '${item}' to a reminder stack so the program remembers which file or nested archive it is currently looking inside`
        : level === 'intermediate'
        ? `pushes '${item}' onto file_stack to maintain the active breadcrumb hierarchy during nested archive exploration`
        : `pushes '${item}' onto call stack frame: preserves nested provenance chain for exploit detection and error unwinding`;

      deepDive = {
        analogy: "A Hansel and Gretel breadcrumb trail: When exploring inside an archive inside another archive (e.g. outer.tar.gz -> inner.zip -> app.bin), it records where it is so it can trace the exact path back.",
        cleverTrick: "Enables accurate error reporting and shields against zip-slip directory traversal exploits by tracking the exact ancestral extraction chain.",
        underTheHood: "Operates as a LIFO (Last-In-First-Out) state stack.",
        suggestedQuestions: [
          "Why maintain a file_stack?",
          "What happens if an archive has nested archives inside it?",
          "How does this prevent path traversal bugs?"
        ]
      };
    } else if (cleanCombined.includes('file_stack.pop()')) {
      hasFileStack = true;
      explanation = level === 'beginner'
        ? `crosses the finished file off the reminder stack now that scanning inside it is complete`
        : level === 'intermediate'
        ? `removes the finished path from file_stack via .pop(), cleanly restoring the parent directory state`
        : `pops topmost stack frame upon scan completion, maintaining deterministic stack depth invariant`;
    }

    // 6. Pathlib Directory & File Checks
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

    // 7. Early Exit Flags (if self.no_scan:)
    else if (cleanCombined.includes('self.no_scan') || cleanCombined.includes('no_scan:')) {
      hasNoScan = true;
      explanation = level === 'beginner'
        ? `checks if 'self.no_scan' is turned on: if the user asked not to scan, it skips the heavy work completely`
        : level === 'intermediate'
        ? `evaluates 'self.no_scan' flag: skips CVE scanning when no-scan mode was requested via CLI flags`
        : `fail-fast short-circuit: checks 'self.no_scan' guard to prevent unnecessary extraction sandbox initialization`;
    }

    // 8. Logging
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

    // 9. Directory Walker Loop
    else if (cleanCombined.startsWith('for ') && cleanCombined.includes('self.walker(')) {
      hasForLoop = true;
      explanation = level === 'beginner'
        ? `loops through every single file found inside the folder, saving each file path to 'filepath'`
        : level === 'intermediate'
        ? `passes path to self.walker() to iterate through every discovered file sequentially as 'filepath'`
        : `traverses directory generator stream from self.walker(), binding each discovered path to 'filepath'`;
    }

    // 10. While True / Loops
    else if (cleanCombined.startsWith('while True:') || cleanCombined.startsWith('while true:')) {
      hasWhileTrue = true;
      explanation = level === 'beginner'
        ? `starts an infinite loop that keeps repeating continuously until you specifically type 'exit'`
        : level === 'intermediate'
        ? `runs an infinite while loop: repeats indefinitely until an explicit 'break' statement is executed`
        : `continuous polling event loop with explicit sentinel break termination`;
    }

    // 11. Loop controls
    else if (cleanCombined === 'break' || cleanCombined.startsWith('break ')) {
      hasBreak = true;
      explanation = level === 'beginner'
        ? `immediately stops the loop from repeating and exits`
        : level === 'intermediate'
        ? `breaks out of the enclosing loop, jumping immediately to subsequent statements`
        : `terminates loop control flow immediately, bypassing remaining iterations`;
    }

    // 12. User Input & Cleaning
    else if (cleanCombined.includes('input(') && cleanCombined.includes('.strip()')) {
      hasStrip = true;
      const varName = cleanCombined.split('=')[0].trim();
      explanation = level === 'beginner'
        ? `asks user for input and uses .strip() to trim any accidental spaces or newlines before saving into '${varName}'`
        : level === 'intermediate'
        ? `captures user console input and sanitizes leading/trailing whitespace via .strip() into '${varName}'`
        : `reads stdin stream into '${varName}' with .strip() sanitization to prevent whitespace validation faults`;
    }

    // 13. String methods (.lower, isdigit, len, startswith)
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

    // 14. Else / Fallback
    else if (cleanCombined === 'else:') {
      explanation = level === 'beginner'
        ? `fallback branch: runs automatically if the checks above were not met`
        : level === 'intermediate'
        ? `else branch: executes when previous conditional branches evaluated to false`
        : `fallback control path: handles negative predicate branch`;
    }

    // 15. Print statements
    else if (cleanCombined.startsWith('print(')) {
      const msg = cleanCombined.replace('print(', '').replace(/\)$/, '').trim();
      explanation = level === 'beginner'
        ? `prints message ${msg} onto the screen for the user`
        : level === 'intermediate'
        ? `outputs ${msg} to console stdout`
        : `emits ${msg} to stdout stream`;
    }

    // 16. Method definitions with return types
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
      explanation,
      deepDive
    });

    i++;
  }

  // ================= DEEP ARCHITECTURAL RATIONALES (ADAPTED TO LEVEL) =================
  if (hasAsyncWrap) {
    rationales.push({
      topic: "Why use 'async_wrap' to wrap archive extraction?",
      explanation: level === 'beginner'
        ? "Extracting files takes a lot of time. If you run it normally, your entire program freezes and cannot respond to anyone. Wrapping it lets the extraction run in the background like a restaurant kitchen while the main program stays fast."
        : level === 'intermediate'
        ? "Extracting archives is CPU and disk I/O intensive. Calling it synchronously in an event loop (asyncio) blocks all concurrent requests. 'async_wrap' dispatches the blocking call to a thread pool so the event loop never starves."
        : "Offloads synchronous, blocking C-level decompression routines to an asynchronous worker thread pool, preventing event loop blocking and preserving asynchronous concurrency guarantees.",
      analogy: "The Restaurant Buzzer: Handing the customer a buzzer instead of freezing the ordering counter while the chef cooks."
    });
  }

  if (hasStaticInvalidKey || hasAioRun) {
    rationales.push({
      topic: "Why supply STATIC_INVALID_KEY and pass commands as a list?",
      explanation: level === 'beginner'
        ? "Two clever tricks: (1) Passing a fake password forces password-protected files to stop immediately instead of freezing forever waiting for someone to type. (2) Using a list keeps filenames safe so strange symbols or spaces don't break the computer."
        : level === 'intermediate'
        ? "(1) Intentional sentinel key forces password prompts to exit immediately with an error code rather than hanging headless automation. (2) Passing argv as a list prevents shell command injection (CWE-78) and handles whitespace in paths."
        : "Subprocess security & non-interactive execution: avoids invoking an intermediate shell to eliminate command injection vectors, and pre-supplies credentials to ensure deterministic non-blocking failure on encrypted payloads.",
      analogy: "Pre-filling an administrative form with an invalid token to trigger an immediate automated rejection rather than waiting for an in-person interview."
    });
  }

  if (hasYieldFrom || hasYield) {
    rationales.push({
      topic: "Why use 'yield from' and a Generator instead of returning a list?",
      explanation: level === 'beginner'
        ? "Because scanning a computer with thousands of files all at once would freeze your system and use up all your computer memory. A generator hands you findings one file at a time smoothly as they are found."
        : level === 'intermediate'
        ? "CVE scanning explores deep directories with thousands of files. Returning a list buffers all findings in RAM, whereas 'yield from' streams results lazily with O(1) memory overhead and emits output immediately."
        : "Implements memory-bounded coroutine streaming: pipelining findings via 'yield from' enforces an O(1) space complexity bound, preventing Out-Of-Memory (OOM) faults on multi-gigabyte filesystems and allowing backpressure from consumers.",
      analogy: "A conveyor belt: Serving sushi plates one by one as they are made, rather than piling 10,000 plates on a single table and breaking the table."
    });
  }

  if (hasFileStack) {
    rationales.push({
      topic: "Why maintain 'self.file_stack' using append() and pop()?",
      explanation: level === 'beginner'
        ? "Compressed archives can be nested (like a zip file inside another zip file). Pushing with append() and popping with pop() keeps a breadcrumb list of where the program is so it never gets lost."
        : level === 'intermediate'
        ? "Maintains an active call stack of currently unpacked files. If an extraction fails or a corrupted archive is encountered, the error logger reconstructs the exact parent-child extraction hierarchy."
        : "Maintains provenance call-stack invariant across recursive archive extractions. Preserves ancestor path state for deterministic error unwinding and mitigates zip-slip traversal exploits.",
      analogy: "Hansel & Gretel breadcrumbs: Dropping markers as you walk deeper into a maze so you can always retrace the exact path."
    });
  }

  if (hasContextManager) {
    rationales.push({
      topic: "Why wrap extraction in 'with Extractor(...) as ectx:'?",
      explanation: level === 'beginner'
        ? "When files are unpacked, they create temporary clutter on your hard drive. Using 'with' makes sure that even if the scan crashes or you stop it, all temporary files are automatically cleaned up and erased."
        : level === 'intermediate'
        ? "Implements a context manager for temporary directory sandboxing. Guarantees that extracted files are deterministically purged from disk upon exit, preventing storage leaks."
        : "RAII scoped lifetime encapsulation: isolates untrusted archive extraction into an ephemeral sandbox and guarantees disk cleanup invariants even under unhandled exceptions or SIGINT cancellation.",
      analogy: "Renting a workspace with a cleaning guarantee: Whatever clutter is created while working is guaranteed to be erased the moment you leave."
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

  const summaries = {
    beginner: `Analyzed "${targetFile.fileName}" in Beginner Mode: Plain English, everyday analogies, and clear mental models for every line.`,
    intermediate: `Analyzed "${targetFile.fileName}" in Intermediate Mode: Standard developer breakdown covering data flow, APIs, and state.`,
    advanced: `Analyzed "${targetFile.fileName}" in Senior / Architect Mode: Deep systems engineering breakdown covering invariants, memory bounds, and lifecycles.`
  };

  return {
    summary: summaries[level],
    lineExplanations,
    whyBuiltRationales: rationales
  };
}
