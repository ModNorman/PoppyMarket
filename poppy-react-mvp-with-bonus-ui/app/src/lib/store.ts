import { create } from 'zustand'

type User = { id: string, email: string } | null
type Profile = { id: string, full_name: string, role: 'seller'|'admin', status: 'active'|'pending'|'inactive' } | null

type State = {
  user: User
  profile: Profile
  setUser: (u: User) => void
  setProfile: (p: Profile) => void
}

export const useSessionStore = create<State>((set) => ({
  user: null,
  profile: null,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
}))
