import { SampleProject } from '../types';

export const SAMPLE_PROJECTS: SampleProject[] = [
  {
    id: 'calculator-sample',
    title: 'Arithmetic Calculator (Line-by-Line Flow)',
    subtitle: 'Takes inputs, defines an addition function, and outputs the result',
    ecosystem: 'Python / Fundamentals',
    tags: ['Arithmetic', 'Input/Output', 'Functions'],
    files: [
      {
        fileName: 'calculator.py',
        language: 'python',
        content: `int a, b\na = input("Enter first number: ")\nb = input("Enter second number: ")\n\ndef add(a, b):\n    return (a + b)\n\nprint(add(a, b))`,
        summary: {
          beginner: "Takes two numbers as input from the user, defines an addition function, and prints back the sum.",
          intermediate: "Standard input-processing pipeline with function encapsulation.",
          advanced: "Linear execution pipeline with function abstraction boundary."
        },
        lineExplanations: {
          beginner: [
            {
              id: 'l1',
              lineNumber: 1,
              endLineNumber: 1,
              codeSnippet: 'int a, b',
              explanation: 'declared two variables of int type to reserve memory for numbers',
              deepDive: {
                analogy: "Labeling two storage jars 'a' and 'b' so you know exactly which box holds which ingredient.",
                cleverTrick: "Pre-declaring types signals to both developers and IDE linters what kind of data is expected.",
                misconceptionClarified: "Does Python require 'int a, b' before assignment? In pure Python it doesn't, but in typed languages or type-annotated code it clarifies intent immediately.",
                underTheHood: "Allocates symbol entries in the local namespace table.",
                suggestedQuestions: ["Why declare types in Python?", "What happens if a user enters text instead?"]
              }
            },
            {
              id: 'l2',
              lineNumber: 2,
              endLineNumber: 2,
              codeSnippet: 'a = input("Enter first number: ")',
              explanation: 'taken a as input as first number to add from the console',
              deepDive: {
                analogy: "A receptionist pausing to ask for your name before handing you a visitor pass.",
                cleverTrick: "The input() function halts execution until the human hits Enter, ensuring data is available before calculating.",
                misconceptionClarified: "Does input() return a number? No! It returns a string (text) like '5', which would need int(a) if we do math.",
                underTheHood: "Reads raw bytes from stdin file descriptor 0 until a newline byte (\\n) is encountered.",
                suggestedQuestions: ["Why is input() considered a string?", "How to convert input to integer?"]
              }
            },
            {
              id: 'l3',
              lineNumber: 3,
              endLineNumber: 3,
              codeSnippet: 'b = input("Enter second number: ")',
              explanation: 'taken b as input as second number to add from the console'
            },
            {
              id: 'l4',
              lineNumber: 5,
              endLineNumber: 6,
              codeSnippet: 'def add(a, b):\n    return (a + b)',
              explanation: 'created a reusable function named add that takes parameters a and b and returns their sum (a + b)',
              deepDive: {
                analogy: "The Kitchen Blender: You don't build a new motor every time you want a smoothie. You put ingredients in (a, b), press blend, and pour out the drink (return value).",
                cleverTrick: "Functions prevent Copy-Paste Rot: If your formula ever changes, you only edit one place instead of hunting through 10 duplicated blocks.",
                misconceptionClarified: "Does writing 'def add' run the addition immediately? No! It merely stores the recipe in memory; it runs only when you call add().",
                underTheHood: "Creates a code object function in heap memory and binds the name 'add' in the global scope.",
                suggestedQuestions: ["Does defining a function execute it?", "Why return a + b instead of print(a + b)?"]
              }
            },
            {
              id: 'l7',
              lineNumber: 8,
              endLineNumber: 8,
              codeSnippet: 'print(add(a, b))',
              explanation: 'calls the add function with our inputs and displays the final sum on the screen'
            }
          ],
          intermediate: [
            {
              id: 'l1_i',
              lineNumber: 1,
              endLineNumber: 1,
              codeSnippet: 'int a, b',
              explanation: 'Type declaration declaring variables a and b as integer storage.'
            },
            {
              id: 'l2_i',
              lineNumber: 2,
              endLineNumber: 3,
              codeSnippet: 'a = input(...)\nb = input(...)',
              explanation: 'Prompts console for input strings and stores them in variables a and b.'
            },
            {
              id: 'l4_i',
              lineNumber: 5,
              endLineNumber: 6,
              codeSnippet: 'def add(a, b): return (a + b)',
              explanation: 'Encapsulates addition logic with formal parameters a and b, returning their sum.'
            },
            {
              id: 'l7_i',
              lineNumber: 8,
              endLineNumber: 8,
              codeSnippet: 'print(add(a, b))',
              explanation: 'Evaluates add(a, b) and pipes the return value directly into standard output.'
            }
          ],
          advanced: [
            {
              id: 'l1_a',
              lineNumber: 1,
              endLineNumber: 8,
              codeSnippet: 'calculator.py',
              explanation: 'Synchronous CLI arithmetic pipeline: stdin read -> stack frame push -> stdout write.'
            }
          ]
        },
        whyBuiltRationales: {
          beginner: [
            {
              topic: "Why create a separate add(a,b) function instead of just writing print(a + b)?",
              explanation: "Creating a function packages the addition logic into a reusable block. If you later need to add numbers in 10 different places in the program, you only call add() instead of writing duplicate addition code.",
              analogy: "A reusable kitchen recipe card vs rewriting instructions on every scrap of paper."
            },
            {
              topic: "Why use input() instead of fixed numbers?",
              explanation: "Accepting input allows the program to add any two numbers chosen by the user at runtime, rather than being stuck on hardcoded values like 5 + 3."
            }
          ],
          intermediate: [
            {
              topic: "Why encapsulate arithmetic into a function?",
              explanation: "Enforces single-responsibility principle: isolates computation from I/O presentation."
            }
          ],
          advanced: [
            {
              topic: "Architectural abstraction boundary",
              explanation: "Decouples domain computation from transport I/O (console stream)."
            }
          ]
        }
      }
    ]
  },
  {
    id: 'cve-async-archive-sample',
    title: 'Safe Async Archive Extractor (CVE Security Engine)',
    subtitle: 'Real-world open-source code from cve-bin-tool with async_wrap and anti-freeze dummy keys',
    ecosystem: 'Python / Security & Systems',
    tags: ['Asyncio', 'Security', 'Subprocesses', 'cve-bin-tool'],
    files: [
      {
        fileName: 'extractor_worker.py',
        language: 'python',
        content: `import asyncio\nfrom pathlib import Path\nfrom cve_bin_tool.extractor import Extractor\n\nSTATIC_INVALID_KEY = "cve-bin-tool-non-free-password"\n\ndef async_wrap(func):\n    """Wraps a CPU/IO blocking function into an async coroutine on a worker thread pool."""\n    async def run(*args, **kwargs):\n        loop = asyncio.get_running_loop()\n        return await loop.run_in_executor(None, func, *args, **kwargs)\n    return run\n\nrpmextract = async_wrap(rpmextract)\n\nasync def unzip_file(file_path: Path, output_dir: Path):\n    """Safely extracts zip archive without hanging headless CI/CD servers."""\n    cmd = ["unzip", "-q", "-P", STATIC_INVALID_KEY, str(file_path), "-d", str(output_dir)]\n    proc = await asyncio.create_subprocess_exec(\n        *cmd,\n        stdout=asyncio.subprocess.PIPE,\n        stderr=asyncio.subprocess.PIPE\n    )\n    stdout, stderr = await proc.communicate()\n    return proc.returncode == 0`,
        summary: {
          beginner: "Safely extracts RPM and ZIP archives in the background using worker threads and dummy passwords so servers never freeze waiting for user input.",
          intermediate: "Non-blocking archive extraction harness combining thread-pool delegation (async_wrap) with isolated subprocess execution.",
          advanced: "Asynchronous subprocess orchestrator with thread-executor offloading to preserve event-loop liveness during CPU/IO bound decompressions."
        },
        lineExplanations: {
          beginner: [
            {
              id: 'cve-l5',
              lineNumber: 5,
              endLineNumber: 5,
              codeSnippet: 'STATIC_INVALID_KEY = "cve-bin-tool-non-free-password"',
              explanation: 'sets a deliberately bogus password used when attempting to unzip unknown files',
              deepDive: {
                analogy: "The Pre-Inserted Dummy Key: If you try a locked door with a fake key, the lock clicks and says 'Access Denied' immediately. You don't stand there for hours waiting for a locksmith to arrive.",
                cleverTrick: "The Anti-Freeze Guard: In automated GitHub Actions or Docker CI/CD pipelines, there is no human sitting at a screen. If an archive is password-protected, the command-line unzip utility normally stops and asks 'Enter password:'. Passing this dummy key forces unzip to fail instantly with an exit code rather than hanging your server forever!",
                misconceptionClarified: "Does this crack or bypass passwords? No! It does the exact opposite: it deliberately causes a clean, instant failure so the automated security scanner can move on to the next file without locking up.",
                underTheHood: "Passes '-P <key>' directly to unzip. Unzip attempts CRC verification, detects bad password, and terminates with exit code 82.",
                suggestedQuestions: ["Why pass an invalid password instead of no password?", "Does this crack password-protected files?", "What happens on a headless CI/CD server?"]
              }
            },
            {
              id: 'cve-l7',
              lineNumber: 7,
              endLineNumber: 12,
              codeSnippet: 'def async_wrap(func):\n    async def run(*args, **kwargs):\n        loop = asyncio.get_running_loop()\n        return await loop.run_in_executor(None, func, *args, **kwargs)\n    return run',
              explanation: 'converts any slow, freezing Python function into a background coroutine that will not block the program while running',
              deepDive: {
                analogy: "The Restaurant Buzzer: If a cashier took your order and then personally walked into the kitchen to bake your pizza, the whole line would freeze for 20 minutes! Instead, the cashier hands you a buzzer and keeps serving customers. When your food is cooked in the background, your buzzer sounds (await).",
                cleverTrick: "Bypasses the Single-Thread Bottleneck: Normal Python code runs sequentially on one thread. Heavy operations like unpacking a 500MB RPM archive would freeze UI windows and network pings. Wrapping with run_in_executor offloads the task to a background worker thread.",
                misconceptionClarified: "Does async_wrap give root permissions or run as admin? Absolutely NOT! It runs with the exact same user privileges; it only changes execution time and thread scheduling so the program doesn't freeze.",
                underTheHood: "Dispatches the callable to a concurrent.futures.ThreadPoolExecutor, releasing the GIL during blocking C-level I/O operations.",
                suggestedQuestions: ["Does async_wrap grant admin or root access?", "What is the difference between synchronous and asynchronous here?", "Why is run_in_executor needed?"]
              }
            },
            {
              id: 'cve-l14',
              lineNumber: 14,
              endLineNumber: 14,
              codeSnippet: 'rpmextract = async_wrap(rpmextract)',
              explanation: 'replaces the original blocking rpmextract function with its new non-blocking background version',
              deepDive: {
                analogy: "Upgrading your regular postal mail carrier to a 24/7 express courier without changing the address written on the envelope.",
                cleverTrick: "Drop-in API Replacement: Other parts of the codebase can now call 'await rpmextract(file)' without needing to rewrite any internal extraction algorithms.",
                misconceptionClarified: "Does extracting an RPM install it on your computer? NO! Extracting is like opening an IKEA furniture box in your garage to inspect the parts; installing is like drilling holes into your living room walls. Extracting never executes install scripts.",
                underTheHood: "Rebinds the symbol 'rpmextract' in module globals to the wrapped closure.",
                suggestedQuestions: ["Is extracting an RPM the same as installing it?", "Can extracting malware harm the host operating system?"]
              }
            },
            {
              id: 'cve-l18',
              lineNumber: 18,
              endLineNumber: 18,
              codeSnippet: 'cmd = ["unzip", "-q", "-P", STATIC_INVALID_KEY, str(file_path), "-d", str(output_dir)]',
              explanation: 'builds the command line arguments as a list of separate strings: quiet mode (-q), dummy password (-P), source file, and destination directory (-d)',
              deepDive: {
                analogy: "Separate Luggage Tags: Putting each instruction into its own sealed envelope so the postal service never mixes up instructions with addresses.",
                cleverTrick: "CWE-78 Shell Injection Immunity: By passing arguments as a list directly to the operating system (execve), special characters like ';' or '|' inside file paths are never interpreted as shell commands, making it impossible for an attacker to hijack the terminal.",
                misconceptionClarified: "Why not write f'unzip -q {file_path}'? If a malicious file is named 'test; rm -rf /', string formatting would execute the dangerous command! A list treats the entire filename purely as literal text.",
                underTheHood: "Calls OS syscall execve() directly without invoking /bin/sh or cmd.exe.",
                suggestedQuestions: ["Why pass commands as a list instead of a string?", "What is Shell Injection (CWE-78)?", "What does the -q flag do?"]
              }
            },
            {
              id: 'cve-l19',
              lineNumber: 19,
              endLineNumber: 23,
              codeSnippet: 'proc = await asyncio.create_subprocess_exec(\n    *cmd,\n    stdout=asyncio.subprocess.PIPE,\n    stderr=asyncio.subprocess.PIPE\n)',
              explanation: 'launches the external unzip program in an isolated OS process and captures all output in pipes so terminal spam is suppressed',
              deepDive: {
                analogy: "A Soundproof Testing Booth: Running a noisy motor inside a soundproof booth and checking the dials through glass, rather than letting loud sirens blare through the main office.",
                cleverTrick: "Process Isolation: If the external unzip binary crashes or encounters a corrupted archive, only that isolated process terminates; the main Python scanner stays healthy and running.",
                misconceptionClarified: "Does this require administrative privileges? No, create_subprocess_exec runs with the exact same user privileges as the parent process.",
                underTheHood: "Spawns a child process using fork()+exec() on Linux or CreateProcess() on Windows with redirected anonymous pipes.",
                suggestedQuestions: ["What does PIPE do?", "Why use create_subprocess_exec instead of os.system?"]
              }
            }
          ],
          intermediate: [
            {
              id: 'cve-l5_i',
              lineNumber: 5,
              endLineNumber: 5,
              codeSnippet: 'STATIC_INVALID_KEY = "cve-bin-tool-non-free-password"',
              explanation: 'Constant token fed to -P flag preventing interactive password prompts from blocking headless runners.'
            },
            {
              id: 'cve-l7_i',
              lineNumber: 7,
              endLineNumber: 12,
              codeSnippet: 'def async_wrap(func): ...',
              explanation: 'Decorator closure bridging synchronous blocking callables to asyncio via ThreadPoolExecutor.'
            },
            {
              id: 'cve-l14_i',
              lineNumber: 14,
              endLineNumber: 14,
              codeSnippet: 'rpmextract = async_wrap(rpmextract)',
              explanation: 'Monkey-patches synchronous rpmextract with thread-pool async wrapper.'
            },
            {
              id: 'cve-l18_i',
              lineNumber: 18,
              endLineNumber: 18,
              codeSnippet: 'cmd = ["unzip", "-q", "-P", ...]',
              explanation: 'Parametrized argument vector ensuring shell injection safety across arbitrary file paths.'
            },
            {
              id: 'cve-l19_i',
              lineNumber: 19,
              endLineNumber: 23,
              codeSnippet: 'proc = await asyncio.create_subprocess_exec(...)',
              explanation: 'Asynchronous process creation with piped stdout/stderr for non-blocking stream consumption.'
            }
          ],
          advanced: [
            {
              id: 'cve-l5_a',
              lineNumber: 5,
              endLineNumber: 14,
              codeSnippet: 'extractor_worker.py',
              explanation: 'Concurrency adapter & anti-freeze protocol: wraps legacy blocking archive tools in thread pools.'
            },
            {
              id: 'cve-l18_a',
              lineNumber: 18,
              endLineNumber: 25,
              codeSnippet: 'unzip_file(...)',
              explanation: 'Direct execve invocation bypassing shell intermediaries; isolates decompression in child PID.'
            }
          ]
        },
        whyBuiltRationales: {
          beginner: [
            {
              topic: "Why pass STATIC_INVALID_KEY instead of letting unzip ask for a password?",
              explanation: "In automated security pipelines there is no user sitting with a keyboard. If an archive has a password, unzip hangs the entire CI/CD runner forever waiting for input. Supplying a fake password forces unzip to fail in 0.01 seconds and exit cleanly.",
              analogy: "Inserting a dummy key into a lock to test if it's locked, rather than waiting for someone to answer the doorbell."
            },
            {
              topic: "Why use async_wrap instead of running rpmextract directly?",
              explanation: "Unpacking packages takes heavy CPU and disk time. Running it synchronously on Python's main thread freezes all other operations (like timers, network calls, and UI updates). async_wrap offloads it to a background thread so the main engine stays responsive.",
              analogy: "A restaurant buzzer allowing the cashier to keep taking orders while the kitchen cooks."
            },
            {
              topic: "Why pass arguments as a list ['unzip', '-q', ...] instead of a formatted string?",
              explanation: "Security against Shell Injection (CWE-78). A list passes arguments directly to the operating system kernel without invoking a shell command interpreter, meaning filenames with spaces or malicious characters (like ';' or '&&') cannot execute rogue commands.",
              analogy: "Putting instructions into numbered envelopes rather than reading raw text off a megaphone."
            }
          ],
          intermediate: [
            {
              topic: "Why ThreadPoolExecutor over ProcessPoolExecutor for async_wrap?",
              explanation: "Archive unpackers spend significant time in disk I/O and C library routines where GIL is released. Thread pools avoid the serialization and inter-process communication overhead of Process pools."
            },
            {
              topic: "Subprocess execution vector vs os.system",
              explanation: "asyncio.create_subprocess_exec maps directly to execve syscall, completely removing /bin/sh shell invocation and preventing command injection vulnerabilities."
            }
          ],
          advanced: [
            {
              topic: "Event loop starvation mitigation",
              explanation: "Prevents synchronous decompression routines from blocking the asyncio reactor loop, maintaining sub-millisecond task turnaround."
            }
          ]
        }
      }
    ]
  },
  {
    id: 'cve-recursive-scanner-sample',
    title: 'Recursive Archive Walker (cve-bin-tool version_scanner)',
    subtitle: 'Zero-RAM-spike generator pipeline with directory traversal and RAII extraction sandbox',
    ecosystem: 'Python / Security & Core',
    tags: ['Generators', 'Yield From', 'version_scanner.py', 'Context Managers'],
    files: [
      {
        fileName: 'version_scanner.py',
        language: 'python',
        content: `with Extractor(logger=self.logger, error_mode=self.error_mode) as ectx:\n    if Path(scan_path).is_dir():\n        for filepath in self.walker([scan_path]):\n            self.file_stack.append(filepath)\n            yield from self.scan_and_or_extract_file(ectx, filepath)\n            self.file_stack.pop()\n    elif Path(scan_path).is_file():\n        self.file_stack.append(scan_path)\n        yield from self.scan_and_or_extract_file(ectx, scan_path)\n        self.file_stack.pop()`,
        summary: {
          beginner: "Walks through files and folders piece-by-piece, streaming findings one at a time with 'yield from' so huge 50GB disks can be scanned without running out of RAM.",
          intermediate: "Streaming file traversal pipeline using Python generators, RAII temporary sandbox context, and breadcrumb stack tracking.",
          advanced: "Constant-memory O(1) recursive archive analyzer with generator delegation and guaranteed cleanup boundaries."
        },
        lineExplanations: {
          beginner: [
            {
              id: 'vs-l1',
              lineNumber: 1,
              endLineNumber: 1,
              codeSnippet: 'with Extractor(logger=self.logger, error_mode=self.error_mode) as ectx:',
              explanation: 'opens a temporary extraction sandbox that automatically cleans up and deletes all extracted files when finished',
              deepDive: {
                analogy: "The Self-Cleaning Examination Tray: In a laboratory, you place a specimen in a disposable sterile tray (ectx). As soon as the test is done, the tray and all its bio-waste are automatically incinerated, leaving your workspace completely spotless.",
                cleverTrick: "The Disk-Leak Shield: Archives often expand into thousands of temporary files. If an exception occurs midway through scanning, a standard folder might stay on disk, slowly filling up the hard drive. The 'with' context manager guarantees the temporary folder is deleted even if the program crashes!",
                misconceptionClarified: "Does 'with Extractor' install software? Never! It only extracts dormant files into a temporary sandbox for version inspection.",
                underTheHood: "Implements __enter__ and __exit__ dunder protocols. __exit__ executes shutil.rmtree() on the temporary directory.",
                suggestedQuestions: ["What does 'with' do?", "Why use Extractor instead of regular open()?", "Does this leave files on disk?"]
              }
            },
            {
              id: 'vs-l2',
              lineNumber: 2,
              endLineNumber: 2,
              codeSnippet: 'if Path(scan_path).is_dir():',
              explanation: 'checks whether scan_path is a directory/folder rather than an individual file',
              deepDive: {
                analogy: "Checking whether a package is a large carton full of boxes or a single envelope.",
                cleverTrick: "Cross-Platform Pathing: Using pathlib.Path handles backslashes on Windows and forward slashes on Linux seamlessly.",
                misconceptionClarified: "Does is_dir() read file contents? No, it only reads filesystem metadata from the operating system directory index.",
                underTheHood: "Performs an os.stat() syscall and checks the S_ISDIR mode bit.",
                suggestedQuestions: ["Why pathlib instead of os.path?", "What is a directory in OS terms?"]
              }
            },
            {
              id: 'vs-l3',
              lineNumber: 3,
              endLineNumber: 3,
              codeSnippet: 'for filepath in self.walker([scan_path]):',
              explanation: 'loops sequentially through every file found inside the directory tree',
              deepDive: {
                analogy: "A postal carrier walking street by street, visiting each mailbox in order.",
                cleverTrick: "Lazy File Walking: Rather than loading 100,000 filenames into a giant memory array, walker yields files on demand.",
                misconceptionClarified: "Does walker skip hidden files? By default it inspects all matching targets configured in the walker rules.",
                underTheHood: "Wraps os.scandir() using an internal generator iterator.",
                suggestedQuestions: ["What is self.walker?", "How does it handle deeply nested directories?"]
              }
            },
            {
              id: 'vs-l4',
              lineNumber: 4,
              endLineNumber: 4,
              codeSnippet: 'self.file_stack.append(filepath)',
              explanation: 'pushes the current file path onto the stack to keep track of nested archive ancestry',
              deepDive: {
                analogy: "Hansel and Gretel's Breadcrumbs: Dropping a pebble at every fork in the road so you can always trace exactly where you came from.",
                cleverTrick: "Archive Inception Tracking: If you have a .tar.gz inside an .rpm inside a .zip, file_stack records the exact parent-child chain so error reports pinpoint the root container.",
                misconceptionClarified: "Does append() write to disk? No, it only adds a string to an in-memory Python list.",
                underTheHood: "Appends pointer to list in O(1) amortized time.",
                suggestedQuestions: ["What is file_stack used for?", "Why push before scanning?"]
              }
            },
            {
              id: 'vs-l5',
              lineNumber: 5,
              endLineNumber: 5,
              codeSnippet: 'yield from self.scan_and_or_extract_file(ectx, filepath)',
              explanation: 'delegates to the inner scanner and streams findings directly to the caller one by one',
              deepDive: {
                analogy: "The Factory Conveyor Belt: Instead of waiting until 10,000 cars are completely built before shipping any, each car is rolled out to the showroom the second it is assembled.",
                cleverTrick: "Zero RAM Explosion: If scanning 1,000,000 files, returning a list [ScanInfo, ...] would consume gigabytes of memory and crash low-spec servers. 'yield from' streams results in real time with virtually zero memory overhead!",
                misconceptionClarified: "What is the difference between 'yield' and 'yield from'? 'yield' emits one single item; 'yield from' connects to another generator and forwards all of its items automatically.",
                underTheHood: "Establishes a bi-directional transparent generator delegation channel between the caller and subgenerator.",
                suggestedQuestions: ["What is the difference between yield and yield from?", "Why use a generator instead of returning a list?"]
              }
            },
            {
              id: 'vs-l6',
              lineNumber: 6,
              endLineNumber: 6,
              codeSnippet: 'self.file_stack.pop()',
              explanation: 'removes the current file from the breadcrumb stack after scanning completes'
            }
          ],
          intermediate: [
            {
              id: 'vs-l1_i',
              lineNumber: 1,
              endLineNumber: 1,
              codeSnippet: 'with Extractor(...) as ectx:',
              explanation: 'RAII context manager provisioning temporary extraction directory and ensuring teardown.'
            },
            {
              id: 'vs-l2_i',
              lineNumber: 2,
              endLineNumber: 2,
              codeSnippet: 'if Path(scan_path).is_dir():',
              explanation: 'Type inspection distinguishing directory tree traversal from single-target scan.'
            },
            {
              id: 'vs-l4_i',
              lineNumber: 4,
              endLineNumber: 6,
              codeSnippet: 'self.file_stack.append(...) / pop()',
              explanation: 'Maintains DFS traversal stack for nested container provenance and debug traceback.'
            },
            {
              id: 'vs-l5_i',
              lineNumber: 5,
              endLineNumber: 5,
              codeSnippet: 'yield from self.scan_and_or_extract_file(...)',
              explanation: 'Subgenerator delegation streaming ScanInfo instances with constant memory footprint.'
            }
          ],
          advanced: [
            {
              id: 'vs-l1_a',
              lineNumber: 1,
              endLineNumber: 6,
              codeSnippet: 'version_scanner.py',
              explanation: 'Memory-bounded recursive DFS traversal with RAII cleanup and transparent subgenerator pipeline.'
            }
          ]
        },
        whyBuiltRationales: {
          beginner: [
            {
              topic: "Why use 'yield from' instead of building a list and returning it?",
              explanation: "If you scan a massive operating system image with 500,000 files, collecting every finding into a list would consume gigabytes of RAM. 'yield from' streams each finding immediately to the caller, keeping memory usage constant and tiny.",
              analogy: "A conveyor belt delivering packages one by one vs piling all 500,000 boxes into your living room before shipping."
            },
            {
              topic: "Why use a file_stack with append() and pop()?",
              explanation: "Archives can be nested inside other archives (e.g., a zip file inside an RPM). The file_stack keeps a breadcrumb trail so if a corrupted file is found, the tool can report the exact parent archive that contained it.",
              analogy: "Leaving breadcrumbs so you know how deep into the forest you've traveled."
            },
            {
              topic: "Why use 'with Extractor(...)' as a context manager?",
              explanation: "When inspecting archives, files must be unpacked to disk. If the program crashes or finishes, the context manager guarantees the temporary folder is wiped from the disk immediately, preventing hard drives from running out of space.",
              analogy: "A self-cleaning tray in a laboratory."
            }
          ],
          intermediate: [
            {
              topic: "Generator delegation mechanics (PEP 380)",
              explanation: "Transparently delegates iteration and exception propagation to the child generator without intermediate frame allocation."
            },
            {
              topic: "DFS state management via file_stack",
              explanation: "Enables context-aware logging and cycle detection during nested archive recursion."
            }
          ],
          advanced: [
            {
              topic: "Memory bounds ($O(1)$ RAM invariant)",
              explanation: "Enforces streaming architecture where memory consumption remains invariant to disk or archive collection size."
            }
          ]
        }
      }
    ]
  }
];
