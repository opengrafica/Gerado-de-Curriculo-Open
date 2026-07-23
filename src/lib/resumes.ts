import { getSupabase } from '@/lib/supabase'
import { TEMPLATES } from '@/data/constants'
import type { ResumeData, TemplateId } from '@/types'

export type StoredResume = ResumeData & {
  status?: 'draft' | 'paid' | 'generated'
  updatedAt?: string
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function safeResumeId(id?: string) {
  return id && UUID_RE.test(id) ? id : crypto.randomUUID()
}

function safeTemplateId(id?: string): TemplateId {
  return TEMPLATES.some((t) => t.id === id) ? (id as TemplateId) : 'moderno'
}

function mirrorLocal(resume: ResumeData, status: StoredResume['status'], updatedAt: string) {
  const local = JSON.parse(localStorage.getItem('cj_cloud_resumes') || '[]') as StoredResume[]
  const next: StoredResume = { ...resume, status, updatedAt }
  const others = local.filter((r) => r.id !== resume.id)
  localStorage.setItem('cj_cloud_resumes', JSON.stringify([next, ...others]))
}

export async function saveResumeToCloud(params: {
  userId: string
  resume: ResumeData
  status?: 'draft' | 'paid' | 'generated'
}): Promise<string> {
  const id = safeResumeId(params.resume.id)
  const templateId = safeTemplateId(params.resume.templateId)
  const resume: ResumeData = { ...params.resume, id, templateId }
  const status = params.status || 'draft'
  const updatedAt = new Date().toISOString()

  // Sempre espelha localmente para não travar o fluxo do cliente
  mirrorLocal(resume, status, updatedAt)

  const supabase = getSupabase()
  if (!supabase) return id

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const authUserId = session?.user?.id || params.userId

    const payload = {
      id,
      user_id: authUserId,
      data: resume,
      template_id: templateId,
      status,
      updated_at: updatedAt,
    }

    const { error } = await supabase.from('resumes').upsert(payload, { onConflict: 'id' })
    if (error) {
      // Retry sem FK de template (casos de seed incompleto)
      const { error: retryError } = await supabase.from('resumes').upsert(
        { ...payload, template_id: null },
        { onConflict: 'id' },
      )
      if (retryError) {
        console.warn('Falha ao salvar currículo no Supabase; mantido localmente.', retryError.message)
      }
    }
  } catch (err) {
    console.warn('Falha ao sincronizar currículo; mantido localmente.', err)
  }

  return id
}

export async function listUserResumes(userId: string): Promise<StoredResume[]> {
  const supabase = getSupabase()
  if (supabase) {
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
    if (!error && data) {
      return data.map((row) => ({
        ...(row.data as ResumeData),
        id: row.id,
        templateId: safeTemplateId(row.template_id || (row.data as ResumeData)?.templateId),
        status: row.status,
        updatedAt: row.updated_at,
      }))
    }
  }

  const local = JSON.parse(localStorage.getItem('cj_cloud_resumes') || '[]') as StoredResume[]
  return local.map((r) => ({ ...r, templateId: safeTemplateId(r.templateId) }))
}

export async function deleteUserResume(id: string) {
  const supabase = getSupabase()
  if (supabase) {
    await supabase.from('resumes').delete().eq('id', id)
  }
  const local = JSON.parse(localStorage.getItem('cj_cloud_resumes') || '[]') as StoredResume[]
  localStorage.setItem(
    'cj_cloud_resumes',
    JSON.stringify(local.filter((r) => r.id !== id)),
  )
}

export async function markResumePaid(id: string) {
  const supabase = getSupabase()
  if (supabase) {
    await supabase.from('resumes').update({ status: 'paid', updated_at: new Date().toISOString() }).eq('id', id)
  }
  const local = JSON.parse(localStorage.getItem('cj_cloud_resumes') || '[]') as StoredResume[]
  localStorage.setItem(
    'cj_cloud_resumes',
    JSON.stringify(local.map((r) => (r.id === id ? { ...r, status: 'paid' as const } : r))),
  )
}
