import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { 
  DownloadCloud, 
  Search, 
  Sparkles, 
  Star, 
  Code2, 
  ShieldAlert, 
  CheckCircle2, 
  Layers, 
  Tag, 
  ExternalLink,
  ArrowRight,
  Plus,
  Trash2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CodewarsImport: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [challengeData, setChallengeData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [paths, setPaths] = useState<any[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [initialCode, setInitialCode] = useState('function solution(input) {\n  // Escreva seu código aqui\n}');
  const [publicTests, setPublicTests] = useState<{ input: string; expected: string; description: string }[]>([
    { input: '[1, 2, 3]', expected: '6', description: 'Teste básico de soma' }
  ]);
  const [hiddenTests, setHiddenTests] = useState<{ input: string; expected: string; description: string }[]>([
    { input: '[]', expected: '0', description: 'Array vazio' }
  ]);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    async function loadPaths() {
      try {
        const res = await api.get('/learning-paths');
        setPaths(res.data.data || []);
      } catch (err) {
        console.error('Error fetching paths:', err);
      }
    }
    loadPaths();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    setError(null);
    setChallengeData(null);
    setSuccessMsg(null);

    try {
      const res = await api.get(`/codewars/challenges/${encodeURIComponent(query.trim())}`);
      setChallengeData(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Não foi possível encontrar o desafio no Codewars.');
    } finally {
      setSearching(false);
    }
  };

  const handleAddPublicTest = () => {
    setPublicTests([...publicTests, { input: '', expected: '', description: '' }]);
  };

  const handleAddHiddenTest = () => {
    setHiddenTests([...hiddenTests, { input: '', expected: '', description: '' }]);
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challengeData) return;

    setImporting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await api.post('/codewars/import', {
        externalId: challengeData.id,
        topicId: selectedTopicId || null,
        language: 'JAVASCRIPT',
        initialCode,
        publicTests,
        hiddenTests,
        customTitle: challengeData.name,
        customDescription: challengeData.description,
      });

      setSuccessMsg('Desafio importado com sucesso para a plataforma!');
      setTimeout(() => {
        navigate('/learning-paths');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Falha ao importar desafio.');
    } finally {
      setImporting(false);
    }
  };

  const isTeacherOrAdmin = user?.role === 'ADMIN' || user?.role === 'PROFESSOR';

  if (!isTeacherOrAdmin) {
    return (
      <div className="p-12 text-center text-slate-400 bg-[#0f1628]/80 border border-slate-800 rounded-2xl">
        Acesso restrito ao corpo docente e administração.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <DownloadCloud className="w-6 h-6 text-indigo-400" />
            <span>Importador Codewars</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400">
            Consulte a API pública do Codewars e transforme desafios em exercícios pedagógicos internos.
          </p>
        </div>
      </div>

      {/* Search Input Card */}
      <div className="p-6 rounded-2xl bg-[#0f1628]/80 border border-slate-800 shadow-xl">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Digite o ID ou Slug do Codewars (ex: 52c31f8e6605bcc646000082 ou two-sum)..."
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={searching}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center space-x-2 disabled:opacity-50 transition-all"
          >
            {searching ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Search className="w-3.5 h-3.5" />
                <span>Consultar API</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Suggestion buttons */}
        <div className="flex flex-wrap items-center gap-2 mt-4 text-xs text-slate-400">
          <span>Sugestões rápidas:</span>
          <button
            type="button"
            onClick={() => setQuery('52c31f8e6605bcc646000082')}
            className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-mono text-[11px]"
          >
            Two Sum (ID)
          </button>
          <button
            type="button"
            onClick={() => setQuery('even-or-odd')}
            className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-mono text-[11px]"
          >
            Even or Odd (Slug)
          </button>
          <button
            type="button"
            onClick={() => setQuery('sum-of-positive')}
            className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-mono text-[11px]"
          >
            Sum of Positive (Slug)
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Challenge Preview & Import Form */}
      {challengeData && (
        <div className="space-y-6">
          {/* Preview Card */}
          <div className="p-6 rounded-2xl bg-[#0f1628]/90 border border-indigo-500/30 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center space-x-2 text-xs font-mono text-indigo-400 mb-1">
                  <span className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold uppercase">
                    Codewars External ID: {challengeData.id}
                  </span>
                  <span>• {challengeData.rank?.name || '8 kyu'}</span>
                </div>
                <h2 className="text-xl font-bold text-white">{challengeData.name}</h2>
              </div>

              <a
                href={challengeData.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-mono"
              >
                <span>Ver no Codewars</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="text-xs text-slate-300 leading-relaxed max-h-48 overflow-y-auto bg-slate-900/60 p-4 rounded-xl border border-slate-800 font-mono whitespace-pre-wrap">
              {challengeData.description}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {challengeData.tags?.map((tag: string) => (
                <span key={tag} className="text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* Adaptation & Import Form */}
          <form onSubmit={handleImport} className="p-6 rounded-2xl bg-[#0f1628]/80 border border-slate-800 space-y-6 shadow-xl">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Adaptar e Vincular à Hierarquia Pedagógica</span>
            </h3>

            {/* Target Topic Selection */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Vincular a um Tópico Curricular (Opcional)
              </label>
              <select
                value={selectedTopicId}
                onChange={(e) => setSelectedTopicId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">Sem vínculo inicial (Catálogo Geral)</option>
                {paths.map((p) =>
                  p.modules?.map((m: any) =>
                    m.topics?.map((t: any) => (
                      <option key={t.id} value={t.id}>
                        {p.title} → {m.title} → {t.title}
                      </option>
                    ))
                  )
                )}
              </select>
            </div>

            {/* Initial Code Template */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Código Inicial (Template fornecido ao aluno)
              </label>
              <textarea
                value={initialCode}
                onChange={(e) => setInitialCode(e.target.value)}
                rows={4}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-indigo-300 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Public Tests */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Testes Públicos (Visíveis no editor)</h4>
                  <p className="text-[11px] text-slate-400">Casos que o aluno pode executar para teste rápido.</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddPublicTest}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold flex items-center space-x-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Adicionar Teste</span>
                </button>
              </div>

              {publicTests.map((t, idx) => (
                <div key={idx} className="grid sm:grid-cols-3 gap-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <input
                    type="text"
                    placeholder="Input (ex: [2, 7, 11, 15], 9)"
                    value={t.input}
                    onChange={(e) => {
                      const updated = [...publicTests];
                      updated[idx].input = e.target.value;
                      setPublicTests(updated);
                    }}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="Expected (ex: [0, 1])"
                    value={t.expected}
                    onChange={(e) => {
                      const updated = [...publicTests];
                      updated[idx].expected = e.target.value;
                      setPublicTests(updated);
                    }}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="Descrição do caso"
                    value={t.description}
                    onChange={(e) => {
                      const updated = [...publicTests];
                      updated[idx].description = e.target.value;
                      setPublicTests(updated);
                    }}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
              ))}
            </div>

            {/* Hidden Tests */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Testes Ocultos (Validação no Sandbox)</h4>
                  <p className="text-[11px] text-slate-400">Casos sigilosos jamais expostos ao aluno antes ou durante a submissão.</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddHiddenTest}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold flex items-center space-x-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Adicionar Teste Oculto</span>
                </button>
              </div>

              {hiddenTests.map((t, idx) => (
                <div key={idx} className="grid sm:grid-cols-3 gap-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <input
                    type="text"
                    placeholder="Input (ex: [3, 3], 6)"
                    value={t.input}
                    onChange={(e) => {
                      const updated = [...hiddenTests];
                      updated[idx].input = e.target.value;
                      setHiddenTests(updated);
                    }}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="Expected (ex: [0, 1])"
                    value={t.expected}
                    onChange={(e) => {
                      const updated = [...hiddenTests];
                      updated[idx].expected = e.target.value;
                      setHiddenTests(updated);
                    }}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="Descrição oculta"
                    value={t.description}
                    onChange={(e) => {
                      const updated = [...hiddenTests];
                      updated[idx].description = e.target.value;
                      setHiddenTests(updated);
                    }}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={importing}
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {importing ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <DownloadCloud className="w-4 h-4" />
                  <span>Confirmar Importação para a Plataforma</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
