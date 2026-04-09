import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useMap() {
  const [mapUrl, setMapUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchMap = async () => {
      const { data, error } = await supabase
        .from('map_settings')
        .select('image_url')
        .eq('id', 1)
        .single();
      
      if (!error && data) {
        setMapUrl(data.image_url);
      }
    };

    fetchMap();

    const channel = supabase
      .channel('public:map_settings')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'map_settings' },
        (payload) => {
          setMapUrl(payload.new.image_url);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateMapUrl = async (url: string | null) => {
    const { error } = await supabase
      .from('map_settings')
      .update({ image_url: url })
      .eq('id', 1);
    
    if (error) {
      console.error("Error updating map:", error)
    }
  };

  return { mapUrl, updateMapUrl };
}
