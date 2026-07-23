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

function addPhoto(
  doc: jsPDF,
  dataUrl: string,
  x: number,
  y: number,
  size: number,
) {
  try {
    const format = dataUrl.includes('image/png') ? 'PNG' : 'JPEG'
    doc.addImage(dataUrl, format, x, y, size, size)
  } catch {
    // ignora foto inválida
  }
}

function drawModerno(doc: jsPDF, data: ResumeData) {
  const pageW = 210
  const pageH = 297
  const cyan: [number, number, number] = [0, 174, 239]
  const magenta: [number, number, number] = [236, 0, 140]
  const ink: [number, number, number] = [24, 24, 27]
  const muted: [number, number, number] = [90, 95, 110]
  const sideW = 62
  const showPhoto = hasResumePhoto(data)

  // Sidebar
  doc.setFillColor(...cyan)
  doc.rect(0, 0, sideW, pageH, 'F')
  doc.setFillColor(...magenta)
  doc.rect(0, 0, 3.2, pageH, 'F')

  let sy = 14
  if (showPhoto && data.photoDataUrl) {
    const photoSize = 36
    const px = (sideW - photoSize) / 2
    // anel
    doc.setFillColor(255, 255, 255)
    doc.circle(sideW / 2, sy + photoSize / 2, photoSize / 2 + 1.6, 'F')
    addPhoto(doc, data.photoDataUrl, px, sy, photoSize)
    sy += photoSize + 10
  }

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('CONTATO', 8, sy)
  sy += 6
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  ;[data.phone, data.email, data.address].filter(Boolean).forEach((line) => {
    const lines = doc.splitTextToSize(String(line), sideW - 14)
    doc.text(lines, 8, sy)
    sy += lines.length * 3.6 + 2.2
  })

  sy += 5
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('PERFIL', 8, sy)
  sy += 6
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  ;[
    data.birthDate ? `Nasc.: ${formatBirth(data.birthDate)}` : '',
    data.nationality ? data.nationality : '',
    data.maritalStatus ? data.maritalStatus : '',
  ]
    .filter(Boolean)
    .forEach((line) => {
      const lines = doc.splitTextToSize(String(line), sideW - 14)
      doc.text(lines, 8, sy)
      sy += lines.length * 3.6 + 2
    })

  // Main
  const mx = sideW + 12
  const contentW = pageW - mx - 14
  let y = 22

  doc.setTextColor(...ink)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  const nameLines = doc.splitTextToSize(data.fullName || 'Seu Nome', contentW)
  doc.text(nameLines, mx, y)
  y += nameLines.length * 8 + 2

  doc.setFillColor(...cyan)
  doc.rect(mx, y, 28, 1.4, 'F')
  doc.setFillColor(...magenta)
  doc.rect(mx + 29, y, 10, 1.4, 'F')
  y += 10

  const ensure = (need: number) => {
    if (y + need > 282) {
      doc.addPage()
      doc.setFillColor(...cyan)
      doc.rect(0, 0, sideW, pageH, 'F')
      doc.setFillColor(...magenta)
      doc.rect(0, 0, 3.2, pageH, 'F')
      y = 20
    }
  }

  const section = (title: string) => {
    ensure(14)
    doc.setTextColor(...cyan)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text(title.toUpperCase(), mx, y)
    y += 2.5
    doc.setDrawColor(...magenta)
    doc.setLineWidth(0.45)
    doc.line(mx, y, mx + contentW, y)
    y += 7
    doc.setTextColor(...ink)
  }

  if (data.professionalSummary) {
    section('Resumo profissional')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    const lines = doc.splitTextToSize(data.professionalSummary, contentW)
    ensure(lines.length * 4.2 + 4)
    doc.text(lines, mx, y)
    y += lines.length * 4.2 + 6
  }

  if (data.experiences.length) {
    section('Experiência')
    data.experiences.forEach((exp) => {
      ensure(22)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(...ink)
      doc.text(exp.role || 'Cargo', mx, y)
      y += 4.2
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(...muted)
      doc.text(`${exp.company}  ·  ${formatPeriod(exp.startDate, exp.endDate, exp.current)}`, mx, y)
      y += 4.5
      doc.setTextColor(...ink)
      if (exp.description) {
        doc.setFontSize(8.5)
        const lines = doc.splitTextToSize(exp.description, contentW)
        ensure(lines.length * 3.8 + 4)
        doc.text(lines, mx, y)
        y += lines.length * 3.8 + 5
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
    section('Cursos')
    data.courses.forEach((c) => {
      ensure(8)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
      doc.setTextColor(...ink)
      const line = `${c.name}${c.institution ? ` — ${c.institution}` : ''}${c.year ? ` (${c.year})` : ''}`
      const lines = doc.splitTextToSize(line, contentW)
      doc.text(lines, mx, y)
      y += lines.length * 3.8 + 3
    })
  }
}

function drawClassico(doc: jsPDF, data: ResumeData) {
  const pageW = 210
  const pageH = 297
  const charcoal: [number, number, number] = [28, 32, 38]
  const gold: [number, number, number] = [176, 137, 74]
  const muted: [number, number, number] = [100, 104, 112]
  const showPhoto = hasResumePhoto(data)
  const margin = 16
  let y = 16

  // Top banner
  doc.setFillColor(...charcoal)
  doc.rect(0, 0, pageW, showPhoto ? 48 : 36, 'F')
  doc.setFillColor(...gold)
  doc.rect(0, showPhoto ? 48 : 36, pageW, 2.2, 'F')

  if (showPhoto && data.photoDataUrl) {
    doc.setFillColor(255, 255, 255)
    doc.circle(pageW - 30, 24, 16.5, 'F')
    addPhoto(doc, data.photoDataUrl, pageW - 44, 10, 28)
  }

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  const nameMax = showPhoto ? pageW - 70 : pageW - 32
  const nameLines = doc.splitTextToSize(data.fullName || 'Seu Nome', nameMax)
  doc.text(nameLines, margin, 18)
  let hy = 18 + nameLines.length * 7.5

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(230, 230, 230)
  const contact = [data.phone, data.email, data.address].filter(Boolean).join('  ·  ')
  if (contact) {
    const lines = doc.splitTextToSize(contact, nameMax)
    doc.text(lines, margin, hy)
  }

  y = (showPhoto ? 48 : 36) + 12

  const personal = [
    data.birthDate ? `Nascimento: ${formatBirth(data.birthDate)}` : '',
    data.nationality ? `Nacionalidade: ${data.nationality}` : '',
    data.maritalStatus ? `Estado civil: ${data.maritalStatus}` : '',
  ]
    .filter(Boolean)
    .join('   ·   ')
  if (personal) {
    doc.setTextColor(...muted)
    doc.setFontSize(8)
    const lines = doc.splitTextToSize(personal, pageW - margin * 2)
    doc.text(lines, margin, y)
    y += lines.length * 3.8 + 6
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
    doc.setTextColor(...charcoal)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text(title.toUpperCase(), margin, y)
    y += 2
    doc.setDrawColor(...gold)
    doc.setLineWidth(0.7)
    doc.line(margin, y, pageW - margin, y)
    y += 1.2
    doc.setDrawColor(220, 220, 220)
    doc.setLineWidth(0.3)
    doc.line(margin, y, pageW - margin, y)
    y += 7
  }

  if (data.professionalSummary) {
    section('Perfil profissional')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...charcoal)
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
      doc.setTextColor(...charcoal)
      doc.text(exp.role || 'Cargo', margin, y)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(...gold)
      const period = formatPeriod(exp.startDate, exp.endDate, exp.current)
      doc.text(period, pageW - margin, y, { align: 'right' })
      y += 4.2
      doc.setTextColor(...muted)
      doc.text(exp.company || '', margin, y)
      y += 4.5
      if (exp.description) {
        doc.setTextColor(...charcoal)
        doc.setFontSize(8.5)
        const lines = doc.splitTextToSize(exp.description, contentW)
        ensure(lines.length * 3.8 + 4)
        doc.text(lines, margin, y)
        y += lines.length * 3.8 + 5
      } else y += 3
    })
  }

  if (data.education.length) {
    section('Formação acadêmica')
    data.education.forEach((ed) => {
      ensure(12)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9.5)
      doc.setTextColor(...charcoal)
      doc.text(ed.course || 'Formação', margin, y)
      if (ed.year) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(...gold)
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
      doc.setTextColor(...charcoal)
      const line = `•  ${c.name}${c.institution ? ` — ${c.institution}` : ''}${c.year ? ` (${c.year})` : ''}`
      const lines = doc.splitTextToSize(line, contentW)
      doc.text(lines, margin, y)
      y += lines.length * 3.8 + 2.5
    })
  }

  // avoid unused pageH lint - use subtle footer area check
  void pageH
}

export function generateResumePdf(data: ResumeData, templateId?: TemplateId): jsPDF {
  const id = resolveTemplate(templateId || data.templateId)
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  if (id === 'classico') drawClassico(doc, data)
  else drawModerno(doc, data)

  doc.setFontSize(7)
  doc.setTextColor(150, 150, 150)
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
