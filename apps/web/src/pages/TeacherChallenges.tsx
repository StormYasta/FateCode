import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Code2, Edit3, Plus, Save, Search, Trash2, X } from 'lucide-react';

type Difficulty = 'KYU_8' | 'KYU_7' | 'KYU_6' | 'KYU_5' | 'KYU_4' | 'KYU_3' | 'KYU_2' | 'KYU_1';
type Language = 'JAVASCRIPT' | 'TYPESCRIPT' | 'PYTHON' | 'JAVA' | 'C' | 'CPP';

type Challenge = {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: Difficulty;
  language: Language;
  tags: string[];
  xpReward: number;
  isDaily: boolean;
  source: string;
};

type FormState = {
  title: string;
  slug: string;
  description: string;
  difficulty: Difficulty;
  language: Language;
  xpReward: number;
  tags: string;
  initialCode: string;
  publicTests: string;
  hiddenTests: string;
  isDaily: boolean;
};

const emptyForm: FormState = {
  title: '',
  slug: '',
  description: '',
  difficulty: 'KYU_8',
  language: 'JAVASCRIPT',
  xpReward: 50,
  tags: '',
  initialCode: '// Escreva sua solução aqui\n',
  publicTests: '[]',
  hiddenTests: '[]',
  isDaily: false,
};

const languageLabels: Record<Language, string> = {
  JAVASCRIPT: 'JavaScript',
  TYPESCRIPT: 'TypeScript',
  PYTHON: 'Python',
  JAVA: 'Java',
  C: 'C',
  CPP: 'C++',
};

const slugify = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)/g, '');

export const TeacherChallenges: React.FC = () => {
  const { user } = useAuth();
  const canManage = user?.role === 'ADMIN' || user?.role === 'PROFESSOR';
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadChallenges = async () => {
    setLoading(true);
    try {
      const response = await api.get('/challenges');
      setChallenges(response.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Não foi possível carregar os desafios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canManage) loadChallenges();
  }, [canManage]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return challenges;
    return challenges.filter((challenge) =>
      challenge.title.toLowerCase().includes(term) ||
      challenge.slug.toLowerCase().includes(term) ||
      challenge.tags?.some((tag) => tag.toLowerCase().includes(term))
    );
  }, [challenges, search]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const startCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
    setShowForm(true);
  };

  const startEdit = async (challenge: Challenge) => {
    setError('');
    try {
      const response = await api.get(`/challenges/${challenge.id}`);
      const full = response.data.data;
      setEditingId(challenge.id);
      setForm({
        title: full.title || '',
        slug: full.slug || '',
        description: full.description || '',
        difficulty: full.difficulty || 'KYU_8',
        language: full.language || 'JAVASCRIPT',
        xpReward: full.xpReward || 50,
        tags: (full.tags || []).join(', '),
        initialCode: full.initialCode || '',
        publicTests: JSON.stringify(full.publicTests || [], null, 2),
        hiddenTests: JSON.stringify(full.hiddenTests || [], null, 2),
        isDaily: Boolean(full.isDaily),
      });
      setShowForm(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Não foi possível abrir o desafio para edição.');
    }
  };

  const buildPayload = () => {
    let publicTests: unknown;
    let hiddenTests: unknown;
    try {
      publicTests = JSON.parse(form.publicTests || '[]');
      hiddenTests = JSON.parse(form.hiddenTests || '[]');
    } catch {
      throw new Error('Os testes públicos e ocultos precisam estar em JSON válido.');
    }

    return {
      title: form.title.trim(),
      slug: form.slug.trim(),
      description: form.description.trim(),
      difficulty: form.difficulty,
      source: 'INTERNAL',
      externalId: null,
      language: form.language,
      initialCode: form.initialCode,
      testCode: '',
      publicTests,
      hiddenTests,
      tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      xpReward: Number(form.xpReward),
      isDaily: form.isDaily,
      topicId: null,
    };
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = buildPayload();
      if (editingId) {
        await api.put(`/challenges/${editingId}`, payload);
      } else {
        await api.post('/challenges', payload);
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      await loadChallenges();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Não foi possível salvar o desafio.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (challenge: Challenge) => {
    if (!window.confirm(`Excluir o desafio "${challenge.title}"?`)) return;
    setError('');
    try {
      await api.delete(`/challenges/${challenge.id}`);
      await loadChallenges();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Não foi possível excluir o desafio.');
    }
  };

  if (!canManage) {
    return (
      <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-8 text-center text-rose-300">
        Esta área é exclusiva para professores e administradores.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2 mb-2">
            <Code2 className="w-4 h-4" /> Gestão Docente
          </div>
          <h1 className="text-3xl font-black text-white">CRUD de Desafios</h1>
          <p className="text-sm text-slate-400 mt-2">Crie, revise e mantenha os desafios usados no treino livre e nas atividades.</p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Novo desafio
        </button>
      </div>

      {error && <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">{error}</div>}

      {showForm && (
        <form onSubmit={handleSave} className="rounded-2xl bg-[#0f1628]/90 border border-slate-800 p-5 md:p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-white">{editingId ? 'Editar desafio' : 'Novo desafio'}</h2>
            <button type="button" onClick={() => setShowForm(false)} className="p-2 text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <label className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-300">Título</span>
              <input
                required
                minLength={3}
                value={form.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setField('title', title);
                  if (!editingId) setField('slug', slugify(title));
                }}
                className="w-full rounded-xl bg-slate-950/60 border border-slate-800 px-3 py-2.5 text-sm text-white"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-300">Slug</span>
              <input required value={form.slug} onChange={(e) => setField('slug', slugify(e.target.value))} className="w-full rounded-xl bg-slate-950/60 border border-slate-800 px-3 py-2.5 text-sm text-white font-mono" />
            </label>
          </div>

          <label className="space-y-1.5 block">
            <span className="text-xs font-semibold text-slate-300">Descrição</span>
            <textarea required minLength={10} rows={5} value={form.description} onChange={(e) => setField('description', e.target.value)} className="w-full rounded-xl bg-slate-950/60 border border-slate-800 px-3 py-2.5 text-sm text-white resize-y" />
          </label>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <label className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-300">Dificuldade</span>
              <select value={form.difficulty} onChange={(e) => setField('difficulty', e.target.value as Difficulty)} className="w-full rounded-xl bg-slate-950/60 border border-slate-800 px-3 py-2.5 text-sm text-white">
                {[8,7,6,5,4,3,2,1].map((kyu) => <option key={kyu} value={`KYU_${kyu}`}>{kyu} kyu</option>)}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-300">Linguagem base</span>
              <select value={form.language} onChange={(e) => setField('language', e.target.value as Language)} className="w-full rounded-xl bg-slate-950/60 border border-slate-800 px-3 py-2.5 text-sm text-white">
                {(Object.keys(languageLabels) as Language[]).map((language) => <option key={language} value={language}>{languageLabels[language]}</option>)}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-300">XP</span>
              <input type="number" min={10} value={form.xpReward} onChange={(e) => setField('xpReward', Number(e.target.value))} className="w-full rounded-xl bg-slate-950/60 border border-slate-800 px-3 py-2.5 text-sm text-white" />
            </label>
            <label className="flex items-end gap-2 pb-2.5 text-xs font-semibold text-slate-300">
              <input type="checkbox" checked={form.isDaily} onChange={(e) => setField('isDaily', e.target.checked)} />
              Pode ser desafio diário
            </label>
          </div>

          <label className="space-y-1.5 block">
            <span className="text-xs font-semibold text-slate-300">Tags (separadas por vírgula)</span>
            <input value={form.tags} onChange={(e) => setField('tags', e.target.value)} placeholder="arrays, matemática, strings" className="w-full rounded-xl bg-slate-950/60 border border-slate-800 px-3 py-2.5 text-sm text-white" />
          </label>

          <label className="space-y-1.5 block">
            <span className="text-xs font-semibold text-slate-300">Código inicial</span>
            <textarea rows={6} value={form.initialCode} onChange={(e) => setField('initialCode', e.target.value)} className="w-full rounded-xl bg-slate-950/60 border border-slate-800 px-3 py-2.5 text-xs text-white font-mono" />
          </label>

          <div className="grid lg:grid-cols-2 gap-4">
            <label className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-300">Testes públicos (JSON)</span>
              <textarea rows={8} value={form.publicTests} onChange={(e) => setField('publicTests', e.target.value)} className="w-full rounded-xl bg-slate-950/60 border border-slate-800 px-3 py-2.5 text-xs text-white font-mono" />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-300">Testes ocultos (JSON)</span>
              <textarea rows={8} value={form.hiddenTests} onChange={(e) => setField('hiddenTests', e.target.value)} className="w-full rounded-xl bg-slate-950/60 border border-slate-800 px-3 py-2.5 text-xs text-white font-mono" />
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-sm">Cancelar</button>
            <button disabled={saving} type="submit" className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold flex items-center gap-2 disabled:opacity-50">
              <Save className="w-4 h-4" /> {saving ? 'Salvando...' : 'Salvar desafio'}
            </button>
          </div>
        </form>
      )}

      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por título, slug ou tag..." className="w-full rounded-xl bg-slate-950/60 border border-slate-800 pl-10 pr-4 py-2.5 text-sm text-white" />
      </div>

      <div className="rounded-2xl border border-slate-800 bg-[#0f1628]/80 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-slate-400">Carregando desafios...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-400">Nenhum desafio encontrado.</div>
        ) : (
          <div className="divide-y divide-slate-800">
            {filtered.map((challenge) => (
              <div key={challenge.id} className="p-4 flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-white">{challenge.title}</h3>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">{challenge.difficulty.replace('KYU_', '')} kyu</span>
                    <span className="text-[11px] text-slate-400">{languageLabels[challenge.language]}</span>
                    {challenge.isDaily && <span className="text-[11px] text-amber-400">Diário</span>}
                  </div>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-1">{challenge.description}</p>
                  <p className="text-[11px] text-slate-500 font-mono mt-1">/{challenge.slug} · +{challenge.xpReward} XP · {challenge.source}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button type="button" onClick={() => startEdit(challenge)} className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5" /> Editar
                  </button>
                  <button type="button" onClick={() => handleDelete(challenge)} className="px-3 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-semibold flex items-center gap-1.5">
                    <Trash2 className="w-3.5 h-3.5" /> Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
