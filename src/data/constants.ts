import type { Coupon, ResumeData, TemplateId } from '@/types'

export const TEMPLATES: {
  id: TemplateId
  name: string
  description: string
  preview: string
}[] = [
  {
    id: 'moderno',
    name: 'Corporativo Cinza',
    description: 'Sidebar grafite e acentos prata — visual chamativo para empresas.',
    preview: 'linear-gradient(135deg,#1f2937 0%,#374151 45%,#9ca3af 100%)',
  },
  {
    id: 'classico',
    name: 'Executivo Grafite',
    description: 'Cabeçalho premium em cinza escuro — elegante e corporativo.',
    preview: 'linear-gradient(135deg,#111827 0%,#1f2937 50%,#6b7280 100%)',
  },
]

export const DEMO_COUPONS: Coupon[] = [
  { code: 'BEMVINDO10', discountPercent: 10, active: true, maxUses: 1000, usedCount: 42 },
  { code: 'CURRICULO20', discountPercent: 20, active: true, maxUses: 100, usedCount: 18 },
]

export const NATIONALITIES = ['Brasileiro', 'Brasileira'] as const

export const MARITAL_STATUS_BY_NATIONALITY: Record<(typeof NATIONALITIES)[number], string[]> = {
  Brasileiro: ['Solteiro', 'Casado', 'Divorciado', 'Viúvo', 'União estável'],
  Brasileira: ['Solteira', 'Casada', 'Divorciada', 'Viúva', 'União estável'],
}

export const MARITAL_STATUS = [
  ...MARITAL_STATUS_BY_NATIONALITY.Brasileiro,
  ...MARITAL_STATUS_BY_NATIONALITY.Brasileira.filter((s) => s !== 'União estável'),
]

export function maritalOptionsFor(nationality?: string) {
  if (nationality === 'Brasileiro') return MARITAL_STATUS_BY_NATIONALITY.Brasileiro
  if (nationality === 'Brasileira') return MARITAL_STATUS_BY_NATIONALITY.Brasileira
  return MARITAL_STATUS_BY_NATIONALITY.Brasileira
}

export const emptyResume = (): ResumeData => ({
  fullName: '',
  address: '',
  birthDate: '',
  nationality: 'Brasileiro',
  maritalStatus: 'Solteiro',
  phone: '',
  email: '',
  includePhoto: false,
  photoDataUrl: undefined,
  education: [],
  courses: [],
  experiences: [],
  professionalSummary: '',
  templateId: 'moderno',
  aiEnhanced: false,
})

export const DEMO_RESUME: ResumeData = {
  id: crypto.randomUUID?.() || undefined,
  fullName: 'Ana Clara Mendes',
  address: 'Rua das Flores, 120 — São Paulo, SP',
  birthDate: '1998-04-12',
  nationality: 'Brasileira',
  maritalStatus: 'Solteira',
  phone: '(11) 98765-4321',
  email: 'ana.mendes@email.com',
  includePhoto: false,
  photoDataUrl: undefined,
  education: [
    {
      id: '1',
      institution: 'Universidade Paulista',
      course: 'Graduação em Publicidade e Propaganda',
      year: '2021',
    },
  ],
  courses: [
    { id: '1', name: 'Google Ads', institution: 'Google Skillshop', year: '2023' },
    { id: '2', name: 'Excel Avançado', institution: 'Senac', year: '2022' },
  ],
  experiences: [
    {
      id: '1',
      company: 'Agência Norte',
      role: 'Assistente de Marketing',
      startDate: '2022-03',
      endDate: '',
      current: true,
      description: 'Gestão de redes sociais e suporte em campanhas digitais.',
    },
  ],
  professionalSummary:
    'Profissional organizada, comunicativa e com experiência em atendimento e marketing digital.',
  templateId: 'moderno',
  aiEnhanced: true,
}

export const BENEFITS = [
  {
    title: 'Currículo profissional',
    description: 'Formato limpo, pronto para enviar em vagas.',
  },
  {
    title: 'PDF e Word',
    description: 'Após o Pix, baixe os dois arquivos.',
  },
  {
    title: 'Rápido e simples',
    description: 'Preencha poucos campos e finalize em minutos.',
  },
  {
    title: 'Entrega instantânea',
    description: 'Sem espera e sem complicação.',
  },
  {
    title: '2 modelos + foto',
    description: 'Corporativo Cinza ou Executivo Grafite, com foto opcional e prévia ao vivo.',
  },
]
