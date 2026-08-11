import { renderWithProviders, screen, act } from '../../test/test-utils';
import { fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InterventionMarker } from './InterventionMarker';
import type { Intervention, Team } from '../../types';

describe('InterventionMarker Component', () => {
  const mockTeams: Team[] = [
    { id: 't1', name: 'Alpha Team', color: '#3b82f6', status: 'dispo', pos_x: 20, pos_y: 30, map_id: 'm1', updated_at: '', description: null },
  ];

  const mockIntervention: Intervention = {
    id: 'int1',
    map_id: 'm1',
    number: 1,
    description: 'Malaise vagal',
    priority: 'P1',
    status: 'open',
    pos_x: 50,
    pos_y: 50,
    assigned_team_id: null,
    created_at: new Date(Date.now() - 120000).toISOString() // 2 minutes ago
  };

  const mockProps = {
    intervention: mockIntervention,
    teams: mockTeams,
    onDragStart: vi.fn(),
    onDragMove: vi.fn(),
    onDragEnd: vi.fn(),
    onConfigure: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the intervention marker with correct number and elapsed time', async () => {
    await act(async () => {
      renderWithProviders(<InterventionMarker {...mockProps} mode="deployment" />);
    });

    // Check number rendering (#1)
    expect(screen.getByText('#1')).toBeInTheDocument();

    // Check dynamic timer rendering (around 2m)
    expect(screen.getByText('2m')).toBeInTheDocument();
  });

  it('calls onConfigure when context menu (right-click) is triggered', async () => {
    await act(async () => {
      renderWithProviders(<InterventionMarker {...mockProps} mode="deployment" />);
    });

    const marker = screen.getByText('#1');
    await act(async () => {
      fireEvent.contextMenu(marker);
    });

    expect(mockProps.onConfigure).toHaveBeenCalledTimes(1);
  });

  it('displays the assigned team initial marker correctly', async () => {
    const assignedIntervention = { ...mockIntervention, assigned_team_id: 't1' };
    await act(async () => {
      renderWithProviders(
        <InterventionMarker 
          {...mockProps} 
          intervention={assignedIntervention} 
          mode="deployment" 
        />
      );
    });

    // Renders assigned team's abbreviation: "Alpha Team" -> "AT"
    expect(screen.getByText('AT')).toBeInTheDocument();
  });
});
