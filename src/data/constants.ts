import type { Coupon, ResumeData, TemplateId } from '@/types'

export const TEMPLATES: {
  id: TemplateId
  name: string
  description: string
  preview: string
}[] = [
  { id: 'moderno', name: 'Moderno', description: 'Limpo e atual.', preview: '#00AEEF' },
  { id: 'classico', name: 'Clássico', description: 'Tradicional e elegante.', preview: '#111111' },
  { id: 'executivo', name: 'Executivo', description: 'Sofisticado para liderança.', preview: '#1e3a5f' },
  { id: 'minimalista', name: 'Minimalista', description: 'Espaçoso e direto.', preview: '#525252' },
  { id: 'azul', name: 'Azul', description: 'Tom corporativo cyan.', preview: '#00AEEF' },
  { id: 'preto', name: 'Preto', description: 'Alto contraste.', preview: '#111111' },
  { id: 'criativo', name: 'Criativo', description: 'Toque magenta OPEN.', preview: '#EC008C' },
  { id: 'jovem-aprendiz', name: 'Jovem Aprendiz', description: 'Foco em potencial.', preview: '#00AEEF' },
  { id: 'primeiro-emprego', name: 'Primeiro Emprego', description: 'Valoriza formação.', preview: '#EC008C' },
  { id: 'corporativo', name: 'Corporativo', description: 'Padrão empresas.', preview: '#111111' },
]

export const DEMO_COUPONS: Coupon[] = [
  { code: 'BEMVINDO10', discountPercent: 10, active: true, maxUses: 1000, usedCount: 42 },
  { code: 'CURRICULO20', discountPercent: 20, active: true, maxUses: 100, usedCount: 18 },
  { code: 'AFILIADO15', discountPercent: 15, active: true, usedCount: 7 },
]

export const MARITAL_STATUS = ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União estável']

export const emptyResume = (): ResumeData => ({
  fullName: '',
  address: '',
  birthDate: '',
  nationality: 'Brasileira',
  maritalStatus: 'Solteiro(a)',
  phone: '',
  email: '',
  education: [],
  courses: [],
  experiences: [],
  professionalSummary: '',
  templateId: 'moderno',
  aiEnhanced: false,
})

export const DEMO_RESUME: ResumeData = {
  id: 'demo-resume-1',
  fullName: 'Ana Clara Mendes',
  address: 'Rua das Flores, 120 — São Paulo, SP',
  birthDate: '1998-04-12',
  nationality: 'Brasileira',
  maritalStatus: 'Solteiro(a)',
  phone: '(11) 98765-4321',
  email: 'ana.mendes@email.com',
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
    title: 'PDF automático',
    description: 'Após o Pix, baixe na hora.',
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
    title: '10 modelos',
    description: 'Escolha o visual ideal para sua área.',
  },
]
