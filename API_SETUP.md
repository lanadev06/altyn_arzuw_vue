# 🚀 Настройка API для Vue.js проекта

## 📋 Обзор

Этот проект настроен для работы с реальным API с возможностью fallback на имитацию для разработки.

## ⚙️ Конфигурация

### 1. Переменные окружения

Создайте файл `.env` в корне проекта:

```env
# API Configuration
VITE_API_URL=http://localhost:3000/api

# Development settings
VITE_APP_TITLE=Altyn Arzuw Vue App
VITE_APP_ENV=development

# Feature flags
VITE_ENABLE_MOCK_API=true
```

### 2. Настройки API

Основные настройки находятся в `src/config/api.ts`:

```typescript
export const API_CONFIG = {
  BASE_URL: 'http://localhost:3000/api',
  TIMEOUT: 10000, // 10 секунд
  DEV: {
    USE_MOCK_FALLBACK: true, // Использовать имитацию если API недоступен
    MOCK_DELAY: 1000, // Задержка имитации
  },
}
```

## 🔌 Подключение к реальному API

### 1. Измените базовый URL

В файле `.env`:

```env
VITE_API_URL=https://your-api-domain.com/api
```

### 2. Отключите имитацию (опционально)

В `src/config/api.ts`:

```typescript
DEV: {
  USE_MOCK_FALLBACK: false, // Отключить имитацию
}
```

### 3. Настройте endpoints

В `src/config/api.ts` обновите `API_ENDPOINTS` под ваш API:

```typescript
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REGISTER: '/auth/register',
    VERIFY: '/auth/verify',
    FORGOT_PASSWORD: '/auth/forgot-password',
  },
  // Добавьте ваши endpoints
}
```

## 🔐 Аутентификация

### JWT Token

Проект использует JWT токены для аутентификации:

```typescript
// Автоматически добавляется в заголовки
headers: {
  'Authorization': `Bearer ${token}`
}
```

### Формат ответа API

Ожидаемый формат ответа для логина:

```json
{
  "success": true,
  "token": "jwt-token-here",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

## 🛠️ Разработка

### Тестовые данные

Для разработки используйте:

- Email: `admin@example.com`
- Пароль: `password`

### Имитация API

Если реальный API недоступен, система автоматически использует имитацию:

```typescript
// В консоли браузера увидите:
// "API недоступен, используем имитацию: [error]"
```

## 📡 Примеры API вызовов

### Логин

```typescript
import { authApi } from '@/services/api'

const result = await authApi.login({
  email: 'user@example.com',
  password: 'password',
})
```

### Регистрация

```typescript
const result = await authApi.register({
  email: 'newuser@example.com',
  password: 'password123',
  name: 'New User',
})
```

### Восстановление пароля

```typescript
const result = await authApi.forgotPassword('user@example.com')
```

## 🚨 Обработка ошибок

Система автоматически обрабатывает:

- Ошибки сети
- Таймауты (10 секунд)
- HTTP ошибки (401, 403, 404, 500)
- Ошибки валидации

## 🔧 Дополнительные настройки

### Таймаут запросов

```typescript
// В src/config/api.ts
TIMEOUT: 15000, // 15 секунд
```

### Заголовки по умолчанию

```typescript
DEFAULT_HEADERS: {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'X-API-Version': 'v1', // Добавьте свои заголовки
}
```

## 📝 Логирование

В режиме разработки все API вызовы логируются в консоль браузера.

## 🔄 Обновление токена

Токен автоматически добавляется ко всем запросам после логина и удаляется при выходе.

## 🎯 Следующие шаги

1. Настройте ваш backend API
2. Обновите endpoints в конфигурации
3. Протестируйте все функции аутентификации
4. Добавьте дополнительные API вызовы по необходимости
