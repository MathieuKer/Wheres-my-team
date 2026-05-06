import { useState } from 'react';
import { Users, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from './lib/AuthContext';
import { LoginForm } from './components/auth/LoginForm';
import { useTeams } from './hooks/useTeams';
import { useMap } from './hooks/useMap';
import { Sidebar } from './components/sidebar/Sidebar';
import { MapContainer } from './components/map/MapContainer';

function Dashboard({ signOut }: Readonly<{ signOut: () => Promise<void> }>) {
  const [showUnicorn, setShowUnicorn] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const triggerUnicorn = () => {
    if (showUnicorn) return;
    setShowUnicorn(true);
    setTimeout(() => {
      setShowUnicorn(false);
    }, 3000);
  };
  const { 
    teams, 
    addTeam, 
    updateTeamPosition, 
    updateTeamColor,
    updateTeamStatus, 
    deleteTeam, 
    flushAll 
  } = useTeams();
  
  const { mapUrl, updateMapUrl } = useMap();

  const handleDoubleToggleStatus = (id: string, currentStatus: string) => {
    // Si déjà en intervention, on repasse dispo (ou pause)
    // Sinon on passe en intervention "flash rouge"
    const newStatus = currentStatus === 'intervention' ? 'dispo' : 'intervention';
    updateTeamStatus(id, newStatus as any);
  };

  const handleFlush = () => {
    if (globalThis.confirm("Êtes-vous sûr de vouloir supprimer toutes les équipes ? Cette action est irréversible et effacera la carte pour tous les utilisateurs.")) {
      flushAll();
    }
  };

  return (
    <div className="flex h-[100dvh] w-screen overflow-hidden bg-background relative">
      
      {/* MOBILE OVERLAY */}
      {isSidebarOpen && (
        <button 
          type="button"
          aria-label="Fermer le menu"
          className="fixed inset-0 w-full h-full bg-black/60 z-30 md:hidden backdrop-blur-sm transition-opacity cursor-default border-none"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* MOBILE MENU BUTTON */}
      <div className="absolute top-4 left-4 z-50 md:hidden">
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="bg-slate-800/90 backdrop-blur p-2.5 rounded-lg text-white shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-slate-600 hover:bg-slate-700 transition-colors flex items-center justify-center"
        >
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* MAP AREA */}
      <div className="flex-1 w-full h-full relative md:border-r border-border flex flex-col">
        <MapContainer 
          mapUrl={mapUrl}
          teams={teams}
          onTeamMove={updateTeamPosition}
          onTeamDoubleClick={handleDoubleToggleStatus}
        />
      </div>

      {/* SIDEBAR AREA */}
      <div className={`fixed inset-y-0 right-0 transform ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'} md:translate-x-0 md:relative md:flex w-85 sm:w-96 md:w-80 max-w-[85vw] flex-shrink-0 bg-surface flex-col shadow-2xl md:shadow-xl z-40 transition-transform duration-300 ease-in-out border-l border-slate-700/50 md:border-none`}>
        <div className="p-4 border-b border-border flex items-center justify-between bg-slate-900">
          <div className="flex items-center gap-2 font-bold text-lg">
            <Users className="w-5 h-5 text-primary" />
            Répartition ({teams.length})
          </div>
          <button 
            onClick={signOut} 
            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded transition-colors" 
            title="Se déconnecter"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
        
        <Sidebar 
          teams={teams}
          onAddTeam={addTeam}
          onUpdateColor={updateTeamColor}
          onUpdateStatus={updateTeamStatus}
          onDeleteTeam={deleteTeam}
          onMapUpload={updateMapUrl}
        />

        <div className="p-4 border-t border-border bg-slate-900">
          <button 
            onClick={handleFlush}
            className="w-full bg-red-900/40 border border-red-900 hover:bg-red-900/80 transition-colors py-2 rounded-md text-sm font-semibold text-red-200"
          >
            Flush Événement
          </button>
        </div>
      </div>

      {/* EASTER EGG */}
      <button 
        onClick={triggerUnicorn}
        className="absolute bottom-2 left-2 z-50 opacity-30 hover:opacity-100 transition-opacity duration-300 cursor-pointer text-2xl select-none grayscale hover:grayscale-0"
        title="Secret"
      >
        🐴
      </button>

      <div 
        className={`absolute bottom-0 left-1/2 -translate-x-1/2 z-[9999] transition-transform duration-[1500ms] ease-in-out pointer-events-none ${
          showUnicorn ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <img 
          src="https://media.giphy.com/media/26AHG5KGFxSkUWw1i/giphy.gif" 
          alt="Magical Unicorn" 
          className="h-64 object-contain drop-shadow-2xl"
        />
      </div>

    </div>
  );
}

function App() {
  const { session, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen bg-background flex flex-col items-center justify-center text-slate-400 gap-4">
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        <p className="animate-pulse">Chargement sécurisé...</p>
      </div>
    );
  }

  if (!session) {
    return <LoginForm />;
  }

  return <Dashboard signOut={signOut} />;
}

export default App;
