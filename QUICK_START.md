# 🚀 Быстрый старт - Система товаров

## Что уже готово ✅

- ✅ Все Vue.js компоненты созданы
- ✅ API сервисы настроены
- ✅ Роутинг добавлен
- ✅ Навигация в сайдбаре добавлена
- ✅ Используется существующий роут для дизайнеров: `/api/users/role/designer`

## Что нужно сделать в Laravel 🔧

### 1. Создать миграцию для таблицы products

```bash
php artisan make:migration create_products_table
```

### 2. Добавить код миграции

```php
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
```

### 3. Создать модель Product

```bash
php artisan make:model Product
```

```php
// app/Models/Product.php
class Product extends Model
{
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

### 4. Создать ProductController

```bash
php artisan make:controller Api/ProductController
```

Скопировать код из `PRODUCTS_LARAVEL_SETUP.md`

### 5. Добавить роуты

```php
// routes/api.php
Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('products', ProductController::class);
    // Роут для дизайнеров уже существует
    // Route::get('users/role/{role}', [UserController::class, 'getByRole']);
});
```

### 6. Запустить миграцию

```bash
php artisan migrate
```

## Тестирование 🧪

### 1. Запустить фронтенд

```bash
npm run dev
```

### 2. Перейти на страницу товаров

```
http://localhost:5173/products
```

### 3. Проверить API

```bash
# Получить товары
curl -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Accept: application/json" \
     "http://localhost:8000/api/products"

# Получить дизайнеров
curl -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Accept: application/json" \
     "http://localhost:8000/api/users/role/designer"
```

## Возможные проблемы 🔍

1. **Дизайнеры не загружаются**: Проверьте, что у вас есть пользователи с `role = 'designer'`
2. **Ошибки CORS**: Убедитесь, что Laravel настроен для работы с фронтендом
3. **Ошибки авторизации**: Проверьте, что токен авторизации корректный

## Готово! 🎉

После выполнения этих шагов система товаров будет полностью функциональна:

- ✅ Создание товаров
- ✅ Редактирование товаров
- ✅ Удаление товаров
- ✅ Поиск товаров
- ✅ Сортировка
- ✅ Пагинация
- ✅ Назначение дизайнеров
- ✅ Настройка цеховых работ
