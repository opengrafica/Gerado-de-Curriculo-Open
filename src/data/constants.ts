import type { Coupon, ResumeData, TemplateId } from '@/types'

export const TEMPLATES: {
  id: TemplateId
  name: string
  description: string
  preview: string
}[] = [
  { id: 'moderno', name: 'Moderno', description: 'Layout limpo com destaque em teal.', preview: '#0d9476' },
  { id: 'classico', name: 'Clássico', description: 'Tipografia serifada e estrutura tradicional.', preview: '#3a4251' },
  { id: 'executivo', name: 'Executivo', description: 'Sofisticado para cargos de liderança.', preview: '#1e3a5f' },
  { id: 'minimalista', name: 'Minimalista', description: 'Espaço em branco e tipografia leve.', preview: '#525252' },
  { id: 'azul', name: 'Azul', description: 'Paleta azul corporativa.', preview: '#2563eb' },
  { id: 'preto', name: 'Preto', description: 'Alto contraste e visual impactante.', preview: '#171717' },
  { id: 'criativo', name: 'Criativo', description: 'Toques de cor e seções dinâmicas.', preview: '#ea580c' },
  { id: 'jovem-aprendiz', name: 'Jovem Aprendiz', description: 'Foco em potencial e formação.', preview: '#0891b2' },
  { id: 'primeiro-emprego', name: 'Primeiro Emprego', description: 'Valoriza cursos e habilidades.', preview: '#059669' },
  { id: 'corporativo', name: 'Corporativo', description: 'Padrão ATS-friendly para empresas.', preview: '#0f7661' },
]

export const DEMO_COUPONS: Coupon[] = [
  { code: 'BEMVINDO10', discountPercent: 10, active: true, maxUses: 1000, usedCount: 42 },
  { code: 'CURRICULO20', discountPercent: 20, active: true, maxUses: 100, usedCount: 18 },
  { code: 'AFILIADO15', discountPercent: 15, active: true, usedCount: 7 },
]

export const emptyResume = (): ResumeData => ({
  fullName: '',
  birthDate: '',
  phone: '',
  email: '',
  city: '',
  objective: '',
  professionalSummary: '',
  experiences: [],
  education: [],
  courses: [],
  skills: [],
  languages: [],
  keywords: [],
  templateId: 'moderno',
  aiEnhanced: false,
})

export const DEMO_RESUME: ResumeData = {
  id: 'demo-resume-1',
  fullName: 'Ana Clara Mendes',
  birthDate: '1998-04-12',
  phone: '(11) 98765-4321',
  email: 'ana.mendes@email.com',
  city: 'São Paulo, SP',
  objective:
    'Busco oportunidade como analista de marketing digital para aplicar estratégias de conteúdo e performance.',
  professionalSummary:
    'Profissional de marketing digital com experiência em campanhas de performance, SEO e redes sociais. Foco em resultados mensuráveis e comunicação clara com stakeholders.',
  experiences: [
    {
      id: '1',
      company: 'Agência Norte',
      role: 'Assistente de Marketing',
      startDate: '2022-03',
      endDate: '',
      current: true,
      description:
        'Gestão de redes sociais, criação de relatórios mensais e suporte em campanhas Google Ads e Meta Ads.',
    },
    {
      id: '2',
      company: 'Loja Brilho',
      role: 'Estagiária de Comunicação',
      startDate: '2020-08',
      endDate: '2022-02',
      current: false,
      description: 'Produção de conteúdo para blog e e-mail marketing, com aumento de 30% na taxa de abertura.',
    },
  ],
  education: [
    {
      id: '1',
      institution: 'Universidade Paulista',
      course: 'Publicidade e Propaganda',
      level: 'Graduação',
      startDate: '2017-02',
      endDate: '2021-12',
    },
  ],
  courses: [
    { id: '1', name: 'Google Ads', institution: 'Google Skillshop', year: '2023' },
    { id: '2', name: 'SEO Avançado', institution: 'Alura', year: '2022' },
  ],
  skills: ['Marketing Digital', 'Google Ads', 'Meta Ads', 'SEO', 'Canva', 'Excel', 'Copywriting'],
  languages: [
    { id: '1', name: 'Português', level: 'Nativo' },
    { id: '2', name: 'Inglês', level: 'Intermediário' },
  ],
  keywords: ['marketing digital', 'performance', 'SEO', 'campanhas', 'redes sociais'],
  templateId: 'moderno',
  aiEnhanced: true,
}

export const BENEFITS = [
  {
    title: 'Currículo profissional',
    description: 'Layout limpo, hierarquia clara e visual que transmite confiança.',
  },
  {
    title: 'PDF automático',
    description: 'Após o pagamento, seu arquivo fica pronto para download na hora.',
  },
  {
    title: 'Compatível com vagas',
    description: 'Modelos pensados para ATS e recrutadores brasileiros.',
  },
  {
    title: 'Entrega instantânea',
    description: 'Do formulário ao PDF em poucos minutos — sem espera.',
  },
  {
    title: 'Mais de 10 modelos',
    description: 'Do primeiro emprego ao executivo: escolha o visual ideal.',
  },
]
