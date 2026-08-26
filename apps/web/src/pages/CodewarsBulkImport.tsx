import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { AlertTriangle, ArrowLeft, CheckCircle2, DownloadCloud, Layers3, ShieldAlert } from 'lucide-react';

const languages = [
  ['JAVASCRIPT', 'JavaScript'],
  ['TYPESCRIPT', 'TypeScript'],
  ['PYTHON', 'Python'],
  ['JAVA', 'Java'],
  ['C', 'C'],
  ['CPP', 'C++'],
] as const;

export const CodewarsBulkImport: React.FC = () => {
  const { user } = useAuth();
  const [username, setUsername] = useState('');
  const [limit, setLimit] = useState(100);
  const [language, setLanguage] = useState('JAVASCRIPT');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any | null>(null);

  const isTeacherOrAdmin = user?.role === 'ADMIN' || user?.role === 'PROFESSOR';
  if (!isTeacherOrAdmin) {
    return <div className="p-10 rounded-2xl border border-rose-500/20 bg-rose-500/10 text-center text-slate-300">Acesso restrito ao corpo docente e administração.</div>;
  }

  const handleImport = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const response = await api.post('/codewars/import-bulk', {
        username: username.trim(),
        limit,
        language,
      });
      setResult(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Falha na importação em lote.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Link to="/codewars-import" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-indigo-400">
        <ArrowLeft className="w-4 h-4" /> Importação individual
      </Link>

      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
          <Layers3 className="w-4 h-4" /> Importação em lote
        </div>
        <h1 className="text-3xl font-black text-white mt-1">Base Codewars</h1>
        <p className="text-sm text-slate-400 mt-1">Use os desafios concluídos de um perfil público como fonte de até 100 kata por operação.</p>
      </div>

      <div className="p-5 rounded-2xl border border-amber-500/25 bg-amber-500/5 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <h2 className="text-sm font-bold text-amber-200">Os itens entram como rascunho</h2>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">A API pública do Codewars fornece enunciado, rank, tags e linguagens, mas não os testes de submissão. O FateCode marca esses itens com <code className="text-amber-300">codewars-draft</code> e não os mostra aos alunos até a revisão docente.</p>
        </div>
      </div>

      <form onSubmit={handleImport} className="p-6 rounded-2xl bg-[#0f1628]/80 border border-slate-800 space-y-4">
        <div className="grid md:grid-cols-[1fr_160px_180px] gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Usuário público do Codewars</label>
            <input required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="ex: nome-do-usuario" className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Quantidade</label>
            <input type="number" min="1" max="100" value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Linguagem base</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white">
              {languages.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
        </div>
        <button disabled={loading} className="px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-2 disabled:opacity-50">
          <DownloadCloud className="w-4 h-4" /> {loading ? 'Importando...' : `Importar até ${limit} rascunhos`}
        </button>
      </form>

      {error && <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-2"><ShieldAlert className="w-4 h-4" />{error}</div>}

      {result && (
        <div className="p-6 rounded-2xl bg-[#0f1628]/80 border border-emerald-500/20 space-y-4">
          <div className="flex items-center gap-2 text-emerald-300 font-bold"><CheckCircle2 className="w-5 h-5" /> Importação concluída</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              ['Solicitados', result.requested],
              ['Importados', result.imported],
              ['Já existentes', result.skipped],
              ['Falhas', result.failed],
            ].map(([label, value]) => (
              <div key={label as string} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="text-xl font-black text-white">{value}</div>
                <div className="text-[11px] text-slate-400">{label}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400">Abra <Link to="/teacher/challenges" className="text-indigo-400 font-semibold">CRUD de Desafios</Link>, adicione starter code/testes adequados e remova a tag <code className="text-amber-300">codewars-draft</code> para liberar cada item.</p>
        </div>
      )}
    </div>
  );
};
