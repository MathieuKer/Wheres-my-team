import { lazy, Suspense } from 'react';
import { useAuth } from './hooks/useAuth';

const LoginForm = lazy(() => import('./components/auth/LoginForm').then(m => ({ default: m.LoginForm })));
const Dashboard = lazy(() => import('./components/Dashboard').then(m => ({ default: m.Dashboard })));

function LoadingFallback() {
  return (
    <div className="h-screen w-screen bg-background flex flex-col items-center justify-center text-slate-400 gap-4">
      <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      <p className="animate-pulse">Chargement sécurisé...</p>
    </div>
  );
}

function App() {
  const { session, loading, signOut } = useAuth();

  if (loading) {
    return <LoadingFallback />;
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      {!session ? (
        <LoginForm />
      ) : (
        <Dashboard signOut={signOut} />
      )}
    </Suspense>
  );
}

export default App;
