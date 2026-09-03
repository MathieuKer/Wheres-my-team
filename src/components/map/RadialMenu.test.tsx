import { renderWithProviders, screen, fireEvent } from '../../test/test-utils';
import { describe, it, expect, vi } from 'vitest';
import { RadialMenu } from './RadialMenu';
import type { Team } from '../../types';

describe('RadialMenu Component [E-06]', () => {
  const mockTeam: Team = {
    id: 't1',
    name: 'Alpha 1',
    color: '#3b82f6',
    status: 'dispo',
    pos_x: 50,
    pos_y: 50,
    map_id: 'm1',
    updated_at: '',
  };

  const defaultProps = {
    team: mockTeam,
    onSelectStatus: vi.fn(),
    onClose: vi.fn(),
  };

  it('renders all 4 status options with keyboard indicators', () => {
    renderWithProviders(<RadialMenu {...defaultProps} />);

    expect(screen.getByLabelText('Disponible')).toBeInTheDocument();
    expect(screen.getByLabelText('En route')).toBeInTheDocument();
    expect(screen.getByLabelText('Intervention')).toBeInTheDocument();
    expect(screen.getByLabelText('En pause')).toBeInTheDocument();

    expect(screen.getByText('[1]')).toBeInTheDocument();
    expect(screen.getByText('[2]')).toBeInTheDocument();
    expect(screen.getByText('[3]')).toBeInTheDocument();
    expect(screen.getByText('[4]')).toBeInTheDocument();
    expect(screen.getByText('Alpha 1')).toBeInTheDocument();
  });

  it('closes on Escape key press without changing status', () => {
    const onCloseMock = vi.fn();
    const onSelectStatusMock = vi.fn();

    renderWithProviders(
      <RadialMenu {...defaultProps} onClose={onCloseMock} onSelectStatus={onSelectStatusMock} />
    );

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(onCloseMock).toHaveBeenCalledTimes(1);
    expect(onSelectStatusMock).not.toHaveBeenCalled();
  });

  it('triggers onSelectStatus and closes on keyboard shortcut (1, 2, 3, 4)', () => {
    const onSelectStatusMock = vi.fn();
    const onCloseMock = vi.fn();

    renderWithProviders(
      <RadialMenu {...defaultProps} onSelectStatus={onSelectStatusMock} onClose={onCloseMock} />
    );

    // Press '2' for 'en_route'
    fireEvent.keyDown(window, { key: '2' });

    expect(onSelectStatusMock).toHaveBeenCalledWith('en_route');
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

function mockMenuBoundingBox(element: HTMLElement) {
  vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
    left: 100,
    top: 100,
    width: 220,
    height: 220,
    right: 320,
    bottom: 320,
    x: 100,
    y: 100,
    toJSON: () => {},
  });
}

  it('triggers onSelectStatus on pointerup when a sector is hovered', () => {
    const onSelectStatusMock = vi.fn();
    const onCloseMock = vi.fn();

    const { container } = renderWithProviders(
      <RadialMenu {...defaultProps} onSelectStatus={onSelectStatusMock} onClose={onCloseMock} />
    );

    mockMenuBoundingBox(container.firstChild as HTMLElement);

    // Center is at (210, 210). Pointing up to (210, 150) -> dx = 0, dy = -60 -> angle = 0° / North (dispo)
    fireEvent(window, new PointerEvent('pointermove', { clientX: 210, clientY: 150 }));

    // Releasing the pointer
    fireEvent(window, new PointerEvent('pointerup'));

    expect(onSelectStatusMock).toHaveBeenCalledWith('dispo');
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('closes without onSelectStatus when pointerup happens in the central deadzone', () => {
    const onSelectStatusMock = vi.fn();
    const onCloseMock = vi.fn();

    const { container } = renderWithProviders(
      <RadialMenu {...defaultProps} onSelectStatus={onSelectStatusMock} onClose={onCloseMock} />
    );

    mockMenuBoundingBox(container.firstChild as HTMLElement);

    // Center is at (210, 210). Moving to (212, 212) -> distance < 32px
    fireEvent(window, new PointerEvent('pointermove', { clientX: 212, clientY: 212 }));
    fireEvent(window, new PointerEvent('pointerup'));

    expect(onSelectStatusMock).not.toHaveBeenCalled();
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });
});
