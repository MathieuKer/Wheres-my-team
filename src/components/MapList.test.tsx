import { renderWithProviders, screen, act } from '../test/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MapList } from './MapList'
import { mapRepo } from '../lib/repositories/map'

// Mock the map repository module
vi.mock('../lib/repositories/map', () => ({
  mapRepo: {
    getAll: vi.fn(),
    subscribe: vi.fn(() => vi.fn()),
    create: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('MapList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading spinner and then the maps list', async () => {
    const mockMaps = [
      { id: '1', name: 'Map Alpha', created_at: '2026-06-30T12:00:00Z', owner_id: 'user1', image_url: null },
      { id: '2', name: 'Map Beta', created_at: '2026-06-30T13:00:00Z', owner_id: 'user1', image_url: null },
    ]

    vi.mocked(mapRepo.getAll).mockResolvedValue(mockMaps)

    await act(async () => {
      renderWithProviders(<MapList onSelectMap={vi.fn()} signOut={vi.fn()} />)
    })

    expect(screen.getByText('Vos Cartes')).toBeInTheDocument()
    expect(screen.getByText('Map Alpha')).toBeInTheDocument()
    expect(screen.getByText('Map Beta')).toBeInTheDocument()
  })

  it('calls signOut when logout button is clicked', async () => {
    vi.mocked(mapRepo.getAll).mockResolvedValue([])
    const mockSignOut = vi.fn()

    await act(async () => {
      renderWithProviders(<MapList onSelectMap={vi.fn()} signOut={mockSignOut} />)
    })

    const logoutBtn = screen.getByRole('button', { name: /Déconnexion/i })
    logoutBtn.click()

    expect(mockSignOut).toHaveBeenCalledTimes(1)
  })
})
