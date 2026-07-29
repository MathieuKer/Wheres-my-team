import { renderWithProviders, screen, act } from '../../test/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Sidebar } from './Sidebar';
import type { Team, Zone } from '../../types';

// Mock supabase client
vi.mock('../../lib/supabase', () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: {}, error: null }),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'http://example.com/map.png' } })),
      })),
    },
  },
}));

describe('Sidebar Component', () => {
  const mockTeams: Team[] = [
    { id: 't1', name: 'Alpha Team', color: '#3b82f6', status: 'dispo', pos_x: 20, pos_y: 30, map_id: 'm1', updated_at: '', description: null },
    { id: 't2', name: 'Bravo Team', color: '#ef4444', status: 'intervention', pos_x: 40, pos_y: 50, map_id: 'm1', updated_at: '', description: 'Secouristes' },
  ];

  const mockZones: Zone[] = [
    { id: 'z1', name: 'Zone A', color: '#10b981', rotation: 0, bounds: { x: 10, y: 10, width: 20, height: 20 }, map_id: 'm1', created_at: '' },
  ];

  const mockProps = {
    teams: mockTeams,
    zones: mockZones,
    onAddTeam: vi.fn(),
    onUpdateStatus: vi.fn(),
    onUpdateColor: vi.fn(),
    onUpdateName: vi.fn(),
    onDeleteTeam: vi.fn(),
    onMapUpload: vi.fn(),
    onDeleteZone: vi.fn(),
    onUpdateZone: vi.fn(),
    onUpdateDescription: vi.fn(),
    onAddZone: vi.fn(),
    onTeamsMove: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock localStorage to prevent environment warnings/errors
    const store: Record<string, string> = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        for (const k in store) delete store[k];
      }),
    });
  });

  it('renders team lists in deployment mode with edit inputs and action buttons', async () => {
    await act(async () => {
      renderWithProviders(<Sidebar {...mockProps} mode="deployment" />);
    });

    // Verify team name is in an input field
    const nameInputs = screen.getAllByRole('textbox');
    // filter inputs to find Alpha Team
    const alphaInput = nameInputs.find(i => (i as HTMLInputElement).value === 'Alpha Team');
    expect(alphaInput).toBeInTheDocument();
    expect(alphaInput?.tagName).toBe('INPUT');

    // Changer le plan should NOT be visible in deployment mode
    expect(screen.queryByText('Changer le plan')).not.toBeInTheDocument();

    // Verify presence of interactive reset and delete buttons
    const resetBtns = screen.getAllByTitle("Recentrer l'unité");
    expect(resetBtns.length).toBe(2);

    const deleteBtns = screen.getAllByLabelText("Supprimer l'équipe");
    expect(deleteBtns.length).toBe(2);
  });

  it('renders map upload box in edition ("Plan") mode', async () => {
    await act(async () => {
      renderWithProviders(<Sidebar {...mockProps} mode="edition" />);
    });

    // Changer le plan should be visible
    expect(screen.getByText('Changer le plan')).toBeInTheDocument();
  });

  it('hides edit buttons, color pickers, and renders static elements in reader mode', async () => {
    await act(async () => {
      renderWithProviders(<Sidebar {...mockProps} mode="reader" />);
    });

    // Changer le plan should NOT be visible
    expect(screen.queryByText('Changer le plan')).not.toBeInTheDocument();

    // Verify team name is flat text/span, not an input textbox
    const textSpan = screen.getByText('Alpha Team');
    expect(textSpan).toBeInTheDocument();
    expect(textSpan.tagName).toBe('SPAN');

    // No input textboxes should exist in reader mode
    expect(screen.queryAllByRole('textbox').length).toBe(0);

    // Action buttons (Reset, Delete) should be hidden
    expect(screen.queryByTitle("Recentrer l'unité")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Supprimer l'équipe")).not.toBeInTheDocument();

    // Status buttons (Dispo, Pause) should be replaced with static indicator badge
    expect(screen.getByText('Disponible')).toBeInTheDocument();
    expect(screen.getByText('Intervention')).toBeInTheDocument();
  });

  it('calls onTeamsMove callback when individual reset position button is clicked and confirmed', async () => {
    // Mock global confirm dialog
    const confirmSpy = vi.spyOn(globalThis, 'confirm').mockReturnValue(true);

    await act(async () => {
      renderWithProviders(<Sidebar {...mockProps} mode="deployment" />);
    });

    const resetBtns = screen.getAllByTitle("Recentrer l'unité");
    await act(async () => {
      resetBtns[0].click();
    });

    expect(confirmSpy).toHaveBeenCalledWith('Voulez-vous replacer l\'unité "Alpha Team" au centre de la carte ?');
    expect(mockProps.onTeamsMove).toHaveBeenCalledWith([{ id: 't1', x: 50, y: 50 }]);
    confirmSpy.mockRestore();
  });

  it('hides intervention management and list sections when hasInterventions is false', async () => {
    await act(async () => {
      renderWithProviders(<Sidebar {...mockProps} mode="deployment" hasInterventions={false} />);
    });

    expect(screen.queryByText('Administration des Interventions')).not.toBeInTheDocument();
    expect(screen.queryByText(/Interventions en cours/)).not.toBeInTheDocument();
  });
});
