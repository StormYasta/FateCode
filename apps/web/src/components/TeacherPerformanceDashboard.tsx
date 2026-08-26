import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import {
  Activity,
  BarChart3,
  BookOpenCheck,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  Gauge,
  RefreshCw,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';

type ClassMetric = {
  classId: string;
  name: string;
  code: string;
  course: string;
  students: number;
  activeStudents: number;
  activeStudentRate: number;
  assignments: number;
  requiredAssignments: number;
  submissions: number;
  completionRate: number;
  averageScore: number;
  averageAttempts: number;
  averageSolveMinutes: number;
  medianSolveMinutes: number;
};

type FocusArea = {
  kind: 'ASSIGNMENT' | 'TAG';
  label: string;
  classId?: string;
  className?: string;
  detail: string;
  averageScore: number;
  completionRate: number;
  averageAttempts: number;
  severity: 'HIGH' | 'MEDIUM';
};

type AnalyticsData = {
  periodDays: number;
  overview: {
    classes: number;
    students: number;
    activeStudentRate: number;
    assignments: number;
    submissions: number;
    completionRate: number;
    averageScore: number;
    averageAttempts: number;
    averageSolveMinutes: number;
    medianSolveMinutes: number;
  };
  classComparison: ClassMetric[];
  tagBreakdown: Array<{
    tag: string;
    averageScore: number;
    completionRate: number;
    averageAttempts: number;
    samples: number;
    classes: string[];
  }>;
  difficultyBreakdown: Array<{
    difficulty: string;
    averageScore: number;
    completionRate: number;
    averageAttempts: number;
    samples: number;
  }>;
  weeklyActivity: Array<{ label: string; submissions: number; accepted: number }>;
  focusAreas: FocusArea[];
  methodology: {
    score: string;
    completion: string;
    solveTime: string;
  };
};

const formatMinutes = (value: number) => {
  if (!value) return '—';
  if (value < 60) return `${value.toFixed(value < 10 ? 1 : 0)} min`;
  const hours = Math.floor(value / 60);
  const minutes = Math.round(value % 60);
  return `${hours}h ${minutes}m`;
};

const kyuLabel = (value: string) => value.replace('KYU_', '') + ' kyu';

const scoreTone = (value: number) => {
  if (value >= 80) return 'text-emerald-400';
  if (value >= 60) return 'text-amber-400';
  return 'text-rose-400';
};

export const TeacherPerformanceDashboard: React.FC = () => {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');

  const loadAnalytics = async (period = days) => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/teacher/analytics?days=${period}`);
      const result = response.data.data as AnalyticsData;
      setData(result);
      setSelectedClassId((current) => {
        if (current && result.classComparison.some((item) => item.classId === current)) return current;
        return result.classComparison[0]?.classId || '';
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Não foi possível carregar as métricas docentes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics(days);
  }, [days]);

  const selectedClass = useMemo(
    () => data?.classComparison.find((item) => item.classId === selectedClassId) || null,
    [data, selectedClassId]
  );

  const selectedFocusAreas = useMemo(() => {
    if (!data) return [];
    const classSpecific = data.focusAreas.filter((item) => item.classId === selectedClassId);
    const globalTags = data.focusAreas.filter((item) => item.kind === 'TAG');
    return [...classSpecific, ...globalTags].slice(0, 6);
  }, [data, selectedClassId]);

  const maxWeekly = Math.max(1, ...(data?.weeklyActivity.map((item) => item.submissions) || [1]));

  if (loading && !data) {
    return <div className="p-12 text-center text-slate-400">Calculando indicadores pedagógicos...</div>;
  }

  if (error && !data) {
    return (
      <div className="p-8 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-sm">
        {error}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-indigo-400 font-bold flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> Desempenho pedagógico
          </div>
          <h2 className="text-2xl font-black text-white mt-1">Visão comparativa das turmas</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Indicadores de aprendizagem calculados sobre atividades acadêmicas vinculadas às turmas. Treino livre fica fora deste comparativo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={(event) => setDays(Number(event.target.value))}
            className="rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white"
          >
            <option value={7}>Últimos 7 dias</option>
            <option value={30}>Últimos 30 dias</option>
            <option value={90}>Últimos 90 dias</option>
            <option value={180}>Últimos 180 dias</option>
          </select>
          <button
            type="button"
            onClick={() => loadAnalytics(days)}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white disabled:opacity-50"
            title="Atualizar métricas"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">{error}</div>}

      <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-3">
        {[
          { label: 'Média de desempenho', value: `${data.overview.averageScore}%`, sub: '% de testes aprovados', icon: Gauge, tone: 'text-indigo-400' },
          { label: 'Conclusão', value: `${data.overview.completionRate}%`, sub: 'atividades obrigatórias', icon: CheckCircle2, tone: 'text-emerald-400' },
          { label: 'Tempo médio', value: formatMinutes(data.overview.averageSolveMinutes), sub: `mediana ${formatMinutes(data.overview.medianSolveMinutes)}`, icon: Clock3, tone: 'text-cyan-400' },
          { label: 'Tentativas', value: data.overview.averageAttempts ? data.overview.averageAttempts.toFixed(1) : '—', sub: 'média por atividade/aluno', icon: Activity, tone: 'text-amber-400' },
          { label: 'Engajamento', value: `${data.overview.activeStudentRate}%`, sub: `${data.overview.students} alunos · ${data.overview.classes} turmas`, icon: Users, tone: 'text-purple-400' },
        ].map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className="rounded-2xl border border-slate-800 bg-[#0f1628]/80 p-4">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                <Icon className={`w-4 h-4 ${metric.tone}`} /> {metric.label}
              </div>
              <div className="text-2xl font-black font-mono text-white mt-2">{metric.value}</div>
              <div className="text-[11px] text-slate-500 mt-1">{metric.sub}</div>
            </div>
          );
        })}
      </div>

      <div className="grid xl:grid-cols-3 gap-5">
        <section className="xl:col-span-2 rounded-2xl border border-slate-800 bg-[#0f1628]/80 overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white">Comparativo entre turmas</h3>
              <p className="text-[11px] text-slate-500">Clique em uma turma para detalhar seus indicadores.</p>
            </div>
            <span className="text-[11px] text-slate-400">{data.classComparison.length} turmas</span>
          </div>

          {data.classComparison.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-400">Nenhuma turma atribuída ao docente.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-900/70 text-slate-400">
                  <tr>
                    <th className="p-3 text-left">Turma</th>
                    <th className="p-3 text-right">Alunos</th>
                    <th className="p-3 text-right">Média</th>
                    <th className="p-3 text-right">Conclusão</th>
                    <th className="p-3 text-right">Tempo</th>
                    <th className="p-3 text-right">Tentativas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {data.classComparison.map((item) => (
                    <tr
                      key={item.classId}
                      onClick={() => setSelectedClassId(item.classId)}
                      className={`cursor-pointer transition-colors ${selectedClassId === item.classId ? 'bg-indigo-500/10' : 'hover:bg-slate-900/50'}`}
                    >
                      <td className="p-3">
                        <div className="font-bold text-slate-200">{item.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{item.code} · {item.course}</div>
                      </td>
                      <td className="p-3 text-right font-mono text-slate-300">{item.students}</td>
                      <td className={`p-3 text-right font-mono font-bold ${scoreTone(item.averageScore)}`}>{item.averageScore}%</td>
                      <td className={`p-3 text-right font-mono font-bold ${scoreTone(item.completionRate)}`}>{item.completionRate}%</td>
                      <td className="p-3 text-right font-mono text-slate-300">{formatMinutes(item.averageSolveMinutes)}</td>
                      <td className="p-3 text-right font-mono text-slate-300">{item.averageAttempts ? item.averageAttempts.toFixed(1) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-800 bg-[#0f1628]/80 p-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Atividade semanal</h3>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Submissões acadêmicas no período.</p>

          <div className="h-44 mt-5 flex items-end gap-2 border-b border-slate-800 pb-2">
            {data.weeklyActivity.map((week) => {
              const height = Math.max(4, Math.round((week.submissions / maxWeekly) * 130));
              const acceptedHeight = week.submissions ? Math.max(2, Math.round((week.accepted / week.submissions) * height)) : 0;
              return (
                <div key={week.label} className="flex-1 min-w-0 flex flex-col items-center justify-end h-full group">
                  <div className="text-[9px] text-slate-500 mb-1 opacity-0 group-hover:opacity-100">{week.accepted}/{week.submissions}</div>
                  <div className="w-full max-w-8 rounded-t bg-slate-700/70 relative" style={{ height }}>
                    <div className="absolute bottom-0 left-0 right-0 rounded-t bg-indigo-500" style={{ height: acceptedHeight }} />
                  </div>
                  <div className="text-[9px] text-slate-500 mt-2 truncate w-full text-center">{week.label}</div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 text-[10px] text-slate-500">Indigo = submissões aceitas · cinza = demais tentativas</div>
        </section>
      </div>

      {selectedClass && (
        <div className="grid lg:grid-cols-3 gap-5">
          <section className="rounded-2xl border border-slate-800 bg-[#0f1628]/80 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-indigo-400 font-bold">Turma selecionada</div>
                <h3 className="text-lg font-black text-white mt-1">{selectedClass.name}</h3>
                <p className="text-[11px] text-slate-500">{selectedClass.code} · {selectedClass.course}</p>
              </div>
              <BookOpenCheck className="w-6 h-6 text-indigo-400" />
            </div>

            <div className="grid grid-cols-2 gap-3 mt-5">
              <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-3">
                <div className="text-[10px] text-slate-500">Alunos ativos</div>
                <div className="font-mono font-bold text-white mt-1">{selectedClass.activeStudents}/{selectedClass.students}</div>
                <div className="text-[10px] text-indigo-400">{selectedClass.activeStudentRate}%</div>
              </div>
              <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-3">
                <div className="text-[10px] text-slate-500">Atividades</div>
                <div className="font-mono font-bold text-white mt-1">{selectedClass.assignments}</div>
                <div className="text-[10px] text-slate-500">{selectedClass.submissions} submissões</div>
              </div>
              <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-3">
                <div className="text-[10px] text-slate-500">Média</div>
                <div className={`font-mono font-bold mt-1 ${scoreTone(selectedClass.averageScore)}`}>{selectedClass.averageScore}%</div>
              </div>
              <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-3">
                <div className="text-[10px] text-slate-500">Tempo mediano</div>
                <div className="font-mono font-bold text-white mt-1">{formatMinutes(selectedClass.medianSolveMinutes)}</div>
              </div>
            </div>
          </section>

          <section className="lg:col-span-2 rounded-2xl border border-slate-800 bg-[#0f1628]/80 p-5">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Pontos para trabalhar em sala</h3>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Sugestões baseadas em baixa média/conclusão. Servem como apoio pedagógico, não como avaliação automática.</p>

            {selectedFocusAreas.length === 0 ? (
              <div className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Nenhum ponto crítico identificado com os dados disponíveis neste período.
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-3 mt-4">
                {selectedFocusAreas.map((item, index) => (
                  <div key={`${item.kind}-${item.label}-${index}`} className={`rounded-xl border p-4 ${item.severity === 'HIGH' ? 'border-rose-500/25 bg-rose-500/5' : 'border-amber-500/25 bg-amber-500/5'}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${item.severity === 'HIGH' ? 'text-rose-400' : 'text-amber-400'}`}>
                        {item.kind === 'TAG' ? 'Conceito / tag' : 'Atividade'}
                      </span>
                      <span className="text-[10px] text-slate-500">{item.className}</span>
                    </div>
                    <h4 className="text-sm font-bold text-white mt-1">{item.label}</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed mt-1.5">{item.detail}</p>
                    <div className="flex gap-3 mt-3 text-[10px] font-mono text-slate-400">
                      <span>Média {item.averageScore}%</span>
                      <span>Conclusão {item.completionRate}%</span>
                      <span>{item.averageAttempts || 0} tent.</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-5">
        <section className="rounded-2xl border border-slate-800 bg-[#0f1628]/80 p-5">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white">Desempenho por dificuldade</h3>
          </div>
          <div className="space-y-3 mt-4">
            {data.difficultyBreakdown.map((item) => (
              <div key={item.difficulty}>
                <div className="flex items-center justify-between text-[11px] mb-1.5">
                  <span className="font-bold text-slate-300">{kyuLabel(item.difficulty)}</span>
                  <span className="font-mono text-slate-400">média {item.averageScore}% · conclusão {item.completionRate}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.min(100, item.averageScore)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-[#0f1628]/80 p-5">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Conceitos com menor média</h3>
          </div>
          <div className="space-y-2 mt-4">
            {data.tagBreakdown.slice(0, 8).map((item) => (
              <div key={item.tag} className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 flex items-center gap-3">
                <div className={`w-12 text-center font-mono font-bold text-sm ${scoreTone(item.averageScore)}`}>{item.averageScore}%</div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-200 truncate">#{item.tag}</div>
                  <div className="text-[10px] text-slate-500">Conclusão {item.completionRate}% · {item.averageAttempts || 0} tentativas · amostra {item.samples}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <details className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4 text-[11px] text-slate-500">
        <summary className="cursor-pointer font-semibold text-slate-400">Como essas métricas são calculadas?</summary>
        <div className="mt-3 space-y-1.5 leading-relaxed">
          <p><strong className="text-slate-300">Média:</strong> {data.methodology.score}</p>
          <p><strong className="text-slate-300">Conclusão:</strong> {data.methodology.completion}</p>
          <p><strong className="text-slate-300">Tempo:</strong> {data.methodology.solveTime}</p>
        </div>
      </details>
    </div>
  );
};
