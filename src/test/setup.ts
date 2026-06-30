import { vi } from 'vitest'
import '@testing-library/jest-dom'

// Mock Supabase globally for all tests
vi.mock('../lib/supabase', () => {
  const mockStorageBucket = {
    upload: vi.fn().mockResolvedValue({ data: { path: 'mocked-path' }, error: null }),
    getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/mocked.png' } }),
  }

  const mockQueryBuilder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    then: vi.fn((onfulfilled) => {
      return Promise.resolve({ data: [], error: null }).then(onfulfilled)
    }),
  }

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
    from: vi.fn().mockReturnValue(mockQueryBuilder),
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
