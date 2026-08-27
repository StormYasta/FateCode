import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpenCheck,
  CalendarPlus,
  CheckCircle2,
  Edit3,
  FlaskConical,
  Plus,
  Save,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

type Subject =
  | 'DISCRETE_MATHEMATICS'
  | 'PROGRAMMING_LOGIC'
  | 'CALCULUS'
  | 'STATISTICS'
  | 'OPERATIONS_RESEARCH'
  | 'OTHER';

type ExerciseType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'NUMERIC' | 'SHORT_TEXT';
type Difficulty = 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';

const subjectLabels: Record<Subject, string> = {
  DISCRETE_MATHEMATICS: 'Matemática Discreta',
  PROGRAMMING_LOGIC: 'Lógica de Programação',
  CALCULUS: 'Cálculo',
  STATISTICS: 'Estatística',
  OPERATIONS_RESEARCH: 'Pesquisa Operacional',
  OTHER: 'Outra disciplina',
};

const typeLabels: Record<ExerciseType, string> = {
  MULTIPLE_CHOICE: 'Múltipla escolha',
  TRUE_FALSE: 'Verdadeiro / Falso',
  NUMERIC: 'Resposta numérica',
  SHORT_TEXT: 'Resposta curta',
};

const emptyForm = {
  title: '',
  slug: '',
  statement: '',
  subject: 'DISCRETE_MATHEMATICS' as Subject,
  exerciseType: 'MULTIPLE_CHOICE' as ExerciseType,
  difficulty: 'BASIC' as Difficulty,
  optionsText: '',
  correctAnswerText: '',
  explanation: '',
  numericTolerance: '0',
  tagsText: '',
  xpReward: '30',
  isPublished: true,
};

export const TeacherAcademicExercises: React.FC = () => {
  const { user } = useAuth();
  const [exercises, setExercises] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [assignExercise, setAssignExercise] = useState<any | null>(null);
  const [assignClassId, setAssignClassId] = useState('');
  const [assignTitle, setAssignTitle] = useState('');
  const [assignDueDate, setAssignDueDate] = useState('');

  const allowed = user?.role === 'PROFESSOR' || user?.role === 'ADMIN';

  const load = async () => {
    setLoading(true);
    try {
      const [exerciseResponse, classResponse] = await Promise.all([
        api.get('/academic-exercises'),
        api.get('/classes'),
      ]);
      setExercises(exerciseResponse.data.data || []);
      setClasses(classResponse.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (allowed) load();
  }, [allowed]);

  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase('pt-BR');
    if (!q) return exercises;
    return exercises.filter((exercise) =>
      exercise.title.toLocaleLowerCase('pt-BR').includes(q) ||
      subjectLabels[exercise.subject as Subject]?.toLocaleLowerCase('pt-BR').includes(q)
    );
  }, [exercises, search]);

  if (!allowed) {
    return <div className="p-12 text-center text-slate-500 dark:text-slate-400">Acesso restrito ao corpo docente.</div>;
  }

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
    setError('');
  };

  const openEdit = (exercise: any) => {
    setEditingId(exercise.id);
    setForm({
      title: exercise.title,
      slug: exercise.slug,
      statement: exercise.statement,
      subject: exercise.subject,
      exerciseType: exercise.exerciseType,
      difficulty: exercise.difficulty,
      optionsText: Array.isArray(exercise.options) ? exercise.options.join('\n') : '',
      correctAnswerText: typeof exercise.correctAnswer === 'boolean'
        ? String(exercise.correctAnswer)
        : Array.isArray(exercise.correctAnswer)
        ? exercise.correctAnswer.join('|')
        : String(exercise.correctAnswer ?? ''),
      explanation: exercise.explanation || '',
      numericTolerance: String(exercise.numericTolerance ?? 0),
      tagsText: (exercise.tags || []).join(', '),
      xpReward: String(exercise.xpReward || 30),
      isPublished: exercise.isPublished,
    });
    setShowForm(true);
    setError('');
  };

  const buildPayload = () => {
    let correctAnswer: any = form.correctAnswerText.trim();
    if (form.exerciseType === 'TRUE_FALSE') correctAnswer = form.correctAnswerText === 'true';
    if (form.exerciseType === 'NUMERIC') correctAnswer = Number(form.correctAnswerText.replace(',', '.'));
    if (form.exerciseType === 'SHORT_TEXT' && form.correctAnswerText.includes('|')) {
      correctAnswer = form.correctAnswerText.split('|').map((item) => item.trim()).filter(Boolean);
    }

    return {
      title: form.title.trim(),
      slug: form.slug.trim().toLowerCase().replace(/\s+/g, '-'),
      statement: form.statement.trim(),
      subject: form.subject,
      exerciseType: form.exerciseType,
      difficulty: form.difficulty,
      options: form.exerciseType === 'MULTIPLE_CHOICE'
        ? form.optionsText.split('\n').map((item) => item.trim()).filter(Boolean)
        : null,
      correctAnswer,
      explanation: form.explanation.trim() || null,
      numericTolerance: form.exerciseType === 'NUMERIC' ? Number(form.numericTolerance || 0) : null,
      tags: form.tagsText.split(',').map((item) => item.trim()).filter(Boolean),
      xpReward: Number(form.xpReward || 30),
      isPublished: form.isPublished,
    };
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      const payload = buildPayload();
      if (editingId) {
        await api.put(`/academic-exercises/${editingId}`, payload);
        setMessage('Exercício atualizado.');
      } else {
        await api.post('/academic-exercises', payload);
        setMessage('Exercício criado.');
      }
      setShowForm(false);
      await load();
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.details?.[0]?.message || 'Não foi possível salvar.');
    }
  };

  const remove = async (exercise: any) => {
    if (!window.confirm(`Excluir "${exercise.title}"?`)) return;
    try {
      await api.delete(`/academic-exercises/${exercise.id}`);
      await load();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Não foi possível excluir o exercício.');
    }
  };

  const seed = async () => {
    setMessage('');
    setError('');
    try {
      const response = await api.post('/academic-exercises/seed-validation');
      setMessage(response.data.message);
      await load();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Falha ao carregar exemplos.');
    }
  };

  const openAssign = (exercise: any) => {
    setAssignExercise(exercise);
    setAssignTitle(exercise.title);
    setAssignClassId(classes[0]?.id || '');
    setAssignDueDate('');
  };

  const assign = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!assignExercise || !assignClassId) return;
    try {
      await api.post('/assignments', {
        title: assignTitle.trim() || assignExercise.title,
        classId: assignClassId,
        academicExerciseId: assignExercise.id,
        dueDate: assignDueDate ? new Date(`${assignDueDate}T23:59:00`).toISOString() : null,
        isOptional: false,
      });
      setMessage(`"${assignExercise.title}" foi atribuído à turma.`);
      setAssignExercise(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Não foi possível criar a atividade.');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2">Gestão Docente</div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">Exercícios de Disciplinas</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Crie questões teóricas, publique no Treino Livre ou atribua diretamente às turmas.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={seed} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-2">
            <FlaskConical className="w-4 h-4" /> Carregar exemplos
          </button>
          <button onClick={openCreate} className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2">
            <Plus className="w-4 h-4" /> Novo exercício
          </button>
        </div>
      </div>

      {(message || error) && (
        <div className={`p-3.5 rounded-xl border text-xs font-semibold ${error ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300' : 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300'}`}>
          {error || message}
        </div>
      )}

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar exercício ou disciplina..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500" />
      </div>

      <div className="rounded-2xl bg-white dark:bg-[#0f1628] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="p-3.5">Exercício</th>
                <th className="p-3.5">Disciplina</th>
                <th className="p-3.5">Formato</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {!loading && filtered.map((exercise) => (
                <tr key={exercise.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                  <td className="p-3.5">
                    <div className="font-bold text-slate-900 dark:text-white">{exercise.title}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{exercise.difficulty} • +{exercise.xpReward} XP</div>
                  </td>
                  <td className="p-3.5 text-slate-600 dark:text-slate-300">{subjectLabels[exercise.subject as Subject]}</td>
                  <td className="p-3.5 text-slate-600 dark:text-slate-300">{typeLabels[exercise.exerciseType as ExerciseType]}</td>
                  <td className="p-3.5">
                    <span className={`px-2 py-1 rounded-lg font-bold ${exercise.isPublished ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300'}`}>
                      {exercise.isPublished ? 'Publicado' : 'Rascunho'}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <div className="flex justify-end gap-1.5">
                      <button onClick={() => openAssign(exercise)} title="Atribuir à turma" className="p-2 rounded-lg text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10"><CalendarPlus className="w-4 h-4" /></button>
                      <button onClick={() => openEdit(exercise)} title="Editar" className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"><Edit3 className="w-4 h-4" /></button>
                      <button onClick={() => remove(exercise)} title="Excluir" className="p-2 rounded-lg text-rose-600 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="max-w-3xl mx-auto my-4 bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-700 rounded-3xl shadow-2xl">
            <form onSubmit={save} className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">{editingId ? 'Editar exercício' : 'Novo exercício'}</h2>
                <button type="button" onClick={() => setShowForm(false)} className="p-2 text-slate-400"><X className="w-5 h-5" /></button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Título<input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white" /></label>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Slug<input required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono" /></label>
              </div>

              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block">Enunciado<textarea required rows={5} value={form.statement} onChange={(e) => setForm({ ...form, statement: e.target.value })} className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white" /></label>

              <div className="grid md:grid-cols-3 gap-4">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Disciplina<select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value as Subject })} className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{Object.entries(subjectLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Formato<select value={form.exerciseType} onChange={(e) => setForm({ ...form, exerciseType: e.target.value as ExerciseType })} className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Dificuldade<select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value as Difficulty })} className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"><option value="BASIC">Básico</option><option value="INTERMEDIATE">Intermediário</option><option value="ADVANCED">Avançado</option></select></label>
              </div>

              {form.exerciseType === 'MULTIPLE_CHOICE' && (
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block">Alternativas — uma por linha<textarea rows={5} value={form.optionsText} onChange={(e) => setForm({ ...form, optionsText: e.target.value })} className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white" /></label>
              )}

              {form.exerciseType === 'TRUE_FALSE' ? (
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block">Resposta correta<select value={form.correctAnswerText} onChange={(e) => setForm({ ...form, correctAnswerText: e.target.value })} className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"><option value="">Selecione</option><option value="true">Verdadeiro</option><option value="false">Falso</option></select></label>
              ) : (
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block">Resposta correta {form.exerciseType === 'SHORT_TEXT' && <span className="font-normal text-slate-400">(separe alternativas aceitas com |)</span>}<input required value={form.correctAnswerText} onChange={(e) => setForm({ ...form, correctAnswerText: e.target.value })} className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white" /></label>
              )}

              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block">Explicação após resposta<textarea rows={3} value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })} className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white" /></label>

              <div className="grid md:grid-cols-3 gap-4">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Tags<input value={form.tagsText} onChange={(e) => setForm({ ...form, tagsText: e.target.value })} placeholder="limites, derivadas" className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white" /></label>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">XP<input type="number" min="5" value={form.xpReward} onChange={(e) => setForm({ ...form, xpReward: e.target.value })} className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white" /></label>
                {form.exerciseType === 'NUMERIC' && <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Tolerância<input type="number" step="any" min="0" value={form.numericTolerance} onChange={(e) => setForm({ ...form, numericTolerance: e.target.value })} className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white" /></label>}
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"><input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} /> Publicar no Treino Livre</label>

              <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setShowForm(false)} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">Cancelar</button><button type="submit" className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-2"><Save className="w-4 h-4" /> Salvar</button></div>
            </form>
          </div>
        </div>
      )}

      {assignExercise && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm p-4 flex items-center justify-center">
          <form onSubmit={assign} className="w-full max-w-lg bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between"><div><div className="text-xs text-indigo-500 font-bold uppercase">Criar atividade</div><h2 className="text-xl font-black text-slate-900 dark:text-white mt-1">Atribuir à turma</h2></div><button type="button" onClick={() => setAssignExercise(null)}><X className="w-5 h-5 text-slate-400" /></button></div>
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-sm font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-2"><BookOpenCheck className="w-4 h-4" /> {assignExercise.title}</div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block">Título da atividade<input value={assignTitle} onChange={(e) => setAssignTitle(e.target.value)} className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white" /></label>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block">Turma<select required value={assignClassId} onChange={(e) => setAssignClassId(e.target.value)} className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"><option value="">Selecione</option>{classes.map((cls) => <option key={cls.id} value={cls.id}>{cls.name} ({cls.code})</option>)}</select></label>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block">Prazo (opcional)<input type="date" value={assignDueDate} onChange={(e) => setAssignDueDate(e.target.value)} className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white" /></label>
            <button type="submit" className="w-full px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4" /> Criar atividade da turma</button>
          </form>
        </div>
      )}
    </div>
  );
};
