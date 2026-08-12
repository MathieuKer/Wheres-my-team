import { renderWithProviders, screen } from '../../test/test-utils';
import { describe, it, expect } from 'vitest';
import { StretcherIcon } from './StretcherIcon';

describe('StretcherIcon Component', () => {
  it('renders stretcher svg with accessible label', () => {
    renderWithProviders(<StretcherIcon />);
    const icon = screen.getByLabelText('Civière');
    expect(icon).toBeInTheDocument();
    expect(icon.tagName.toLowerCase()).toBe('svg');
  });
});
