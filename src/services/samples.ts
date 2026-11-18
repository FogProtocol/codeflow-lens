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
        content: `int a, b\na = input("Enter first number: ")\nb = input("Enter second number: ")\nadd(a, b) {\n    return (a + b)\n}\nprint(add(a, b))`,
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
              explanation: 'declared two variables of int type'
            },
            {
              id: 'l2',
              lineNumber: 2,
              endLineNumber: 2,
              codeSnippet: 'a = input("Enter first number: ")',
              explanation: 'taken a as input as first number to add'
            },
            {
              id: 'l3',
              lineNumber: 3,
              endLineNumber: 3,
              codeSnippet: 'b = input("Enter second number: ")',
              explanation: 'taken b as input as second number to add'
            },
            {
              id: 'l4',
              lineNumber: 4,
              endLineNumber: 6,
              codeSnippet: 'add(a, b) {\n    return (a + b)\n}',
              explanation: 'created a function named add and included a and b as parameters for it which returns a+b'
            },
            {
              id: 'l7',
              lineNumber: 7,
              endLineNumber: 7,
              codeSnippet: 'print(add(a, b))',
              explanation: 'prints back the sum of a and b'
            }
          ],
          intermediate: [
            {
              id: 'l1_i',
              lineNumber: 1,
              endLineNumber: 1,
              codeSnippet: 'int a, b',
              explanation: 'Type annotation declaring variables a and b as integer storage.'
            },
            {
              id: 'l2_i',
              lineNumber: 2,
              endLineNumber: 3,
              codeSnippet: 'a = input(...)\nb = input(...)',
              explanation: 'Prompts console for input strings and stores in variables a and b.'
            },
            {
              id: 'l4_i',
              lineNumber: 4,
              endLineNumber: 6,
              codeSnippet: 'add(a, b) { return (a + b) }',
              explanation: 'Defines addition function with formal parameters a and b, returning their sum.'
            },
            {
              id: 'l7_i',
              lineNumber: 7,
              endLineNumber: 7,
              codeSnippet: 'print(add(a, b))',
              explanation: 'Evaluates add(a, b) and prints return value to stdout.'
            }
          ],
          advanced: [
            {
              id: 'l1_a',
              lineNumber: 1,
              endLineNumber: 7,
              codeSnippet: 'calculator.py',
              explanation: 'Synchronous CLI arithmetic pipeline: stdin read -> stack frame push -> stdout write.'
            }
          ]
        },
        whyBuiltRationales: {
          beginner: [
            {
              topic: "Why create a separate add(a,b) function instead of just writing print(a + b)?",
              explanation: "Creating a function packages the addition logic into a reusable block. If you later need to add numbers in 10 different places in the program, you only call add() instead of writing duplicate addition code."
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
  }
];
