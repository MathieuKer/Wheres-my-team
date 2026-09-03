import { renderWithProviders, screen, fireEvent, act } from '../../test/test-utils';
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

  it('opens RadialMenu on long right-click (>= 300ms) and updates status', () => {
    vi.useFakeTimers();
    const onUpdateStatusMock = vi.fn();
    const onConfigureMock = vi.fn();
    renderWithProviders(
      <TeamMarker {...defaultProps} onUpdateStatus={onUpdateStatusMock} onConfigure={onConfigureMock} />
    );

    const marker = screen.getByText('AB').closest('.nodrag')!;

    // Right click pointer down
    fireEvent.pointerDown(marker, { button: 2 });

    // Browser immediately fires contextmenu on mousedown/pointerdown
    fireEvent.contextMenu(marker);
    expect(onConfigureMock).not.toHaveBeenCalled();

    // Fast-forward 350ms
    act(() => {
      vi.advanceTimersByTime(350);
    });

    // Radial menu should now be visible and onConfigure was never called
    expect(onConfigureMock).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Sélection rapide du statut')).toBeInTheDocument();
    expect(screen.getByLabelText('Disponible')).toBeInTheDocument();

    // Selecting a status via keyboard shortcut '2' (en_route)
    fireEvent.keyDown(window, { key: '2' });

    expect(onUpdateStatusMock).toHaveBeenCalledWith('en_route');
    expect(screen.queryByLabelText('Sélection rapide du statut')).not.toBeInTheDocument();

    // Release mouse after radial was opened: onConfigure must still not be called
    fireEvent.pointerUp(window, { button: 2 });
    expect(onConfigureMock).not.toHaveBeenCalled();

    vi.useRealTimers();
  });

  it('triggers onConfigure on short right-click (< 300ms)', () => {
    vi.useFakeTimers();
    const onConfigureMock = vi.fn();
    renderWithProviders(
      <TeamMarker {...defaultProps} onConfigure={onConfigureMock} />
    );

    const marker = screen.getByText('AB').closest('.nodrag')!;

    // Pointer down at t=0
    fireEvent.pointerDown(marker, { button: 2 });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    // Pointer up at t=100ms
    fireEvent.pointerUp(marker, { button: 2 });

    expect(onConfigureMock).toHaveBeenCalledTimes(1);
    expect(screen.queryByLabelText('Sélection rapide du statut')).not.toBeInTheDocument();

    vi.useRealTimers();
  });

  it('does not open RadialMenu on long right-click in reader mode', () => {
    vi.useFakeTimers();
    const onUpdateStatusMock = vi.fn();
    renderWithProviders(
      <TeamMarker {...defaultProps} mode="reader" onUpdateStatus={onUpdateStatusMock} />
    );

    const marker = screen.getByText('AB').closest('.nodrag')!;
    fireEvent.pointerDown(marker, { button: 2 });
    act(() => {
      vi.advanceTimersByTime(350);
    });

    expect(screen.queryByLabelText('Sélection rapide du statut')).not.toBeInTheDocument();

    vi.useRealTimers();
  });
});
