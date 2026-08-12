import { renderWithProviders, screen, fireEvent } from '../../test/test-utils';
import { describe, it, expect, vi } from 'vitest';
import { TeamMarker } from './TeamMarker';
import type { Team } from '../../types';

describe('TeamMarker Component', () => {
  const mockTeam: Team = {
    id: 't1',
    name: 'Alpha Bravo',
    color: '#3b82f6',
    status: 'dispo',
    pos_x: 40,
    pos_y: 60,
    map_id: 'm1',
    updated_at: '',
    description: 'Premier secours',
  };

  const defaultProps = {
    team: mockTeam,
    onDoubleClick: vi.fn(),
    onDragStart: vi.fn(),
    onDragMove: vi.fn(),
    onDragEnd: vi.fn(),
    onConfigure: vi.fn(),
    isDraggable: true,
    mode: 'deployment' as const,
  };

  it('renders team abbreviation badge and tooltip name', () => {
    renderWithProviders(<TeamMarker {...defaultProps} />);

    // Abbreviation for "Alpha Bravo" is "AB"
    expect(screen.getByText('AB')).toBeInTheDocument();
    expect(screen.getByText('Alpha Bravo')).toBeInTheDocument();
    expect(screen.getByText('Premier secours')).toBeInTheDocument();
  });

  it('triggers onConfigure when right-clicked in deployment mode', () => {
    renderWithProviders(<TeamMarker {...defaultProps} />);

    const marker = screen.getByText('AB').closest('.nodrag')!;
    fireEvent.contextMenu(marker);

    expect(defaultProps.onConfigure).toHaveBeenCalled();
  });

  it('does not trigger onConfigure when right-clicked in reader mode', () => {
    const onConfigureMock = vi.fn();
    renderWithProviders(<TeamMarker {...defaultProps} mode="reader" onConfigure={onConfigureMock} />);

    const marker = screen.getByText('AB').closest('.nodrag')!;
    fireEvent.contextMenu(marker);

    expect(onConfigureMock).not.toHaveBeenCalled();
  });

  it('highlights badge when team is selected', () => {
    renderWithProviders(<TeamMarker {...defaultProps} isSelected={true} />);

    const badge = screen.getByText('AB').parentElement!;
    expect(badge.className).toContain('bg-blue-600');
  });

  it('renders role information for specialized teams', () => {
    const volanteTeam: Team = {
      ...mockTeam,
      name: 'Volante 1',
      specialty: 'volante',
      color: '#ef4444'
    };

    renderWithProviders(<TeamMarker {...defaultProps} team={volanteTeam} />);
    expect(screen.getByText('V1')).toBeInTheDocument();
    expect(screen.getByText('Volante')).toBeInTheDocument();
  });
});
