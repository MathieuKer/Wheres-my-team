import { useState } from 'react';
import { Users, LogOut, Menu, X } from 'lucide-react';
import { useSquadMap } from '../hooks/useSquadMap';
import { Sidebar } from './sidebar/Sidebar';
import { MapContainer } from './map/MapContainer';

interface DashboardProps {
  signOut: () => Promise<void>;
}

export function Dashboard({ signOut }: Readonly<DashboardProps>) {
  const [showUnicorn, setShowUnicorn] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Utilisation de l'orchestrateur profond
  const { state, actions } = useSquadMap();

  const triggerUnicorn = () => {
    if (showUnicorn) return;
    setShowUnicorn(true);
    setTimeout(() => {
      setShowUnicorn(false);
    }, 3000);
  };

  return (
    <div className="flex h-[100dvh] w-screen overflow-hidden bg-background relative">
      
      {/* MOBILE OVERLAY */}
      {isSidebarOpen ? (
        <button 
          type="button"
          aria-label="Fermer le menu"
          className="fixed inset-0 w-full h-full bg-black/60 z-30 md:hidden backdrop-blur-sm transition-opacity cursor-default border-none"
          onClick={() => setIsSidebarOpen(false)}
        />
      ) : null}

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
          mapUrl={state.mapUrl}
          teams={state.teams}
          onTeamMove={actions.updateTeamPosition}
          onTeamDoubleClick={actions.toggleIntervention}
        />
      </div>

      {/* SIDEBAR AREA */}
      <div className={`fixed inset-y-0 right-0 transform ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'} md:translate-x-0 md:relative md:flex w-85 sm:w-96 md:w-80 max-w-[85vw] flex-shrink-0 glass-panel flex-col shadow-2xl z-40 transition-transform duration-500 ease-in-out md:border-none rounded-l-[2.5rem] md:rounded-none`}>
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/20">
          <div className="flex items-center gap-3 font-bold text-xl font-display">
            <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center border border-blue-500/30">
              <Users className="w-5 h-5 text-blue-400" aria-hidden="true" />
            </div>
            <span className="premium-gradient-text">Répartition</span>
            <span className="text-xs bg-white/5 px-2 py-0.5 rounded-full text-slate-500 border border-white/5">{state.teams.length}</span>
          </div>
          <button 
            onClick={signOut} 
            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all" 
            title="Se déconnecter"
            aria-label="Se déconnecter"
          >
            <LogOut className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
        
        <Sidebar 
          teams={state.teams}
          onAddTeam={actions.addTeam}
          onUpdateColor={actions.updateTeamColor}
          onUpdateStatus={actions.updateTeamStatus}
          onDeleteTeam={actions.deleteTeam}
          onMapUpload={actions.updateMapUrl}
        />

        <div className="p-6 border-t border-white/5 bg-black/20">
          <button 
            onClick={actions.requestFlush}
            className="w-full bg-red-950/30 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all py-3 rounded-xl text-sm font-bold text-red-400 font-display shadow-lg shadow-red-900/10"
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
          alt="Magical Unicorn animation" 
          width={256}
          height={256}
          className="h-64 object-contain drop-shadow-2xl"
        />
      </div>

    </div>
  );
}
