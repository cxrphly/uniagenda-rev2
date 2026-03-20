// ============================================================
// UniAgenda — Login Page
// Design: Fresh Academic — split layout, dark left + form right
// ============================================================

import React, { useState } from 'react';
import { GraduationCap, Mail, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export default function Login() {
  console.log('[Login] Page rendering');
  const { signIn, signUp, isConfigured } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) setError(error);
      } else {
        if (!nome.trim()) { setError('Informe seu nome.'); setLoading(false); return; }
        const { error } = await signUp(email, password, nome);
        if (error) {
          setError(error);
        } else {
          setSuccess('Conta criada! Verifique seu e-mail para confirmar o cadastro.');
          setMode('login');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — dark with gradient */}
      <div
        className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-10 overflow-hidden"
        style={{ background: '#0F172A' }}
      >
        {/* Gradient overlay instead of image */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 to-purple-900/20" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
              <GraduationCap size={22} className="text-white" />
            </div>
            <span className="text-white font-bold text-xl">UniAgenda</span>
          </div>
        </div>

        {/* Decorative elements instead of hero image */}
        <div className="relative z-10 my-auto">
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <GraduationCap size={32} className="text-indigo-400 mb-3" />
              <h3 className="text-white font-semibold text-lg">Disciplinas</h3>
              <p className="text-slate-400 text-sm">Organize suas matérias</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <Mail size={32} className="text-indigo-400 mb-3" />
              <h3 className="text-white font-semibold text-lg">Tarefas</h3>
              <p className="text-slate-400 text-sm">Gerencie prazos</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <Lock size={32} className="text-indigo-400 mb-3" />
              <h3 className="text-white font-semibold text-lg">Eventos</h3>
              <p className="text-slate-400 text-sm">Nunca perca uma prova</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <User size={32} className="text-indigo-400 mb-3" />
              <h3 className="text-white font-semibold text-lg">Anotações</h3>
              <p className="text-slate-400 text-sm">Tudo em um só lugar</p>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <h2 className="text-white text-2xl font-bold mb-3">
            Sua vida acadêmica,<br />organizada.
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Gerencie disciplinas, horários, tarefas, eventos e anotações em um só lugar.
            Funciona offline e sincroniza automaticamente.
          </p>

          <div className="mt-6 flex gap-6">
            {[
              { label: 'Offline First', desc: 'Funciona sem internet' },
              { label: 'PWA', desc: 'Instale no celular' },
              { label: 'Sync Auto', desc: 'Dados na nuvem' },
            ].map(({ label, desc }) => (
              <div key={label}>
                <p className="text-white font-semibold text-sm">{label}</p>
                <p className="text-slate-500 text-xs">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form (sem alterações) */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
              <GraduationCap size={20} className="text-white" />
            </div>
            <span className="font-bold text-xl text-slate-900">UniAgenda</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-1">
            {mode === 'login' ? 'Bem-vindo de volta' : 'Criar conta'}
          </h1>
          <p className="text-slate-500 text-sm mb-8">
            {mode === 'login'
              ? 'Entre na sua conta para continuar'
              : 'Crie sua conta gratuita agora'}
          </p>

          {!isConfigured && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-2 text-sm text-amber-800">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>Configure as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para habilitar autenticação.</span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2 text-sm text-red-700">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div className="space-y-1.5">
                <Label htmlFor="nome" className="text-slate-700 font-medium text-sm">Nome completo</Label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="nome"
                    type="text"
                    placeholder="Seu nome"
                    value={nome}
                    onChange={e => setNome(e.target.value)}
                    className="pl-9 h-11 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-slate-700 font-medium text-sm">E-mail</Label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="pl-9 h-11 border-slate-200 focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-slate-700 font-medium text-sm">Senha</Label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="pl-9 pr-10 h-11 border-slate-200 focus:border-indigo-500"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
              disabled={loading}
            >
              {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            {mode === 'login' ? 'Não tem conta?' : 'Já tem conta?'}{' '}
            <button
              className="text-indigo-600 font-semibold hover:underline"
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setSuccess(''); }}
            >
              {mode === 'login' ? 'Criar agora' : 'Entrar'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}