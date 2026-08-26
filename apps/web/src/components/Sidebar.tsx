import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
  Home,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const isTeacherOrAdmin = user?.role === 'ADMIN' || user?.role === 'PROFESSOR';
  const storedEnvironment = localStorage.getItem('fatecode_environment');
  const isGeneral =
    location.pathname.startsWith('/general') ||
    (location.pathname.startsWith('/challenges/') && storedEnvironment === 'general');

  const academicNavItems = [
    { label: 'Dashboard', path: '/academic/dashboard', icon: LayoutDashboard },
    { label: 'Trilhas de Estudo', path: '/learning-paths', icon: Map },
    { label: 'Atividades da Turma', path: '/assignments', icon: ListChecks },
    { label: 'Rankings & Pódio', path: '/rankings', icon: Trophy },
    { label: 'Estrutura Acadêmica', path: '/academic', icon: Building2 },
    { label: 'Turmas & Alunos', path: '/classes', icon: GraduationCap },
    { label: 'Meu Perfil', path: '/profile', icon: User },
  ];

  const generalNavItems = [
    { label: 'Desafios', path: '/general/challenges', icon: Code2 },
    { label: 'Meu Perfil', path: '/profile', icon: User },
    { label: 'Trocar Ambiente', path: '/', icon: Home },
  ];

  const navItems = isGeneral ? generalNavItems : academicNavItems;
  const selectedLanguage = localStorage.getItem('fatecode_language') || 'JAVASCRIPT';

  const languageNames: Record<string, string> = {
    JAVASCRIPT: 'JavaScript',
    TYPESCRIPT: 'TypeScript',
    PYTHON: 'Python',
    JAVA: 'Java',
    C: 'C',
    CPP: 'C++',
  };

  return (
    <aside className="w-64 bg-[#0c1222] border-r border-slate-800/80 p-4 flex flex-col justify-between hidden md:flex min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        {isGeneral ? (
          <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20">
            <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-1">
              <Code2 className="w-3.5 h-3.5" />
              <span>Ambiente Geral</span>
            </div>
            <p className="text-xs text-slate-300 font-medium">Desafios livres • 8 kyu → 1 kyu</p>
            <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-indigo-500/10 pt-2">
              <span>Linguagem</span>
              <span className="font-mono font-bold text-indigo-200">{languageNames[selectedLanguage] || selectedLanguage}</span>
            </div>
          </div>
        ) : (
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
        )}

        <div className="space-y-1">
          <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            {isGeneral ? 'Prática Livre' : 'Menu Acadêmico'}
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {!isGeneral && isTeacherOrAdmin && (
          <div className="space-y-1 pt-2 border-t border-slate-800/80">
            <p className="px-3 text-[11px] font-bold text-indigo-400 uppercase tracking-wider mb-2">
              Gestão Docente
            </p>
            <NavLink
              to="/teacher/dashboard"
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`
              }
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Painel Docente & Integridade</span>
            </NavLink>
            <NavLink
              to="/codewars-import"
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all ${
                  isActive
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`
              }
            >
              <DownloadCloud className="w-4 h-4 text-rose-400" />
              <span>Importar Codewars</span>
            </NavLink>
          </div>
        )}

        <NavLink
          to="/"
          className="flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-sm text-slate-400 hover:bg-slate-800/60 hover:text-white transition-all border border-transparent hover:border-slate-800"
        >
          <Home className="w-4 h-4" />
          <span>Escolher ambiente</span>
        </NavLink>
      </div>

      <div className="text-[11px] text-slate-400 border-t border-slate-800/80 pt-3 px-2 flex justify-between items-center">
        <span>FateCode v1.1.0</span>
        <span className="text-emerald-400 font-semibold font-mono">2 Ambientes</span>
      </div>
    </aside>
  );
};
