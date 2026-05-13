import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Lock, User, LogIn, AlertCircle } from 'lucide-react';

export function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Transformation de l'identifiant simple en email pour Supabase
      let email = username.toLowerCase().trim();
      if (!email.includes('@')) {
        email = `${email}@carte-equipe.local`;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error("Identifiants incorrects ou utilisateur inexistant.");
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Une erreur inconnue est survenue.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0b0f1a] relative overflow-hidden">
      {/* Decorative background blobs - enhanced colors */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-600/20 rounded-full mix-blend-screen filter blur-3xl opacity-60 animate-blob"></div>
      <div className="absolute top-1/3 -right-20 w-96 h-96 bg-indigo-600/20 rounded-full mix-blend-screen filter blur-3xl opacity-60 animate-blob" style={{ animationDelay: '2s' }}></div>
      <div className="absolute -bottom-32 left-1/2 w-96 h-96 bg-blue-500/10 rounded-full mix-blend-screen filter blur-3xl opacity-40 animate-blob" style={{ animationDelay: '4s' }}></div>

      <div className="relative w-full max-w-md p-10 glass-panel rounded-[2rem] z-10 mx-4">
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-tr from-blue-600 via-blue-500 to-indigo-600 rounded-2xl shadow-2xl shadow-blue-500/20 flex items-center justify-center mb-6 transform -rotate-6 hover:rotate-0 transition-transform duration-500 ease-out cursor-default">
            <Lock className="w-10 h-10 text-white" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white font-display mb-2 premium-gradient-text">Accès Sécurisé</h1>
          <p className="text-slate-400 text-sm text-center max-w-[280px]">
            Identifiez-vous pour accéder au système de répartition en temps réel.
          </p>
        </div>

        {error ? (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3 animate-shake" role="alert">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        ) : null}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="username" className="text-sm font-semibold text-slate-400 ml-1 font-display">Identifiant</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-400 transition-colors">
                <User className="h-5 w-5" aria-hidden="true" />
              </div>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 text-slate-100 placeholder-slate-500 transition-all outline-none backdrop-blur-sm"
                spellCheck={false}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-semibold text-slate-400 ml-1 font-display">Mot de passe</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-400 transition-colors">
                <Lock className="h-5 w-5" aria-hidden="true" />
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 text-slate-100 placeholder-slate-500 transition-all outline-none backdrop-blur-sm"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-1 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mt-4 font-display"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-live="polite" aria-label="Connexion en cours…" />
            ) : (
              <>
                Se connecter
                <LogIn className="w-5 h-5 ml-1" aria-hidden="true" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
