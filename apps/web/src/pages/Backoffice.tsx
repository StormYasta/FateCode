import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
  BarChart3,
  BookOpenCheck,
  CheckCircle2,
  Database,
  GraduationCap,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  Trash2,
  UserMinus,
  UserPlus,
  Users,
  Wrench,
  X,
} from 'lucide-react';

type Tab = 'overview' | 'classes' | 'professors' | 'challenges';

type Course = {
  id: string;
  name: string;
  code: string;
  faculty?: { name: string; code: string };
};

type ClassItem = {
  id: string;
  name: string;
  code: string;
  semester: string;
  year: number;
  courseId: string;
  course?: Course;
  _count?: { members: number };
};

type Professor = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  classMemberships?: Array<{ role: string; class: { id: string; name: string; code: string } }>;
};

const emptyClassForm = {
  name: '',
  code: '',
  semester: '1º',
  year: new Date().getFullYear(),
  courseId: '',
};

const emptyProfessorForm = {
  name: '',
  email: '',
  password: '',
};

export const Backoffice: React.FC = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [overview, setOverview] = useState<any | null>(null);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [classForm, setClassForm] = useState({ ...emptyClassForm });
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<any | null>(null);
  const [professorToAssign, setProfessorToAssign] = useState('');

  const [professorForm, setProfessorForm] = useState({ ...emptyProfessorForm });
  const [editingProfessor, setEditingProfessor] = useState<Professor | null>(null);
  const [editProfessorName, setEditProfessorName] = useState('');
  const [editProfessorEmail, setEditProfessorEmail] = useState('');

  const clearFeedback = () => {
    setMessage('');
    setError('');
  };

  const loadAll = async () => {
    if (user?.role !== 'ADMIN') return;
    setLoading(true);
    clearFeedback();
    try {
      const [overviewRes, classesRes, coursesRes, professorsRes] = await Promise.all([
        api.get('/admin/overview'),
        api.get('/classes'),
        api.get('/courses'),
        api.get('/users', { params: { role: 'PROFESSOR', includeInactive: true, limit: 200 } }),
      ]);
      setOverview(overviewRes.data.data);
      setClasses(classesRes.data.data || []);
      setCourses(coursesRes.data.data || []);
      setProfessors(professorsRes.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Falha ao carregar o backoffice.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [user?.role]);

  if (user?.role !== 'ADMIN') {
    return (
      <div className="p-10 rounded-2xl border border-rose-500/20 bg-rose-500/10 text-center">
        <ShieldCheck className="w-9 h-9 text-rose-400 mx-auto" />
        <h1 className="text-xl font-black text-white mt-3">Backoffice restrito</h1>
        <p className="text-sm text-slate-400 mt-1">Somente administradores podem alterar a estrutura institucional.</p>
      </div>
    );
  }

  const submitClass = async (event: React.FormEvent) => {
    event.preventDefault();
    clearFeedback();
    setBusy(true);
    try {
      const payload = {
        ...classForm,
        name: classForm.name.trim(),
        code: classForm.code.trim(),
        year: Number(classForm.year),
      };
      if (editingClassId) {
        await api.put(`/classes/${editingClassId}`, payload);
        setMessage('Turma atualizada com sucesso.');
      } else {
        await api.post('/classes', payload);
        setMessage('Turma criada com sucesso.');
      }
      setEditingClassId(null);
      setClassForm({ ...emptyClassForm, courseId: courses[0]?.id || '' });
      await loadAll();
      setTab('classes');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Não foi possível salvar a turma.');
    } finally {
      setBusy(false);
    }
  };

  const editClass = (cls: ClassItem) => {
    setEditingClassId(cls.id);
    setClassForm({
      name: cls.name,
      code: cls.code,
      semester: cls.semester,
      year: cls.year,
      courseId: cls.courseId,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteClass = async (cls: ClassItem) => {
    if (!window.confirm(`Excluir a turma "${cls.name}"? Matrículas e vínculos associados serão removidos.`)) return;
    clearFeedback();
    try {
      await api.delete(`/classes/${cls.id}`);
      if (selectedClass?.id === cls.id) setSelectedClass(null);
      setMessage('Turma excluída.');
      await loadAll();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Não foi possível excluir a turma.');
    }
  };

  const manageClass = async (cls: ClassItem) => {
    clearFeedback();
    try {
      const res = await api.get(`/classes/${cls.id}`);
      setSelectedClass(res.data.data);
      setProfessorToAssign('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Não foi possível carregar a turma.');
    }
  };

  const assignProfessor = async () => {
    if (!selectedClass || !professorToAssign) return;
    clearFeedback();
    setBusy(true);
    try {
      await api.post(`/classes/${selectedClass.id}/members`, {
        userId: professorToAssign,
        role: 'PROFESSOR',
      });
      setMessage('Professor atribuído à turma.');
      await manageClass(selectedClass);
      await loadAll();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Não foi possível atribuir o professor.');
    } finally {
      setBusy(false);
    }
  };

  const removeProfessor = async (professorId: string) => {
    if (!selectedClass) return;
    if (!window.confirm('Remover este professor da turma?')) return;
    clearFeedback();
    try {
      await api.delete(`/classes/${selectedClass.id}/members/${professorId}`);
      setMessage('Professor removido da turma.');
      await manageClass(selectedClass);
      await loadAll();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Não foi possível remover o professor.');
    }
  };

  const createProfessor = async (event: React.FormEvent) => {
    event.preventDefault();
    clearFeedback();
    setBusy(true);
    try {
      await api.post('/users', { ...professorForm, role: 'PROFESSOR' });
      setProfessorForm({ ...emptyProfessorForm });
      setMessage('Professor criado. Agora ele pode ser atribuído às turmas.');
      await loadAll();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Não foi possível criar o professor.');
    } finally {
      setBusy(false);
    }
  };

  const startProfessorEdit = (professor: Professor) => {
    setEditingProfessor(professor);
    setEditProfessorName(professor.name);
    setEditProfessorEmail(professor.email);
  };

  const saveProfessor = async () => {
    if (!editingProfessor) return;
    clearFeedback();
    setBusy(true);
    try {
      await api.put(`/users/${editingProfessor.id}/admin`, {
        name: editProfessorName.trim(),
        email: editProfessorEmail.trim(),
        role: 'PROFESSOR',
      });
      setEditingProfessor(null);
      setMessage('Professor atualizado.');
      await loadAll();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Não foi possível atualizar o professor.');
    } finally {
      setBusy(false);
    }
  };

  const toggleProfessor = async (professor: Professor) => {
    clearFeedback();
    try {
      await api.patch(`/users/${professor.id}/status`, { isActive: !professor.isActive });
      setMessage(professor.isActive ? 'Professor desativado.' : 'Professor reativado.');
      await loadAll();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Não foi possível alterar o status.');
    }
  };

  const bootstrapChallenges = async () => {
    if (!window.confirm('Criar o catálogo de 100 desafios internos de validação? A operação não duplica desafios já existentes.')) return;
    clearFeedback();
    setBusy(true);
    try {
      const res = await api.post('/admin/bootstrap/challenges');
      const data = res.data.data;
      setMessage(`Catálogo processado: ${data.created} novos desafios; ${data.validationCatalogAfter} desafios de validação disponíveis.`);
      await loadAll();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Não foi possível carregar os desafios.');
    } finally {
      setBusy(false);
    }
  };

  const classProfessors = selectedClass?.members?.filter((m: any) => m.role === 'PROFESSOR' || m.role === 'ASSISTANT') || [];
  const assignedIds = new Set(classProfessors.map((m: any) => m.userId));
  const availableProfessors = professors.filter((p) => p.isActive && !assignedIds.has(p.id));

  const tabs: Array<{ key: Tab; label: string; icon: React.ElementType }> = [
    { key: 'overview', label: 'Visão Geral', icon: BarChart3 },
    { key: 'classes', label: 'Turmas', icon: GraduationCap },
    { key: 'professors', label: 'Professores', icon: Users },
    { key: 'challenges', label: 'Desafios', icon: BookOpenCheck },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" /> Administração
          </div>
          <h1 className="text-3xl font-black text-white mt-1">Backoffice FateCode</h1>
          <p className="text-sm text-slate-400 mt-1">Controle institucional de turmas, docentes, usuários e catálogo de desafios.</p>
        </div>
        <button onClick={loadAll} className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-2 hover:bg-slate-800">
          <RefreshCw className="w-4 h-4" /> Atualizar dados
        </button>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 ${tab === key ? 'bg-indigo-600 text-white' : 'bg-slate-900/70 border border-slate-800 text-slate-300 hover:border-indigo-500/40'}`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {message && <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-sm flex items-center gap-2"><CheckCircle2 className="w-4 h-4" />{message}</div>}
      {error && <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-sm">{error}</div>}

      {loading ? (
        <div className="p-12 text-center text-slate-400">Carregando backoffice...</div>
      ) : tab === 'overview' ? (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              ['Usuários', overview?.users || 0, Users],
              ['Professores', overview?.professors || 0, ShieldCheck],
              ['Turmas', overview?.classes || 0, GraduationCap],
              ['Desafios', overview?.challenges || 0, BookOpenCheck],
              ['Alunos', overview?.students || 0, Users],
              ['Cursos', overview?.courses || 0, Database],
              ['Atividades', overview?.assignments || 0, Wrench],
            ].map(([label, value, Icon]: any) => (
              <div key={label} className="p-5 rounded-2xl bg-[#0f1628]/80 border border-slate-800">
                <Icon className="w-5 h-5 text-indigo-400" />
                <div className="text-3xl font-black text-white mt-4">{value}</div>
                <div className="text-xs text-slate-400 mt-1">{label}</div>
              </div>
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <button onClick={() => setTab('classes')} className="p-6 text-left rounded-2xl border border-indigo-500/20 bg-indigo-500/5 hover:border-indigo-500/50">
              <GraduationCap className="w-6 h-6 text-indigo-400" />
              <h3 className="text-lg font-bold text-white mt-3">Gerenciar estrutura de turmas</h3>
              <p className="text-xs text-slate-400 mt-1">Criar, editar, excluir e definir o corpo docente de cada turma.</p>
            </button>
            <button onClick={() => setTab('challenges')} className="p-6 text-left rounded-2xl border border-amber-500/20 bg-amber-500/5 hover:border-amber-500/50">
              <BookOpenCheck className="w-6 h-6 text-amber-400" />
              <h3 className="text-lg font-bold text-white mt-3">Popular catálogo de desafios</h3>
              <p className="text-xs text-slate-400 mt-1">Carregar uma base executável de 100 exercícios para validar filtros, ranking e treino livre.</p>
            </button>
          </div>
        </div>
      ) : tab === 'classes' ? (
        <div className="grid xl:grid-cols-[360px_1fr] gap-6 items-start">
          <form onSubmit={submitClass} className="p-5 rounded-2xl bg-[#0f1628]/80 border border-slate-800 space-y-3 xl:sticky xl:top-24">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-white">{editingClassId ? 'Editar turma' : 'Nova turma'}</h2>
              {editingClassId && <button type="button" onClick={() => { setEditingClassId(null); setClassForm({ ...emptyClassForm, courseId: courses[0]?.id || '' }); }} className="p-1.5 text-slate-400"><X className="w-4 h-4" /></button>}
            </div>
            <input required minLength={3} value={classForm.name} onChange={(e) => setClassForm({ ...classForm, name: e.target.value })} placeholder="Nome da turma" className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white" />
            <input required minLength={2} value={classForm.code} onChange={(e) => setClassForm({ ...classForm, code: e.target.value })} placeholder="Código (ex: ADS-2026-2)" className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white" />
            <div className="grid grid-cols-2 gap-2">
              <input required value={classForm.semester} onChange={(e) => setClassForm({ ...classForm, semester: e.target.value })} placeholder="Semestre" className="bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white" />
              <input required type="number" min="2020" max="2100" value={classForm.year} onChange={(e) => setClassForm({ ...classForm, year: Number(e.target.value) })} className="bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white" />
            </div>
            <select required value={classForm.courseId || courses[0]?.id || ''} onChange={(e) => setClassForm({ ...classForm, courseId: e.target.value })} className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white">
              <option value="">Selecione o curso</option>
              {courses.map((course) => <option key={course.id} value={course.id}>{course.name} · {course.faculty?.code}</option>)}
            </select>
            <button disabled={busy} className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50">
              {editingClassId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />} {editingClassId ? 'Salvar alterações' : 'Criar turma'}
            </button>
          </form>

          <div className="space-y-5">
            <div className="grid md:grid-cols-2 gap-3">
              {classes.map((cls) => (
                <div key={cls.id} className={`p-4 rounded-2xl border ${selectedClass?.id === cls.id ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-800 bg-[#0f1628]/80'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-mono text-indigo-300">{cls.code}</span>
                      <h3 className="font-bold text-white mt-1">{cls.name}</h3>
                      <p className="text-xs text-slate-400">{cls.course?.name} · {cls.semester}/{cls.year}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => editClass(cls)} title="Editar" className="p-2 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => deleteClass(cls)} title="Excluir" className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800">
                    <span className="text-[11px] text-slate-500">{cls._count?.members || 0} membros</span>
                    <button onClick={() => manageClass(cls)} className="px-3 py-1.5 rounded-lg border border-indigo-500/30 text-indigo-300 text-xs font-bold">Gerenciar docentes</button>
                  </div>
                </div>
              ))}
            </div>

            {selectedClass && (
              <div className="p-5 rounded-2xl bg-[#0f1628]/80 border border-indigo-500/20 space-y-4">
                <div>
                  <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Corpo docente</div>
                  <h2 className="text-xl font-black text-white">{selectedClass.name}</h2>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select value={professorToAssign} onChange={(e) => setProfessorToAssign(e.target.value)} className="flex-1 bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white">
                    <option value="">Selecionar professor...</option>
                    {availableProfessors.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.email}</option>)}
                  </select>
                  <button disabled={!professorToAssign || busy} onClick={assignProfessor} className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50"><UserPlus className="w-4 h-4" /> Atribuir</button>
                </div>
                {classProfessors.length === 0 ? (
                  <p className="text-xs text-slate-400">Nenhum professor atribuído.</p>
                ) : (
                  <div className="space-y-2">
                    {classProfessors.map((membership: any) => (
                      <div key={membership.id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-bold text-white">{membership.user.name}</div>
                          <div className="text-[11px] text-slate-400">{membership.user.email} · {membership.role}</div>
                        </div>
                        <button onClick={() => removeProfessor(membership.user.id)} className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/10" title="Remover da turma"><UserMinus className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : tab === 'professors' ? (
        <div className="grid xl:grid-cols-[360px_1fr] gap-6 items-start">
          <form onSubmit={createProfessor} className="p-5 rounded-2xl bg-[#0f1628]/80 border border-slate-800 space-y-3 xl:sticky xl:top-24">
            <h2 className="font-bold text-white flex items-center gap-2"><UserPlus className="w-4 h-4 text-indigo-400" /> Novo professor</h2>
            <input required minLength={2} value={professorForm.name} onChange={(e) => setProfessorForm({ ...professorForm, name: e.target.value })} placeholder="Nome completo" className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white" />
            <input required type="email" value={professorForm.email} onChange={(e) => setProfessorForm({ ...professorForm, email: e.target.value })} placeholder="E-mail" className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white" />
            <input required minLength={6} type="password" value={professorForm.password} onChange={(e) => setProfessorForm({ ...professorForm, password: e.target.value })} placeholder="Senha inicial" className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white" />
            <button disabled={busy} className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold disabled:opacity-50">Criar professor</button>
          </form>

          <div className="space-y-3">
            {professors.map((professor) => (
              <div key={professor.id} className={`p-4 rounded-2xl border ${professor.isActive ? 'bg-[#0f1628]/80 border-slate-800' : 'bg-slate-900/30 border-slate-800 opacity-70'}`}>
                {editingProfessor?.id === professor.id ? (
                  <div className="grid md:grid-cols-[1fr_1fr_auto] gap-2 items-center">
                    <input value={editProfessorName} onChange={(e) => setEditProfessorName(e.target.value)} className="bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white" />
                    <input type="email" value={editProfessorEmail} onChange={(e) => setEditProfessorEmail(e.target.value)} className="bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white" />
                    <div className="flex gap-1">
                      <button onClick={saveProfessor} className="p-2 rounded-lg bg-indigo-600 text-white"><Save className="w-4 h-4" /></button>
                      <button onClick={() => setEditingProfessor(null)} className="p-2 rounded-lg text-slate-400"><X className="w-4 h-4" /></button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white">{professor.name}</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${professor.isActive ? 'bg-emerald-500/10 text-emerald-300' : 'bg-slate-700 text-slate-300'}`}>{professor.isActive ? 'Ativo' : 'Inativo'}</span>
                      </div>
                      <p className="text-xs text-slate-400">{professor.email}</p>
                      <p className="text-[11px] text-slate-500 mt-1">{professor.classMemberships?.filter((m) => m.role === 'PROFESSOR' || m.role === 'ASSISTANT').length || 0} turma(s) vinculada(s)</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => startProfessorEdit(professor)} className="px-3 py-2 rounded-lg border border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5"><Pencil className="w-3.5 h-3.5" /> Editar</button>
                      <button onClick={() => toggleProfessor(professor)} className={`px-3 py-2 rounded-lg border text-xs font-semibold ${professor.isActive ? 'border-rose-500/30 text-rose-300' : 'border-emerald-500/30 text-emerald-300'}`}>{professor.isActive ? 'Desativar' : 'Reativar'}</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-5">
          <div className="p-6 rounded-2xl bg-[#0f1628]/80 border border-indigo-500/20">
            <Database className="w-7 h-7 text-indigo-400" />
            <h2 className="text-xl font-black text-white mt-4">Catálogo inicial de 100 desafios</h2>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">Cria 100 exercícios JavaScript executáveis, com testes públicos e ocultos, cobrindo 20 famílias e todos os níveis de 8 kyu a 1 kyu. A carga é idempotente e foi criada para validar o produto em escala.</p>
            <button disabled={busy} onClick={bootstrapChallenges} className="mt-5 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 disabled:opacity-50"><Database className="w-4 h-4" /> Carregar / completar os 100 desafios</button>
          </div>
          <div className="p-6 rounded-2xl bg-[#0f1628]/80 border border-slate-800">
            <Wrench className="w-7 h-7 text-amber-400" />
            <h2 className="text-xl font-black text-white mt-4">CRUD detalhado de desafios</h2>
            <p className="text-sm text-slate-400 mt-2">Use a tela docente existente para editar enunciados, testes, tags, XP e demais parâmetros individualmente.</p>
            <Link to="/teacher/challenges" className="inline-flex mt-5 px-5 py-3 rounded-xl border border-amber-500/30 text-amber-300 text-xs font-bold">Abrir gestão de desafios</Link>
          </div>
        </div>
      )}
    </div>
  );
};
