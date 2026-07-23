import { jsPDF } from 'jspdf'
import type { ResumeData, TemplateId } from '@/types'
import { TEMPLATES } from '@/data/constants'

type Theme = {
  primary: [number, number, number]
  text: [number, number, number]
  muted: [number, number, number]
  accent: [number, number, number]
  sidebar?: boolean
  serif?: boolean
}

const THEMES: Record<TemplateId, Theme> = {
  moderno: { primary: [13, 148, 118], text: [33, 37, 45], muted: [102, 118, 144], accent: [13, 148, 118], sidebar: true },
  classico: { primary: [58, 66, 81], text: [33, 37, 45], muted: [102, 118, 144], accent: [58, 66, 81], serif: true },
  executivo: { primary: [30, 58, 95], text: [20, 30, 45], muted: [90, 110, 130], accent: [30, 58, 95], sidebar: true },
  minimalista: { primary: [82, 82, 82], text: [40, 40, 40], muted: [120, 120, 120], accent: [82, 82, 82] },
  azul: { primary: [37, 99, 235], text: [30, 41, 59], muted: [100, 116, 139], accent: [37, 99, 235], sidebar: true },
  preto: { primary: [23, 23, 23], text: [23, 23, 23], muted: [82, 82, 82], accent: [23, 23, 23] },
  criativo: { primary: [234, 88, 12], text: [33, 37, 45], muted: [102, 118, 144], accent: [234, 88, 12], sidebar: true },
  'jovem-aprendiz': { primary: [8, 145, 178], text: [33, 37, 45], muted: [102, 118, 144], accent: [8, 145, 178] },
  'primeiro-emprego': { primary: [5, 150, 105], text: [33, 37, 45], muted: [102, 118, 144], accent: [5, 150, 105] },
  corporativo: { primary: [15, 118, 97], text: [33, 37, 45], muted: [102, 118, 144], accent: [15, 118, 97] },
}

function formatPeriod(start: string, end: string, current?: boolean) {
  const fmt = (v: string) => {
    if (!v) return ''
    const [y, m] = v.split('-')
    return m ? `${m}/${y}` : y
  }
  return `${fmt(start)} — ${current ? 'Atual' : fmt(end) || '—'}`
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
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('CONTATO', 10, 28)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    const contact = [data.email, data.phone, data.city].filter(Boolean)
    let cy = 36
    contact.forEach((line) => {
      const lines = doc.splitTextToSize(line, 42)
      doc.text(lines, 10, cy)
      cy += lines.length * 4 + 2
    })

    cy += 8
    if (data.skills.length) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.text('HABILIDADES', 10, cy)
      cy += 6
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      data.skills.forEach((s) => {
        doc.text(`• ${s}`, 10, cy)
        cy += 5
      })
    }

    cy += 6
    if (data.languages.length) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.text('IDIOMAS', 10, cy)
      cy += 6
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      data.languages.forEach((l) => {
        doc.text(`${l.name} — ${l.level}`, 10, cy)
        cy += 5
      })
    }
  }

  doc.setTextColor(...theme.text)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(theme.serif ? 22 : 20)
  doc.text(data.fullName || 'Seu Nome', margin, y)
  y += 8

  if (!theme.sidebar) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...theme.muted)
    doc.text([data.email, data.phone, data.city].filter(Boolean).join('  •  '), margin, y)
    y += 8
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

  if (data.professionalSummary || data.objective) {
    section('Resumo profissional')
    body(data.professionalSummary || data.objective)
  }

  if (data.objective && data.professionalSummary) {
    section('Objetivo')
    body(data.objective)
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

  if (data.education.length) {
    section('Escolaridade')
    data.education.forEach((ed) => {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.text(`${ed.course} — ${ed.level}`, margin, y)
      y += 4.5
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(...theme.muted)
      doc.text(`${ed.institution}  |  ${formatPeriod(ed.startDate, ed.endDate)}`, margin, y)
      doc.setTextColor(...theme.text)
      y += 7
    })
  }

  if (data.courses.length) {
    section('Cursos')
    data.courses.forEach((c) => {
      body(`${c.name} — ${c.institution} (${c.year})`, 9)
    })
  }

  if (!theme.sidebar && data.skills.length) {
    section('Habilidades')
    body(data.skills.join('  •  '))
  }

  if (!theme.sidebar && data.languages.length) {
    section('Idiomas')
    body(data.languages.map((l) => `${l.name} (${l.level})`).join('  •  '))
  }

  if (data.keywords?.length) {
    section('Palavras-chave')
    body(data.keywords.join(', '))
  }

  // Footer label
  doc.setFontSize(7)
  doc.setTextColor(160, 160, 160)
  const label = TEMPLATES.find((t) => t.id === id)?.name || id
  doc.text(`CurrículoJá • Modelo ${label}`, pageW / 2, 292, { align: 'center' })

  return doc
}

export function downloadResumePdf(data: ResumeData, templateId?: TemplateId) {
  const doc = generateResumePdf(data, templateId)
  const name = (data.fullName || 'curriculo').replace(/\s+/g, '_')
  doc.save(`CurriculoJa_${name}.pdf`)
}

export function getResumePdfBlob(data: ResumeData, templateId?: TemplateId): Blob {
  return generateResumePdf(data, templateId).output('blob')
}

export function getResumePdfDataUrl(data: ResumeData, templateId?: TemplateId): string {
  return generateResumePdf(data, templateId).output('datauristring')
}
