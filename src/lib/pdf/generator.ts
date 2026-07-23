import { jsPDF } from 'jspdf'
import type { ResumeData, TemplateId } from '@/types'
import { TEMPLATES } from '@/data/constants'

type Theme = {
  primary: [number, number, number]
  text: [number, number, number]
  muted: [number, number, number]
  accent: [number, number, number]
  sidebar?: boolean
}

const THEMES: Record<TemplateId, Theme> = {
  moderno: { primary: [0, 174, 239], text: [24, 24, 27], muted: [106, 106, 115], accent: [0, 174, 239], sidebar: true },
  classico: { primary: [17, 17, 17], text: [24, 24, 27], muted: [106, 106, 115], accent: [17, 17, 17] },
  executivo: { primary: [30, 58, 95], text: [20, 30, 45], muted: [90, 110, 130], accent: [30, 58, 95], sidebar: true },
  minimalista: { primary: [82, 82, 82], text: [40, 40, 40], muted: [120, 120, 120], accent: [82, 82, 82] },
  azul: { primary: [0, 174, 239], text: [30, 41, 59], muted: [100, 116, 139], accent: [0, 174, 239], sidebar: true },
  preto: { primary: [17, 17, 17], text: [17, 17, 17], muted: [82, 82, 82], accent: [17, 17, 17] },
  criativo: { primary: [236, 0, 140], text: [24, 24, 27], muted: [106, 106, 115], accent: [236, 0, 140], sidebar: true },
  'jovem-aprendiz': { primary: [0, 174, 239], text: [24, 24, 27], muted: [106, 106, 115], accent: [0, 174, 239] },
  'primeiro-emprego': { primary: [236, 0, 140], text: [24, 24, 27], muted: [106, 106, 115], accent: [236, 0, 140] },
  corporativo: { primary: [17, 17, 17], text: [24, 24, 27], muted: [106, 106, 115], accent: [0, 174, 239] },
}

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

export function generateResumePdf(data: ResumeData, templateId?: TemplateId): jsPDF {
  const id = templateId || data.templateId
  const theme = THEMES[id]
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = 210
  const pageH = 297
  const margin = theme.sidebar ? 72 : 18
  let y = 20

  if (theme.sidebar) {
    doc.setFillColor(...theme.primary)
    doc.rect(0, 0, 58, pageH, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('CONTATO', 10, 28)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    let cy = 36
    ;[data.email, data.phone, data.address].filter(Boolean).forEach((line) => {
      const lines = doc.splitTextToSize(String(line), 42)
      doc.text(lines, 10, cy)
      cy += lines.length * 4 + 2
    })

    cy += 6
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('DADOS', 10, cy)
    cy += 6
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    const personal = [
      data.birthDate ? `Nasc.: ${formatBirth(data.birthDate)}` : '',
      data.nationality ? `Nacionalidade: ${data.nationality}` : '',
      data.maritalStatus ? `Est. civil: ${data.maritalStatus}` : '',
    ].filter(Boolean)
    personal.forEach((line) => {
      const lines = doc.splitTextToSize(line, 42)
      doc.text(lines, 10, cy)
      cy += lines.length * 4 + 2
    })
  }

  doc.setTextColor(...theme.text)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.text(data.fullName || 'Seu Nome', margin, y)
  y += 8

  if (!theme.sidebar) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...theme.muted)
    const top = [data.email, data.phone, data.address].filter(Boolean).join('  •  ')
    if (top) {
      const lines = doc.splitTextToSize(top, pageW - margin - 18)
      doc.text(lines, margin, y)
      y += lines.length * 4.2 + 2
    }
    const personal = [
      data.birthDate ? `Nascimento: ${formatBirth(data.birthDate)}` : '',
      data.nationality ? `Nacionalidade: ${data.nationality}` : '',
      data.maritalStatus ? `Estado civil: ${data.maritalStatus}` : '',
    ]
      .filter(Boolean)
      .join('  •  ')
    if (personal) {
      const lines = doc.splitTextToSize(personal, pageW - margin - 18)
      doc.text(lines, margin, y)
      y += lines.length * 4.2 + 4
    }
  }

  doc.setDrawColor(...theme.accent)
  doc.setLineWidth(0.6)
  doc.line(margin, y, pageW - 18, y)
  y += 10

  const section = (title: string) => {
    if (y > 270) {
      doc.addPage()
      y = 20
    }
    doc.setTextColor(...theme.primary)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text(title.toUpperCase(), margin, y)
    y += 2
    doc.setDrawColor(...theme.accent)
    doc.setLineWidth(0.3)
    doc.line(margin, y, pageW - 18, y)
    y += 7
    doc.setTextColor(...theme.text)
  }

  const body = (text: string, size = 9) => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(size)
    const lines = doc.splitTextToSize(text, pageW - margin - 18)
    if (y + lines.length * 4.2 > 285) {
      doc.addPage()
      y = 20
    }
    doc.text(lines, margin, y)
    y += lines.length * 4.2 + 4
  }

  if (data.professionalSummary) {
    section('Resumo')
    body(data.professionalSummary)
  }

  if (data.education.length) {
    section('Escolaridade')
    data.education.forEach((ed) => {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.text(ed.course || 'Formação', margin, y)
      y += 4.5
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(...theme.muted)
      doc.text(`${ed.institution}${ed.year ? `  |  ${ed.year}` : ''}`, margin, y)
      doc.setTextColor(...theme.text)
      y += 7
    })
  }

  if (data.courses.length) {
    section('Cursos')
    data.courses.forEach((c) => {
      body(`${c.name}${c.institution ? ` — ${c.institution}` : ''}${c.year ? ` (${c.year})` : ''}`)
    })
  }

  if (data.experiences.length) {
    section('Experiência profissional')
    data.experiences.forEach((exp) => {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(...theme.text)
      doc.text(exp.role || 'Cargo', margin, y)
      y += 4.5
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(...theme.muted)
      doc.text(`${exp.company}  |  ${formatPeriod(exp.startDate, exp.endDate, exp.current)}`, margin, y)
      y += 5
      doc.setTextColor(...theme.text)
      if (exp.description) body(exp.description, 9)
      else y += 2
    })
  }

  doc.setFontSize(7)
  doc.setTextColor(160, 160, 160)
  const label = TEMPLATES.find((t) => t.id === id)?.name || id
  doc.text(`Currículo OPEN • Modelo ${label}`, pageW / 2, 292, { align: 'center' })

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
