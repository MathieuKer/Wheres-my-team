import { useState, useMemo, memo } from 'react';
import type { Team, TeamStatus, Zone } from '../../types';
import { supabase } from '../../lib/supabase';
import { Trash2, AlertTriangle, Coffee, Play, UploadCloud, FileText, Layout, Type, BriefcaseMedical, Hospital, LogIn, Music, Shield, Utensils } from 'lucide-react';
import { ColorPicker } from './ColorPicker';
import { ConfirmDialog } from '../ui/ConfirmDialog';

interface TeamRowProps {
  team: Team;
  onUpdateStatus: (id: string, status: TeamStatus) => void;
  onUpdateColor: (id: string, color: string) => void;
  onUpdateDescription: (id: string, description: string | null) => void;
  setTeamToDelete: (team: Team) => void;
}

const TeamRow = memo(function TeamRow({
  team,
  onUpdateStatus,
  onUpdateColor,
  onUpdateDescription,
  setTeamToDelete
}: Readonly<TeamRowProps>) {
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(team.description ?? '');
  const [initialDescription, setInitialDescription] = useState(team.description ?? '');

  const handleSave = () => {
    const currentDbVal = team.description ?? '';
    if (currentDbVal !== initialDescription) {
      const force = window.confirm(
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
    <div className="flex flex-col gap-1.5 glass-card p-2 rounded-xl group/team relative focus-within:z-[60] hover:z-[60] transition-all">
      <div className="flex items-center gap-3 w-full">
        <div className="shrink-0 w-6 h-6 flex items-center justify-center">
          <ColorPicker color={team.color} onChange={(c) => onUpdateColor(team.id, c)} />
        </div>

        <span className="font-semibold text-sm text-slate-200 truncate flex-1 font-display" title={team.name}>
          {team.name}
        </span>
        
        <div className="flex items-center gap-1 shrink-0 bg-black/20 rounded-lg p-1 border border-white/5">
          <button 
            type="button"
            onClick={() => onUpdateStatus(team.id, 'dispo')}
            className={`p-1.5 rounded-md transition-all ${team.status === 'dispo' ? 'bg-slate-700 text-white shadow-inner' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'}`}
            aria-label="Marquer comme disponible"
          >
            <Play className="w-4 h-4" aria-hidden="true" />
          </button>
          <button 
            type="button"
            onClick={() => onUpdateStatus(team.id, 'intervention')}
            className={`p-1.5 rounded-md transition-all ${team.status === 'intervention' ? 'bg-red-500 text-white shadow-lg shadow-red-500/40 animate-pulse' : 'text-slate-500 hover:bg-white/5 hover:text-red-400'}`}
            aria-label="Marquer en intervention"
          >
            <AlertTriangle className="w-4 h-4" aria-hidden="true" />
          </button>
          <button 
            type="button"
            onClick={() => onUpdateStatus(team.id, 'pause')}
            className={`p-1.5 rounded-md transition-all ${team.status === 'pause' ? 'bg-amber-600 text-white shadow-inner' : 'text-slate-500 hover:bg-white/5 hover:text-amber-400'}`}
            aria-label="Marquer en pause"
          >
            <Coffee className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

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
          className={`p-1.5 rounded-md transition-all ${
            isEditing 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
              : team.description 
                ? 'text-blue-400 hover:bg-white/5' 
                : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'
          }`}
          title={team.description ? "Modifier la note (Contient du texte)" : "Ajouter une note"}
        >
          <FileText className="w-4 h-4" aria-hidden="true" />
        </button>

        <button 
          type="button"
          onClick={() => setTeamToDelete(team)} 
          className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-all opacity-0 group-hover/team:opacity-100 shrink-0 mr-1" 
          aria-label="Supprimer l'équipe"
        >
          <Trash2 className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {/* Expandable description editor */}
      {isEditing && (
        <div className="mt-1.5 p-3 bg-black/40 rounded-xl border border-white/5 flex flex-col gap-2 animate-in slide-in-from-top-2 duration-200">
          <div className="flex justify-between items-center">
            <label htmlFor={`note-${team.id}`} className="text-[10px] uppercase tracking-wider text-slate-500 font-bold font-display">
              Note de l'unité
            </label>
            {(team.description ?? '') !== initialDescription && (
              <span className="text-[10px] text-amber-400 font-semibold animate-pulse">
                ⚠️ Modifiée en arrière-plan
              </span>
            )}
          </div>
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
        </div>
      )}
    </div>
  );
});

interface SidebarProps {
  teams: Team[];
  onAddTeam: (name: string, color: string) => Promise<void>;
  onUpdateStatus: (id: string, status: TeamStatus) => void;
  onUpdateColor: (id: string, color: string) => void;
  onDeleteTeam: (id: string) => void;
  onMapUpload: (url: string) => void;
  zones: Zone[];
  mode: 'deployment' | 'edition';
  onDeleteZone: (id: string) => void;
  onUpdateZone: (id: string, updates: Partial<Zone>) => void;
  onUpdateDescription: (id: string, description: string | null) => void;
  onAddZone: (zone: Omit<Zone, 'id' | 'map_id' | 'created_at'>) => void;
}

export const Sidebar = memo(function Sidebar({ 
  teams, 
  onAddTeam, 
  onUpdateStatus, 
  onUpdateColor, 
  onDeleteTeam, 
  onMapUpload,
  zones,
  mode,
  onDeleteZone,
  onUpdateZone,
  onUpdateDescription,
  onAddZone
}: Readonly<SidebarProps>) {
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#3b82f6');
  const [uploading, setUploading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  const [zoneToDelete, setZoneToDelete] = useState<Zone | null>(null);

  const handleAddSpecialElement = (type: string, defaultName: string) => {
    const isText = type === 'text';
    const isStage = type === 'infra_stage';
    
    // Dimensions par défaut adaptées
    const width = isText ? 16 : isStage ? 14 : 7;
    const height = isText ? 6 : isStage ? 10 : 7;

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
      name: `${defaultName} ${zones.filter(z => z.type === type).length + 1}`,
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
      
      {/* Upload Carte */}
      <div className="glass-card p-1 rounded-2xl overflow-hidden">
        <label className="flex items-center justify-center gap-3 cursor-pointer bg-white/5 hover:bg-white/10 transition-all duration-300 py-3 rounded-xl text-sm font-semibold text-slate-300 group">
           <UploadCloud className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" aria-hidden="true" />
           {uploading ? 'Upload en cours…' : 'Changer le plan'}
           <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading}/>
        </label>
      </div>

      {/* Ajout Équipe - Uniquement en mode déploiement */}
      {mode === 'deployment' && (
        <form onSubmit={handleAdd} className="flex flex-col gap-3 glass-card p-4 rounded-2xl relative focus-within:z-[60] hover:z-[60] transition-all">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 font-display">Nouvelle Équipe</div>
          <input 
            type="text" 
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Ex: Unité Alpha…" 
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
          />
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
          {sortedZones.map(zone => (
            <div key={zone.id} className="flex items-center glass-card p-3 rounded-xl group/zone animate-in slide-in-from-right-4 duration-300">
               <div className="shrink-0 mr-3">
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
                   placeholder={
                      zone.type === 'text' 
                        ? "Saisir le texte à afficher..." 
                        : zone.type?.startsWith('infra_')
                          ? "Libellé de l'élément..."
                          : "Nom de la zone..."
                    }
                   className="w-full bg-transparent border-none focus:ring-0 text-sm font-semibold text-slate-200 font-display p-0"
                 />
               </div>

                <div className="shrink-0 ml-4 mr-2">
                  <button 
                    onClick={() => setZoneToDelete(zone)} 
                    className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-all opacity-0 group-hover/zone:opacity-100" 
                    aria-label="Supprimer la zone"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
            </div>
          ))}
        </div>
      </div>
      )}

      {/* Liste Équipes - Uniquement en mode déploiement (ou grisé ?) */}
      {mode === 'deployment' && (
        <div className="flex flex-col gap-3">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 flex justify-between items-center font-display">
          <span>Unités sur le terrain ({teams.length})</span>
        </div>
        {sortedTeams.map(team => (
           <TeamRow 
             key={team.id}
             team={team}
             onUpdateStatus={onUpdateStatus}
             onUpdateColor={onUpdateColor}
             onUpdateDescription={onUpdateDescription}
             setTeamToDelete={setTeamToDelete}
           />
        ))}
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
