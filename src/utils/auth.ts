// Authentication utility functions

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!localStorage.getItem('auth_token')
}

/**
 * Get current user from localStorage
 */
export function getCurrentUser() {
  const userStr = localStorage.getItem('user')
  return userStr ? JSON.parse(userStr) : null
}

/**
 * Clear authentication data
 */
export function clearAuth(): void {
  localStorage.removeItem('auth_token')
  localStorage.removeItem('user')
}

/**
 * Set authentication data
 */
export function setAuth(token: string, user: any): void {
  localStorage.setItem('auth_token', token)
  localStorage.setItem('user', JSON.stringify(user))
}
