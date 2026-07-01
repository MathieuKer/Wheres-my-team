import { useRef, useState, useEffect, useCallback } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import type { ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import type { Team, Zone, TeamStatus, Intervention, InterventionPriority } from '../../types';
import { TeamMarker } from './TeamMarker';
import { ZoneElement } from './ZoneElement';
import { ZoneContent } from './ZoneContent';
import { InterventionMarker } from './InterventionMarker';
import { MapIcon, MousePointer2, ZoomIn, ZoomOut, Maximize, Lock, Unlock, Eye, EyeOff, X, RotateCcw, CheckCircle, Trash2, ShieldAlert } from 'lucide-react';
import { getZoneStyle } from '../../lib/utils';

interface MapContainerProps {
  mapUrl: string | null;
  teams: Team[];
  zones: Zone[];
  interventions?: Intervention[];
  mode: 'reader' | 'deployment' | 'edition';
  onTeamsMove: (moves: { id: string; x: number; y: number }[]) => void;
  onTeamDoubleClick: (id: string, currentStatus: TeamStatus) => void;
  onTeamUpdateStatus?: (id: string, status: TeamStatus) => void;
  onTeamUpdateDescription?: (id: string, description: string | null) => void;
  onZoneCreate: (zone: Omit<Zone, 'id' | 'map_id' | 'created_at'>) => void;
  onZoneUpdate: (id: string, updates: Partial<Zone>) => void;
  onZoneDelete: (id: string) => void;
  onInterventionAdd?: (description: string, priority: string, posX?: number, posY?: number) => Promise<Intervention | null>;
  onInterventionUpdate?: (id: string, updates: Partial<Intervention>) => void;
  onInterventionDelete?: (id: string) => void;
  configuringTeamId: string | null;
  setConfiguringTeamId: (id: string | null) => void;
  configuringInterventionId: string | null;
  setConfiguringInterventionId: (id: string | null) => void;
}

const TeamConfigModal = ({ 
  team, 
  onClose, 
  onUpdateStatus, 
  onUpdateDescription, 
  onTeamsMove, 
  mode 
}: { 
  team: Team; 
  onClose: () => void; 
  onUpdateStatus?: (id: string, status: TeamStatus) => void;
  onUpdateDescription?: (id: string, description: string | null) => void;
  onTeamsMove?: (moves: { id: string; x: number; y: number }[]) => void;
  mode: string;
}) => {
  const [description, setDescription] = useState(team.description ?? '');
  const [prevDesc, setPrevDesc] = useState(team.description ?? '');
  const isReadOnly = mode === 'reader';

  const handleSaveDescription = useCallback(() => {
    if (onUpdateDescription) {
      onUpdateDescription(team.id, description.trim() || null);
    }
  }, [onUpdateDescription, team.id, description]);

  // Save and close on Escape or Ctrl+Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation();
        handleSaveDescription();
        onClose();
      } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.stopImmediatePropagation();
        handleSaveDescription();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [description, onClose, handleSaveDescription]);

  // Sync description if prop changes during render
  if ((team.description ?? '') !== prevDesc) {
    setDescription(team.description ?? '');
    setPrevDesc(team.description ?? '');
  }

  const handleResetPosition = () => {
    if (onTeamsMove) {
      if (confirm(`Voulez-vous replacer l'unité "${team.name}" au centre de la carte ?`)) {
        onTeamsMove([{ id: team.id, x: 50, y: 50 }]);
        onClose();
      }
    }
  };

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-2xl p-5 shadow-2xl text-left text-slate-200 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: team.color }} />
            <span className="text-sm font-black font-display tracking-wider text-slate-100 uppercase truncate">
              Configuration : {team.name}
            </span>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 hover:bg-white/5 rounded-md transition-colors"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status */}
        <div className="mb-4">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Statut
          </label>
          {isReadOnly ? (
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${team.status === 'dispo' ? 'bg-emerald-500' : team.status === 'en_route' ? 'bg-blue-500' : team.status === 'intervention' ? 'bg-red-500' : 'bg-amber-500'}`} />
              <span className="text-xs font-bold text-slate-300 capitalize">
                {team.status === 'dispo' ? 'Disponible' : team.status === 'en_route' ? 'En direction' : team.status === 'pause' ? 'En pause' : 'Intervention'}
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'dispo', label: 'Disponible', colorClass: 'bg-emerald-500/20 border-emerald-500 text-emerald-400' },
                { id: 'en_route', label: 'En Route', colorClass: 'bg-blue-500/20 border-blue-500 text-blue-400' },
                { id: 'intervention', label: 'Intervention', colorClass: 'bg-red-500/20 border-red-500 text-red-400' },
                { id: 'pause', label: 'En Pause', colorClass: 'bg-amber-500/20 border-amber-500 text-amber-400' }
              ].map((s) => {
                const isActive = team.status === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => { if (onUpdateStatus) onUpdateStatus(team.id, s.id as TeamStatus); }}
                    className={`py-1.5 text-xs font-bold rounded-lg border text-center transition-all ${
                      isActive ? s.colorClass : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Consignes / Notes */}
        <div className="mb-4">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Consignes / Notes
          </label>
          {isReadOnly ? (
            <div className="text-xs bg-black/20 rounded-lg p-2.5 border border-white/5 text-slate-300 max-h-24 overflow-y-auto font-semibold">
              {team.description || 'Aucune note.'}
            </div>
          ) : (
            <textarea
              placeholder="Membres, matériel, consignes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleSaveDescription}
              className="w-full text-xs bg-black/20 border border-white/10 rounded-lg p-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors font-semibold min-h-[60px] resize-y"
            />
          )}
        </div>

        {/* Recentrer l'unité */}
        {!isReadOnly && onTeamsMove && (
          <button
            onClick={handleResetPosition}
            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white font-bold py-2 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            Recentrer l'unité
          </button>
        )}
      </div>
    </div>
  );
};

const InterventionConfigModal = ({
  intervention,
  teams,
  onClose,
  onUpdate,
  onDelete,
  mode
}: {
  intervention: Intervention;
  teams: Team[];
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Intervention>) => void;
  onDelete: (id: string) => void;
  mode: string;
}) => {
  const isReadOnly = mode === 'reader';
  const assignedTeam = teams.find(t => t.id === intervention.assigned_team_id);

  // Close on Escape or Ctrl+Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation();
        onClose();
      } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.stopImmediatePropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [onClose]);

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-2xl p-5 shadow-2xl text-left text-slate-200 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-black font-display tracking-wider text-slate-100 uppercase">
              Intervention #{intervention.number}
            </span>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 hover:bg-white/5 rounded-md transition-colors"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Motif */}
        <div className="mb-4">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Descriptif / Motif
          </label>
          {isReadOnly ? (
            <div className="text-xs bg-black/20 rounded-lg p-2.5 border border-white/5 text-slate-300 font-semibold">
              {intervention.description || 'Aucun motif renseigné'}
            </div>
          ) : (
            <input
              type="text"
              placeholder="Ex: Malaise vagal..."
              value={intervention.description || ''}
              onChange={(e) => onUpdate(intervention.id, { description: e.target.value })}
              className="w-full text-xs bg-black/20 border border-white/10 rounded-lg p-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors font-semibold"
            />
          )}
        </div>

        {/* Priorité */}
        <div className="mb-4">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Priorité
          </label>
          {isReadOnly ? (
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${intervention.priority === 'P0' ? 'bg-slate-950 border border-red-500' : intervention.priority === 'P1' ? 'bg-red-500' : intervention.priority === 'P3' ? 'bg-amber-500' : 'bg-blue-500'}`} />
              <span className="text-xs font-bold text-slate-300">{intervention.priority}</span>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-1.5">
              {['P0', 'P1', 'P3', 'P5'].map((p) => {
                const isSelected = intervention.priority === p;
                return (
                  <button
                    key={p}
                    onClick={() => onUpdate(intervention.id, { priority: p as InterventionPriority })}
                    className={`py-1.5 text-xs font-bold rounded-lg border text-center transition-all ${
                      isSelected 
                        ? p === 'P0' ? 'bg-slate-950 border-red-500 text-red-500 font-black shadow-lg shadow-red-500/20'
                        : p === 'P1' ? 'bg-red-600/20 border-red-500 text-red-400 font-black'
                        : p === 'P3' ? 'bg-amber-500/20 border-amber-500 text-amber-400 font-black'
                        : 'bg-blue-600/20 border-blue-500 text-blue-400 font-black'
                        : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Attribution */}
        <div className="mb-4">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Équipe attribuée
          </label>
          {isReadOnly ? (
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              {assignedTeam ? (
                <>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: assignedTeam.color }} />
                  {assignedTeam.name}
                </>
              ) : (
                'Aucune équipe attribuée'
              )}
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-black/10 rounded-lg border border-white/5">
              <button
                onClick={() => onUpdate(intervention.id, { assigned_team_id: null })}
                className={`px-2 py-1 text-[10px] font-bold rounded-md border transition-all ${
                  !intervention.assigned_team_id
                    ? 'bg-slate-700 border-slate-500 text-white'
                    : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                Aucune
              </button>
              {teams.map((t) => {
                const isAssigned = intervention.assigned_team_id === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => onUpdate(intervention.id, { assigned_team_id: t.id })}
                    className={`px-2 py-1 text-[10px] font-bold rounded-md border transition-all flex items-center gap-1 ${
                      isAssigned
                        ? 'bg-slate-700 border-slate-500 text-white'
                        : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: t.color }} />
                    {t.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Résoudre / Supprimer */}
        {!isReadOnly && (
          <div className="flex gap-2 border-t border-white/5 pt-4">
            <button
              onClick={() => { onDelete(intervention.id); onClose(); }}
              className="flex-1 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 font-bold py-2 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              Résoudre
            </button>
            <button
              onClick={() => { 
                if (confirm("Voulez-vous supprimer cette intervention ?")) {
                  onDelete(intervention.id); 
                  onClose(); 
                }
              }}
              className="flex-1 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 font-bold py-2 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              Supprimer
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export function MapContainer({ 
  mapUrl, 
  teams, 
  zones, 
  interventions = [],
  mode, 
  onTeamsMove, 
  onTeamDoubleClick,
  onTeamUpdateStatus,
  onTeamUpdateDescription,
  onZoneCreate,
  onZoneUpdate,
  onInterventionAdd,
  onInterventionUpdate,
  onInterventionDelete,
  configuringTeamId,
  setConfiguringTeamId,
  configuringInterventionId,
  setConfiguringInterventionId
}: Readonly<MapContainerProps>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<ReactZoomPanPinchRef>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [showInterventions, setShowInterventions] = useState(true);

  // État de sélection par lasso
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [selectedInterventionIds, setSelectedInterventionIds] = useState<string[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectStart, setSelectStart] = useState<{ x: number, y: number } | null>(null);
  const [selectCurrent, setSelectCurrent] = useState<{ x: number, y: number } | null>(null);

  // État de glissement de groupe/individuel
  const [dragOffset, setDragOffset] = useState<{ dx: number, dy: number } | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);



  // Désélectionner avec la touche Échap et fermer les fenêtres de configuration
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedTeamIds([]);
        setSelectedInterventionIds([]);
        setConfiguringTeamId(null);
        setConfiguringInterventionId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [setConfiguringTeamId, setConfiguringInterventionId]);

  // Nettoyer la sélection si on change de mode (Render-pass reset pattern)
  const [prevMode, setPrevMode] = useState(mode);
  if (mode !== prevMode) {
    setPrevMode(mode);
    setSelectedTeamIds([]);
    setSelectedInterventionIds([]);
  }

  const getRelativeCoords = (e: React.PointerEvent) => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    return { x, y };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (mode === 'edition') {
      if ((e.target as HTMLElement).closest('.zone-action')) return;
      const coords = getRelativeCoords(e);
      if (coords) {
        setIsDrawing(true);
        setDrawStart(coords);
        setDrawCurrent(coords);
      }
      return;
    }

    if (mode === 'deployment' && isLocked) {
      // Ignorer si on clique sur un marqueur
      if ((e.target as HTMLElement).closest('.group\\/outer')) return;

      const coords = getRelativeCoords(e);
      if (coords) {
        setIsSelecting(true);
        setSelectStart(coords);
        setSelectCurrent(coords);
        setSelectedTeamIds([]); // Vider la sélection lors d'un nouveau lasso
        setSelectedInterventionIds([]);
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (mode === 'edition' && isDrawing) {
      const coords = getRelativeCoords(e);
      if (coords) {
        setDrawCurrent(coords);
      }
      return;
    }

    if (mode === 'deployment' && isSelecting && selectStart) {
      const coords = getRelativeCoords(e);
      if (coords) {
        setSelectCurrent(coords);
      }
    }
  };

  const handlePointerUp = (e?: React.PointerEvent) => {
    if (isDrawing && drawStart && drawCurrent) {
      const width = Math.abs(drawCurrent.x - drawStart.x);
      const height = Math.abs(drawCurrent.y - drawStart.y);

      if (width > 1 && height > 1) {
        onZoneCreate({
          name: `Zone ${zones.length + 1}`,
          color: '#3b82f6',
          rotation: 0,
          bounds: {
            x: Math.min(drawStart.x, drawCurrent.x),
            y: Math.min(drawStart.y, drawCurrent.y),
            width,
            height
          }
        });
      }

      setIsDrawing(false);
      setDrawStart(null);
      setDrawCurrent(null);
      return;
    }

    if (isSelecting && selectStart && selectCurrent) {
      const width = Math.abs(selectCurrent.x - selectStart.x);
      const height = Math.abs(selectCurrent.y - selectStart.y);

      if (width < 0.5 && height < 0.5) {
        // Clic simple sur le fond : vide la sélection
        setSelectedTeamIds([]);
        setSelectedInterventionIds([]);
      } else {
        // Rectangle de sélection lasso
        const minX = Math.min(selectStart.x, selectCurrent.x);
        const maxX = Math.max(selectStart.x, selectCurrent.x);
        const minY = Math.min(selectStart.y, selectCurrent.y);
        const maxY = Math.max(selectStart.y, selectCurrent.y);

        const newlySelectedTeams = teams
          .filter(t => t.pos_x >= minX && t.pos_x <= maxX && t.pos_y >= minY && t.pos_y <= maxY)
          .map(t => t.id);

        setSelectedTeamIds(newlySelectedTeams);

        // Simple lasso = juste les équipes. lasso + CTRL = équipe + interventions
        const isCtrl = e ? (e.ctrlKey || e.metaKey) : false;
        if (isCtrl) {
          const newlySelectedInterventions = interventions
            .filter(i => i.pos_x >= minX && i.pos_x <= maxX && i.pos_y >= minY && i.pos_y <= maxY)
            .map(i => i.id);
          setSelectedInterventionIds(newlySelectedInterventions);
        } else {
          setSelectedInterventionIds([]);
        }
      }

      setIsSelecting(false);
      setSelectStart(null);
      setSelectCurrent(null);
    }
  };

  const handleMapDoubleClick = async (e: React.MouseEvent) => {
    if (mode !== 'deployment') return;

    // Ignore double click if on marker or zone element
    if ((e.target as HTMLElement).closest('.nodrag') || (e.target as HTMLElement).closest('.zone-element')) {
      return;
    }

    const coords = getRelativeCoords(e as React.PointerEvent<HTMLDivElement>);
    if (coords && onInterventionAdd) {
      const newInt = await onInterventionAdd("Nouvelle Intervention", "P3", coords.x, coords.y);
      if (newInt) {
        setConfiguringInterventionId(newInt.id);
      }
    }
  };

  // Gestion du drag-and-drop de groupe ou d'unité
  const handleDragStart = (id: string) => {
    setActiveDragId(id);
    setDragOffset({ dx: 0, dy: 0 });
    setConfiguringTeamId(null);
    setConfiguringInterventionId(null);
  };

  const handleDragMove = (_id: string, dx: number, dy: number) => {
    setDragOffset({ dx, dy });
  };

  const handleDragEnd = (id: string, dx: number, dy: number) => {
    const isIntervention = interventions.some(i => i.id === id);
    const isMovedTeamSelected = selectedTeamIds.includes(id);
    const isMovedInterventionSelected = selectedInterventionIds.includes(id);
    const isGroupDrag = isMovedTeamSelected || isMovedInterventionSelected;

    if (isGroupDrag) {
      // 1. Move all selected teams in database
      if (selectedTeamIds.length > 0) {
        const moves = selectedTeamIds.map(tid => {
          const t = teams.find(team => team.id === tid);
          if (!t) return null;
          const newX = Math.max(0, Math.min(100, t.pos_x + dx));
          const newY = Math.max(0, Math.min(100, t.pos_y + dy));
          return { id: tid, x: newX, y: newY };
        }).filter(Boolean) as { id: string; x: number; y: number }[];
        onTeamsMove(moves);
      }

      // 2. Move all selected interventions in database
      if (selectedInterventionIds.length > 0 && onInterventionUpdate) {
        selectedInterventionIds.forEach(iid => {
          const int = interventions.find(i => i.id === iid);
          if (int) {
            const newX = Math.max(0, Math.min(100, int.pos_x + dx));
            const newY = Math.max(0, Math.min(100, int.pos_y + dy));
            onInterventionUpdate(iid, { pos_x: newX, pos_y: newY });
          }
        });
      }

      setActiveDragId(null);
      setDragOffset(null);
      return;
    }

    if (isIntervention && onInterventionUpdate) {
      const int = interventions.find(i => i.id === id);
      if (int) {
        const newX = Math.max(0, Math.min(100, int.pos_x + dx));
        const newY = Math.max(0, Math.min(100, int.pos_y + dy));
        onInterventionUpdate(id, { pos_x: newX, pos_y: newY });
      }
      setActiveDragId(null);
      setDragOffset(null);
      return;
    }

    const t = teams.find(team => team.id === id);
    if (t) {
      const newX = Math.max(0, Math.min(100, t.pos_x + dx));
      const newY = Math.max(0, Math.min(100, t.pos_y + dy));
      onTeamsMove([{ id, x: newX, y: newY }]);
    }

    setActiveDragId(null);
    setDragOffset(null);
  };

  // État local pour le dessin de zone en cours
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number, y: number } | null>(null);
  const [drawCurrent, setDrawCurrent] = useState<{ x: number, y: number } | null>(null);

  if (!mapUrl) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 bg-[#0b0f1a] overflow-hidden">
         <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
         <div className="relative z-10 flex flex-col items-center animate-in fade-in zoom-in duration-700">
            <div className="w-24 h-24 bg-slate-800/50 rounded-3xl flex items-center justify-center mb-6 border border-white/5 backdrop-blur-sm">
                <MapIcon className="w-12 h-12 text-blue-500/50" aria-hidden="true" />
            </div>
            <h2 className="text-xl font-bold text-slate-300 font-display mb-2">Aucun plan chargé</h2>
            <p className="text-slate-500 text-sm max-w-[250px] text-center">
                Uploadez une image de plan depuis le panneau latéral pour commencer la répartition.
            </p>
         </div>
      </div>
    );
  }

  const currentDrawRect = isDrawing && drawStart && drawCurrent ? {
    left: `${Math.min(drawStart.x, drawCurrent.x)}%`,
    top: `${Math.min(drawStart.y, drawCurrent.y)}%`,
    width: `${Math.abs(drawCurrent.x - drawStart.x)}%`,
    height: `${Math.abs(drawCurrent.y - drawStart.y)}%`,
  } : null;

  return (
    <div 
      className={`w-full h-full bg-[#0b0f1a] relative overflow-hidden ${mode === 'edition' ? 'cursor-crosshair' : 'cursor-move'}`}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>
      
       {mode === 'edition' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-amber-600/90 backdrop-blur px-3 py-1.5 md:px-4 md:py-2 rounded-full border border-amber-400/30 text-white text-[10px] md:text-xs font-bold shadow-xl animate-in slide-in-from-top-4 duration-500 flex items-center gap-1.5 whitespace-nowrap">
          <MousePointer2 className="w-3 h-3" />
          <span className="md:hidden">MODE ÉDITION</span>
          <span className="hidden md:inline">MODE ÉDITION : CLIQUEZ ET GLISSEZ POUR DESSINER DES ZONES</span>
        </div>
      )}

      {mode === 'reader' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-slate-800/90 backdrop-blur px-3 py-1.5 md:px-4 md:py-2 rounded-full border border-white/10 text-white text-[10px] md:text-xs font-bold shadow-xl animate-in slide-in-from-top-4 duration-500 flex items-center gap-1.5 whitespace-nowrap">
          <Eye className="w-3.5 h-3.5 text-blue-400" />
          <span className="md:hidden">MODE LECTEUR</span>
          <span className="hidden md:inline">MODE LECTEUR : CONSULTATION UNIQUEMENT (DÉPLACEMENT DES ÉQUIPES BLOQUÉ)</span>
        </div>
      )}

      <TransformWrapper
        ref={transformRef}
        initialScale={1}
        minScale={0.5}
        maxScale={4}
        centerOnInit={true}
        wheel={{ step: 0.005 }}
        disabled={isDrawing || isSelecting} // Désactivé pendant dessin ou sélection lasso
        doubleClick={{ disabled: true }} 
        panning={{ disabled: isLocked, excluded: ['nodrag', 'zone-element'] }} 
        onTransform={(_ref, state) => {
          if (state.scale !== zoomScale) {
            setZoomScale(state.scale);
          }
        }}
      >
        <TransformComponent wrapperClass="!w-full !h-full" contentClass="w-full h-full flex items-center justify-center">
          <div 
            id="map-bounds-container" 
            ref={containerRef} 
            className="relative shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-lg overflow-hidden border border-white/10 select-none"
            onPointerDown={handlePointerDown}
            onDoubleClick={handleMapDoubleClick}
          >
            
            <img 
              src={mapUrl} 
              alt="Map Plan" 
              draggable={false}
              className="max-w-[85vw] max-h-[90vh] object-contain pointer-events-none select-none"
            />

            {/* Rendu des Zones existantes */}
            {zones.map(zone => {
              const { bg, border, borderWidth, borderStyle, borderRadius } = getZoneStyle(zone);

              return mode === 'edition' ? (
                <ZoneElement 
                  key={zone.id} 
                  zone={zone} 
                  onUpdate={onZoneUpdate} 
                />
              ) : (
                <div 
                  key={zone.id}
                  className="absolute pointer-events-none zone-element"
                  style={{
                    left: `${zone.bounds.x}%`,
                    top: `${zone.bounds.y}%`,
                    width: `${zone.bounds.width}%`,
                    height: `${zone.bounds.height}%`,
                    backgroundColor: bg,
                    borderColor: border,
                    borderWidth,
                    borderStyle,
                    borderRadius,
                    opacity: zone.opacity ?? 1,
                    transform: `rotate(${zone.rotation}deg)`,
                    zIndex: 5
                  }}
                >
                  <ZoneContent zone={zone} />
                </div>
              );
            })}

            {/* Rendu du rectangle en cours de dessin de zone */}
            {isDrawing && currentDrawRect && (
              <div 
                className="absolute border-2 border-blue-400 bg-blue-500/20 z-50 pointer-events-none"
                style={currentDrawRect}
              />
            )}

            {/* Rendu de la boîte de sélection lasso */}
            {isSelecting && selectStart && selectCurrent && (
              <div 
                className="absolute border border-dashed border-blue-500 bg-blue-500/10 z-50 pointer-events-none rounded"
                style={{
                  left: `${Math.min(selectStart.x, selectCurrent.x)}%`,
                  top: `${Math.min(selectStart.y, selectCurrent.y)}%`,
                  width: `${Math.abs(selectCurrent.x - selectStart.x)}%`,
                  height: `${Math.abs(selectCurrent.y - selectStart.y)}%`,
                }}
              />
            )}

            {/* SVG Connection lines between teams and interventions */}
            {showInterventions && (mode === 'deployment' || mode === 'reader') && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                {interventions.map((intervention) => {
                  if (intervention.assigned_team_id) {
                    const team = teams.find(t => t.id === intervention.assigned_team_id);
                    if (team) {
                      // Calculate active coordinates taking into account any ongoing drag coordinates
                      let teamX = team.pos_x;
                      let teamY = team.pos_y;
                      if (dragOffset && activeDragId) {
                        const isDragIdSelected = selectedTeamIds.includes(activeDragId) || selectedInterventionIds.includes(activeDragId);
                        const isMoving = team.id === activeDragId || (isDragIdSelected && selectedTeamIds.includes(team.id));
                        if (isMoving) {
                          teamX = Math.max(0, Math.min(100, teamX + dragOffset.dx));
                          teamY = Math.max(0, Math.min(100, teamY + dragOffset.dy));
                        }
                      }

                      let intX = intervention.pos_x;
                      let intY = intervention.pos_y;
                      if (dragOffset && activeDragId) {
                        const isDragIdSelected = selectedTeamIds.includes(activeDragId) || selectedInterventionIds.includes(activeDragId);
                        const isMoving = intervention.id === activeDragId || (isDragIdSelected && selectedInterventionIds.includes(intervention.id));
                        if (isMoving) {
                          intX = Math.max(0, Math.min(100, intX + dragOffset.dx));
                          intY = Math.max(0, Math.min(100, intY + dragOffset.dy));
                        }
                      }

                      return (
                        <line
                          key={`link-${intervention.id}`}
                          x1={`${teamX}%`}
                          y1={`${teamY}%`}
                          x2={`${intX}%`}
                          y2={`${intY}%`}
                          stroke={team.color}
                          strokeWidth="2"
                          strokeDasharray="4 4"
                          className="opacity-70"
                        />
                      );
                    }
                  }
                  return null;
                })}
              </svg>
            )}

            {/* Les marqueurs par-dessus */}
            {(mode === 'deployment' || mode === 'reader') && teams.map(team => {
              let x = team.pos_x;
              let y = team.pos_y;
              
              if (dragOffset && activeDragId) {
                const isDragIdSelected = selectedTeamIds.includes(activeDragId) || selectedInterventionIds.includes(activeDragId);
                const isMoving = team.id === activeDragId || (isDragIdSelected && selectedTeamIds.includes(team.id));
                if (isMoving) {
                  x = Math.max(0, Math.min(100, x + dragOffset.dx));
                  y = Math.max(0, Math.min(100, y + dragOffset.dy));
                }
              }

              return (
                <TeamMarker 
                  key={team.id} 
                  team={{ ...team, pos_x: x, pos_y: y }} 
                  isDraggable={mode === 'deployment'}
                  zoomScale={zoomScale}
                  isSelected={selectedTeamIds.includes(team.id)}
                  mode={mode}
                  onDoubleClick={() => onTeamDoubleClick(team.id, team.status)} 
                  onDragStart={handleDragStart}
                  onDragMove={handleDragMove}
                  onDragEnd={handleDragEnd}
                  onConfigure={() => setConfiguringTeamId(team.id)}
                />
              );
            })}

            {/* Interventions Markers */}
            {showInterventions && (mode === 'deployment' || mode === 'reader') && interventions.map(intervention => {
              let x = intervention.pos_x;
              let y = intervention.pos_y;
              
              if (dragOffset && activeDragId) {
                const isDragIdSelected = selectedTeamIds.includes(activeDragId) || selectedInterventionIds.includes(activeDragId);
                const isMoving = intervention.id === activeDragId || (isDragIdSelected && selectedInterventionIds.includes(intervention.id));
                if (isMoving) {
                  x = Math.max(0, Math.min(100, x + dragOffset.dx));
                  y = Math.max(0, Math.min(100, y + dragOffset.dy));
                }
              }

              return (
                <InterventionMarker
                  key={intervention.id}
                  intervention={{ ...intervention, pos_x: x, pos_y: y }}
                  teams={teams}
                  isDraggable={mode === 'deployment'}
                  zoomScale={zoomScale}
                  mode={mode}
                  onDragStart={handleDragStart}
                  onDragMove={handleDragMove}
                  onDragEnd={handleDragEnd}
                  onConfigure={() => setConfiguringInterventionId(intervention.id)}
                  isSelected={selectedInterventionIds.includes(intervention.id)}
                />
              );
            })}

          </div>
        </TransformComponent>
      </TransformWrapper>

      {/* FLOATING CONTROLS */}
      <div className="absolute bottom-4 right-4 z-50 flex flex-col gap-2 bg-slate-900/80 backdrop-blur-md p-2 rounded-2xl border border-white/10 shadow-2xl">
        <button
          type="button"
          onClick={() => transformRef.current?.zoomIn()}
          className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 hover:text-white transition-colors border border-white/5"
          title="Zoomer"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => transformRef.current?.zoomOut()}
          className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 hover:text-white transition-colors border border-white/5"
          title="Dézoomer"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => transformRef.current?.resetTransform()}
          className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 hover:text-white transition-colors border border-white/5"
          title="Réinitialiser la vue"
        >
          <Maximize className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => setShowInterventions(prev => !prev)}
          className={`p-2.5 rounded-xl transition-all border ${
            showInterventions
              ? 'bg-white/5 border-white/5 text-slate-300 hover:text-white hover:bg-white/10'
              : 'bg-red-500/20 border-red-500/30 text-red-400'
          }`}
          title={showInterventions ? "Masquer les interventions" : "Afficher les interventions"}
        >
          {showInterventions ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
        </button>
        <div className="h-px bg-white/10 my-1" />
        <button
          type="button"
          onClick={() => setIsLocked(prev => !prev)}
          className={`p-2.5 rounded-xl transition-all border ${
            isLocked
              ? 'bg-red-500/20 border-red-500/30 text-red-400'
              : 'bg-white/5 border-white/5 text-slate-300 hover:text-white hover:bg-white/10'
          }`}
          title={isLocked ? "Déverrouiller le déplacement" : "Verrouiller le déplacement"}
        >
          {isLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
        </button>
      </div>

      {/* Viewport-independent overlay modals */}
      {configuringTeamId && (() => {
        const teamObj = teams.find(t => t.id === configuringTeamId);
        if (!teamObj) return null;
        return (
          <TeamConfigModal
            team={teamObj}
            mode={mode}
            onClose={() => setConfiguringTeamId(null)}
            onUpdateStatus={onTeamUpdateStatus}
            onUpdateDescription={onTeamUpdateDescription}
            onTeamsMove={onTeamsMove}
          />
        );
      })()}

      {configuringInterventionId && (() => {
        const intObj = interventions.find(i => i.id === configuringInterventionId);
        if (!intObj) return null;
        return (
          <InterventionConfigModal
            intervention={intObj}
            teams={teams}
            mode={mode}
            onClose={() => setConfiguringInterventionId(null)}
            onUpdate={onInterventionUpdate!}
            onDelete={onInterventionDelete!}
          />
        );
      })()}
    </div>
  );
}
