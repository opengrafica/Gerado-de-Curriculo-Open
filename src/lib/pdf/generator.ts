import { jsPDF } from 'jspdf'
import type { ResumeData, TemplateId } from '@/types'
import { TEMPLATES } from '@/data/constants'
import { hasResumePhoto } from '@/lib/photo'

function formatPeriod(start: string, end: string, current?: boolean) {
  const fmt = (v: string) => {
    if (!v) return ''
    const [y, m] = v.split('-')
    return m ? `${m}/${y}` : y
  }
  return `${fmt(start)} — ${current ? 'Atual' : fmt(end) || '—'}`
}

function formatBirth(iso: string) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso || ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function resolveTemplate(id?: TemplateId): TemplateId {
  return id === 'classico' ? 'classico' : 'moderno'
}

function addPhoto(doc: jsPDF, dataUrl: string, x: number, y: number, size: number) {
  try {
    const format = dataUrl.includes('image/png') ? 'PNG' : 'JPEG'
    doc.addImage(dataUrl, format, x, y, size, size)
  } catch {
    // ignora foto inválida
  }
}

/** Modelo 1 — Corporativo Cinza: sidebar grafite + acentos prata (chamativo para empresas) */
function drawModerno(doc: jsPDF, data: ResumeData) {
  const pageW = 210
  const pageH = 297
  const graphite: [number, number, number] = [55, 65, 81]
  const slate: [number, number, number] = [31, 41, 55]
  const silver: [number, number, number] = [156, 163, 175]
  const ink: [number, number, number] = [17, 24, 39]
  const muted: [number, number, number] = [107, 114, 128]
  const sideW = 64
  const showPhoto = hasResumePhoto(data)

  doc.setFillColor(...graphite)
  doc.rect(0, 0, sideW, pageH, 'F')
  doc.setFillColor(...slate)
  doc.rect(0, 0, sideW, 58, 'F')
  doc.setFillColor(...silver)
  doc.rect(sideW - 2.2, 0, 2.2, pageH, 'F')

  let sy = 12
  if (showPhoto && data.photoDataUrl) {
    const photoSize = 34
    const px = (sideW - photoSize) / 2
    doc.setFillColor(255, 255, 255)
    doc.circle(sideW / 2, sy + photoSize / 2, photoSize / 2 + 1.8, 'F')
    addPhoto(doc, data.photoDataUrl, px, sy, photoSize)
    sy += photoSize + 9
  } else {
    sy = 18
  }

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.text('CONTATO', 8, sy)
  sy += 2
  doc.setDrawColor(...silver)
  doc.setLineWidth(0.4)
  doc.line(8, sy, sideW - 8, sy)
  sy += 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.2)
  ;[data.phone, data.email, data.address].filter(Boolean).forEach((line) => {
    const lines = doc.splitTextToSize(String(line), sideW - 14)
    doc.text(lines, 8, sy)
    sy += lines.length * 3.5 + 2.4
  })

  sy += 6
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.text('PERFIL', 8, sy)
  sy += 2
  doc.line(8, sy, sideW - 8, sy)
  sy += 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.2)
  ;[
    data.birthDate ? `Nasc.: ${formatBirth(data.birthDate)}` : '',
    data.nationality || '',
    data.maritalStatus || '',
  ]
    .filter(Boolean)
    .forEach((line) => {
      const lines = doc.splitTextToSize(String(line), sideW - 14)
      doc.text(lines, 8, sy)
      sy += lines.length * 3.5 + 2
    })

  // faixa inferior da sidebar
  doc.setFillColor(...slate)
  doc.rect(0, pageH - 18, sideW, 18, 'F')
  doc.setFontSize(6.5)
  doc.setTextColor(...silver)
  doc.text('CURRÍCULO OPEN', sideW / 2, pageH - 8, { align: 'center' })

  const mx = sideW + 12
  const contentW = pageW - mx - 14
  let y = 20

  doc.setTextColor(...ink)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(21)
  const nameLines = doc.splitTextToSize(data.fullName || 'Seu Nome', contentW)
  doc.text(nameLines, mx, y)
  y += nameLines.length * 7.8 + 1

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...muted)
  doc.text('CURRÍCULO PROFISSIONAL', mx, y)
  y += 4
  doc.setFillColor(...slate)
  doc.rect(mx, y, 36, 1.6, 'F')
  doc.setFillColor(...silver)
  doc.rect(mx + 37, y, 12, 1.6, 'F')
  y += 9

  const ensure = (need: number) => {
    if (y + need > 280) {
      doc.addPage()
      doc.setFillColor(...graphite)
      doc.rect(0, 0, sideW, pageH, 'F')
      doc.setFillColor(...silver)
      doc.rect(sideW - 2.2, 0, 2.2, pageH, 'F')
      y = 20
    }
  }

  const section = (title: string) => {
    ensure(14)
    doc.setFillColor(243, 244, 246)
    doc.roundedRect(mx - 2, y - 4.5, contentW + 4, 8, 1, 1, 'F')
    doc.setTextColor(...slate)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text(title.toUpperCase(), mx, y)
    y += 7
    doc.setTextColor(...ink)
  }

  if (data.professionalSummary) {
    section('Resumo profissional')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    const lines = doc.splitTextToSize(data.professionalSummary, contentW)
    ensure(lines.length * 4.1 + 4)
    doc.text(lines, mx, y)
    y += lines.length * 4.1 + 6
  }

  if (data.experiences.length) {
    section('Experiência profissional')
    data.experiences.forEach((exp) => {
      ensure(22)
      doc.setFillColor(...silver)
      doc.circle(mx + 1.2, y - 1.2, 1.3, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(...ink)
      doc.text(exp.role || 'Cargo', mx + 5, y)
      y += 4.2
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(...muted)
      doc.text(`${exp.company}  ·  ${formatPeriod(exp.startDate, exp.endDate, exp.current)}`, mx + 5, y)
      y += 4.5
      doc.setTextColor(...ink)
      if (exp.description) {
        doc.setFontSize(8.5)
        const lines = doc.splitTextToSize(exp.description, contentW - 5)
        ensure(lines.length * 3.7 + 4)
        doc.text(lines, mx + 5, y)
        y += lines.length * 3.7 + 5
      } else y += 3
    })
  }

  if (data.education.length) {
    section('Escolaridade')
    data.education.forEach((ed) => {
      ensure(12)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9.5)
      doc.setTextColor(...ink)
      doc.text(ed.course || 'Formação', mx, y)
      y += 4
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(...muted)
      doc.text(`${ed.institution}${ed.year ? `  ·  ${ed.year}` : ''}`, mx, y)
      y += 6.5
    })
  }

  if (data.courses.length) {
    section('Cursos e qualificações')
    data.courses.forEach((c) => {
      ensure(8)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
      doc.setTextColor(...ink)
      const line = `•  ${c.name}${c.institution ? ` — ${c.institution}` : ''}${c.year ? ` (${c.year})` : ''}`
      const lines = doc.splitTextToSize(line, contentW)
      doc.text(lines, mx, y)
      y += lines.length * 3.7 + 2.8
    })
  }
}

/** Modelo 2 — Executivo Grafite: cabeçalho premium cinza + tipografia limpa */
function drawClassico(doc: jsPDF, data: ResumeData) {
  const pageW = 210
  const pageH = 297
  const slate: [number, number, number] = [31, 41, 55]
  const mid: [number, number, number] = [75, 85, 99]
  const silver: [number, number, number] = [156, 163, 175]
  const ink: [number, number, number] = [17, 24, 39]
  const muted: [number, number, number] = [107, 114, 128]
  const showPhoto = hasResumePhoto(data)
  const margin = 16
  const headerH = showPhoto ? 52 : 40

  doc.setFillColor(...slate)
  doc.rect(0, 0, pageW, headerH, 'F')
  doc.setFillColor(...mid)
  doc.rect(0, headerH - 8, pageW, 8, 'F')
  doc.setFillColor(...silver)
  doc.rect(0, headerH, pageW, 2, 'F')

  // detalhe geométrico
  doc.setFillColor(55, 65, 81)
  doc.triangle(pageW - 42, 0, pageW, 0, pageW, 28, 'F')

  if (showPhoto && data.photoDataUrl) {
    doc.setFillColor(255, 255, 255)
    doc.circle(pageW - 28, 24, 16.8, 'F')
    addPhoto(doc, data.photoDataUrl, pageW - 42, 10, 28)
  }

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  const nameMax = showPhoto ? pageW - 68 : pageW - 32
  const nameLines = doc.splitTextToSize(data.fullName || 'Seu Nome', nameMax)
  doc.text(nameLines, margin, 17)
  let hy = 17 + nameLines.length * 7.2

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(229, 231, 235)
  doc.text('CURRÍCULO PROFISSIONAL PARA EMPRESAS', margin, hy)
  hy += 5
  const contact = [data.phone, data.email, data.address].filter(Boolean).join('  ·  ')
  if (contact) {
    const lines = doc.splitTextToSize(contact, nameMax)
    doc.text(lines, margin, hy)
  }

  let y = headerH + 12

  const personal = [
    data.birthDate ? `Nascimento: ${formatBirth(data.birthDate)}` : '',
    data.nationality ? `Nacionalidade: ${data.nationality}` : '',
    data.maritalStatus ? `Estado civil: ${data.maritalStatus}` : '',
  ]
    .filter(Boolean)
    .join('   ·   ')
  if (personal) {
    doc.setFillColor(249, 250, 251)
    doc.roundedRect(margin, y - 4, pageW - margin * 2, 10, 1.5, 1.5, 'F')
    doc.setTextColor(...muted)
    doc.setFontSize(7.8)
    const lines = doc.splitTextToSize(personal, pageW - margin * 2 - 6)
    doc.text(lines, margin + 3, y + 1.5)
    y += 12
  }

  const contentW = pageW - margin * 2

  const ensure = (need: number) => {
    if (y + need > 282) {
      doc.addPage()
      y = 18
    }
  }

  const section = (title: string) => {
    ensure(14)
    doc.setTextColor(...slate)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10.5)
    doc.text(title.toUpperCase(), margin, y)
    y += 2.2
    doc.setDrawColor(...silver)
    doc.setLineWidth(0.9)
    doc.line(margin, y, margin + 28, y)
    doc.setDrawColor(229, 231, 235)
    doc.setLineWidth(0.35)
    doc.line(margin + 30, y, pageW - margin, y)
    y += 7
  }

  if (data.professionalSummary) {
    section('Perfil profissional')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...ink)
    const lines = doc.splitTextToSize(data.professionalSummary, contentW)
    ensure(lines.length * 4.1 + 4)
    doc.text(lines, margin, y)
    y += lines.length * 4.1 + 6
  }

  if (data.experiences.length) {
    section('Experiência profissional')
    data.experiences.forEach((exp) => {
      ensure(20)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(...ink)
      doc.text(exp.role || 'Cargo', margin, y)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(...mid)
      doc.text(formatPeriod(exp.startDate, exp.endDate, exp.current), pageW - margin, y, {
        align: 'right',
      })
      y += 4.2
      doc.setTextColor(...muted)
      doc.text(exp.company || '', margin, y)
      y += 4.5
      if (exp.description) {
        doc.setTextColor(...ink)
        doc.setFontSize(8.5)
        const lines = doc.splitTextToSize(exp.description, contentW)
        ensure(lines.length * 3.7 + 4)
        doc.text(lines, margin, y)
        y += lines.length * 3.7 + 5
      } else y += 3
    })
  }

  if (data.education.length) {
    section('Formação acadêmica')
    data.education.forEach((ed) => {
      ensure(12)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9.5)
      doc.setTextColor(...ink)
      doc.text(ed.course || 'Formação', margin, y)
      if (ed.year) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(...mid)
        doc.text(ed.year, pageW - margin, y, { align: 'right' })
      }
      y += 4
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(...muted)
      doc.text(ed.institution || '', margin, y)
      y += 6.5
    })
  }

  if (data.courses.length) {
    section('Cursos e qualificações')
    data.courses.forEach((c) => {
      ensure(8)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
      doc.setTextColor(...ink)
      const line = `•  ${c.name}${c.institution ? ` — ${c.institution}` : ''}${c.year ? ` (${c.year})` : ''}`
      const lines = doc.splitTextToSize(line, contentW)
      doc.text(lines, margin, y)
      y += lines.length * 3.7 + 2.5
    })
  }

  void pageH
}

export function generateResumePdf(data: ResumeData, templateId?: TemplateId): jsPDF {
  const id = resolveTemplate(templateId || data.templateId)
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  if (id === 'classico') drawClassico(doc, data)
  else drawModerno(doc, data)

  doc.setFontSize(7)
  doc.setTextColor(156, 163, 175)
  const label = TEMPLATES.find((t) => t.id === id)?.name || id
  doc.text(`Currículo OPEN • Modelo ${label}`, 105, 292, { align: 'center' })
  return doc
}

export function downloadResumePdf(data: ResumeData, templateId?: TemplateId) {
  const doc = generateResumePdf(data, templateId)
  const name = (data.fullName || 'curriculo').replace(/\s+/g, '_')
  doc.save(`Curriculo_OPEN_${name}.pdf`)
}

export function getResumePdfBlob(data: ResumeData, templateId?: TemplateId): Blob {
  return generateResumePdf(data, templateId).output('blob')
}

export function getResumePdfDataUrl(data: ResumeData, templateId?: TemplateId): string {
  return generateResumePdf(data, templateId).output('datauristring')
}
