import { renderWithProviders, screen, fireEvent, act } from '../../test/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginForm } from './LoginForm';
import { supabase } from '../../lib/supabase';
import type { Session, User, AuthError } from '@supabase/supabase-js';

// Mock Supabase Auth
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
    },
  },
}));

describe('LoginForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form inputs and submit button', () => {
    renderWithProviders(<LoginForm />);

    expect(screen.getByRole('heading', { name: /Accès Sécurisé/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Identifiant/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Mot de passe/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Se connecter/i })).toBeInTheDocument();
  });

  it('submits form with user credentials transforming plain username into email', async () => {
    const mockUser = { id: 'u1' } as User;
    const mockSession = {} as Session;
    const mockSignIn = vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: mockUser, session: mockSession },
      error: null,
    });

    renderWithProviders(<LoginForm />);

    const usernameInput = screen.getByLabelText(/Identifiant/i);
    const passwordInput = screen.getByLabelText(/Mot de passe/i);

    fireEvent.change(usernameInput, { target: { value: 'admin' } });
    fireEvent.change(passwordInput, { target: { value: 'secret' } });

    await act(async () => {
      fireEvent.submit(screen.getByRole('button', { name: /Se connecter/i }).closest('form')!);
    });

    expect(mockSignIn).toHaveBeenCalledWith({
      email: 'admin@carte-equipe.local',
      password: 'secret',
    });
  });

  it('displays error message when login fails', async () => {
    const mockError = { message: 'Invalid login' } as AuthError;
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: null, session: null },
      error: mockError,
    });

    renderWithProviders(<LoginForm />);

    const usernameInput = screen.getByLabelText(/Identifiant/i);
    const passwordInput = screen.getByLabelText(/Mot de passe/i);

    fireEvent.change(usernameInput, { target: { value: 'wronguser' } });
    fireEvent.change(passwordInput, { target: { value: 'badpassword' } });

    await act(async () => {
      fireEvent.submit(screen.getByRole('button', { name: /Se connecter/i }).closest('form')!);
    });

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Identifiants incorrects ou utilisateur inexistant/i)).toBeInTheDocument();
  });
});
