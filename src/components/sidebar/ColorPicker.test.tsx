import { renderWithProviders, screen, fireEvent } from '../../test/test-utils';
import { describe, it, expect, vi } from 'vitest';
import { ColorPicker } from './ColorPicker';

describe('ColorPicker Component', () => {
  it('renders trigger button and opens popover on click', () => {
    const onChangeMock = vi.fn();
    renderWithProviders(<ColorPicker color="#3b82f6" onChange={onChangeMock} />);

    const triggerBtn = screen.getByTitle('Choisir une couleur');
    expect(triggerBtn).toBeInTheDocument();

    // Popover portal should not be visible before click
    expect(document.getElementById('color-picker-portal')).not.toBeInTheDocument();

    fireEvent.click(triggerBtn);

    // Popover portal should now exist
    const portal = document.getElementById('color-picker-portal');
    expect(portal).toBeInTheDocument();
  });

  it('selects color when swatch is clicked and calls onChange', () => {
    const onChangeMock = vi.fn();
    renderWithProviders(<ColorPicker color="#3b82f6" onChange={onChangeMock} />);

    const triggerBtn = screen.getByTitle('Choisir une couleur');
    fireEvent.click(triggerBtn);

    const portal = document.getElementById('color-picker-portal')!;
    const swatchButtons = portal.querySelectorAll('button');
    expect(swatchButtons.length).toBeGreaterThan(0);

    // Click red swatch (#ef4444)
    fireEvent.click(swatchButtons[4]);

    expect(onChangeMock).toHaveBeenCalledWith('#ef4444');
    expect(document.getElementById('color-picker-portal')).not.toBeInTheDocument();
  });
});
