import { vi } from 'vitest'
import '@testing-library/jest-dom'

// Mock Supabase globally for all tests
vi.mock('../lib/supabase', () => {
  const mockStorageBucket = {
    upload: vi.fn().mockResolvedValue({ data: { path: 'mocked-path' }, error: null }),
    getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/mocked.png' } }),
  }

  const createMockQueryBuilder = () => {
    const result = { data: [], error: null };
    const promise = Promise.resolve(result);
    return {
      select: vi.fn().mockReturnValue(promise),
      insert: vi.fn().mockReturnValue(promise),
      update: vi.fn().mockReturnValue(promise),
      delete: vi.fn().mockReturnValue(promise),
      eq: vi.fn().mockReturnValue(promise),
      order: vi.fn().mockReturnValue(promise),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
  };

  const mockSupabase = {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: { session: {} }, error: null }),
    },
    from: vi.fn().mockImplementation(() => createMockQueryBuilder()),
    storage: {
      from: vi.fn().mockReturnValue(mockStorageBucket),
    },
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
      unsubscribe: vi.fn(),
    }),
    removeChannel: vi.fn().mockResolvedValue(undefined),
  }
  return {
    supabase: mockSupabase,
  }
})
