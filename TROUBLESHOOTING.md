# 🔍 Диагностика проблем с загрузкой товаров

## Шаг 1: Проверьте консоль браузера

1. Откройте DevTools (F12)
2. Перейдите на вкладку Console
3. Обновите страницу товаров
4. Посмотрите на логи с эмодзи:

### ✅ Успешная загрузка:

```
❌ Error in fetchProducts: Ошибка загрузки товаров: 404 Not Found
```

### ❌ Ошибки API:

```
❌ API Error: {status: 404, statusText: "Not Found", response: "..."}
```

## Шаг 2: Проверьте настройки API

### Проверьте файл .env (создайте если нет):

```bash
# .env
VITE_API_URL=http://localhost:8000/api
```

### Проверьте конфигурацию в src/config/api.ts:

```typescript
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  // ...
}
```

## Шаг 3: Проверьте Laravel бэкенд

### 1. Запущен ли Laravel сервер?

```bash
php artisan serve
# Должен быть доступен на http://localhost:8000
```

### 2. Существует ли роут для товаров?

```bash
php artisan route:list | grep products
```

### 3. Создана ли таблица products?

```bash
php artisan migrate:status
```

### 4. Есть ли данные в таблице?

```bash
php artisan tinker
>>> App\Models\Product::count()
```

## Шаг 4: Проверьте авторизацию

### 1. Есть ли токен в localStorage?

```javascript
// В консоли браузера
localStorage.getItem('auth_token')
```

### 2. Валидный ли токен?

```bash
# Проверьте токен в Laravel
php artisan tinker
>>> Laravel\Sanctum\PersonalAccessToken::where('token', 'hash_of_your_token')->first()
```

## Шаг 5: Тестирование API

### 1. Тест без авторизации:

```bash
curl -H "Accept: application/json" \
     "http://localhost:8000/api/products"
```

### 2. Тест с авторизацией:

```bash
curl -H "Accept: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     "http://localhost:8000/api/products"
```

### 3. Тест дизайнеров:

```bash
curl -H "Accept: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     "http://localhost:8000/api/users/role/designer"
```

## Шаг 6: Возможные решения

### Проблема: 404 Not Found

**Решение:** Создайте роуты и контроллер

```bash
php artisan make:controller Api/ProductController
# Добавьте роуты в routes/api.php
```

### Проблема: 401 Unauthorized

**Решение:** Проверьте авторизацию

```bash
# Войдите в систему через фронтенд
# Или создайте тестовый токен
php artisan tinker
>>> $user = App\Models\User::first();
>>> $token = $user->createToken('test-token')->plainTextToken;
>>> echo $token;
```

### Проблема: 500 Internal Server Error

**Решение:** Проверьте логи Laravel

```bash
tail -f storage/logs/laravel.log
```

### Проблема: CORS Error

**Решение:** Настройте CORS в Laravel

```bash
# В config/cors.php
'allowed_origins' => ['http://localhost:5173'],
```

## Шаг 8: Проверка компонентов

### 1. Проверьте ProductList.vue:

```javascript
// В консоли браузера
console.log('ProductList mounted')
```

### 2. Проверьте ProductController:

```javascript
// В консоли браузера
console.log('ProductController.fetchProducts called')
```

## Частые ошибки и решения

| Ошибка             | Причина                     | Решение                     |
| ------------------ | --------------------------- | --------------------------- |
| `Failed to fetch`  | Сервер не запущен           | `php artisan serve`         |
| `404 Not Found`    | Роут не существует          | Создайте контроллер и роуты |
| `401 Unauthorized` | Нет токена                  | Войдите в систему           |
| `500 Server Error` | Ошибка в коде               | Проверьте логи Laravel      |
| `CORS Error`       | Неправильные настройки CORS | Настройте config/cors.php   |

## Получение помощи

Если проблема не решается:

1. Скопируйте все логи из консоли браузера
2. Проверьте логи Laravel: `tail -f storage/logs/laravel.log`
3. Убедитесь, что все шаги из QUICK_START.md выполнены
4. Проверьте, что Laravel API работает: `curl http://localhost:8000/api/products`
