import { useState, useEffect } from 'react';
import { mapRepo } from '../lib/repositories/map';
import type { SquadMap } from '../types';
import { Plus, Map as MapIcon, LogOut, Trash2 } from 'lucide-react';
import { ConfirmDialog } from './ui/ConfirmDialog';

interface MapListProps {
  onSelectMap: (id: string) => void;
  signOut: () => Promise<void>;
}

export function MapList({ onSelectMap, signOut }: Readonly<MapListProps>) {
  const [maps, setMaps] = useState<SquadMap[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newMapName, setNewMapName] = useState('');
  const [hasInterventions, setHasInterventions] = useState(false);
  const [mapToDelete, setMapToDelete] = useState<SquadMap | null>(null);

  useEffect(() => {
    loadMaps();
    const unsub = mapRepo.subscribe(() => {
      loadMaps();
    });
    return () => unsub();
  }, []);

  const loadMaps = async () => {
    try {
      const data = await mapRepo.getAll();
      setMaps(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMapName.trim() || isCreating) return;
    setIsCreating(true);
    try {
      await mapRepo.create(newMapName.trim(), hasInterventions);
      setNewMapName('');
      setHasInterventions(false);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la création de la carte.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await mapRepo.delete(id);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la suppression de la carte.");
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-screen bg-background p-6 md:p-12 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-12 glass-panel p-6 rounded-3xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center border border-blue-500/30">
              <MapIcon className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-display text-white">Vos Cartes</h1>
              <p className="text-slate-400 text-sm">Gestion des événements et sites</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={signOut}
            className="flex items-center gap-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 px-4 py-2 rounded-xl transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="hidden sm:inline font-medium">Déconnexion</span>
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Create New Map Card */}
          <form onSubmit={handleCreate} className="glass-card p-6 rounded-3xl flex flex-col justify-center min-h-[220px] gap-4 border-dashed border-2 border-slate-700 hover:border-blue-500/50 transition-colors">
            <h3 className="text-white font-bold font-display text-lg">Nouvelle Carte</h3>
            <input 
              type="text" 
              value={newMapName}
              onChange={(e) => setNewMapName(e.target.value)}
              placeholder="Nom de l'événement..."
              className="bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-white w-full"
            />
            <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer select-none py-1">
              <input 
                type="checkbox"
                checked={hasInterventions}
                onChange={(e) => setHasInterventions(e.target.checked)}
                className="rounded border-white/20 bg-black/40 text-blue-600 focus:ring-blue-500/30 w-4 h-4 cursor-pointer"
              />
              <span>Gestion des interventions</span>
            </label>
            <button 
              type="submit"
              disabled={isCreating || !newMapName.trim()}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <Plus className="w-5 h-5" />
              {isCreating ? 'Création...' : 'Créer'}
            </button>
          </form>

          {/* Map List */}
          {maps.map(map => (
            <div key={map.id} className="glass-card rounded-3xl overflow-hidden flex flex-col min-h-[220px] group relative transition-all hover:shadow-2xl hover:shadow-blue-900/20">
              <button 
                type="button"
                onClick={() => setMapToDelete(map)}
                className="absolute top-4 right-4 z-10 p-2.5 bg-black/40 hover:bg-red-500 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all backdrop-blur-md"
                title="Supprimer la carte"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              
              <button 
                type="button"
                className="flex-1 bg-slate-800 relative cursor-pointer overflow-hidden border-none p-0 w-full"
                onClick={() => onSelectMap(map.id)}
              >
                {map.image_url ? (
                  <img src={map.image_url} alt={map.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-all duration-700 group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-800 border-b border-white/5 transition-transform duration-700 group-hover:scale-110">
                    <MapIcon className="w-12 h-12 text-slate-600" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent" />
              </button>
              
              <button 
                type="button"
                className="p-5 bg-slate-900 backdrop-blur-md relative cursor-pointer border-t border-white/5 text-left w-full border-none"
                onClick={() => onSelectMap(map.id)}
              >
                <div className="flex items-center justify-between gap-2 pr-8">
                  <h3 className="text-white font-bold font-display text-lg truncate">{map.name}</h3>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${map.has_interventions !== false ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                    {map.has_interventions !== false ? 'Avec inters' : 'Sans inter'}
                  </span>
                </div>
                <p className="text-slate-400 text-xs mt-1">Créée le {new Date(map.created_at).toLocaleDateString()}</p>
              </button>
            </div>
          ))}
        </div>
      </div>

      <ConfirmDialog 
        isOpen={!!mapToDelete}
        title="Supprimer la carte"
        message={
          <p>Êtes-vous sûr de vouloir supprimer la carte <strong className="text-white">{mapToDelete?.name}</strong> ?<br/><span className="text-red-400 text-xs">Toutes les équipes et zones associées seront perdues à jamais.</span></p>
        }
        confirmText="Supprimer"
        onConfirm={() => {
          if (mapToDelete) handleDelete(mapToDelete.id);
          setMapToDelete(null);
        }}
        onCancel={() => setMapToDelete(null)}
      />
    </div>
  );
}
