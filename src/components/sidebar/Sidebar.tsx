import { useState, useMemo, memo, useRef, useEffect } from 'react';
import type { Team, TeamStatus, Zone } from '../../types';
import { supabase } from '../../lib/supabase';
import { parseZoneType } from '../../lib/utils';
import { Trash2, AlertTriangle, Coffee, Play, UploadCloud, FileText, Layout, Type, BriefcaseMedical, Hospital, LogIn, Music, Shield, Utensils, SlidersHorizontal, RotateCcw, Navigation, Clock, X, PlusCircle } from 'lucide-react';
import { ColorPicker } from './ColorPicker';
import { ConfirmDialog } from '../ui/ConfirmDialog';

interface TeamRowProps {
  team: Team;
  onUpdateStatus: (id: string, status: TeamStatus) => void;
  onUpdateColor: (id: string, color: string) => void;
  onUpdateName: (id: string, name: string) => void;
  onUpdateDescription: (id: string, description: string | null) => void;
  setTeamToDelete: (team: Team) => void;
  isCompact?: boolean;
  isReadOnly?: boolean;
  onTeamsMove?: (moves: { id: string; x: number; y: number }[]) => void;
}

const TeamRow = memo(function TeamRow({
  team,
  onUpdateStatus,
  onUpdateColor,
  onUpdateName,
  onUpdateDescription,
  setTeamToDelete,
  isCompact = false,
  isReadOnly = false,
  onTeamsMove
}: Readonly<TeamRowProps>) {
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(team.description ?? '');
  const [initialDescription, setInitialDescription] = useState(team.description ?? '');
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);

  // Close context menu on external click
  useEffect(() => {
    if (!contextMenuPos) return;
    const closeMenu = () => setContextMenuPos(null);
    document.addEventListener('click', closeMenu);
    return () => document.removeEventListener('click', closeMenu);
  }, [contextMenuPos]);

  const handleContextMenu = (e: React.MouseEvent) => {
    if (isReadOnly) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setContextMenuPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleResetPosition = () => {
    if (!onTeamsMove) return;
    if (confirm(`Voulez-vous replacer l'unité "${team.name}" au centre de la carte ?`)) {
      onTeamsMove([{ id: team.id, x: 50, y: 50 }]);
    }
  };

  const btnPadding = isCompact ? 'p-1 rounded' : 'p-1.5 rounded-md';
  const iconClassName = isCompact ? 'w-3.5 h-3.5' : 'w-4 h-4';

  let noteButtonClassName = `text-slate-500 hover:bg-white/5 hover:text-slate-300 ${btnPadding}`;
  if (isEditing) {
    noteButtonClassName = `bg-blue-600 text-white shadow-lg shadow-blue-500/20 ${btnPadding}`;
  } else if (team.description) {
    noteButtonClassName = `text-blue-400 hover:bg-white/5 ${btnPadding}`;
  }

  const handleSave = () => {
    const currentDbVal = team.description ?? '';
    if (currentDbVal !== initialDescription) {
      const force = globalThis.confirm(
        "Attention : Cette note a été modifiée par un autre utilisateur en arrière-plan.\n" +
        "Voulez-vous forcer l'enregistrement et écraser ses modifications ?"
      );
      if (!force) {
        setDescription(currentDbVal);
        setInitialDescription(currentDbVal);
        setIsEditing(false);
        return;
      }
    }
    onUpdateDescription(team.id, description.trim() || null);
    setIsEditing(false);
  };

  return (
    <div 
      onContextMenu={handleContextMenu}
      className={`flex flex-col ${isCompact ? 'gap-1 p-1.5 rounded-lg' : 'gap-1.5 p-2 rounded-xl'} glass-card group/team relative focus-within:z-[60] hover:z-[60] transition-all`}
    >
      <div className={`flex items-center ${isCompact ? 'gap-1.5' : 'gap-3'} w-full`}>
        <div className={`shrink-0 ${isCompact ? 'w-5 h-5' : 'w-6 h-6'} flex items-center justify-center`}>
          {isReadOnly ? (
            <div 
              className="w-5 h-5 rounded-full border border-white/20 shadow-sm" 
              style={{ backgroundColor: team.color, boxShadow: `0 0 12px ${team.color}66` }}
            />
          ) : (
            <ColorPicker color={team.color} onChange={(c) => onUpdateColor(team.id, c)} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          {isReadOnly ? (
            <span 
              className={`w-full text-slate-200 font-semibold font-display truncate block p-0 ${isCompact ? 'text-xs' : 'text-sm'}`}
              title={team.name}
            >
              {team.name}
            </span>
          ) : (
            <input
              type="text"
              value={team.name}
              onChange={(e) => onUpdateName(team.id, e.target.value)}
              className={`w-full bg-transparent border-none focus:ring-0 ${isCompact ? 'text-xs' : 'text-sm'} font-semibold text-slate-200 font-display p-0`}
              title={team.name}
            />
          )}
        </div>
        
        {isReadOnly ? (
          <div className="shrink-0 text-[10px] px-2.5 py-1 rounded-lg bg-black/30 border border-white/5 text-slate-400 font-semibold font-display flex items-center gap-1.5">
            {team.status === 'intervention' && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-red-400 font-black">Intervention</span>
              </>
            )}
            {team.status === 'en_route' && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span className="text-blue-400 font-black">En route</span>
              </>
            )}
            {team.status === 'pause' && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span className="text-amber-500 font-black">Pause</span>
              </>
            )}
            {team.status === 'dispo' && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-emerald-400 font-black">Disponible</span>
              </>
            )}
          </div>
        ) : (
          <div className={`flex items-center gap-0.5 shrink-0 bg-black/20 rounded-lg ${isCompact ? 'p-0.5' : 'p-1'} border border-white/5`}>
            <button 
              type="button"
              onClick={() => onUpdateStatus(team.id, 'dispo')}
              className={`${btnPadding} transition-all ${team.status === 'dispo' ? 'bg-slate-700 text-white shadow-inner' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'}`}
              aria-label="Marquer comme disponible"
            >
              <Play className={iconClassName} aria-hidden="true" />
            </button>
            <button 
              type="button"
              onClick={() => onUpdateStatus(team.id, 'en_route')}
              className={`${btnPadding} transition-all ${team.status === 'en_route' ? 'bg-blue-600 text-white shadow-inner' : 'text-slate-500 hover:bg-white/5 hover:text-blue-400'}`}
              aria-label="Marquer en route"
            >
              <Navigation className={iconClassName} aria-hidden="true" />
            </button>
            <button 
              type="button"
              onClick={() => onUpdateStatus(team.id, 'intervention')}
              className={`${btnPadding} transition-all ${team.status === 'intervention' ? 'bg-red-500 text-white shadow-lg shadow-red-500/40 animate-pulse' : 'text-slate-500 hover:bg-white/5 hover:text-red-400'}`}
              aria-label="Marquer en intervention"
            >
              <AlertTriangle className={iconClassName} aria-hidden="true" />
            </button>
            <button 
              type="button"
              onClick={() => onUpdateStatus(team.id, 'pause')}
              className={`${btnPadding} transition-all ${team.status === 'pause' ? 'bg-amber-600 text-white shadow-inner' : 'text-slate-500 hover:bg-white/5 hover:text-amber-400'}`}
              aria-label="Marquer en pause"
            >
              <Coffee className={iconClassName} aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Note button */}
        <button
          type="button"
          onClick={() => {
            if (!isEditing) {
              setDescription(team.description ?? '');
              setInitialDescription(team.description ?? '');
            }
            setIsEditing(!isEditing);
          }}
          className={noteButtonClassName}
          title={team.description ? "Voir/Modifier la note" : "Ajouter une note"}
        >
          <FileText className={iconClassName} aria-hidden="true" />
        </button>

        {!isReadOnly && onTeamsMove && (
          <button 
            type="button"
            onClick={handleResetPosition} 
            className={`${btnPadding} text-slate-600 hover:text-blue-400 hover:bg-blue-400/10 rounded-md transition-all opacity-0 group-hover/team:opacity-100 shrink-0 cursor-pointer`} 
            title="Recentrer l'unité"
            aria-label="Recentrer l'unité"
          >
            <RotateCcw className={iconClassName} aria-hidden="true" />
          </button>
        )}

        {!isReadOnly && (
          <button 
            type="button"
            onClick={() => setTeamToDelete(team)} 
            className={`${btnPadding} text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-all opacity-0 group-hover/team:opacity-100 shrink-0 mr-1`} 
            aria-label="Supprimer l'équipe"
          >
            <Trash2 className={iconClassName} aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Expandable description editor */}
      {isEditing && (
        <div className="mt-1.5 p-3 bg-black/40 rounded-xl border border-white/5 flex flex-col gap-2 animate-in slide-in-from-top-2 duration-200">
          <div className="flex justify-between items-center">
            <label htmlFor={`note-${team.id}`} className="text-[10px] uppercase tracking-wider text-slate-500 font-bold font-display">
              Note de l'unité
            </label>
            {!isReadOnly && (team.description ?? '') !== initialDescription && (
              <span className="text-[10px] text-amber-400 font-semibold animate-pulse">
                ⚠️ Modifiée en arrière-plan
              </span>
            )}
          </div>
          {isReadOnly ? (
            <div className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed py-1">
              {team.description || <span className="italic text-slate-600">Aucune note pour cette unité</span>}
            </div>
          ) : (
            <>
              <textarea
                id={`note-${team.id}`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Membres, matériel, consignes..."
                className="bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/30 min-h-[60px] resize-y"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-2.5 py-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-3 py-1 text-[11px] bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-md transition-colors shadow-md shadow-blue-500/10"
                >
                  Enregistrer
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Right-click Custom Context Menu */}
      {contextMenuPos && (
        <div 
          className="absolute bg-slate-950/95 border border-white/10 rounded-xl py-1 shadow-2xl z-[100] w-40 text-left font-display animate-in fade-in duration-100"
          style={{ left: contextMenuPos.x, top: contextMenuPos.y }}
          onPointerDown={(e) => e.stopPropagation()} // Stop propagation to avoid drag trigger
        >
          <div className="px-3 py-1 text-[9px] font-bold text-slate-500 uppercase tracking-wider border-b border-white/5 mb-1">
            Changer statut
          </div>
          <button 
            onClick={() => { onUpdateStatus(team.id, 'dispo'); setContextMenuPos(null); }}
            className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-emerald-500/20 hover:text-emerald-400 font-semibold flex items-center gap-2"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            Disponible
          </button>
          <button 
            onClick={() => { onUpdateStatus(team.id, 'en_route'); setContextMenuPos(null); }}
            className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-blue-500/20 hover:text-blue-400 font-semibold flex items-center gap-2"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            En direction
          </button>
          <button 
            onClick={() => { onUpdateStatus(team.id, 'intervention'); setContextMenuPos(null); }}
            className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-red-500/20 hover:text-red-400 font-semibold flex items-center gap-2"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            Intervention
          </button>
          <button 
            onClick={() => { onUpdateStatus(team.id, 'pause'); setContextMenuPos(null); }}
            className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-amber-500/20 hover:text-amber-400 font-semibold flex items-center gap-2"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            En pause
          </button>
        </div>
      )}
    </div>
  );
});

import type { Intervention } from '../../types';

interface SidebarProps {
  teams: Team[];
  onAddTeam: (name: string, color: string) => Promise<void>;
  onUpdateStatus: (id: string, status: TeamStatus) => void;
  onUpdateColor: (id: string, color: string) => void;
  onUpdateName: (id: string, name: string) => void;
  onDeleteTeam: (id: string) => void;
  onMapUpload: (url: string | null) => void;
  zones: Zone[];
  interventions?: Intervention[];
  mode: 'reader' | 'deployment' | 'edition';
  onDeleteZone: (id: string) => void;
  onUpdateZone: (id: string, updates: Partial<Zone>) => void;
  onUpdateDescription: (id: string, description: string | null) => void;
  onAddZone: (zone: Omit<Zone, 'id' | 'map_id' | 'created_at'>) => void;
  onTeamsMove?: (moves: { id: string; x: number; y: number }[]) => void;
  onAddIntervention?: (description: string, priority: string, posX?: number, posY?: number) => Promise<Intervention | null>;
  onUpdateIntervention?: (id: string, updates: Partial<Intervention>) => Promise<void>;
  onDeleteIntervention?: (id: string) => Promise<void>;
  onFlushInterventions?: () => Promise<void>;
}

export const Sidebar = memo(function Sidebar({ 
  teams, 
  onAddTeam, 
  onUpdateStatus, 
  onUpdateColor, 
  onUpdateName,
  onDeleteTeam, 
  onMapUpload,
  zones,
  interventions = [],
  mode,
  onDeleteZone,
  onUpdateZone,
  onUpdateDescription,
  onAddZone,
  onTeamsMove,
  onAddIntervention,
  onDeleteIntervention,
  onFlushInterventions
}: Readonly<SidebarProps>) {
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#3b82f6');
  const [uploading, setUploading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 15000);
    return () => clearInterval(interval);
  }, []);

  const [isCompact, setIsCompact] = useState(() => {
    try {
      return localStorage.getItem('squad_map_sidebar_compact') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('squad_map_sidebar_compact', String(isCompact));
    } catch (err) {
      console.error(err);
    }
  }, [isCompact]);

  const inputRef = useRef<HTMLInputElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedSuggestionIndex, setFocusedSuggestionIndex] = useState(-1);
  const [hasUserEdited, setHasUserEdited] = useState(false);

  // Alphabet phonétique international (NATO)
  const PHONETIC_ALPHABET = useMemo(() => [
    'Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel', 'India', 'Juliett',
    'Kilo', 'Lima', 'Mike', 'November', 'Oscar', 'Papa', 'Quebec', 'Romeo', 'Sierra', 'Tango',
    'Uniform', 'Victor', 'Whiskey', 'X-ray', 'Yankee', 'Zulu'
  ], []);

  // Équipes volantes par défaut
  const VOLANTES = useMemo(() => [
    'Volante 1', 'Volante 2', 'Volante 3', 'Volante 4', 'Volante 5'
  ], []);

  // Génération dynamique du pool de suggestions basé sur les équipes existantes
  const suggestionsPool = useMemo(() => {
    const existingNames = new Set(teams.map(t => t.name.trim().toLowerCase()));
    const pool: string[] = [];

    // Noms phonétiques (avec incrémentation si déjà pris)
    for (const base of PHONETIC_ALPHABET) {
      if (existingNames.has(base.toLowerCase())) {
        let num = 2;
        while (existingNames.has(`${base.toLowerCase()} ${num}`)) {
          num++;
        }
        pool.push(`${base} ${num}`);
      } else {
        pool.push(base);
      }
    }

    // Volantes (avec incrémentation si déjà prises)
    for (const v of VOLANTES) {
      if (!existingNames.has(v.toLowerCase())) {
        pool.push(v);
      }
    }

    let vNum = 1;
    while (existingNames.has(`volante ${vNum}`)) {
      vNum++;
    }
    if (vNum > 5) {
      pool.push(`Volante ${vNum}`);
    }

    return pool;
  }, [teams, PHONETIC_ALPHABET, VOLANTES]);

  const nextDefaultSuggestion = useMemo(() => {
    return suggestionsPool[0] || '';
  }, [suggestionsPool]);

  // Pré-remplit automatiquement le champ lorsqu'il n'a pas été modifié par l'utilisateur
  useEffect(() => {
    if (!hasUserEdited) {
      setNewName(nextDefaultSuggestion);
    }
  }, [nextDefaultSuggestion, hasUserEdited]);

  const filteredSuggestions = useMemo(() => {
    const cleanInput = newName.trim().toLowerCase();
    if (!cleanInput) {
      return suggestionsPool.slice(0, 5);
    }
    const startsWith = suggestionsPool.filter(name => 
      name.toLowerCase().startsWith(cleanInput)
    );
    const contains = suggestionsPool.filter(name => 
      !name.toLowerCase().startsWith(cleanInput) && name.toLowerCase().includes(cleanInput)
    );
    return [...startsWith, ...contains].slice(0, 6);
  }, [newName, suggestionsPool]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
    setShowSuggestions(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || filteredSuggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedSuggestionIndex(prev => (prev + 1) % filteredSuggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedSuggestionIndex(prev => (prev - 1 + filteredSuggestions.length) % filteredSuggestions.length);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      if (focusedSuggestionIndex >= 0 && focusedSuggestionIndex < filteredSuggestions.length) {
        e.preventDefault();
        const selected = filteredSuggestions[focusedSuggestionIndex];
        setNewName(selected);
        setShowSuggestions(false);
        setFocusedSuggestionIndex(-1);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setFocusedSuggestionIndex(-1);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setNewName(suggestion);
    setHasUserEdited(true);
    setShowSuggestions(false);
    setFocusedSuggestionIndex(-1);
    inputRef.current?.focus();
  };

  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  const [zoneToDelete, setZoneToDelete] = useState<Zone | null>(null);
  const [activeZoneConfigId, setActiveZoneConfigId] = useState<string | null>(null);

  const handleAddSpecialElement = (type: string, defaultName: string) => {
    const isText = type === 'text';
    const isStage = type === 'infra_stage';
    
    // Dimensions par défaut adaptées
    let width = 7;
    let height = 7;
    if (isText) {
      width = 16;
      height = 6;
    } else if (isStage) {
      width = 14;
      height = 10;
    }

    // Palette de couleurs intelligentes par type
    let color = '#3b82f6'; // bleu par défaut
    if (type === 'infra_first_aid' || type === 'infra_hospital') {
      color = '#ef4444'; // rouge pour la santé
    } else if (type === 'infra_security') {
      color = '#f59e0b'; // orange pour la sécurité
    } else if (type === 'infra_entrance') {
      color = '#10b981'; // vert pour les entrées
    } else if (type === 'text') {
      color = '#ffffff'; // blanc pour le texte
    }

    onAddZone({
      name: `${defaultName} ${zones.filter(z => z.type?.split(':')[0] === type).length + 1}`,
      color,
      rotation: 0,
      type,
      bounds: {
        x: 50 - width / 2,
        y: 50 - height / 2,
        width,
        height
      }
    });
  };

  const sortedTeams = useMemo(() => {
    return [...teams].sort((a, b) => a.name.localeCompare(b.name));
  }, [teams]);

  const sortedZones = useMemo(() => {
    return [...zones].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [zones]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newName.trim();
    if (!cleanName || isAdding) return;

    if (teams.some(t => t.name.toLowerCase() === cleanName.toLowerCase())) {
      alert(`Impossible de créer l'unité : Le nom "${cleanName}" existe déjà sur la carte.`);
      return;
    }

    setIsAdding(true);
    try {
      await onAddTeam(cleanName, newColor);
      setNewName('');
      setHasUserEdited(false);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la création de l'unité.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `plans/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('maps')
      .upload(filePath, file);

    if (uploadError) {
      console.error(uploadError);
      alert("Erreur lors de l'upload de l'image");
    } else {
      const { data } = supabase.storage.from('maps').getPublicUrl(filePath);
      onMapUpload(data.publicUrl);
    }
    setUploading(false);
  };

  return (
    <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-8 custom-scrollbar">
      
      {/* Upload Carte - Uniquement disponible en mode édition ("Plan") */}
      {mode === 'edition' && (
        <div className="glass-card p-1 rounded-2xl overflow-hidden shrink-0">
          <label className="flex items-center justify-center gap-3 cursor-pointer bg-white/5 hover:bg-white/10 transition-all duration-300 py-3 rounded-xl text-sm font-semibold text-slate-300 group">
             <UploadCloud className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" aria-hidden="true" />
             {uploading ? 'Upload en cours…' : 'Changer le plan'}
             <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading}/>
          </label>
        </div>
      )}

      {/* Ajout Équipe - Uniquement en mode déploiement */}
      {mode === 'deployment' && (
        <form onSubmit={handleAdd} className="flex flex-col gap-3 glass-card p-4 rounded-2xl relative focus-within:z-[60] hover:z-[60] transition-all">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 font-display">Nouvelle Équipe</div>
          <div className="relative">
            <input 
              ref={inputRef}
              type="text" 
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                setHasUserEdited(true);
                setShowSuggestions(true);
                setFocusedSuggestionIndex(-1);
              }}
              onFocus={handleFocus}
              onBlur={() => {
                setTimeout(() => setShowSuggestions(false), 200);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ex: Unité Alpha…" 
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
            />
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 backdrop-blur-md bg-slate-950/90 border border-white/10 rounded-xl overflow-hidden shadow-2xl z-[70] max-h-48 overflow-y-auto flex flex-col divide-y divide-white/5 animate-in fade-in duration-200">
                {filteredSuggestions.map((suggestion, index) => (
                  <button
                    key={suggestion}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSuggestionClick(suggestion);
                    }}
                    onMouseEnter={() => setFocusedSuggestionIndex(index)}
                    className={`px-4 py-2.5 text-left text-xs transition-colors flex justify-between items-center ${
                      index === focusedSuggestionIndex 
                        ? 'bg-blue-600 text-white font-semibold' 
                        : 'text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <span>{suggestion}</span>
                    <span className={`text-[9px] uppercase tracking-wider font-bold ${
                      index === focusedSuggestionIndex ? 'text-blue-200' : 'text-slate-500'
                    }`}>
                      {suggestion.includes('Volante') ? 'Mobile' : 'Phonétique'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2 relative focus-within:z-[60]">
            <div className="h-10 w-[20%] bg-white/5 border border-white/10 rounded-xl flex items-center justify-center shrink-0">
              <ColorPicker color={newColor} onChange={setNewColor} />
            </div>
            <button 
              type="submit" 
              disabled={isAdding}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 transition-all rounded-xl text-sm text-white font-bold shadow-lg shadow-blue-500/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAdding ? 'Ajout…' : "Ajouter l'Unité"}
            </button>
          </div>
        </form>
      )}

      {/* Mode Édition - Liste des Zones */}
      {mode === 'edition' && (
        <div className="flex flex-col gap-6">
          
          {/* Palette d'Ajout d'Éléments */}
          <div className="flex flex-col gap-3 glass-card p-4 rounded-2xl">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-500 mb-1 font-display">
              Ajouter sur la carte
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleAddSpecialElement('zone', 'Zone')}
                className="flex items-center justify-center gap-2 bg-white/5 hover:bg-amber-600/20 hover:text-amber-400 p-2.5 rounded-xl text-xs font-semibold text-slate-300 transition-colors border border-white/5"
              >
                <Layout className="w-3.5 h-3.5" />
                Zone
              </button>
              <button
                type="button"
                onClick={() => handleAddSpecialElement('text', 'Texte')}
                className="flex items-center justify-center gap-2 bg-white/5 hover:bg-amber-600/20 hover:text-amber-400 p-2.5 rounded-xl text-xs font-semibold text-slate-300 transition-colors border border-white/5"
              >
                <Type className="w-3.5 h-3.5" />
                Texte
              </button>
              <button
                type="button"
                onClick={() => handleAddSpecialElement('infra_first_aid', 'Secours')}
                className="flex items-center justify-center gap-2 bg-white/5 hover:bg-amber-600/20 hover:text-amber-400 p-2.5 rounded-xl text-xs font-semibold text-slate-300 transition-colors border border-white/5"
              >
                <BriefcaseMedical className="w-3.5 h-3.5" />
                Soin
              </button>
              <button
                type="button"
                onClick={() => handleAddSpecialElement('infra_hospital', 'Hôpital')}
                className="flex items-center justify-center gap-2 bg-white/5 hover:bg-amber-600/20 hover:text-amber-400 p-2.5 rounded-xl text-xs font-semibold text-slate-300 transition-colors border border-white/5"
              >
                <Hospital className="w-3.5 h-3.5" />
                Clinique
              </button>
              <button
                type="button"
                onClick={() => handleAddSpecialElement('infra_entrance', 'Entrée')}
                className="flex items-center justify-center gap-2 bg-white/5 hover:bg-amber-600/20 hover:text-amber-400 p-2.5 rounded-xl text-xs font-semibold text-slate-300 transition-colors border border-white/5"
              >
                <LogIn className="w-3.5 h-3.5" />
                Entrée
              </button>
              <button
                type="button"
                onClick={() => handleAddSpecialElement('infra_stage', 'Scène')}
                className="flex items-center justify-center gap-2 bg-white/5 hover:bg-amber-600/20 hover:text-amber-400 p-2.5 rounded-xl text-xs font-semibold text-slate-300 transition-colors border border-white/5"
              >
                <Music className="w-3.5 h-3.5" />
                Scène
              </button>
              <button
                type="button"
                onClick={() => handleAddSpecialElement('infra_security', 'Sécurité')}
                className="flex items-center justify-center gap-2 bg-white/5 hover:bg-amber-600/20 hover:text-amber-400 p-2.5 rounded-xl text-xs font-semibold text-slate-300 transition-colors border border-white/5"
              >
                <Shield className="w-3.5 h-3.5" />
                Sécurité
              </button>
              <button
                type="button"
                onClick={() => handleAddSpecialElement('infra_catering', 'Catering')}
                className="flex items-center justify-center gap-2 bg-white/5 hover:bg-amber-600/20 hover:text-amber-400 p-2.5 rounded-xl text-xs font-semibold text-slate-300 transition-colors border border-white/5"
              >
                <Utensils className="w-3.5 h-3.5" />
                Catering
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-500 mb-1 flex justify-between items-center font-display">
              <span>Éléments du plan ({zones.length})</span>
            </div>
            {zones.length === 0 && (
              <div className="p-8 text-center glass-card rounded-2xl border-dashed border-2 border-white/5">
                <p className="text-slate-500 text-xs italic">Dessinez sur la carte ou utilisez les boutons ci-dessus pour ajouter des éléments</p>
              </div>
            )}
          {sortedZones.map(zone => {
            const isConfigActive = activeZoneConfigId === zone.id;
            
            let placeholderText = "Nom de la zone...";
            if (zone.type === 'text') {
              placeholderText = "Saisir le texte à afficher...";
            } else if (zone.type?.startsWith('infra_')) {
              placeholderText = "Libellé de l'élément...";
            }
            
            return (
              <div key={zone.id} className="flex flex-col gap-1.5 glass-card p-2.5 rounded-xl group/zone relative transition-all">
                <div className="flex items-center gap-3 w-full">
                  <div className="shrink-0 w-6 h-6 flex items-center justify-center">
                    <ColorPicker 
                      color={zone.color} 
                      onChange={(newColor) => onUpdateZone(zone.id, { color: newColor })} 
                      className="w-6 h-6" 
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={zone.name || ''}
                      onChange={(e) => onUpdateZone(zone.id, { name: e.target.value })}
                      placeholder={placeholderText}
                      className="w-full bg-transparent border-none focus:ring-0 text-sm font-semibold text-slate-200 font-display p-0"
                    />
                  </div>

                  <div className="flex items-center gap-1 shrink-0 bg-black/20 rounded-lg p-1 border border-white/5">
                    <button
                      type="button"
                      onClick={() => setActiveZoneConfigId(isConfigActive ? null : zone.id)}
                      className={`p-1.5 rounded-md transition-all ${
                        isConfigActive 
                          ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20' 
                          : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'
                      }`}
                      title="Configurer l'élément"
                    >
                      <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
                    </button>
                    
                    <button 
                      type="button"
                      onClick={() => setZoneToDelete(zone)} 
                      className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-all opacity-0 group-hover/zone:opacity-100" 
                      aria-label="Supprimer la zone"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Configuration Panel */}
                {isConfigActive && (
                  <div className="mt-1.5 p-3 bg-black/40 rounded-xl border border-white/5 flex flex-col gap-3 animate-in slide-in-from-top-2 duration-200">
                    
                    {/* Size slider (only for text zones) */}
                    {zone.type === 'text' && (
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-[10px] uppercase tracking-wider text-slate-500 font-bold font-display">
                          <span>Taille du texte</span>
                          <span className="text-slate-300 font-semibold">{zone.font_size ?? 14}px</span>
                        </div>
                        <input
                          type="range"
                          min="8"
                          max="48"
                          value={zone.font_size ?? 14}
                          onChange={(e) => onUpdateZone(zone.id, { font_size: Number.parseInt(e.target.value, 10) })}
                          className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                        />
                      </div>
                    )}

                    {/* Opacity slider */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-[10px] uppercase tracking-wider text-slate-500 font-bold font-display">
                        <span>Opacité</span>
                        <span className="text-slate-300 font-semibold">{Math.round((zone.opacity ?? 1) * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        step="5"
                        value={Math.round((zone.opacity ?? 1) * 100)}
                        onChange={(e) => onUpdateZone(zone.id, { opacity: Number.parseFloat(e.target.value) / 100 })}
                        className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                      />
                    </div>

                    {/* Visual format selector (only for infra elements) */}
                    {zone.type?.startsWith('infra_') && (
                      <div className="flex flex-col gap-3 border-t border-white/5 pt-2.5 mt-0.5">
                        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold font-display">
                          Format d'affichage
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 mt-0.5">
                          {[
                            { id: 'clean', label: 'Épuré (sans fond)' },
                            { id: 'transparent', label: 'Transparent' },
                            { id: 'solid', label: 'Plaque Solide' },
                            { id: 'circle', label: 'Macaron' }
                          ].map(opt => {
                            const { baseType, format, bgCol } = parseZoneType(zone.type);
                            const isActive = format === opt.id;
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => {
                                  const newType = bgCol ? `${baseType}:${opt.id}:${bgCol}` : `${baseType}:${opt.id}`;
                                  onUpdateZone(zone.id, { type: newType });
                                }}
                                className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                                  isActive 
                                    ? 'bg-amber-600 border-amber-500 text-white shadow-md shadow-amber-500/20' 
                                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>

                        {/* Background color picker (hidden for clean format) */}
                        {(() => {
                          const { baseType, format, bgCol } = parseZoneType(zone.type);
                          if (format === 'clean') return null;
                          return (
                            <div className="flex items-center justify-between gap-3 mt-1 bg-black/20 p-2 rounded-xl border border-white/5">
                              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold font-display">
                                Couleur de fond
                              </span>
                              <div className="shrink-0 w-8 h-8 flex items-center justify-center bg-black/45 rounded-lg border border-white/10 relative z-[60]">
                                <ColorPicker 
                                  color={bgCol || '#090d16'} 
                                  onChange={(newBg) => {
                                    onUpdateZone(zone.id, { type: `${baseType}:${format}:${newBg}` });
                                  }}
                                  className="w-6 h-6" 
                                />
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Section Administration des Interventions */}
        <div className="flex flex-col gap-3 glass-card p-4 rounded-2xl border border-red-500/10 bg-red-950/5 mt-4">
          <div className="text-xs font-bold uppercase tracking-wider text-red-400 mb-1 font-display">
            Administration des Interventions
          </div>
          <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
            Cette action supprimera définitivement tout l'historique des interventions et réinitialisera le compteur à 0.
          </p>
          {onFlushInterventions && (
            <button
              type="button"
              onClick={() => {
                if (confirm("⚠️ ATTENTION : Voulez-vous vraiment supprimer toutes les interventions et réinitialiser le compteur ? Cette action est irréversible.")) {
                  onFlushInterventions();
                }
              }}
              className="flex items-center justify-center gap-2 bg-red-950/20 hover:bg-red-600 hover:text-white border border-red-500/20 p-2.5 rounded-xl text-xs font-bold text-red-400 transition-all cursor-pointer shadow-sm shadow-red-950/30"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Vider l'historique des interventions
            </button>
          )}
        </div>
      </div>
      )}

      {/* Liste Équipes - Visible en mode déploiement ou en mode lecteur */}
      {(mode === 'deployment' || mode === 'reader') && (
        <div className="flex flex-col gap-3">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 flex justify-between items-center font-display w-full">
          <span>Unités sur le terrain ({teams.length})</span>
          <div className="flex gap-1.5 items-center">
            <button
              type="button"
              onClick={() => setIsCompact(prev => !prev)}
              className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold transition-all ${
                isCompact 
                  ? 'bg-blue-600/20 border-blue-500/30 text-blue-400' 
                  : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
              }`}
            >
              {isCompact ? 'Mode normal' : 'Mode compact'}
            </button>
          </div>
        </div>
        {sortedTeams.map(team => (
           <TeamRow 
             key={team.id}
             team={team}
             onUpdateStatus={onUpdateStatus}
             onUpdateColor={onUpdateColor}
             onUpdateName={onUpdateName}
             onUpdateDescription={onUpdateDescription}
             setTeamToDelete={setTeamToDelete}
             isCompact={isCompact}
             isReadOnly={mode === 'reader'}
             onTeamsMove={onTeamsMove}
           />
        ))}
      </div>
      )}

      {/* Liste Interventions - Visible en mode déploiement ou en mode lecteur */}
      {(mode === 'deployment' || mode === 'reader') && (
        <div className="flex flex-col gap-3 mt-4 border-t border-white/5 pt-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 flex justify-between items-center font-display w-full">
            <span>Interventions en cours ({interventions.length})</span>
          </div>

          {mode === 'deployment' && onAddIntervention && (
            <button
              type="button"
              onClick={() => onAddIntervention("Nouvelle Intervention", "P3", 50, 55)}
              className="w-full py-2.5 px-4 rounded-xl border border-red-500/30 text-red-400 bg-red-500/10 hover:bg-red-500 hover:text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mb-2"
            >
              <PlusCircle className="w-4 h-4" />
              Créer une intervention
            </button>
          )}
          {interventions.length === 0 ? (
            <div className="text-xs text-slate-500 bg-black/20 border border-white/5 rounded-xl p-4 text-center italic font-semibold leading-relaxed">
              Aucune intervention en cours
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {interventions.map((intervention) => {
                const assigned = teams.find(t => t.id === intervention.assigned_team_id);
                
                // Helper to get initials
                const getTeamAbbrev = (name: string) => {
                  const words = name.split(' ').filter(Boolean);
                  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
                  return name.slice(0, 3).toUpperCase();
                };

                const calculateElapsed = () => {
                  const diffMs = Date.now() - new Date(intervention.created_at).getTime();
                  if (diffMs < 0) return '0m';
                  const mins = Math.floor(diffMs / 60000);
                  if (mins < 60) return `${mins}m`;
                  return `${Math.floor(mins / 60)}h${(mins % 60).toString().padStart(2, '0')}`;
                };

                return (
                  <div 
                    key={intervention.id}
                    className="flex flex-col gap-1.5 p-3 rounded-xl border border-white/5 bg-slate-950/25 text-slate-300 relative group/int hover:border-white/10 transition-colors shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        {/* Priority Badge */}
                        <span className={`text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center text-white shrink-0 shadow-md ${
                          intervention.priority === 'P0' ? 'bg-slate-950 border border-red-500 text-red-500 animate-pulse' :
                          intervention.priority === 'P1' ? 'bg-red-600' :
                          intervention.priority === 'P3' ? 'bg-amber-500' : 'bg-blue-500'
                        }`}>
                          {intervention.number}
                        </span>
                        <span className="text-xs font-bold text-slate-200 truncate leading-none">
                          {intervention.description || `Intervention #${intervention.number}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Elapsed Timer */}
                        <span className="text-[9px] font-bold text-slate-500 flex items-center gap-0.5">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {calculateElapsed()}
                        </span>
                        {/* Assigned Team badge */}
                        {assigned ? (
                          <span 
                            className="text-[9px] font-black px-2 py-0.5 rounded-full text-white border border-white/10 shadow-sm"
                            style={{ backgroundColor: assigned.color }}
                          >
                            {getTeamAbbrev(assigned.name)}
                          </span>
                        ) : (
                          <span className="text-[8px] bg-slate-800 border border-white/5 text-slate-500 font-bold px-2 py-0.5 rounded-full">
                            Non assignée
                          </span>
                        )}
                        {/* Delete button (resolve) */}
                        {mode === 'deployment' && onDeleteIntervention && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Voulez-vous résoudre et clôturer l'intervention #${intervention.number} ?`)) {
                                onDeleteIntervention(intervention.id);
                              }
                            }}
                            className="text-slate-600 hover:text-red-400 p-0.5 rounded transition-colors cursor-pointer"
                            title="Résoudre l'intervention"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}


      <ConfirmDialog 
        isOpen={!!teamToDelete}
        title="Supprimer l'unité"
        message={
          <p>Êtes-vous sûr de vouloir supprimer l'unité <strong className="text-white">{teamToDelete?.name}</strong> ?<br/><span className="text-red-400 text-xs">Cette action est irréversible.</span></p>
        }
        confirmText="Supprimer"
        onConfirm={() => {
          if (teamToDelete) onDeleteTeam(teamToDelete.id);
          setTeamToDelete(null);
        }}
        onCancel={() => setTeamToDelete(null)}
       />

       <ConfirmDialog 
         isOpen={!!zoneToDelete}
         title="Supprimer la zone"
         message={
           <p>Êtes-vous sûr de vouloir supprimer la zone <strong className="text-white">{zoneToDelete?.name}</strong> ?<br/><span className="text-red-400 text-xs">Cette action supprimera également le tracé sur la carte.</span></p>
         }
         confirmText="Supprimer"
         onConfirm={() => {
           if (zoneToDelete) onDeleteZone(zoneToDelete.id);
           setZoneToDelete(null);
         }}
         onCancel={() => setZoneToDelete(null)}
       />
    </div>
  );
});
