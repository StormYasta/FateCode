import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Map,
  ListChecks,
  GraduationCap,
  User,
  Building2,
  Trophy,
  ShieldCheck,
  DownloadCloud,
  Code2,
  Dumbbell,
  Wrench,
  Settings,
  Layers3,
  Calculator,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const isTeacherOrAdmin = user?.role === 'ADMIN' || user?.role === 'PROFESSOR';
  const isAdmin = user?.role === 'ADMIN';

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Treino Livre', path: '/practice', icon: Dumbbell },
    { label: 'Atividades da Turma', path: '/assignments', icon: ListChecks },
    { label: 'Trilhas de Estudo', path: '/learning-paths', icon: Map },
    { label: 'Rankings & Pódio', path: '/rankings', icon: Trophy },
    { label: 'Estrutura Acadêmica', path: '/academic', icon: Building2 },
    { label: 'Turmas & Alunos', path: '/classes', icon: GraduationCap },
    { label: 'Meu Perfil', path: '/profile', icon: User },
  ];

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all ${
      isActive
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
    }`;

  return (
    <aside className="w-64 bg-[#0c1222] border-r border-slate-800/80 p-4 flex flex-col justify-between hidden md:flex min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
            <Building2 className="w-3.5 h-3.5" />
            <span>FATEC São Paulo</span>
          </div>
          <p className="text-xs text-slate-300 font-medium truncate">
            {user?.role === 'STUDENT' ? 'Estudante Ativo' : user?.role === 'PROFESSOR' ? 'Corpo Docente' : 'Administração'}
          </p>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/60 pt-2">
            <span>Ano Letivo</span>
            <span className="font-mono font-bold text-slate-300">2026/2</span>
          </div>
        </div>

        <div className="space-y-1">
          <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Menu Principal</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.path} to={item.path} end={item.path === '/'} className={linkClass}>
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {isAdmin && (
          <div className="space-y-1 pt-2 border-t border-slate-800/80">
            <p className="px-3 text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-2">Administração</p>
            <NavLink to="/backoffice" className={linkClass}>
              <Settings className="w-4 h-4 text-amber-400" />
              <span>Backoffice</span>
            </NavLink>
          </div>
        )}

        {isTeacherOrAdmin && (
          <div className="space-y-1 pt-2 border-t border-slate-800/80">
            <p className="px-3 text-[11px] font-bold text-indigo-400 uppercase tracking-wider mb-2">Gestão Docente</p>
            <NavLink to="/teacher/dashboard" className={linkClass}>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Dashboard Docente</span>
            </NavLink>
            <NavLink to="/teacher/challenges" className={linkClass}>
              <Wrench className="w-4 h-4 text-indigo-400" />
              <span>Desafios de Programação</span>
            </NavLink>
            <NavLink to="/teacher/academic-exercises" className={linkClass}>
              <Calculator className="w-4 h-4 text-emerald-400" />
              <span>Exercícios de Disciplinas</span>
            </NavLink>
            <NavLink to="/codewars-import" className={linkClass}>
              <DownloadCloud className="w-4 h-4 text-rose-400" />
              <span>Importar Codewars</span>
            </NavLink>
            <NavLink to="/codewars-import/bulk" className={linkClass}>
              <Layers3 className="w-4 h-4 text-rose-300" />
              <span>Codewars em Lote</span>
            </NavLink>
          </div>
        )}

        <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-indigo-300">
          <div className="flex items-center space-x-2 font-bold mb-1">
            <Code2 className="w-4 h-4 text-indigo-400" />
            <span>Programação + Disciplinas</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Dois módulos de exercícios no mesmo ecossistema, sem misturar correção ou experiência de resolução.
          </p>
        </div>
      </div>

      <div className="text-[11px] text-slate-400 border-t border-slate-800/80 pt-3 px-2 flex justify-between items-center">
        <span>FateCode v1.5.0</span>
        <span className="text-emerald-400 font-semibold font-mono">Disciplinas</span>
      </div>
    </aside>
  );
};