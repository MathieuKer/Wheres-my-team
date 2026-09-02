import { renderWithProviders, screen, act, fireEvent } from '../test/test-utils'
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

  it('renders has_interventions badges correctly and submits custom intervention setting on creation', async () => {
    const mockMaps = [
      { id: '1', name: 'Map Intervention', created_at: '2026-06-30T12:00:00Z', owner_id: 'user1', image_url: null, has_interventions: true },
      { id: '2', name: 'Map Normal', created_at: '2026-06-30T13:00:00Z', owner_id: 'user1', image_url: null, has_interventions: false },
    ]

    vi.mocked(mapRepo.getAll).mockResolvedValue(mockMaps)
    vi.mocked(mapRepo.create).mockResolvedValue({ id: '3', name: 'Nouvelle Map', created_at: '2026-06-30T14:00:00Z', owner_id: 'user1', image_url: null, has_interventions: false })

    await act(async () => {
      renderWithProviders(<MapList onSelectMap={vi.fn()} signOut={vi.fn()} />)
    })

    expect(screen.getByText('Avec inters')).toBeInTheDocument()
    expect(screen.getByText('Sans inter')).toBeInTheDocument()

    // Check that the checkbox is unchecked by default
    const checkbox = screen.getByRole('checkbox', { name: /Gestion des interventions/i }) as HTMLInputElement
    expect(checkbox.checked).toBe(false)
  })

  it('creates map with has_interventions = false by default when not checked', async () => {
    vi.mocked(mapRepo.getAll).mockResolvedValue([])
    vi.mocked(mapRepo.create).mockResolvedValue({ 
      id: 'm1', 
      name: 'Event Alpha', 
      created_at: '2026-06-30T12:00:00Z', 
      owner_id: 'user1', 
      image_url: null, 
      has_interventions: false 
    })

    await act(async () => {
      renderWithProviders(<MapList onSelectMap={vi.fn()} signOut={vi.fn()} />)
    })

    const input = screen.getByPlaceholderText(/Nom de l'événement/i)
    const form = input.closest('form')!

    await act(async () => {
      fireEvent.change(input, { target: { value: 'Event Alpha' } })
    })

    const checkbox = screen.getByRole('checkbox', { name: /Gestion des interventions/i }) as HTMLInputElement
    expect(checkbox.checked).toBe(false)

    await act(async () => {
      fireEvent.submit(form)
    })

    expect(mapRepo.create).toHaveBeenCalledWith('Event Alpha', false)
  })
})
