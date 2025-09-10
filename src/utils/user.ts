import type { User } from '../types/api'

export async function getUserImageUrl(user: User | null | undefined): Promise<string> {
  if (!user) return ''
  const anyUser = user as any
  
  // Приоритет: используем image_url из API ответа (полный URL)
  if (typeof anyUser.image_url === 'string' && anyUser.image_url) {
    return anyUser.image_url
  }
  
  // Fallback: если image_url нет, используем image
  if (typeof anyUser.image === 'string' && anyUser.image) {
    // Если это уже полный URL
    if (anyUser.image.startsWith('http')) {
      return anyUser.image
    }
    // Если это путь к файлу, используем относительный путь
    return `/storage/${anyUser.image}`
  }
  
  return ''
}
