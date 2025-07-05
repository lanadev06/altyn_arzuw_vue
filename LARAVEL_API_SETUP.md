# Настройка Laravel API для Vue.js приложения

## 🔧 Конфигурация

### 1. Переменные окружения

Создайте файл `.env` в корне Vue.js проекта:

```env
# Laravel API URL
VITE_API_URL=http://localhost:8000/api

# Настройки приложения
VITE_APP_TITLE=Altyn Arzuw Vue App
VITE_APP_ENV=development

# Отключить имитацию API когда Laravel готов
VITE_ENABLE_MOCK_API=false
```

### 2. Laravel API Endpoints

Убедитесь, что в вашем Laravel проекте настроены следующие роуты:

```php
// routes/api.php
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
Route::get('/me', [AuthController::class, 'me'])->middleware('auth:sanctum');
```

### 3. CORS настройки

В Laravel добавьте CORS middleware для Vue.js:

```php
// config/cors.php
return [
    'paths' => ['api/*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => ['http://localhost:5174'], // Vue.js dev server
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => false,
];
```

## 🚀 Запуск

### 1. Запустите Laravel API:

```bash
cd your-laravel-project
php artisan serve
```

### 2. Запустите Vue.js приложение:

```bash
npm run dev
```

### 3. Откройте страницу логина:

```
http://localhost:5174/login
```

## 📝 Тестовые данные

Для тестирования используйте:

**Логин:**

- Username: `admin`
- Password: `password`

**Или создайте пользователя через Laravel:**

```bash
php artisan tinker
User::create([
    'username' => 'test',
    'password' => Hash::make('password'),
    'name' => 'Test User',
    'role' => 'admin'
]);
```

## 🔄 Структура данных

### Login Request:

```json
{
  "username": "admin",
  "password": "password"
}
```

### Login Response:

```json
{
  "user": {
    "id": 1,
    "username": "admin",
    "name": "Администратор",
    "phone": "+7 (999) 123-45-67",
    "role": "admin",
    "created_at": "2024-01-01T00:00:00.000000Z",
    "updated_at": "2024-01-01T00:00:00.000000Z"
  },
  "token": "1|abc123..."
}
```

## 🛠️ Отладка

### Проверка API:

```bash
# Тест логина
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'

# Тест с токеном
curl -X GET http://localhost:8000/api/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Логи Vue.js:

Откройте DevTools (F12) и проверьте консоль на ошибки API.

## 🔒 Безопасность

1. **Всегда используйте HTTPS в продакшене**
2. **Настройте rate limiting в Laravel**
3. **Валидируйте данные на сервере**
4. **Используйте CSRF токены для веб-форм**

## 📚 Дополнительные ресурсы

- [Laravel Sanctum Documentation](https://laravel.com/docs/sanctum)
- [Vue.js API Integration](https://vuejs.org/guide/scaling-up/state-management.html)
- [CORS Configuration](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

## ProductController with Search and Pagination

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        if (Gate::denies('viewAny', Product::class)) {
            return response()->json([
                'message' => 'Not Authorized'
            ], 403);
        }

        $perPage = $request->get('per_page', 10);
        $query = Product::with('designer');

        // Add search functionality
        if ($request->has('search') && $request->search) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $sortBy = $request->get('sort_by', 'id');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        return $query->paginate($perPage);
    }

    public function show(Product $product)
    {
        if (Gate::denies('view', $product)) {
            return response()->json([
                'message' => 'Not Authorized'
            ], 403);
        }

        return $product->load('designer');
    }

    public function store(Request $request)
    {
        if (Gate::denies('create', Product::class)) {
            return response()->json([
                'message' => 'Not Authorized'
            ], 403);
        }

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'designer_id' => 'nullable|exists:users,id',
            'is_workshop_required' => 'boolean',
            'workshop_type' => 'nullable|in:montage,binding',
        ]);

        $product = Product::create($data);

        return response()->json($product->load('designer'), 201);
    }

    public function update(Request $request, Product $product)
    {
        if (Gate::denies('update', $product)) {
            return response()->json([
                'message' => 'Not Authorized'
            ], 403);
        }

        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'designer_id' => 'nullable|exists:users,id',
            'is_workshop_required' => 'sometimes|boolean',
            'workshop_type' => 'nullable|in:montage,binding',
        ]);

        $product->update($data);

        return response()->json($product->load('designer'));
    }

    public function destroy(Product $product)
    {
        if (Gate::denies('delete', $product)) {
            return response()->json([
                'message' => 'Not Authorized'
            ], 403);
        }

        $product->delete();

        return response()->json(['message' => 'Товар удалён']);
    }
}
```

## Product Model

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'designer_id',
        'is_workshop_required',
        'workshop_type',
    ];

    protected $casts = [
        'is_workshop_required' => 'boolean',
    ];

    public function designer()
    {
        return $this->belongsTo(User::class, 'designer_id');
    }
}
```

## Database Migration

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->foreignId('designer_id')->nullable()->constrained('users')->onDelete('set null');
            $table->boolean('is_workshop_required')->default(false);
            $table->enum('workshop_type', ['montage', 'binding'])->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('products');
    }
};
```

## Routes

```php
// routes/api.php
Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('products', ProductController::class);
    Route::get('designers', [UserController::class, 'getDesigners']);
});
```

## Designer API Endpoint

```php
// In UserController
public function getDesigners()
{
    return User::where('role', 'designer')
        ->select('id', 'name', 'username')
        ->get();
}
```
