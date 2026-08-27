import React, { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
  Code2,
  Play,
  Send,
  Star,
  Flame,
  CheckCircle2,
  XCircle,
  Clock,
  Lock,
  Unlock,
  MessageSquare,
  ArrowLeft,
  RotateCcw,
  Terminal,
  ListChecks,
} from 'lucide-react';

type EditorLanguage = 'javascript' | 'typescript' | 'python';

type StarterSignature = {
  name: string;
  params: string[];
};

function editorLanguageFromChallenge(language?: string): EditorLanguage {
  if (language === 'PYTHON') return 'python';
  if (language === 'TYPESCRIPT') return 'typescript';
  return 'javascript';
}

function extractStarterSignature(initialCode: string): StarterSignature {
  const jsMatch = initialCode.match(/function\s+([A-Za-z_$][\w$]*)\s*\(([^)]*)\)/);
  if (jsMatch) {
    const params = jsMatch[2]
      .split(',')
      .map((param) => param.trim().replace(/=.*$/, '').replace(/\??:\s*.+$/, '').trim())
      .filter((param) => /^[A-Za-z_$][\w$]*$/.test(param));
    return { name: jsMatch[1], params };
  }

  const pythonMatch = initialCode.match(/def\s+([A-Za-z_]\w*)\s*\(([^)]*)\)/);
  if (pythonMatch) {
    const params = pythonMatch[2]
      .split(',')
      .map((param) => param.trim().replace(/=.*$/, '').replace(/:\s*.+$/, '').trim())
      .filter((param) => /^[A-Za-z_]\w*$/.test(param));
    return { name: pythonMatch[1], params };
  }

  return { name: 'solve', params: ['input'] };
}

function starterForLanguage(challenge: any, language: EditorLanguage): string {
  const initial = String(challenge?.initialCode || '');
  const primary = editorLanguageFromChallenge(challenge?.language);

  if (language === primary && initial.trim()) return initial;
  if (language === 'typescript' && primary === 'javascript' && initial.trim()) return initial;
  if (language === 'javascript' && primary === 'typescript' && initial.trim() && !initial.includes(':')) return initial;

  const signature = extractStarterSignature(initial);
  const params = signature.params.join(', ');

  if (language === 'python') {
    return `def ${signature.name}(${params}):\n    # Escreva sua solução aqui\n    pass\n`;
  }

  return `function ${signature.name}(${params}) {\n  // Escreva sua solução aqui\n  return undefined;\n}\n`;
}

function codeStorageKey(challengeId: string, language: EditorLanguage) {
  return `fatecode_code_${challengeId}_${language}`;
}

function displayValue(value: any) {
  if (value === undefined) return 'undefined';
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export const ChallengeSolve: React.FC = () => {
  const { idOrSlug } = useParams<{ idOrSlug: string }>();
  const [searchParams] = useSearchParams();
  const assignmentId = searchParams.get('assignmentId') || searchParams.get('assignment');
  const { user, refreshUser } = useAuth();

  const [challenge, setChallenge] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeLeftTab, setActiveLeftTab] = useState<'description' | 'submissions' | 'community' | 'comments'>('description');
  const [activeBottomTab, setActiveBottomTab] = useState<'tests' | 'console'>('tests');

  const [language, setLanguage] = useState<EditorLanguage>('javascript');
  const [code, setCode] = useState<string>('');
  const [executing, setExecuting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [executionResult, setExecutionResult] = useState<any | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [communitySolutions, setCommunitySolutions] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [celebrationData, setCelebrationData] = useState<any | null>(null);

  useEffect(() => {
    async function loadChallenge() {
      try {
        const [chRes, subRes] = await Promise.all([
          api.get(`/challenges/${idOrSlug}`),
          api.get(`/challenges/${idOrSlug}/submissions`).catch(() => ({ data: { data: [] } })),
        ]);

        const ch = chRes.data.data;
        setChallenge(ch);
        const subs = subRes.data.data || [];
        setSubmissions(subs);

        const accepted = subs.some((s: any) => s.status === 'ACCEPTED');
        setIsCompleted(accepted);

        const initialLanguage = editorLanguageFromChallenge(ch.language);
        setLanguage(initialLanguage);

        const languageDraft = localStorage.getItem(codeStorageKey(ch.id, initialLanguage));
        const legacyDraft = localStorage.getItem(`fatecode_code_${ch.id}`);
        setCode(languageDraft || legacyDraft || starterForLanguage(ch, initialLanguage));

        loadComments(ch.id);
        if (accepted || user?.role === 'PROFESSOR' || user?.role === 'ADMIN') {
          loadCommunitySolutions(ch.id);
        }
      } catch (err) {
        console.error('Failed to load challenge:', err);
      } finally {
        setLoading(false);
      }
    }

    if (idOrSlug) loadChallenge();
  }, [idOrSlug]);

  const loadCommunitySolutions = async (challengeId: string) => {
    try {
      const res = await api.get(`/challenges/${challengeId}/community-solutions`);
      setCommunitySolutions(res.data.data || []);
    } catch (err) {
      console.error('Error fetching community solutions:', err);
    }
  };

  const loadComments = async (challengeId: string) => {
    try {
      const res = await api.get(`/challenges/${challengeId}/comments`);
      setComments(res.data.data || []);
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !challenge) return;

    try {
      await api.post(`/challenges/${challenge.id}/comments`, { content: newComment.trim() });
      setNewComment('');
      loadComments(challenge.id);
    } catch (err) {
      console.error('Error posting comment:', err);
    }
  };

  const handleCodeChange = (value: string | undefined) => {
    const newCode = value || '';
    setCode(newCode);
    if (challenge?.id) {
      localStorage.setItem(codeStorageKey(challenge.id, language), newCode);
    }
  };

  const handleLanguageChange = (nextLanguage: EditorLanguage) => {
    if (!challenge || nextLanguage === language) return;

    localStorage.setItem(codeStorageKey(challenge.id, language), code);
    const nextDraft = localStorage.getItem(codeStorageKey(challenge.id, nextLanguage));
    const nextCode = nextDraft || starterForLanguage(challenge, nextLanguage);

    setLanguage(nextLanguage);
    setCode(nextCode);
    localStorage.setItem(codeStorageKey(challenge.id, nextLanguage), nextCode);
    setExecutionResult(null);
  };

  const handleResetCode = () => {
    if (!challenge) return;
    const starter = starterForLanguage(challenge, language);
    setCode(starter);
    localStorage.setItem(codeStorageKey(challenge.id, language), starter);
    setExecutionResult(null);
  };

  const handleExecute = async () => {
    if (!challenge) return;
    setExecuting(true);
    setActiveBottomTab('tests');

    try {
      api.post(`/challenges/${challenge.id}/events`, { eventType: 'CODE_EXECUTED' }).catch(() => {});
      const res = await api.post(`/challenges/${challenge.id}/execute`, {
        code,
        language: language.toUpperCase(),
      });
      setExecutionResult(res.data.data);
    } catch (err: any) {
      setExecutionResult({
        success: false,
        status: 'RUNTIME_ERROR',
        passedTests: 0,
        totalTests: challenge.publicTests?.length || 0,
        stderr: err.response?.data?.message || 'Falha ao executar código.',
        testResults: [],
      });
    } finally {
      setExecuting(false);
    }
  };

  const handleSubmit = async () => {
    if (!challenge) return;
    setSubmitting(true);
    setActiveBottomTab('tests');

    try {
      api.post(`/challenges/${challenge.id}/events`, { eventType: 'CODE_SUBMITTED' }).catch(() => {});
      const res = await api.post(`/challenges/${challenge.id}/submit`, {
        code,
        language: language.toUpperCase(),
        assignmentId: assignmentId || null,
      });

      const data = res.data;
      setExecutionResult(data);

      const subRes = await api.get(`/challenges/${challenge.id}/submissions`);
      setSubmissions(subRes.data.data || []);

      if (data.success) {
        setIsCompleted(true);
        setCelebrationData(data);
        await refreshUser();
        loadCommunitySolutions(challenge.id);
        confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
      }
    } catch (err: any) {
      setExecutionResult({
        success: false,
        status: 'RUNTIME_ERROR',
        passedTests: 0,
        totalTests: challenge.publicTests?.length || 0,
        stderr: err.response?.data?.message || 'Falha ao submeter solução.',
        testResults: [],
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDifficulty = (difficulty: string) => difficulty ? difficulty.replace('KYU_', '') + ' kyu' : '8 kyu';

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <span className="text-xs text-slate-400">Carregando ambiente do desafio...</span>
        </div>
      </div>
    );
  }

  if (!challenge) {
    return <div className="p-12 text-center text-slate-400 bg-[#0f1628]/80 border border-slate-800 rounded-2xl">Desafio não encontrado.</div>;
  }

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0f1628]/90 border border-slate-800 p-4 rounded-2xl shadow-xl">
        <div className="flex items-center space-x-3">
          <Link to="/practice/programming" className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-black text-white">{challenge.title}</h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">{formatDifficulty(challenge.difficulty)}</span>
              {isCompleted && (
                <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /><span>Concluído</span>
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
              <span>{challenge.topic?.module?.learningPath?.title || 'Desafio Geral'}</span><span>•</span><span className="text-amber-400 font-mono font-bold">+{challenge.xpReward} XP</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button onClick={handleExecute} disabled={executing || submitting} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl flex items-center space-x-2 transition-all disabled:opacity-50">
            {executing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" /><span>Executar Testes</span></>}
          </button>
          <button onClick={handleSubmit} disabled={submitting || executing} className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition-all disabled:opacity-50">
            {submitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Send className="w-3.5 h-3.5" /><span>Submeter Solução</span></>}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 min-h-[680px]">
        <div className="flex flex-col bg-[#0f1628]/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="flex items-center border-b border-slate-800 bg-slate-900/60 px-4">
            <button onClick={() => setActiveLeftTab('description')} className={`px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${activeLeftTab === 'description' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>Enunciado</button>
            <button onClick={() => setActiveLeftTab('submissions')} className={`px-4 py-3 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-1.5 ${activeLeftTab === 'submissions' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}><span>Submissões</span><span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">{submissions.length}</span></button>
            <button onClick={() => setActiveLeftTab('community')} className={`px-4 py-3 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-1.5 ${activeLeftTab === 'community' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>{isCompleted ? <Unlock className="w-3 h-3 text-emerald-400" /> : <Lock className="w-3 h-3 text-amber-400" />}<span>Soluções ({communitySolutions.length})</span></button>
            <button onClick={() => setActiveLeftTab('comments')} className={`px-4 py-3 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-1.5 ${activeLeftTab === 'comments' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}><MessageSquare className="w-3 h-3" /><span>Discussão ({comments.length})</span></button>
          </div>

          <div className="p-6 flex-1 overflow-y-auto max-h-[620px]">
            {activeLeftTab === 'description' && (
              <div className="space-y-5">
                <div className="prose prose-invert max-w-none text-xs leading-relaxed text-slate-300 font-mono whitespace-pre-wrap">{challenge.description}</div>
                <div className="pt-4 border-t border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-slate-200 flex items-center space-x-1.5"><ListChecks className="w-4 h-4 text-indigo-400" /><span>Casos de Teste de Exemplo:</span></h4>
                  <div className="space-y-2">
                    {challenge.publicTests?.map((tc: any, idx: number) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono">
                        <div className="text-slate-400 text-[11px] mb-1">{tc.description || `Exemplo ${idx + 1}`}</div>
                        <div className="text-slate-300"><span className="text-indigo-400">Entrada:</span> {displayValue(tc.input)}</div>
                        <div className="text-slate-300"><span className="text-emerald-400">Esperado:</span> {displayValue(tc.expected)}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-2">{challenge.tags?.map((t: string) => <span key={t} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400">#{t}</span>)}</div>
              </div>
            )}

            {activeLeftTab === 'submissions' && (
              <div className="space-y-2.5">
                {submissions.length === 0 ? <p className="text-xs text-slate-400 text-center py-8">Nenhuma submissão enviada ainda.</p> : submissions.map((sub: any) => (
                  <div key={sub.id} className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">{sub.status === 'ACCEPTED' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}<div><div className="font-bold text-white">{sub.status === 'ACCEPTED' ? 'Aceito' : sub.status}</div><div className="text-[10px] text-slate-400 font-mono">{sub.language} • {new Date(sub.submittedAt).toLocaleString('pt-BR')}</div></div></div>
                    <div className="flex items-center space-x-3 font-mono text-[11px]"><span className="text-slate-400">{sub.passedTests}/{sub.totalTests} testes</span>{sub.executionTimeMs !== null && sub.executionTimeMs !== undefined && <span className="text-indigo-400">{sub.executionTimeMs}ms</span>}</div>
                  </div>
                ))}
              </div>
            )}

            {activeLeftTab === 'community' && (
              <div>{!isCompleted ? (
                <div className="p-8 rounded-2xl bg-slate-900/70 border border-amber-500/20 text-center space-y-3"><Lock className="w-8 h-8 text-amber-400 mx-auto" /><h3 className="text-sm font-bold text-white">Soluções da Comunidade Bloqueadas</h3><p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">Resolva e submeta uma solução aceita para desbloquear o código e discussões dos seus colegas de turma e faculdade.</p></div>
              ) : (
                <div className="space-y-4"><div className="flex items-center space-x-2 text-xs text-emerald-400 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20"><Unlock className="w-4 h-4" /><span>Soluções desbloqueadas! Visualize abordagens de outros estudantes.</span></div>{communitySolutions.map((sol: any) => <div key={sol.id} className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2"><div className="flex items-center justify-between text-xs"><div className="flex items-center space-x-2"><span className="font-bold text-slate-200">{sol.user?.name}</span><span className="text-[10px] text-slate-400">{sol.user?.classMemberships?.[0]?.class?.name}</span></div><span className="font-mono text-indigo-400 text-[11px]">{sol.executionTimeMs || 10}ms</span></div><pre className="p-3 bg-slate-950 rounded-lg text-xs font-mono text-indigo-300 overflow-x-auto">{sol.code}</pre></div>)}</div>
              )}</div>
            )}

            {activeLeftTab === 'comments' && (
              <div className="space-y-4"><form onSubmit={handlePostComment} className="flex gap-2"><input type="text" placeholder="Faça uma pergunta ou comente sobre o desafio..." value={newComment} onChange={(e) => setNewComment(e.target.value)} className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white" /><button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow">Publicar</button></form><div className="space-y-3">{comments.map((c: any) => <div key={c.id} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5 text-xs"><div className="flex items-center justify-between"><span className="font-bold text-slate-200">{c.user?.name}</span><span className="text-[10px] text-slate-400">{new Date(c.createdAt).toLocaleDateString('pt-BR')}</span></div><p className="text-slate-300 font-sans">{c.content}</p></div>)}</div></div>
            )}
          </div>
        </div>

        <div className="flex flex-col space-y-3">
          <div className="flex-1 rounded-2xl bg-[#0d121f] border border-slate-800 overflow-hidden shadow-xl flex flex-col min-h-[380px]">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80 border-b border-slate-800 text-xs">
              <div className="flex items-center space-x-2"><Code2 className="w-3.5 h-3.5 text-indigo-400" /><select value={language} onChange={(event) => handleLanguageChange(event.target.value as EditorLanguage)} className="bg-slate-800 border border-slate-700 text-xs text-white rounded-lg px-2.5 py-1 focus:outline-none"><option value="javascript">JavaScript</option><option value="typescript">TypeScript</option><option value="python">Python</option></select><span className="text-[10px] text-slate-400">Rascunho separado por linguagem</span></div>
              <button onClick={handleResetCode} title={`Restaurar código inicial de ${language}`} className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors flex items-center space-x-1"><RotateCcw className="w-3.5 h-3.5" /><span className="text-[10px]">Resetar</span></button>
            </div>
            <div className="flex-1 min-h-[340px]"><Editor height="100%" defaultLanguage="javascript" language={language} value={code} onChange={handleCodeChange} theme="vs-dark" options={{ fontSize: 13, fontFamily: 'Fira Code, monospace', minimap: { enabled: false }, scrollBeyondLastLine: false, automaticLayout: true, tabSize: language === 'python' ? 4 : 2 }} /></div>
          </div>

          <div className="rounded-2xl bg-[#0f1628]/90 border border-slate-800 overflow-hidden shadow-xl min-h-[260px] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/60 px-4">
              <div className="flex items-center space-x-2">
                <button onClick={() => setActiveBottomTab('tests')} className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-1.5 ${activeBottomTab === 'tests' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}><ListChecks className="w-3.5 h-3.5" /><span>Resultado dos Testes</span>{executionResult && <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${executionResult.success ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>{executionResult.passedTests || 0}/{executionResult.totalTests || 0}</span>}</button>
                <button onClick={() => setActiveBottomTab('console')} className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-1.5 ${activeBottomTab === 'console' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}><Terminal className="w-3.5 h-3.5" /><span>Console & Saída</span></button>
              </div>
              {executionResult?.executionTimeMs !== undefined && <span className="text-[11px] font-mono text-slate-400 flex items-center space-x-1"><Clock className="w-3 h-3 text-indigo-400" /><span>{executionResult.executionTimeMs}ms</span></span>}
            </div>

            <div className="p-4 flex-1 overflow-y-auto max-h-[240px] font-mono text-xs">
              {activeBottomTab === 'tests' && (
                <div>{!executionResult ? <p className="text-slate-400 text-center py-6">Clique em "Executar Testes" ou "Submeter Solução" para avaliar seu código.</p> : (
                  <div className="space-y-3">
                    {(executionResult.status === 'RUNTIME_ERROR' || executionResult.status === 'COMPILATION_ERROR' || executionResult.status === 'TIME_LIMIT_EXCEEDED') && <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-200"><div className="font-bold mb-1">{executionResult.status === 'COMPILATION_ERROR' ? 'Erro de sintaxe/compilação' : executionResult.status === 'TIME_LIMIT_EXCEEDED' ? 'Tempo limite excedido' : 'Erro de execução'}</div><div className="text-[11px] whitespace-pre-wrap">{executionResult.stderr || executionResult.message || 'Não foi possível executar a solução.'}</div></div>}
                    {executionResult.testResults?.map((tr: any, idx: number) => <div key={idx} className={`p-3 rounded-xl border ${tr.passed ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200' : 'bg-rose-500/10 border-rose-500/20 text-rose-200'}`}><div className="flex items-center justify-between gap-3"><div className="flex items-center space-x-2">{tr.passed ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}<div className="font-bold">{tr.description || `Teste ${idx + 1}`}</div></div><span className="text-[10px] font-bold uppercase">{tr.passed ? 'Passou' : 'Falhou'}</span></div><div className="grid sm:grid-cols-3 gap-2 mt-2 text-[10px]"><div className="rounded-lg bg-black/15 p-2"><div className="opacity-60 uppercase mb-1">Entrada</div><div className="break-all">{displayValue(tr.input)}</div></div><div className="rounded-lg bg-black/15 p-2"><div className="opacity-60 uppercase mb-1">Esperado</div><div className="break-all">{displayValue(tr.expected)}</div></div><div className="rounded-lg bg-black/15 p-2"><div className="opacity-60 uppercase mb-1">Obtido</div><div className="break-all">{displayValue(tr.actual)}</div></div></div>{tr.error && <div className="mt-2 rounded-lg bg-rose-950/30 p-2 text-[10px] text-rose-200 whitespace-pre-wrap">{tr.error}</div>}</div>)}
                    {executionResult.hiddenTestsCount > 0 && <div className="text-[10px] text-slate-500 px-1">+ {executionResult.hiddenTestsCount} teste(s) oculto(s) avaliados na submissão. Os dados desses casos não são exibidos.</div>}
                    {!executionResult.testResults?.length && !executionResult.stderr && executionResult.message && <div className="text-slate-300 p-3 rounded-xl bg-slate-900/70 border border-slate-800">{executionResult.message}</div>}
                  </div>
                )}</div>
              )}

              {activeBottomTab === 'console' && <div className="space-y-2">{executionResult?.stdout && <div className="p-2 rounded bg-slate-950 text-slate-300 whitespace-pre-wrap">{executionResult.stdout}</div>}{executionResult?.stderr && <div className="p-2 rounded bg-rose-950/40 text-rose-300 whitespace-pre-wrap">{executionResult.stderr}</div>}{!executionResult?.stdout && !executionResult?.stderr && <p className="text-slate-400 text-center py-6">Nenhuma saída no console.</p>}</div>}
            </div>
          </div>
        </div>
      </div>

      {celebrationData && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"><div className="w-full max-w-md bg-gradient-to-b from-[#161f36] to-[#0c1220] border border-indigo-500/40 rounded-3xl p-8 shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-200"><div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-indigo-500 p-0.5 mx-auto shadow-2xl shadow-indigo-500/40"><div className="w-full h-full bg-[#090d16] rounded-[22px] flex items-center justify-center text-3xl">🏆</div></div><div><h2 className="text-2xl font-black text-white tracking-tight">DESAFIO CONCLUÍDO!</h2><p className="text-xs text-slate-300 mt-1">Todos os testes públicos e ocultos foram aprovados com sucesso.</p></div><div className="grid grid-cols-2 gap-3"><div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20"><div className="flex items-center justify-center space-x-1 text-indigo-300 font-mono text-xl font-bold"><Star className="w-5 h-5 fill-indigo-400 text-indigo-400" /><span>+{celebrationData.xpEarned || challenge.xpReward} XP</span></div><span className="text-[10px] text-slate-400">Experiência Ganha</span></div><div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20"><div className="flex items-center justify-center space-x-1 text-amber-400 font-mono text-xl font-bold"><Flame className="w-5 h-5 fill-amber-500 text-amber-500" /><span>{celebrationData.currentStreak || 1}d</span></div><span className="text-[10px] text-slate-400">Sequência Mantida</span></div></div><button onClick={() => setCelebrationData(null)} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all">Continuar Estudando</button></div></div>
      )}
    </div>
  );
};
