import { createRouter, createWebHistory } from 'vue-router'
import { isAuthenticated, validateAuth } from '@/utils/auth'
import { canViewAllUsers, canViewAllClients, canViewAuditLogs, canViewStages, canViewRoles } from '@/utils/permissions'

// Функция для создания ленивой загрузки с предзагрузкой
const createLazyComponent = (importFn: () => Promise<any>, preload = true) => {
  if (preload) {
    // Предзагружаем компонент сразу
    importFn()
  }
  return importFn
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: createLazyComponent(() => import('../views/DashboardView.vue'), true),
      meta: { title: 'Панель управления', requiresAuth: true, preload: true },
    },
    {
      path: '/login',
      name: 'login',
      component: createLazyComponent(() => import('../views/LoginView.vue'), false),
      meta: { title: 'Вход в систему' },
    },
    {
      path: '/users',
      name: 'users',
      component: createLazyComponent(() => import('../views/UsersView.vue'), true),
      meta: { title: 'Пользователи', requiresAuth: true, preload: true },
    },
    {
      path: '/clients',
      name: 'clients',
      component: createLazyComponent(() => import('../views/ClientsView.vue'), true),
      meta: { title: 'Клиенты', requiresAuth: true, preload: true },
    },
    {
      path: '/projects',
      name: 'projects',
      component: createLazyComponent(() => import('../views/ProjectsView.vue'), true),
      meta: { title: 'Проекты', requiresAuth: true, preload: true },
    },
    {
      path: '/products',
      name: 'products',
      component: createLazyComponent(() => import('../views/ProductsView.vue'), true),
      meta: { title: 'Товары', requiresAuth: true, preload: true },
    },
    {
      path: '/orders',
      name: 'orders',
      component: createLazyComponent(() => import('../views/OrdersView.vue'), true),
      meta: { title: 'Заказы', requiresAuth: true, preload: true },
    },
    {
      path: '/audit-logs',
      name: 'audit-logs',
      component: createLazyComponent(() => import('../views/AuditLogsView.vue'), false),
      meta: { title: 'Аудит-логи', requiresAuth: true, preload: false },
    },
    {
      path: '/stages',
      name: 'stages',
      component: createLazyComponent(() => import('../views/StagesView.vue'), true),
      meta: { title: 'Управление стадиями', requiresAuth: true, preload: true },
    },
    {
      path: '/roles',
      name: 'roles',
      component: createLazyComponent(() => import('../views/RolesView.vue'), true),
      meta: { title: 'Управление ролями', requiresAuth: true, preload: true },
    },
    {
      path: '/categories',
      name: 'categories',
      component: createLazyComponent(() => import('../views/CategoriesView.vue'), true),
      meta: { title: 'Категории', requiresAuth: true, preload: true },
    },
  ],
})

// Authentication and authorization guard
router.beforeEach((to, from, next) => {
  const authenticated = isAuthenticated()
  const validSession = validateAuth()

  // If route requires authentication and user is not authenticated
  if (to.meta.requiresAuth && !authenticated) {
    next({ name: 'login' })
  }
  // If user has token but invalid session data
  else if (to.meta.requiresAuth && authenticated && !validSession) {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    next({ name: 'login' })
  }
  // If user is authenticated and trying to access login page
  else if (to.name === 'login' && authenticated && validSession) {
    next({ name: 'dashboard' })
  }
  // Check role-based access
  else if (to.name === 'users' && !canViewAllUsers()) {
    next({ name: 'dashboard' })
  } else if (to.name === 'clients' && !canViewAllClients()) {
    next({ name: 'dashboard' })
  } else if (to.name === 'audit-logs' && !canViewAuditLogs()) {
    next({ name: 'dashboard' })
  } else if (to.name === 'stages' && !canViewStages()) {
    next({ name: 'dashboard' })
  } else if (to.name === 'roles' && !canViewRoles()) {
    next({ name: 'dashboard' })
  }
  // Allow access to all other routes
  else {
    next()
  }
})

// Оптимизированный хук после навигации
router.afterEach((to, from) => {
  const defaultTitle = 'Панель управления'
  document.title = (to.meta.title as string) || defaultTitle
  
  // Предзагружаем связанные маршруты в фоне
  if (to.meta.preload) {
    setTimeout(() => {
      preloadRelatedRoutes(to.name as string)
    }, 100)
  }
})

// Функция предзагрузки связанных маршрутов
function preloadRelatedRoutes(currentRoute: string) {
  const routeMap: Record<string, string[]> = {
    'dashboard': ['orders', 'users', 'clients'],
    'orders': ['dashboard', 'clients', 'products'],
    'users': ['dashboard', 'roles'],
    'clients': ['dashboard', 'orders', 'projects'],
    'products': ['orders', 'categories'],
    'projects': ['clients', 'orders'],
    'categories': ['products'],
    'stages': ['roles', 'orders'],
    'roles': ['users', 'stages']
  }
  
  const routesToPreload = routeMap[currentRoute] || []
  
  routesToPreload.forEach(routeName => {
    const route = router.resolve({ name: routeName })
    if (route.matched.length > 0) {
      const component = route.matched[0].components?.default
      if (component && typeof component === 'function') {
        // Предзагружаем компонент
        component().catch(() => {
          // Игнорируем ошибки предзагрузки
        })
      }
    }
  })
}

export default router
