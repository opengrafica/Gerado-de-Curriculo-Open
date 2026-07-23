import type { ResumeData } from '@/types'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const MODEL = 'google/gemini-2.0-flash-001'

export const isOpenRouterConfigured = Boolean(
  import.meta.env.VITE_OPENROUTER_API_KEY &&
    !String(import.meta.env.VITE_OPENROUTER_API_KEY).includes('your-'),
)

export interface AiEnhanceResult {
  professionalSummary: string
  experiences: { id: string; description: string }[]
}

function mockEnhance(data: ResumeData): AiEnhanceResult {
  const role = data.experiences[0]?.role || 'profissional'
  return {
    professionalSummary: data.professionalSummary
      ? data.professionalSummary
      : `${data.fullName || 'Profissional'} ${data.nationality ? `(${data.nationality})` : ''}, com formação e experiência em ${role}. Comunicativa, organizada e pronta para contribuir com resultados.`.replace(/\s+/g, ' ').trim(),
    experiences: data.experiences.map((exp) => ({
      id: exp.id,
      description:
        exp.description ||
        `Atuação como ${exp.role || 'colaborador(a)'} na ${exp.company || 'empresa'}, com foco em qualidade, atendimento e cumprimento de metas.`,
    })),
  }
}

export async function enhanceResumeWithAI(data: ResumeData): Promise<AiEnhanceResult> {
  if (!isOpenRouterConfigured) {
    await new Promise((r) => setTimeout(r, 700))
    return mockEnhance(data)
  }

  const prompt = `Você é especialista em currículos no Brasil.
Melhore o currículo abaixo: corrija português, torne textos profissionais e crie um resumo curto.
Retorne APENAS JSON:
{"professionalSummary":"...","experiences":[{"id":"...","description":"..."}]}

Dados:
${JSON.stringify({
    fullName: data.fullName,
    address: data.address,
    nationality: data.nationality,
    maritalStatus: data.maritalStatus,
    education: data.education,
    courses: data.courses,
    experiences: data.experiences,
  })}`

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Curriculo OPEN',
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
      professionalSummary: parsed.professionalSummary || '',
      experiences: parsed.experiences || [],
    }
  } catch {
    return mockEnhance(data)
  }
}
