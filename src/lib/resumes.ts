import { getSupabase } from '@/lib/supabase'
import type { ResumeData } from '@/types'

export type StoredResume = ResumeData & {
  status?: 'draft' | 'paid' | 'generated'
  updatedAt?: string
}

export async function saveResumeToCloud(params: {
  userId: string
  resume: ResumeData
  status?: 'draft' | 'paid' | 'generated'
}): Promise<string> {
  const id = params.resume.id || crypto.randomUUID()
  const payload = {
    id,
    user_id: params.userId,
    data: { ...params.resume, id },
    template_id: params.resume.templateId,
    status: params.status || 'draft',
    updated_at: new Date().toISOString(),
  }

  const supabase = getSupabase()
  if (supabase) {
    const { error } = await supabase.from('resumes').upsert(payload, { onConflict: 'id' })
    if (error) throw error
  }

  // local mirror
  const local = JSON.parse(localStorage.getItem('cj_cloud_resumes') || '[]') as StoredResume[]
  const next: StoredResume = {
    ...params.resume,
    id,
    status: params.status || 'draft',
    updatedAt: payload.updated_at,
  }
  const others = local.filter((r) => r.id !== id)
  localStorage.setItem('cj_cloud_resumes', JSON.stringify([next, ...others]))
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
        templateId: row.template_id || (row.data as ResumeData)?.templateId || 'moderno',
        status: row.status,
        updatedAt: row.updated_at,
      }))
    }
  }

  const local = JSON.parse(localStorage.getItem('cj_cloud_resumes') || '[]') as StoredResume[]
  return local
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
