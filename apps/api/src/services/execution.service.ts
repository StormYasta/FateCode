import vm from 'vm';

export interface TestCase {
  input: any;
  expected: any;
  description?: string;
}

export interface ExecutionResult {
  success: boolean;
  status: 'ACCEPTED' | 'REJECTED' | 'RUNTIME_ERROR' | 'TIME_LIMIT_EXCEEDED';
  passedTests: number;
  totalTests: number;
  testResults: Array<{
    description?: string;
    input?: any;
    expected?: any;
    actual?: any;
    passed: boolean;
    error?: string;
  }>;
  stdout: string;
  stderr: string;
  executionTimeMs: number;
}

function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return a === b;
  if (typeof a !== 'object') return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }

  return true;
}

export class ExecutionService {
  /**
   * Safely executes JavaScript code in an isolated VM context against test cases
   */
  static async runJavaScript(code: string, testCases: TestCase[]): Promise<ExecutionResult> {
    const logs: string[] = [];
    const errors: string[] = [];
    const startTime = Date.now();

    // Sandboxed console
    const sandboxConsole = {
      log: (...args: any[]) => logs.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')),
      error: (...args: any[]) => errors.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')),
      warn: (...args: any[]) => logs.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')),
      info: (...args: any[]) => logs.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')),
    };

    // Isolated sandbox without access to require, process, global, fs, network
    const contextObject: Record<string, any> = {
      console: sandboxConsole,
      Math,
      Date,
      JSON,
      Array,
      Object,
      String,
      Number,
      Boolean,
      RegExp,
      Map,
      Set,
      parseInt,
      parseFloat,
      isNaN,
      isFinite,
    };

    const context = vm.createContext(contextObject);

    try {
      // 1. Execute user script in sandbox
      const script = new vm.Script(code, {
        filename: 'student_solution.js',
      });

      script.runInContext(context, {
        timeout: 2000, // 2s timeout
      });

      // 2. Locate the solution function (either first defined global function or exported)
      const functionNames = Object.keys(contextObject).filter((k) => typeof contextObject[k] === 'function');
      let targetFn: any = null;

      // Prefer non-standard global functions
      const standardKeys = new Set(['parseInt', 'parseFloat', 'isNaN', 'isFinite']);
      for (const fnName of functionNames) {
        if (!standardKeys.has(fnName)) {
          targetFn = contextObject[fnName];
          break;
        }
      }

      if (!targetFn && functionNames.length > 0) {
        targetFn = contextObject[functionNames[0]];
      }

      if (!targetFn) {
        return {
          success: false,
          status: 'RUNTIME_ERROR',
          passedTests: 0,
          totalTests: testCases.length,
          testResults: [],
          stdout: logs.join('\n'),
          stderr: 'Nenhuma função principal foi encontrada no seu código. Certifique-se de declarar uma função (ex: function twoSum(...) { ... }).',
          executionTimeMs: Date.now() - startTime,
        };
      }

      // 3. Run against test cases
      const testResults = [];
      let passedCount = 0;

      for (const tc of testCases) {
        try {
          const args = Array.isArray(tc.input) ? tc.input : [tc.input];
          const actual = targetFn(...args);
          const passed = deepEqual(actual, tc.expected);

          if (passed) passedCount++;

          testResults.push({
            description: tc.description,
            input: tc.input,
            expected: tc.expected,
            actual,
            passed,
          });
        } catch (err: any) {
          testResults.push({
            description: tc.description,
            input: tc.input,
            expected: tc.expected,
            actual: null,
            passed: false,
            error: err.message,
          });
        }
      }

      const allPassed = passedCount === testCases.length && testCases.length > 0;
      const executionTimeMs = Date.now() - startTime;

      return {
        success: allPassed,
        status: allPassed ? 'ACCEPTED' : 'REJECTED',
        passedTests: passedCount,
        totalTests: testCases.length,
        testResults,
        stdout: logs.join('\n'),
        stderr: errors.join('\n'),
        executionTimeMs,
      };
    } catch (err: any) {
      const isTimeout = err.code === 'ERR_SCRIPT_EXECUTION_TIMEOUT' || err.message.includes('timed out');
      return {
        success: false,
        status: isTimeout ? 'TIME_LIMIT_EXCEEDED' : 'RUNTIME_ERROR',
        passedTests: 0,
        totalTests: testCases.length,
        testResults: [],
        stdout: logs.join('\n'),
        stderr: isTimeout ? 'Tempo limite de execução excedido (Timeout > 2000ms). Verifique se há loops infinitos.' : `Erro de Execução: ${err.message}`,
        executionTimeMs: Date.now() - startTime,
      };
    }
  }
}
