import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx'
import { saveAs } from 'file-saver'
import type { ResumeData } from '@/types'

function formatBirth(iso: string) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso || ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function formatPeriod(start: string, end: string, current?: boolean) {
  const fmt = (v: string) => {
    if (!v) return ''
    const [y, m] = v.split('-')
    return m ? `${m}/${y}` : y
  }
  return `${fmt(start)} — ${current ? 'Atual' : fmt(end) || '—'}`
}

function heading(text: string) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 120 },
  })
}

function line(label: string, value?: string) {
  if (!value) return null
  return new Paragraph({
    children: [
      new TextRun({ text: `${label}: `, bold: true }),
      new TextRun(value),
    ],
    spacing: { after: 60 },
  })
}

export async function generateResumeDocx(data: ResumeData): Promise<Blob> {
  const blocks: Paragraph[] = [
    new Paragraph({
      text: data.fullName || 'Currículo',
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.LEFT,
    }),
    line('Endereço', data.address),
    line('Nascimento', formatBirth(data.birthDate)),
    line('Nacionalidade', data.nationality),
    line('Estado civil', data.maritalStatus),
    line('Telefone', data.phone),
    line('E-mail', data.email),
  ].filter(Boolean) as Paragraph[]

  if (data.professionalSummary) {
    blocks.push(heading('Resumo'))
    blocks.push(new Paragraph({ text: data.professionalSummary, spacing: { after: 120 } }))
  }

  if (data.education.length) {
    blocks.push(heading('Escolaridade'))
    data.education.forEach((ed) => {
      blocks.push(
        new Paragraph({
          children: [new TextRun({ text: ed.course || 'Formação', bold: true })],
        }),
      )
      blocks.push(
        new Paragraph({
          text: `${ed.institution}${ed.year ? ` — ${ed.year}` : ''}`,
          spacing: { after: 100 },
        }),
      )
    })
  }

  if (data.courses.length) {
    blocks.push(heading('Cursos'))
    data.courses.forEach((c) => {
      blocks.push(
        new Paragraph({
          text: `${c.name}${c.institution ? ` — ${c.institution}` : ''}${c.year ? ` (${c.year})` : ''}`,
          spacing: { after: 80 },
        }),
      )
    })
  }

  if (data.experiences.length) {
    blocks.push(heading('Experiência profissional'))
    data.experiences.forEach((exp) => {
      blocks.push(
        new Paragraph({
          children: [new TextRun({ text: exp.role || 'Cargo', bold: true })],
        }),
      )
      blocks.push(
        new Paragraph({
          text: `${exp.company} | ${formatPeriod(exp.startDate, exp.endDate, exp.current)}`,
        }),
      )
      if (exp.description) {
        blocks.push(new Paragraph({ text: exp.description, spacing: { after: 120 } }))
      } else {
        blocks.push(new Paragraph({ text: '', spacing: { after: 100 } }))
      }
    })
  }

  const doc = new Document({
    sections: [{ children: blocks }],
  })
  return Packer.toBlob(doc)
}

export async function downloadResumeDocx(data: ResumeData) {
  const blob = await generateResumeDocx(data)
  const name = (data.fullName || 'curriculo').replace(/\s+/g, '_')
  saveAs(blob, `Curriculo_OPEN_${name}.docx`)
}
