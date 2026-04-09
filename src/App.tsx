import { Users } from 'lucide-react';
import { useTeams } from './hooks/useTeams';
import { useMap } from './hooks/useMap';
import { Sidebar } from './components/sidebar/Sidebar';
import { MapContainer } from './components/map/MapContainer';

function App() {
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
    if (window.confirm("Êtes-vous sûr de vouloir supprimer toutes les équipes ? Cette action est irréversible et effacera la carte pour tous les utilisateurs.")) {
      flushAll();
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      
      {/* MAP AREA (90%) */}
      <div className="flex-1 relative border-r border-border flex flex-col">
        <MapContainer 
          mapUrl={mapUrl}
          teams={teams}
          onTeamMove={updateTeamPosition}
          onTeamDoubleClick={handleDoubleToggleStatus}
        />
      </div>

      {/* SIDEBAR AREA (10%) */}
      <div className="w-80 flex-shrink-0 bg-surface flex flex-col shadow-xl z-10">
        <div className="p-4 border-b border-border text-center font-bold text-lg flex items-center gap-2 justify-center bg-slate-900">
          <Users className="w-5 h-5 text-primary" />
          Répartition ({teams.length})
        </div>
        
        <Sidebar 
          teams={teams}
          onAddTeam={addTeam}
          onUpdateColor={updateTeamColor}
          onUpdateStatus={updateTeamStatus}
          onDeleteTeam={deleteTeam}
          onFlush={handleFlush}
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

    </div>
  );
}

export default App;
