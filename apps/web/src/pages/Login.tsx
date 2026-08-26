import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { Flame, Sparkles, Shield, GraduationCap, Lock, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      const { tokens, user } = response.data;
      login(tokens.accessToken, user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Falha ao autenticar. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#070a12] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow decorations */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-4xl grid md:grid-cols-2 rounded-2xl border border-slate-800 bg-[#0f1523]/80 backdrop-blur-xl shadow-2xl overflow-hidden relative z-10">
        {/* Left Side: Branding & Gamified Features */}
        <div className="p-8 md:p-10 bg-gradient-to-br from-[#121a2d] to-[#0d1322] border-b md:border-b-0 md:border-r border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 p-0.5 shadow-lg shadow-indigo-500/30">
                <div className="w-full h-full bg-[#090d16] rounded-[10px] flex items-center justify-center">
                  <span className="font-mono font-bold text-indigo-400 text-xl">⚡</span>
                </div>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-white">
                Fate<span className="text-indigo-400">Code</span>
              </h1>
            </div>

            <p className="text-sm text-slate-300 font-medium leading-relaxed mb-6">
              Plataforma acadêmica gamificada de aprendizado e competição em programação para cursos superiores.
            </p>

            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 mt-0.5">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Hierarquia Acadêmica</h4>
                  <p className="text-[11px] text-slate-400">Faculdade, Cursos, Turmas e acompanhamento docente estruturado.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 mt-0.5">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Gamificação & Desafio Diário</h4>
                  <p className="text-[11px] text-slate-400">XP auditável, streaks contínuos, conquistas e rankings por faculdade e turma.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 mt-0.5">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Ambiente Seguro</h4>
                  <p className="text-[11px] text-slate-400">Execução segura em sandbox isolado e controle rigoroso de testes e soluções.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-800/80 text-[11px] text-slate-400">
            <span>Desenvolvido para ambiente universitário • Fase 1</span>
          </div>
        </div>

        {/* Right Side: Login Form & Quick Fill Credentials */}
        <div className="p-8 md:p-10 flex flex-col justify-between">
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white mb-1">Acessar Plataforma</h2>
              <p className="text-xs text-slate-400">Entre com seu e-mail institucional ou acadêmico.</p>
            </div>

            {error && (
              <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">E-mail</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="seu.nome@fatecode.edu.br"
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Senha</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Entrar no FateCode</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-4 text-center">
              <span className="text-xs text-slate-400">Não tem conta? </span>
              <Link to="/register" className="text-xs font-medium text-indigo-400 hover:text-indigo-300">
                Criar nova conta
              </Link>
            </div>
          </div>

          {/* Quick Demo Accounts Selection */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Contas de Demonstração (Seed):</span>
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickFill('admin@fatecode.edu.br', 'Admin@123456')}
                className="text-left px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 transition-colors flex items-center justify-between"
              >
                <span>👑 Admin</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('prof.silva@fatecode.edu.br', 'Prof@123456')}
                className="text-left px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 transition-colors flex items-center justify-between"
              >
                <span>👨‍🏫 Prof. Silva</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('joao.silva@fatecode.edu.br', 'Student@123456')}
                className="text-left px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 transition-colors flex items-center justify-between"
              >
                <span>🎓 Aluno João</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('maria.souza@fatecode.edu.br', 'Student@123456')}
                className="text-left px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 transition-colors flex items-center justify-between"
              >
                <span>🎓 Aluna Maria</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
