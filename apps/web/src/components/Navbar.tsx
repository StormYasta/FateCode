import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Flame, Star, Trophy, LogOut, User as UserIcon, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  const totalXP = user?.profile?.totalXP || 0;
  const currentStreak = user?.streak?.currentStreak || 0;

  return (
    <header className="h-16 bg-[#0f1629]/90 backdrop-blur border-b border-slate-800/80 px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Brand */}
      <div className="flex items-center space-x-3">
        <Link to="/" className="flex items-center space-x-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#090d16] rounded-[10px] flex items-center justify-center">
              <span className="font-mono font-bold text-indigo-400 text-lg">⚡</span>
            </div>
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
              Fate<span className="text-indigo-400">Code</span>
            </span>
            <span className="text-[10px] block text-slate-400 font-mono tracking-wider -mt-1 uppercase">
              Academic Arena
            </span>
          </div>
        </Link>
      </div>

      {/* Gamification Quick Stats & User Menu */}
      {user && (
        <div className="flex items-center space-x-4">
          {/* Streak pill */}
          <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono text-sm shadow-sm">
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
            <span className="font-bold">{currentStreak}</span>
            <span className="text-xs text-amber-400/80">dias</span>
          </div>

          {/* XP pill */}
          <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-mono text-sm shadow-sm">
            <Star className="w-4 h-4 text-indigo-400 fill-indigo-400/50" />
            <span className="font-bold">{totalXP.toLocaleString('pt-BR')}</span>
            <span className="text-xs text-indigo-300/80">XP</span>
          </div>

          {/* Role badge */}
          <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-xs font-semibold">
            <Shield className="w-3 h-3 text-indigo-400" />
            <span className="text-slate-300">{user.role}</span>
          </div>

          {/* User profile dropdown link */}
          <Link
            to="/profile"
            className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-slate-800/60 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-sm text-white shadow">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span className="hidden md:inline text-sm font-medium text-slate-200">
              {user.name}
            </span>
          </Link>

          {/* Logout */}
          <button
            onClick={logout}
            title="Sair da conta"
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      )}
    </header>
  );
};
