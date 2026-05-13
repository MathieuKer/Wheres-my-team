import { useState, useMemo, memo } from 'react';
import type { Team, TeamStatus } from '../../types';
import { supabase } from '../../lib/supabase';
import { Trash2, AlertTriangle, Coffee, Play, UploadCloud } from 'lucide-react';
import { ColorPicker } from './ColorPicker';
import { ConfirmDialog } from '../ui/ConfirmDialog';

interface SidebarProps {
  teams: Team[];
  onAddTeam: (name: string, color: string) => void;
  onUpdateStatus: (id: string, status: TeamStatus) => void;
  onUpdateColor: (id: string, color: string) => void;
  onDeleteTeam: (id: string) => void;
  onMapUpload: (url: string) => void;
}

export const Sidebar = memo(function Sidebar({ 
  teams, 
  onAddTeam, 
  onUpdateStatus, 
  onUpdateColor, 
  onDeleteTeam, 
  onMapUpload 
}: Readonly<SidebarProps>) {
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#3b82f6');
  const [uploading, setUploading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);

  const sortedTeams = useMemo(() => {
    return [...teams].sort((a, b) => a.name.localeCompare(b.name));
  }, [teams]);

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

      {/* Ajout Équipe */}
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

      {/* Liste Équipes */}
      <div className="flex flex-col gap-3">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 flex justify-between items-center font-display">
          <span>Unités sur le terrain ({teams.length})</span>
        </div>
        {sortedTeams.map(team => (
           <div key={team.id} className="flex items-center gap-3 glass-card p-2 rounded-xl group/team relative focus-within:z-[60] hover:z-[60] transition-all">
              
              <div className="shrink-0 w-6 h-6 flex items-center justify-center">
                <ColorPicker color={team.color} onChange={(c) => onUpdateColor(team.id, c)} />
              </div>

              <span className="font-semibold text-sm text-slate-200 truncate flex-1 font-display" title={team.name}>{team.name}</span>
              
              <div className="flex items-center gap-1 shrink-0 bg-black/20 rounded-lg p-1 border border-white/5">
                <button 
                  onClick={() => onUpdateStatus(team.id, 'dispo')}
                  className={`p-1.5 rounded-md transition-all ${team.status === 'dispo' ? 'bg-slate-700 text-white shadow-inner' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'}`}
                  aria-label="Marquer comme disponible"
                >
                  <Play className="w-4 h-4" aria-hidden="true" />
                </button>
                <button 
                  onClick={() => onUpdateStatus(team.id, 'intervention')}
                  className={`p-1.5 rounded-md transition-all ${team.status === 'intervention' ? 'bg-red-500 text-white shadow-lg shadow-red-500/40 animate-pulse' : 'text-slate-500 hover:bg-white/5 hover:text-red-400'}`}
                  aria-label="Marquer en intervention"
                >
                  <AlertTriangle className="w-4 h-4" aria-hidden="true" />
                </button>
                <button 
                  onClick={() => onUpdateStatus(team.id, 'pause')}
                  className={`p-1.5 rounded-md transition-all ${team.status === 'pause' ? 'bg-amber-600 text-white shadow-inner' : 'text-slate-500 hover:bg-white/5 hover:text-amber-400'}`}
                  aria-label="Marquer en pause"
                >
                  <Coffee className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              <button 
                onClick={() => setTeamToDelete(team)} 
                className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-all opacity-0 group-hover/team:opacity-100" 
                aria-label="Supprimer l'équipe"
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
              </button>
           </div>
        ))}
      </div>

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
    </div>
  );
});
