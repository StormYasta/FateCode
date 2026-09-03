import vm from 'node:vm';
import { spawn } from 'node:child_process';
import ts from 'typescript';

export interface TestCase {
  input: any;
  expected: any;
  description?: string;
}

export type SupportedExecutionLanguage = 'JAVASCRIPT' | 'TYPESCRIPT' | 'PYTHON';

export interface ExecutionResult {
  success: boolean;
  status: 'ACCEPTED' | 'REJECTED' | 'RUNTIME_ERROR' | 'TIME_LIMIT_EXCEEDED' | 'COMPILATION_ERROR';
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

function errorResult(testCases: TestCase[], status: ExecutionResult['status'], stderr: string, startTime: number, stdout = ''): ExecutionResult {
  return {
    success: false,
    status,
    passedTests: 0,
    totalTests: testCases.length,
    testResults: [],
    stdout,
    stderr,
    executionTimeMs: Date.now() - startTime,
  };
}

function extractJavaScriptFunctionCandidates(code: string): string[] {
  const names = new Set<string>();
  const patterns = [
    /function\s+([A-Za-z_$][\w$]*)\s*\(/g,
    /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/g,
    /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?function\b/g,
  ];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(code)) !== null) names.add(match[1]);
  }
  return [...names];
}

const PYTHON_RUNNER = String.raw`
import sys, json, io, contextlib
payload = json.loads(sys.stdin.read())
code = payload.get('code', '')
tests = payload.get('tests', [])
safe_builtins = {
    'len': len, 'range': range, 'enumerate': enumerate, 'sum': sum,
    'min': min, 'max': max, 'sorted': sorted, 'reversed': reversed,
    'list': list, 'dict': dict, 'set': set, 'tuple': tuple,
    'str': str, 'int': int, 'float': float, 'bool': bool,
    'abs': abs, 'all': all, 'any': any, 'zip': zip,
    'map': map, 'filter': filter, 'round': round, 'pow': pow,
    'chr': chr, 'ord': ord, 'isinstance': isinstance, 'print': print,
    'Exception': Exception, 'ValueError': ValueError, 'TypeError': TypeError,
    'IndexError': IndexError, 'KeyError': KeyError, 'RuntimeError': RuntimeError,
}
namespace = {'__builtins__': safe_builtins}
stdout_buffer = io.StringIO()
stderr_buffer = io.StringIO()

def normalize(value):
    if isinstance(value, tuple): return [normalize(v) for v in value]
    if isinstance(value, set): return sorted([normalize(v) for v in value], key=lambda x: str(x))
    if isinstance(value, list): return [normalize(v) for v in value]
    if isinstance(value, dict): return {str(k): normalize(v) for k, v in value.items()}
    return value

def emit(data):
    sys.__stdout__.write(json.dumps(data, ensure_ascii=False, default=str))

try:
    with contextlib.redirect_stdout(stdout_buffer), contextlib.redirect_stderr(stderr_buffer):
        exec(compile(code, 'student_solution.py', 'exec'), namespace, namespace)
    candidates = [(name, value) for name, value in namespace.items() if name != '__builtins__' and callable(value)]
    if not candidates:
        emit({'success': False, 'status': 'RUNTIME_ERROR', 'passedTests': 0, 'totalTests': len(tests), 'testResults': [], 'stdout': stdout_buffer.getvalue(), 'stderr': 'Nenhuma função principal foi encontrada. Declare uma função com def nome(...):'})
        raise SystemExit(0)
    target = candidates[0][1]
    results = []
    passed_count = 0
    for test in tests:
        try:
            raw_input = test.get('input')
            args = raw_input if isinstance(raw_input, list) else [raw_input]
            with contextlib.redirect_stdout(stdout_buffer), contextlib.redirect_stderr(stderr_buffer):
                actual = target(*args)
            actual = normalize(actual)
            expected = normalize(test.get('expected'))
            passed = actual == expected
            if passed: passed_count += 1
            results.append({'description': test.get('description'), 'input': raw_input, 'expected': expected, 'actual': actual, 'passed': passed})
        except Exception as exc:
            results.append({'description': test.get('description'), 'input': test.get('input'), 'expected': test.get('expected'), 'actual': None, 'passed': False, 'error': '{}: {}'.format(type(exc).__name__, str(exc))})
    all_passed = len(tests) > 0 and passed_count == len(tests)
    emit({'success': all_passed, 'status': 'ACCEPTED' if all_passed else 'REJECTED', 'passedTests': passed_count, 'totalTests': len(tests), 'testResults': results, 'stdout': stdout_buffer.getvalue(), 'stderr': stderr_buffer.getvalue()})
except SyntaxError as exc:
    emit({'success': False, 'status': 'COMPILATION_ERROR', 'passedTests': 0, 'totalTests': len(tests), 'testResults': [], 'stdout': stdout_buffer.getvalue(), 'stderr': 'Erro de sintaxe na linha {}: {}'.format(exc.lineno or '?', exc.msg)})
except SystemExit:
    pass
except Exception as exc:
    emit({'success': False, 'status': 'RUNTIME_ERROR', 'passedTests': 0, 'totalTests': len(tests), 'testResults': [], 'stdout': stdout_buffer.getvalue(), 'stderr': '{}: {}'.format(type(exc).__name__, str(exc))})
`;

export class ExecutionService {
  static async run(code: string, testCases: TestCase[], language: string): Promise<ExecutionResult> {
    switch (language) {
      case 'JAVASCRIPT': return this.runJavaScript(code, testCases);
      case 'TYPESCRIPT': return this.runTypeScript(code, testCases);
      case 'PYTHON': return this.runPython(code, testCases);
      default: return errorResult(testCases, 'COMPILATION_ERROR', `A linguagem ${language} ainda não possui executor habilitado no FateCode.`, Date.now());
    }
  }

  static async runJavaScript(code: string, testCases: TestCase[]): Promise<ExecutionResult> {
    const logs: string[] = [];
    const errors: string[] = [];
    const startTime = Date.now();
    const sandboxConsole = {
      log: (...args: any[]) => logs.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')),
      error: (...args: any[]) => errors.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')),
      warn: (...args: any[]) => logs.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')),
      info: (...args: any[]) => logs.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')),
    };
    const context = vm.createContext({ console: sandboxConsole, Math, Date, JSON, Array, Object, String, Number, Boolean, RegExp, Map, Set, parseInt, parseFloat, isNaN, isFinite });

    try {
      new vm.Script(code, { filename: 'student_solution.js' }).runInContext(context, { timeout: 2000 });
      let targetFn: any = null;
      for (const name of extractJavaScriptFunctionCandidates(code)) {
        try {
          const candidate = vm.runInContext(`typeof ${name} === 'function' ? ${name} : undefined`, context, { timeout: 100 });
          if (typeof candidate === 'function') { targetFn = candidate; break; }
        } catch {}
      }
      if (!targetFn) return errorResult(testCases, 'RUNTIME_ERROR', 'Nenhuma função principal foi encontrada no seu código. Declare uma função (ex: function solve(...) { ... }).', startTime, logs.join('\n'));

      const testResults: ExecutionResult['testResults'] = [];
      let passedCount = 0;
      for (const tc of testCases) {
        try {
          const actual = targetFn(...(Array.isArray(tc.input) ? tc.input : [tc.input]));
          const passed = deepEqual(actual, tc.expected);
          if (passed) passedCount++;
          testResults.push({ description: tc.description, input: tc.input, expected: tc.expected, actual, passed });
        } catch (err: any) {
          testResults.push({ description: tc.description, input: tc.input, expected: tc.expected, actual: null, passed: false, error: err.message });
        }
      }
      const allPassed = passedCount === testCases.length && testCases.length > 0;
      return { success: allPassed, status: allPassed ? 'ACCEPTED' : 'REJECTED', passedTests: passedCount, totalTests: testCases.length, testResults, stdout: logs.join('\n'), stderr: errors.join('\n'), executionTimeMs: Date.now() - startTime };
    } catch (err: any) {
      const isTimeout = err.code === 'ERR_SCRIPT_EXECUTION_TIMEOUT' || err.message.includes('timed out');
      return errorResult(testCases, isTimeout ? 'TIME_LIMIT_EXCEEDED' : 'RUNTIME_ERROR', isTimeout ? 'Tempo limite de execução excedido (Timeout > 2000ms). Verifique se há loops infinitos.' : `Erro de Execução: ${err.message}`, startTime, logs.join('\n'));
    }
  }

  static async runTypeScript(code: string, testCases: TestCase[]): Promise<ExecutionResult> {
    const startTime = Date.now();
    const transpiled = ts.transpileModule(code, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.None, strict: false }, reportDiagnostics: true, fileName: 'student_solution.ts' });
    const errors = (transpiled.diagnostics || []).filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error);
    if (errors.length) return errorResult(testCases, 'COMPILATION_ERROR', `Erro de TypeScript: ${errors.map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n')).join('\n')}`, startTime);
    return this.runJavaScript(transpiled.outputText, testCases);
  }

  static async runPython(code: string, testCases: TestCase[]): Promise<ExecutionResult> {
    const startTime = Date.now();
    const pythonBin = process.env.PYTHON_BIN || (process.platform === 'win32' ? 'python' : 'python3');
    return new Promise<ExecutionResult>((resolve) => {
      const child = spawn(pythonBin, ['-I', '-S', '-c', PYTHON_RUNNER], { stdio: ['pipe', 'pipe', 'pipe'], env: { PATH: process.env.PATH || '' } });
      let stdout = '';
      let stderr = '';
      let settled = false;
      const finish = (result: ExecutionResult) => { if (!settled) { settled = true; resolve(result); } };
      const timeout = setTimeout(() => { child.kill('SIGKILL'); finish(errorResult(testCases, 'TIME_LIMIT_EXCEEDED', 'Tempo limite de execução excedido (Timeout > 2500ms). Verifique se há loops infinitos.', startTime)); }, 2500);
      child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
      child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
      child.on('error', (err) => { clearTimeout(timeout); finish(errorResult(testCases, 'RUNTIME_ERROR', `Não foi possível iniciar o executor Python: ${err.message}`, startTime)); });
      child.on('close', () => {
        clearTimeout(timeout);
        if (settled) return;
        try {
          const parsed = JSON.parse(stdout || '{}');
          finish({ success: Boolean(parsed.success), status: parsed.status || 'RUNTIME_ERROR', passedTests: Number(parsed.passedTests || 0), totalTests: Number(parsed.totalTests ?? testCases.length), testResults: Array.isArray(parsed.testResults) ? parsed.testResults : [], stdout: String(parsed.stdout || ''), stderr: String(parsed.stderr || stderr || ''), executionTimeMs: Date.now() - startTime });
        } catch {
          finish(errorResult(testCases, 'RUNTIME_ERROR', stderr || stdout || 'O executor Python retornou uma resposta inválida.', startTime));
        }
      });
      child.stdin.end(JSON.stringify({ code, tests: testCases }));
    });
  }
}
