import { useState } from 'react';
import type { Team, TeamStatus } from '../../types';
import { supabase } from '../../lib/supabase';
import { Trash2, AlertTriangle, Coffee, Play, UploadCloud } from 'lucide-react';

interface SidebarProps {
  teams: Team[];
  onAddTeam: (name: string, color: string) => void;
  onUpdateStatus: (id: string, status: TeamStatus) => void;
  onUpdateColor: (id: string, color: string) => void;
  onDeleteTeam: (id: string) => void;
  onMapUpload: (url: string) => void;
}

export function Sidebar({ teams, onAddTeam, onUpdateStatus, onUpdateColor, onDeleteTeam, onMapUpload }: Readonly<SidebarProps>) {
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#3b82f6');
  const [uploading, setUploading] = useState(false);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      onAddTeam(newName, newColor);
      setNewName('');
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
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
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
      
      {/* Upload Carte */}
      <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
        <label className="flex items-center justify-center gap-2 cursor-pointer bg-slate-700 hover:bg-slate-600 transition-colors py-2 rounded text-sm text-slate-300">
           <UploadCloud className="w-4 h-4" />
           {uploading ? 'Upload en cours...' : 'Changer le plan'}
           <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading}/>
        </label>
      </div>

      {/* Ajout Équipe */}
      <form onSubmit={handleAdd} className="flex flex-col gap-2 bg-slate-800 p-3 rounded-lg border border-slate-700">
        <div className="text-sm font-semibold text-slate-400 mb-1">Nouvelle Équipe</div>
        <input 
          type="text" 
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Ex: Unité Alpha" 
          className="bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-primary"
        />
        <div className="flex gap-2">
          <input 
            type="color" 
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            className="h-8 w-1/3 bg-transparent border-none rounded cursor-pointer"
          />
          <button type="submit" className="flex-1 bg-primary hover:bg-primary/80 transition-colors rounded text-sm text-white font-medium">
            Ajouter
          </button>
        </div>
      </form>

      {/* Liste Équipes */}
      <div className="flex flex-col gap-1.5">
        <div className="text-sm font-semibold text-slate-400 mb-1 flex justify-between items-center">
          <span>Sur le terrain ({teams.length})</span>
        </div>
        {[...teams].sort((a, b) => a.name.localeCompare(b.name)).map(team => (
           <div key={team.id} className="flex items-center gap-2 bg-slate-800 p-1.5 rounded border border-slate-700/50">
              
              <div className="relative group/color shrink-0 w-4 h-4 flex items-center justify-center">
                <input 
                  type="color" 
                  value={team.color} 
                  onChange={(e) => onUpdateColor(team.id, e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  title="Changer la couleur"
                />
                <div className="w-3.5 h-3.5 rounded-sm border border-slate-600 transition-transform group-hover/color:scale-110" style={{backgroundColor: team.color}}></div>
              </div>

              <span className="font-medium text-xs text-slate-200 truncate flex-1" title={team.name}>{team.name}</span>
              
              <div className="flex items-center gap-0.5 shrink-0 bg-slate-900/50 rounded p-0.5 border border-slate-700/50">
                <button 
                  onClick={() => onUpdateStatus(team.id, 'dispo')}
                  className={`p-1.5 rounded transition-colors ${team.status === 'dispo' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-700/50 hover:text-slate-300'}`}
                  title="Disponible"
                >
                  <Play className="w-3.5 h-3.5"/>
                </button>
                <button 
                  onClick={() => onUpdateStatus(team.id, 'intervention')}
                  className={`p-1.5 rounded transition-colors ${team.status === 'intervention' ? 'bg-red-900/80 text-red-400 shadow-sm animate-pulse' : 'text-slate-500 hover:bg-slate-700/50 hover:text-red-400'}`}
                  title="En Urgence"
                >
                  <AlertTriangle className="w-3.5 h-3.5"/>
                </button>
                <button 
                  onClick={() => onUpdateStatus(team.id, 'pause')}
                  className={`p-1.5 rounded transition-colors ${team.status === 'pause' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-700/50 hover:text-slate-300'}`}
                  title="En Pause"
                >
                  <Coffee className="w-3.5 h-3.5"/>
                </button>
              </div>

              <button onClick={() => onDeleteTeam(team.id)} className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-slate-800 rounded transition-colors ml-1" title="Supprimer l'équipe">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
           </div>
        ))}
      </div>
    </div>
  );
}
