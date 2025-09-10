import type { User, Role } from '../types/api'

// Получить текущего пользователя
export function getCurrentUser(): User | null {
  const userStr = localStorage.getItem('user')
  return userStr ? JSON.parse(userStr) : null
}

// Проверить, является ли сотрудник администратором
export function isAdmin(): boolean {
  const user = getCurrentUser()
  return user?.roles?.some((role: Role) => role.name === 'admin') ?? false
}

// Проверить, является ли сотрудник менеджером
export function isManager(): boolean {
  const user = getCurrentUser()
  return user?.roles?.some((role: Role) => role.name === 'manager') ?? false
}

// Проверить, является ли сотрудник администратором или менеджером
export function isAdminOrManager(): boolean {
  return isAdmin() || isManager()
}

// Проверить, является ли сотрудник обычным сотрудником (не админ/менеджер)
export function isStaff(): boolean {
  const user = getCurrentUser()
  if (!user?.roles?.length) return false
  
  return !isAdmin() && !isManager() && user.roles.length > 0
}

// Основные права доступа
export const canCreate = () => isAdminOrManager()
export const canEdit = () => isAdmin()
export const canDelete = () => isAdmin()
export const canViewAll = () => isAdminOrManager()
export const canCreateEdit = () => isAdminOrManager() // Для обратной совместимости

// Права для пользователей
export const canCreateUsers = () => isAdmin()
export const canEditUsers = () => isAdmin()
export const canDeleteUsers = () => isAdmin()
export const canToggleUserActive = () => isAdmin()
export const canViewAllUsers = () => isAdminOrManager()

// Права для других сущностей
export const canViewAllClients = () => isAdminOrManager()
export const canViewAllOrders = () => isAdminOrManager()
export const canViewAllProjects = () => isAdminOrManager()
export const canViewAllProducts = () => isAdminOrManager()
export const canViewOrders = () => isAdminOrManager() || isStaff()

// Административные права
export const canViewAuditLogs = () => isAdmin()
export const canViewStages = () => isAdmin()
export const canViewRoles = () => isAdmin()
export const canViewCategories = () => isAdmin()
export const canViewPrices = () => isAdminOrManager()

// Права на данные (для работы с формами)
export const canViewStagesData = () => isAdminOrManager() || isStaff()
export const canViewRolesData = () => isAdminOrManager() || isStaff()
export const canViewCategoriesData = () => isAdminOrManager()
export const canViewUsersData = () => isAdminOrManager() || isStaff()
export const canViewOrderComments = () => isAdminOrManager() || isStaff()
export const canUpdateAssignmentStatus = () => isAdminOrManager() || isStaff()

// Навигация
export function getNavigationText(item: string): string {
  const texts: Record<string, string> = {
    orders: isStaff() ? 'Мои заказы' : 'Заказы',
    projects: isStaff() ? 'Мои проекты' : 'Проекты',
    products: isStaff() ? 'Мои товары' : 'Товары',
  }
  return texts[item] || item
}
