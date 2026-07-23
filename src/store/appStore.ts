import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ResumeData, UserProfile } from '@/types'
import { emptyResume, DEMO_RESUME } from '@/data/constants'

interface AppState {
  user: UserProfile | null
  resume: ResumeData
  resumes: ResumeData[]
  darkMode: boolean
  paid: boolean
  couponCode: string
  affiliateCode: string
  coverLetter: string
  linkedInText: string
  setUser: (user: UserProfile | null) => void
  setResume: (resume: Partial<ResumeData>) => void
  replaceResume: (resume: ResumeData) => void
  saveCurrentResume: () => void
  loadDemo: () => void
  resetResume: () => void
  toggleDarkMode: () => void
  setPaid: (paid: boolean) => void
  setCouponCode: (code: string) => void
  setAffiliateCode: (code: string) => void
  setCoverLetter: (text: string) => void
  setLinkedInText: (text: string) => void
  logout: () => void
}

function uid() {
  return crypto.randomUUID()
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      resume: emptyResume(),
      resumes: [],
      darkMode: false,
      paid: false,
      couponCode: '',
      affiliateCode: '',
      coverLetter: '',
      linkedInText: '',
      setUser: (user) => set({ user }),
      setResume: (partial) => set({ resume: { ...get().resume, ...partial } }),
      replaceResume: (resume) => set({ resume }),
      saveCurrentResume: () => {
        const current = { ...get().resume, id: get().resume.id || uid() }
        const others = get().resumes.filter((r) => r.id !== current.id)
        set({ resume: current, resumes: [current, ...others] })
      },
      loadDemo: () => set({ resume: { ...DEMO_RESUME, id: uid() } }),
      resetResume: () => set({ resume: emptyResume() }),
      toggleDarkMode: () => {
        const next = !get().darkMode
        document.documentElement.classList.toggle('dark', next)
        set({ darkMode: next })
      },
      setPaid: (paid) => set({ paid }),
      setCouponCode: (couponCode) => set({ couponCode }),
      setAffiliateCode: (affiliateCode) => set({ affiliateCode }),
      setCoverLetter: (coverLetter) => set({ coverLetter }),
      setLinkedInText: (linkedInText) => set({ linkedInText }),
      logout: () => set({ user: null, paid: false }),
    }),
    {
      name: 'curriculoja-store',
      partialize: (s) => ({
        user: s.user,
        resume: s.resume,
        resumes: s.resumes,
        darkMode: s.darkMode,
        paid: s.paid,
        couponCode: s.couponCode,
        affiliateCode: s.affiliateCode,
        coverLetter: s.coverLetter,
        linkedInText: s.linkedInText,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.darkMode) {
          document.documentElement.classList.add('dark')
        }
      },
    },
  ),
)
