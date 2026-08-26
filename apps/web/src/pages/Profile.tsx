import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { 
  User, 
  Flame, 
  Star, 
  Trophy, 
  Shield, 
  GraduationCap, 
  Github, 
  Code2, 
  Award, 
  Edit3, 
  Save, 
  CheckCircle2,
  Building2
} from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const totalXP = user?.profile?.totalXP || 0;
  const currentStreak = user?.streak?.currentStreak || 0;
  const maxStreak = user?.streak?.maxStreak || 0;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg(null);

    try {
      await api.put('/users/profile', { name, bio });
      await refreshUser();
      setIsEditing(false);
      setSuccessMsg('Perfil atualizado com sucesso!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Failed to update profile:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Profile Card */}
      <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-r from-[#12192d] to-[#0d1322] border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-2xl font-black text-white shadow-xl shadow-indigo-500/20">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl md:text-2xl font-black text-white">{user?.name}</h1>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-bold uppercase">
                  {user?.role}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center space-x-2 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditing ? 'Cancelar Edição' : 'Editar Perfil'}</span>
          </button>
        </div>

        {successMsg && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}
      </div>

      {/* Edit Form (if open) */}
      {isEditing && (
        <form onSubmit={handleSave} className="p-6 rounded-2xl bg-[#0f1628]/90 border border-indigo-500/30 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Edit3 className="w-4 h-4 text-indigo-400" />
            <span>Editar Informações Pessoais</span>
          </h3>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Nome Completo</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Biografia Acadêmica</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Descreva seus interesses, trilhas de estudo e objetivos..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-2 shadow-lg shadow-indigo-600/20"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{loading ? 'Salvando...' : 'Salvar Alterações'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#0f1628]/80 border border-slate-800 flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
            <Star className="w-6 h-6 fill-indigo-400/50" />
          </div>
          <div>
            <div className="text-xl font-mono font-bold text-white">{totalXP.toLocaleString('pt-BR')} XP</div>
            <div className="text-xs text-slate-400">Experiência Acumulada</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0f1628]/80 border border-slate-800 flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
            <Flame className="w-6 h-6 fill-amber-500/50" />
          </div>
          <div>
            <div className="text-xl font-mono font-bold text-white">{currentStreak} Dias</div>
            <div className="text-xs text-slate-400">Streak Atual (Max: {maxStreak}d)</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0f1628]/80 border border-slate-800 flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl font-mono font-bold text-white">#4 Faculdade</div>
            <div className="text-xs text-slate-400">Posição Geral FATEC-SP</div>
          </div>
        </div>
      </div>

      {/* Grid: Achievements & Academic Affiliation */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Achievements */}
        <div className="p-6 rounded-2xl bg-[#0f1628]/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Conquistas Desbloqueadas</span>
            </h3>
            <span className="text-xs text-indigo-400 font-mono">5 / 15</span>
          </div>

          <div className="space-y-2.5">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center space-x-3">
              <div className="text-2xl">🔥</div>
              <div>
                <div className="text-xs font-bold text-white">Primeiro Desafio</div>
                <div className="text-[11px] text-slate-400">Resolveu seu primeiro exercício na plataforma.</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center space-x-3">
              <div className="text-2xl">⚡</div>
              <div>
                <div className="text-xs font-bold text-white">7 Dias Consecutivos</div>
                <div className="text-[11px] text-slate-400">Manteve uma sequência diária de 7 dias.</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center space-x-3">
              <div className="text-2xl">🧠</div>
              <div>
                <div className="text-xs font-bold text-white">Algoritmista</div>
                <div className="text-[11px] text-slate-400">Resolveu 20 desafios de algoritmos.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Academic Affiliation */}
        <div className="p-6 rounded-2xl bg-[#0f1628]/80 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-indigo-400" />
            <span>Vínculo Acadêmico</span>
          </h3>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5 text-xs">
            <div className="flex justify-between border-b border-slate-800/80 pb-2">
              <span className="text-slate-400">Instituição:</span>
              <span className="font-bold text-slate-200">FATEC São Paulo</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/80 pb-2">
              <span className="text-slate-400">Curso Principal:</span>
              <span className="font-bold text-slate-200">Análise e Desenvolvimento de Sistemas</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/80 pb-2">
              <span className="text-slate-400">Semestre Atual:</span>
              <span className="font-bold text-slate-200 font-mono">4º Semestre (2026/2)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Linguagem Preferida:</span>
              <span className="font-bold text-indigo-400 font-mono">JavaScript / TypeScript</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
