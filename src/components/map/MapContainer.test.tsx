import { renderWithProviders, screen, act } from '../../test/test-utils';
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { MapContainer } from './MapContainer';
import type { Team, Zone } from '../../types';

describe('MapContainer Component', () => {
  const mockTeams: Team[] = [
    { id: 't1', name: 'Alpha Team', color: '#3b82f6', status: 'dispo', pos_x: 20, pos_y: 30, map_id: 'm1', updated_at: '', description: null },
  ];

  const mockZones: Zone[] = [
    { id: 'z1', name: 'Zone A', color: '#10b981', rotation: 0, bounds: { x: 10, y: 10, width: 20, height: 20 }, map_id: 'm1', created_at: '' },
  ];

  const mockProps = {
    mapUrl: 'http://example.com/map.png',
    teams: mockTeams,
    zones: mockZones,
    onTeamsMove: vi.fn(),
    onTeamDoubleClick: vi.fn(),
    onZoneCreate: vi.fn(),
    onZoneUpdate: vi.fn(),
    onZoneDelete: vi.fn(),
    configuringTeamId: null,
    setConfiguringTeamId: vi.fn(),
    configuringInterventionId: null,
    setConfiguringInterventionId: vi.fn(),
  };

  beforeAll(() => {
    // Mock ResizeObserver for react-zoom-pan-pinch dependency in JSDOM
    globalThis.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders fallback when no mapUrl is provided', async () => {
    await act(async () => {
      renderWithProviders(<MapContainer {...mockProps} mapUrl={null} mode="deployment" />);
    });

    expect(screen.getByText('Aucun plan chargé')).toBeInTheDocument();
  });

  it('renders the map image, team pins, and zones', async () => {
    await act(async () => {
      renderWithProviders(<MapContainer {...mockProps} mode="deployment" />);
    });

    // Check map image presence
    const mapImage = screen.getByAltText('Map Plan') as HTMLImageElement;
    expect(mapImage).toBeInTheDocument();
    expect(mapImage.src).toBe('http://example.com/map.png');

    // Check permanent abbreviation tag (e.g. "AT")
    expect(screen.getByText('AT')).toBeInTheDocument();
  });

  it('renders edition banner in edition ("Plan") mode', async () => {
    await act(async () => {
      renderWithProviders(<MapContainer {...mockProps} mode="edition" />);
    });

    // Banners should contain the mode texts (both mobile version and desktop version)
    expect(screen.getByText('MODIFIER CARTE')).toBeInTheDocument();
    expect(screen.getByText(/CLIQUEZ ET GLISSEZ POUR DESSINER/)).toBeInTheDocument();
  });

  it('renders reader banner in reader ("Lecteur") mode', async () => {
    await act(async () => {
      renderWithProviders(<MapContainer {...mockProps} mode="reader" />);
    });

    expect(screen.getByText('LECTURE SEULE')).toBeInTheDocument();
    expect(screen.getByText(/TOUTE MODIFICATION OU DÉPLACEMENT/)).toBeInTheDocument();
  });

  it('renders deployment banner in deployment ("Terrain") mode', async () => {
    await act(async () => {
      renderWithProviders(<MapContainer {...mockProps} mode="deployment" />);
    });

    expect(screen.getByText('SUIVI DIRECT')).toBeInTheDocument();
    expect(screen.getByText(/GLISSEZ LES ÉQUIPES/)).toBeInTheDocument();
  });

  it('toggles the help panel when clicking the help button', async () => {
    await act(async () => {
      renderWithProviders(<MapContainer {...mockProps} mode="deployment" />);
    });

    // Check that help panel is not open initially
    expect(screen.queryByText('Aide & Légende')).not.toBeInTheDocument();

    // Click the help button (which has title "Aide & Légende")
    const helpBtn = screen.getByTitle('Aide & Légende');
    await act(async () => {
      fireEvent.click(helpBtn);
    });

    // Help panel should now be visible
    expect(screen.getByText('Aide & Légende')).toBeInTheDocument();
    expect(screen.getByText('Statuts des Équipes')).toBeInTheDocument();
    expect(screen.getByText(/Glisser équipe sur intervention/)).toBeInTheDocument();

    // Click help button again to close
    await act(async () => {
      fireEvent.click(helpBtn);
    });
    expect(screen.queryByText('Aide & Légende')).not.toBeInTheDocument();
  });

  it('renders config modal with updated button names', async () => {
    const mockInterventions = [
      {
        id: 'int1',
        map_id: 'm1',
        number: 1,
        description: 'Malaise vagal',
        priority: 'P1' as const,
        status: 'open' as const,
        pos_x: 50,
        pos_y: 50,
        assigned_team_id: null,
        created_at: new Date().toISOString()
      }
    ];

    await act(async () => {
      renderWithProviders(
        <MapContainer 
          {...mockProps} 
          interventions={mockInterventions} 
          configuringInterventionId="int1" 
          mode="deployment" 
        />
      );
    });

    expect(screen.getByText('Intervention #1')).toBeInTheDocument();
    expect(screen.getByText("Valider les changements")).toBeInTheDocument();
    expect(screen.getByText("Terminer l'intervention")).toBeInTheDocument();
  });

  it('hides intervention toggle button and markers when hasInterventions is false', async () => {
    const mockInterventions = [
      {
        id: 'int1',
        map_id: 'm1',
        number: 1,
        description: 'Malaise vagal',
        priority: 'P1' as const,
        status: 'open' as const,
        pos_x: 50,
        pos_y: 50,
        assigned_team_id: null,
        created_at: new Date().toISOString()
      }
    ];

    await act(async () => {
      renderWithProviders(
        <MapContainer 
          {...mockProps} 
          interventions={mockInterventions} 
          hasInterventions={false} 
          mode="deployment" 
        />
      );
    });

    expect(screen.queryByTitle("Masquer les interventions")).not.toBeInTheDocument();
    expect(screen.queryByText('#1')).not.toBeInTheDocument();
  });
});
