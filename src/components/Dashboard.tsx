import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { LogOut, Menu, X, ArrowLeft, Layout, Settings, Eye, AlertCircle } from 'lucide-react';
import { useSquadMap } from '../hooks/useSquadMap';
import { Sidebar } from './sidebar/Sidebar';
import { MapContainer } from './map/MapContainer';

interface DashboardProps {
  mapId: string;
  onBack: () => void;
  signOut: () => Promise<void>;
}

export function Dashboard({ mapId, onBack, signOut }: Readonly<DashboardProps>) {
  const [showUnicorn, setShowUnicorn] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => typeof window !== 'undefined' && window.matchMedia?.('(max-width: 768px)').matches === false);
  const [sidebarWidth, setSidebarWidth] = useState(360);
  const [isMobile, setIsMobile] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  // Utilisation de l'orchestrateur profond avec l'ID de la carte
  const { state, actions } = useSquadMap(mapId);

  // États de configuration globaux (partagés entre la carte et le menu de création de la barre latérale)
  const [configuringTeamId, setConfiguringTeamId] = useState<string | null>(null);
  const [configuringInterventionId, setConfiguringInterventionId] = useState<string | null>(null);
  const [teamToConfirmIntervention, setTeamToConfirmIntervention] = useState<string | null>(null);
  const [skipConfirmCreate, setSkipConfirmCreate] = useState(false);

  // Wrapper pour ouvrir directement le modal lors de la création d'une intervention
  const handleAddIntervention = async (description: string, priority: string, posX?: number, posY?: number) => {
    const newInt = await actions.addIntervention(description, priority, posX, posY);
    if (newInt) {
      setConfiguringInterventionId(newInt.id);
    }
    return newInt;
  };

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = window.innerWidth - moveEvent.clientX;
      if (newWidth >= 280 && newWidth <= 600) {
        setSidebarWidth(newWidth);
      }
    };
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      setIsResizing(false);
    };
    document.body.style.cursor = 'ew-resize';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

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

      {/* MENU BUTTON */}
      <div className="absolute top-4 left-4 z-50">
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="bg-slate-800/90 backdrop-blur p-2.5 rounded-lg text-white shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-slate-600 hover:bg-slate-700 transition-colors flex items-center justify-center"
        >
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* MAP AREA */}
      <div className="flex-1 min-w-0 w-full h-full relative md:border-r border-border flex flex-col">
        <MapContainer 
          mapUrl={state.mapUrl}
          teams={state.teams}
          zones={state.zones}
          interventions={state.interventions}
          hasInterventions={state.hasInterventions}
          mode={state.mode}
          onTeamsMove={actions.updateTeamsPositions}
          onTeamDoubleClick={async (teamId) => {
            if (state.mode !== 'deployment') return;
            const team = state.teams.find(t => t.id === teamId);
            if (!team) return;

            if (!state.hasInterventions) {
              actions.toggleIntervention(teamId, team.status);
              return;
            }

            const runCreation = async () => {
              const newInt = await handleAddIntervention("Nouvelle Intervention", "P3", team.pos_x, team.pos_y);
              if (newInt) {
                await actions.updateIntervention(newInt.id, { assigned_team_id: teamId });
                await actions.updateTeamStatus(teamId, 'intervention');
              }
            };

            if (skipConfirmCreate) {
              await runCreation();
            } else {
              setTeamToConfirmIntervention(teamId);
            }
          }}
          onTeamUpdateStatus={actions.updateTeamStatus}
          onTeamUpdateDescription={actions.updateTeamDescription}
          onZoneCreate={actions.addZone}
          onZoneUpdate={actions.updateZone}
          onZoneDelete={actions.deleteZone}
          onInterventionAdd={handleAddIntervention}
          onInterventionUpdate={actions.updateIntervention}
          onInterventionDelete={actions.deleteIntervention}
          onInterventionsMove={actions.updateInterventionsPositions}
          configuringTeamId={configuringTeamId}
          setConfiguringTeamId={setConfiguringTeamId}
          configuringInterventionId={configuringInterventionId}
          setConfiguringInterventionId={setConfiguringInterventionId}
        />
      </div>

      {/* SIDEBAR AREA */}
      <div 
        className={`fixed inset-y-0 right-0 transform ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'} md:translate-x-0 md:relative flex max-w-[85vw] flex-shrink-0 glass-panel flex-col shadow-2xl z-40 ${isResizing ? 'transition-none' : 'transition-all duration-300'} md:border-none rounded-l-[2.5rem] md:rounded-none ${isSidebarOpen ? 'md:flex' : 'md:hidden'}`}
        style={isMobile ? undefined : { width: `${sidebarWidth}px` }}
      >
        {/* DRAG HANDLE FOR RESIZING */}
        {!isMobile && (
          <div 
            role="separator"
            tabIndex={0}
            aria-label="Redimensionner la barre latérale"
            aria-valuenow={sidebarWidth}
            aria-valuemin={280}
            aria-valuemax={600}
            aria-orientation="vertical"
            className="absolute top-0 bottom-0 left-0 w-1.5 cursor-ew-resize hover:bg-blue-500/30 active:bg-blue-500/70 focus:bg-blue-500/50 outline-none transition-colors z-50"
            onMouseDown={handleMouseDown}
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft') {
                e.preventDefault();
                setSidebarWidth(prev => Math.min(600, prev + 10));
              } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                setSidebarWidth(prev => Math.max(280, prev - 10));
              }
            }}
            title="Glisser ou utiliser les flèches clavier pour redimensionner la barre"
          />
        )}
        <div className="p-4 md:p-5 border-b border-white/5 bg-black/20 flex flex-col gap-3.5">
          {/* Première ligne : Navigation et Déconnexion */}
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2.5 font-bold text-lg font-display">
              <button 
                onClick={onBack}
                className="w-8 h-8 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center border border-white/10 transition-colors"
                title="Retour aux cartes"
              >
                <ArrowLeft className="w-4 h-4 text-slate-400" />
              </button>
              <span className="bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-blue-400/50 truncate max-w-[150px] sm:max-w-none">Répartition</span>
              <span className="text-xs bg-white/5 px-2 py-0.5 rounded-full text-slate-500 border border-white/5">{state.teams.length}</span>
            </div>

            <button 
              onClick={signOut} 
              className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all" 
              title="Se déconnecter"
              aria-label="Se déconnecter"
            >
              <LogOut className="w-4.5 h-4.5" aria-hidden="true" />
            </button>
          </div>

          {/* Deuxième ligne : Sélecteur de mode segmenté */}
          <div className="flex flex-col gap-1.5">
            <div className="grid grid-cols-3 bg-black/40 p-1 rounded-xl border border-white/5 gap-1">
              <button
                onClick={() => actions.setMode('reader')}
                className={`py-1.5 rounded-lg text-[10px] sm:text-[11px] font-bold font-display flex flex-col sm:flex-row items-center justify-center gap-1 transition-all leading-tight ${
                  state.mode === 'reader' 
                    ? 'bg-slate-700 text-white shadow-md' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Lecture seule : consultation uniquement, aucun déplacement possible."
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Lecture seule</span>
              </button>
              <button
                onClick={() => actions.setMode('deployment')}
                className={`py-1.5 rounded-lg text-[10px] sm:text-[11px] font-bold font-display flex flex-col sm:flex-row items-center justify-center gap-1 transition-all leading-tight ${
                  state.mode === 'deployment' 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Suivi en direct : déplacez les équipes et gérez les appels sur le terrain."
              >
                <Layout className="w-3.5 h-3.5" />
                <span>Suivi direct</span>
              </button>
              <button
                onClick={() => actions.setMode('edition')}
                className={`py-1.5 rounded-lg text-[10px] sm:text-[11px] font-bold font-display flex flex-col sm:flex-row items-center justify-center gap-1 transition-all leading-tight ${
                  state.mode === 'edition' 
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-500/10' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Modifier la carte : dessinez des zones tactiques et gérez le plan de fond."
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Modifier carte</span>
              </button>
            </div>
            
            {/* Légende du mode actif */}
            <div className="text-[10px] text-slate-400/90 text-center font-medium italic select-none pt-1">
              {state.mode === 'reader' && "👁️ Mode consultation : rien ne peut être déplacé ou modifié."}
              {state.mode === 'deployment' && "🗺️ Mode terrain : déplacez les équipes et gérez les appels."}
              {state.mode === 'edition' && "🛠️ Mode plan : dessinez les zones et configurez la carte de fond."}
            </div>
          </div>
        </div>
        
        <Sidebar 
          teams={state.teams}
          zones={state.zones}
          interventions={state.interventions}
          hasInterventions={state.hasInterventions}
          mode={state.mode}
          onAddTeam={actions.addTeam}
          onUpdateColor={actions.updateTeamColor}
          onUpdateName={actions.updateTeamName}
          onUpdateStatus={actions.updateTeamStatus}
          onDeleteTeam={actions.deleteTeam}
          onMapUpload={actions.updateMapUrl}
          onDeleteZone={actions.deleteZone}
          onUpdateZone={actions.updateZone}
          onUpdateDescription={actions.updateTeamDescription}
          onAddZone={actions.addZone}
          onTeamsMove={actions.updateTeamsPositions}
          onAddIntervention={handleAddIntervention}
          onUpdateIntervention={actions.updateIntervention}
          onDeleteIntervention={actions.deleteIntervention}
          onFlushInterventions={actions.flushInterventions}
          onConfigureIntervention={setConfiguringInterventionId}
        />

        {state.mode === 'edition' && (
          <div className="p-6 border-t border-white/5 bg-black/20">
            <button 
              onClick={actions.requestFlush}
              className="w-full bg-red-950/30 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all py-3 rounded-xl text-sm font-bold text-red-400 font-display shadow-lg shadow-red-900/10"
            >
              Flush Événement
            </button>
          </div>
        )}
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

      {teamToConfirmIntervention && (() => {
        const teamObj = state.teams.find(t => t.id === teamToConfirmIntervention);
        if (!teamObj) return null;
        return (
          <DoubleClickConfirmModal
            teamName={teamObj.name}
            skipConfirm={skipConfirmCreate}
            setSkipConfirm={setSkipConfirmCreate}
            onConfirm={async () => {
              setTeamToConfirmIntervention(null);
              const newInt = await handleAddIntervention("Nouvelle Intervention", "P3", teamObj.pos_x, teamObj.pos_y);
              if (newInt) {
                await actions.updateIntervention(newInt.id, { assigned_team_id: teamObj.id });
                await actions.updateTeamStatus(teamObj.id, 'intervention');
              }
            }}
            onCancel={() => setTeamToConfirmIntervention(null)}
          />
        );
      })()}

    </div>
  );
}

interface DoubleClickConfirmModalProps {
  teamName: string;
  onConfirm: () => void;
  onCancel: () => void;
  skipConfirm: boolean;
  setSkipConfirm: (val: boolean) => void;
}

function DoubleClickConfirmModal({
  teamName,
  onConfirm,
  onCancel,
  skipConfirm,
  setSkipConfirm
}: Readonly<DoubleClickConfirmModalProps>) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onConfirm();
      }
    };
    globalThis.addEventListener('keydown', handleKeyDown);
    return () => globalThis.removeEventListener('keydown', handleKeyDown);
  }, [onConfirm, onCancel]);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-5 flex gap-4 text-left">
          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 border border-blue-500/30">
            <AlertCircle className="w-5 h-5 text-blue-400" aria-hidden="true" />
          </div>
          <div className="flex-1 pt-1">
            <h3 className="text-lg font-bold text-white mb-2 font-display leading-none">Créer une intervention</h3>
            <p className="text-sm text-slate-300 font-medium">
              Voulez-vous créer une intervention pour l'équipe <strong className="text-white">{teamName}</strong> et l'y assigner ?
            </p>
            
            <label className="flex items-center gap-2 mt-4 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={skipConfirm}
                onChange={(e) => setSkipConfirm(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-0 cursor-pointer"
              />
              <span className="text-xs font-semibold text-slate-400 hover:text-slate-300">Ne plus me demander pour cette session</span>
            </label>
          </div>
        </div>
        
        <div className="bg-white/5 p-4 flex flex-col gap-2 border-t border-white/5">
          <div className="flex gap-3 justify-end">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-xl font-bold text-sm text-slate-300 hover:bg-white/5 transition-colors"
            >
              Annuler (Échap)
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 transition-all outline-none"
            >
              Ok (Entrée)
            </button>
          </div>
          <div className="text-[10px] text-slate-500 text-right font-medium">
            Appuyez sur <kbd className="bg-slate-800 px-1 py-0.5 rounded text-slate-400">Entrée</kbd> pour valider ou <kbd className="bg-slate-800 px-1 py-0.5 rounded text-slate-400">Échap</kbd> pour fermer
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
