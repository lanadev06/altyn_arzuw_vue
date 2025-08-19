import type { User } from '../types/api'

export async function getUserImageUrl(user: User | null | undefined): Promise<string> {
  if (!user) return ''
  const anyUser = user as any
  if (typeof anyUser.image_url === 'string') return anyUser.image_url
  if (typeof anyUser.image === 'string') return anyUser.image
  return ''
}
