import type { User } from '../types/api'

export async function getUserImageUrl(user: User | null | undefined): Promise<string> {
  if (!user) return ''
  const anyUser = user as any
  
  // Если есть полный URL изображения
  if (typeof anyUser.image_url === 'string') return anyUser.image_url
  
  // Если есть путь к изображению в базе данных
  if (typeof anyUser.image === 'string') {
    // Если это уже полный URL
    if (anyUser.image.startsWith('http')) {
      return anyUser.image
    }
    // Если это путь к файлу, добавляем базовый URL
    return `http://localhost:8000/storage/${anyUser.image}`
  }
  
  return ''
}
