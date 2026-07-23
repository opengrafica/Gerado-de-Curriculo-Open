/** Comprime e recorta a foto do currículo (circular PNG) para caber no PDF e no aparelho. */
export async function compressResumePhoto(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Envie uma imagem (JPG ou PNG).')
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error('Imagem muito grande. Use até 8 MB.')
  }

  const bitmap = await createImageBitmap(file)
  const side = Math.min(bitmap.width, bitmap.height)
  const sx = Math.floor((bitmap.width - side) / 2)
  const sy = Math.floor((bitmap.height - side) / 2)
  const size = 420

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Não foi possível processar a imagem.')

  ctx.clearRect(0, 0, size, size)
  ctx.save()
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
  ctx.closePath()
  ctx.clip()
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, size, size)
  ctx.restore()

  // Anel sutil branco para destacar no PDF
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(255,255,255,0.9)'
  ctx.lineWidth = 8
  ctx.stroke()

  bitmap.close()
  return canvas.toDataURL('image/jpeg', 0.82)
}

export function hasResumePhoto(data: { includePhoto?: boolean; photoDataUrl?: string }) {
  return Boolean(data.includePhoto && data.photoDataUrl)
}
