import type { ResumeData } from '@/types'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const MODEL = 'google/gemini-2.0-flash-001'

export const isOpenRouterConfigured = Boolean(
  import.meta.env.VITE_OPENROUTER_API_KEY &&
    !String(import.meta.env.VITE_OPENROUTER_API_KEY).includes('your-'),
)

export interface AiEnhanceResult {
  objective: string
  professionalSummary: string
  experiences: { id: string; description: string }[]
  keywords: string[]
  skills: string[]
}

function mockEnhance(data: ResumeData): AiEnhanceResult {
  const roleHint = data.experiences[0]?.role || data.objective.slice(0, 40) || 'profissional'
  return {
    objective: data.objective
      ? `${data.objective.replace(/\.$/, '')}. Comprometida(o) com resultados, aprendizado contínuo e contribuição para o crescimento da equipe.`
      : `Busco oportunidade como ${roleHint}, aplicando minhas habilidades para gerar impacto positivo e resultados mensuráveis.`,
    professionalSummary: data.professionalSummary
      ? data.professionalSummary
      : `${data.fullName || 'Profissional'} com atuação em ${data.city || 'sua região'}, experiência em ${roleHint} e foco em entrega de qualidade. Habilidades em comunicação, organização e resolução de problemas.`,
    experiences: data.experiences.map((exp) => ({
      id: exp.id,
      description:
        exp.description ||
        `Responsável por atividades de ${exp.role} na ${exp.company}, com foco em produtividade, colaboração e melhoria contínua dos processos.`,
    })),
    keywords: [
      ...new Set([
        ...data.skills.slice(0, 5),
        'proatividade',
        'trabalho em equipe',
        'comunicação',
        'organização',
        roleHint.toLowerCase().split(' ')[0],
      ]),
    ].filter(Boolean),
    skills: data.skills.length
      ? data.skills
      : ['Comunicação', 'Organização', 'Pacote Office', 'Trabalho em equipe'],
  }
}

export async function enhanceResumeWithAI(data: ResumeData): Promise<AiEnhanceResult> {
  if (!isOpenRouterConfigured) {
    await new Promise((r) => setTimeout(r, 800))
    return mockEnhance(data)
  }

  const prompt = `Você é um especialista em RH e redação de currículos no Brasil.
Melhore o currículo abaixo:
- Corrija português
- Torne textos mais profissionais e persuasivos
- Sugira palavras-chave ATS
- Crie um resumo profissional forte

Retorne APENAS JSON válido no formato:
{
  "objective": "...",
  "professionalSummary": "...",
  "experiences": [{"id":"...","description":"..."}],
  "keywords": ["..."],
  "skills": ["..."]
}

Dados:
${JSON.stringify({
    fullName: data.fullName,
    city: data.city,
    objective: data.objective,
    experiences: data.experiences,
    education: data.education,
    courses: data.courses,
    skills: data.skills,
    languages: data.languages,
  })}`

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'CurriculoJa',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      }),
    })

    if (!res.ok) throw new Error(`OpenRouter ${res.status}`)
    const json = await res.json()
    const content = json.choices?.[0]?.message?.content
    const parsed = typeof content === 'string' ? JSON.parse(content) : content
    return {
      objective: parsed.objective || data.objective,
      professionalSummary: parsed.professionalSummary || '',
      experiences: parsed.experiences || [],
      keywords: parsed.keywords || [],
      skills: parsed.skills || data.skills,
    }
  } catch {
    return mockEnhance(data)
  }
}

export async function generateCoverLetter(data: ResumeData): Promise<string> {
  if (!isOpenRouterConfigured) {
    return `Prezado(a) responsável pela seleção,

Meu nome é ${data.fullName} e gostaria de me candidatar à vaga alinhada ao meu objetivo: ${data.objective || 'contribuir com minha experiência profissional'}.

Com formação e trajetória em ${data.city || 'minha região'}, destaco minha capacidade de entrega, comunicação e aprendizado contínuo. Estou à disposição para uma conversa e envio em anexo meu currículo.

Atenciosamente,
${data.fullName}
${data.phone}
${data.email}`
  }

  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'CurriculoJa',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: 'user',
          content: `Escreva uma carta de apresentação curta e profissional em português (BR) para: ${JSON.stringify(data)}`,
        },
      ],
    }),
  })
  const json = await res.json()
  return json.choices?.[0]?.message?.content || ''
}

export async function generateLinkedInProfile(data: ResumeData): Promise<string> {
  if (!isOpenRouterConfigured) {
    return `Headline: ${data.experiences[0]?.role || 'Profissional'} | ${data.city || 'Brasil'}

Sobre:
${data.professionalSummary || data.objective}

Destaques:
${data.skills.map((s) => `• ${s}`).join('\n')}

Palavras-chave: ${(data.keywords || []).join(', ')}`
  }

  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'CurriculoJa',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: 'user',
          content: `Crie headline + sobre + seções para LinkedIn em português com base em: ${JSON.stringify(data)}`,
        },
      ],
    }),
  })
  const json = await res.json()
  return json.choices?.[0]?.message?.content || ''
}
