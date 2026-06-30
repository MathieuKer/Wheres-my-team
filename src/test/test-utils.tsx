/* eslint-disable react-refresh/only-export-components */
import React from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { AuthContext, type AuthContextType } from '../lib/AuthContext';
import { SWRConfig } from 'swr';
import { vi } from 'vitest';

interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
  authState?: Partial<AuthContextType>;
}

const defaultAuthContext: AuthContextType = {
  session: null,
  user: null,
  loading: false,
  signOut: vi.fn().mockResolvedValue(undefined),
};

export function renderWithProviders(
  ui: React.ReactElement,
  { authState, ...renderOptions }: ExtendedRenderOptions = {}
) {
  const mergedAuthContext = {
    ...defaultAuthContext,
    ...authState,
  } as AuthContextType;

  function Wrapper({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
      <SWRConfig value={{ provider: () => new Map() }}>
        <AuthContext.Provider value={mergedAuthContext}>
          {children}
        </AuthContext.Provider>
      </SWRConfig>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Re-export everything from React Testing Library
export * from '@testing-library/react';
