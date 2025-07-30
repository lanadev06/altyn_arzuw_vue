# Отчет о защите от удаления товаров, связанных с заказами

## Проблема

Товары удалялись даже если они были связаны с заказами, что могло привести к потере данных и нарушению целостности системы.

## Решение

Добавлена проверка на связанные заказы перед удалением товара, аналогично тому, как это сделано для пользователей.

## Изменения

### 1. Laravel ProductController.php - Добавлена проверка заказов

**Было:**
```php
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
```

**Стало:**
```php
public function destroy(Product $product)
{
    if (Gate::denies('delete', $product)) {
        return response()->json([
            'message' => 'Not Authorized'
        ], 403);
    }

    // Проверяем все заказы, связанные с товаром
    $ordersCount = $product->orders()->count();

    if ($ordersCount > 0) {
        return response()->json([
            'message' => "Невозможно удалить товар, который используется в {$ordersCount} заказах"
        ], 422);
    }

    $product->delete();

    return response()->json(['message' => 'Товар удалён']);
}
```

### 2. API deleteProduct - Улучшена обработка ошибок

**Было:**
```typescript
export async function deleteProduct(id: number): Promise<void> {
  const res = await fetch(`${API_CONFIG.BASE_URL}/products/${id}`, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
    },
  })
  // Не выбрасывать ошибку при 404 — товар уже удалён
  if (!res.ok && res.status !== 404) {
    throw new Error('Ошибка удаления товара')
  }
}
```

**Стало:**
```typescript
export async function deleteProduct(id: number): Promise<void> {
  const res = await fetch(`${API_CONFIG.BASE_URL}/products/${id}`, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
    },
  })
  
  // Обрабатываем различные статусы ответа
  if (!res.ok) {
    if (res.status === 404) {
      // Товар уже удалён
      throw new Error('Ошибка удаления товара')
    } else if (res.status === 422) {
      // Ошибка валидации (например, товар используется в заказах)
      const errorData = await res.json()
      const error = new Error(errorData.message || 'Ошибка удаления товара')
      ;(error as any).response = { data: errorData }
      throw error
    } else {
      // Другие ошибки
      throw new Error('Ошибка удаления товара')
    }
  }
}
```

### 3. ProductController.ts - Проброс ошибок

**Было:**
```typescript
async function remove(id: number) {
  loading.value = true
  try {
    await deleteProduct(id)
    if (pagination.data.length === 1 && pagination.current_page > 1) {
      await fetchProducts(pagination.current_page - 1)
    } else {
      await fetchProducts(pagination.current_page)
    }
  } finally {
    loading.value = false
  }
}
```

**Стало:**
```typescript
async function remove(id: number) {
  loading.value = true
  try {
    await deleteProduct(id)
    if (pagination.data.length === 1 && pagination.current_page > 1) {
      await fetchProducts(pagination.current_page - 1)
    } else {
      await fetchProducts(pagination.current_page)
    }
  } catch (err: any) {
    // Пробрасываем ошибку дальше для обработки в компоненте
    throw err
  } finally {
    loading.value = false
  }
}
```

### 4. ProductList.vue - Улучшена обработка ошибок

**Было:**
```typescript
async function handleDeleteProduct(productId: number) {
  try {
    await remove(productId)
    showEditModal.value = false
    editingProduct.value = null
    if (pagination?.data?.length === 1 && currentPage.value > 1) {
      currentPage.value--
    }
  } catch (e: any) {
    // Если ошибка 404 — просто закрыть модалку и обновить список
    if (e.message && e.message.includes('Ошибка удаления товара')) {
      toast.show('Товар уже был удалён')
      showEditModal.value = false
      editingProduct.value = null
      // Обновить список, чтобы убрать "мертвый" товар
      await fetchProducts(
        currentPage.value,
        props.search,
        sortBy.value,
        sortOrder.value,
        perPage.value,
      )
    } else {
      toast.show('Ошибка при удалении товара')
    }
  }
}
```

**Стало:**
```typescript
async function handleDeleteProduct(productId: number) {
  try {
    await remove(productId)
    showEditModal.value = false
    editingProduct.value = null
    if (pagination?.data?.length === 1 && currentPage.value > 1) {
      currentPage.value--
    }
    toast.show('Товар успешно удален!', 'success')
  } catch (e: any) {
    console.error('❌ Ошибка удаления товара:', productId, e)
    
    // Обрабатываем ошибки от сервера
    let message = 'Произошла неизвестная ошибка при удалении товара'
    
    if (e?.response?.data?.message) {
      // Ошибка от Laravel (например, товар используется в заказах)
      message = e.response.data.message
    } else if (e.message && e.message.includes('Ошибка удаления товара')) {
      // Если ошибка 404 — просто закрыть модалку и обновить список
      toast.show('Товар уже был удалён')
      showEditModal.value = false
      editingProduct.value = null
      // Обновить список, чтобы убрать "мертвый" товар
      await fetchProducts(
        currentPage.value,
        props.search,
        sortBy.value,
        sortOrder.value,
        perPage.value,
      )
      return
    } else if (e instanceof Error && e.message) {
      message = `Ошибка удаления товара: ${e.message}`
    }
    
    toast.show(message, 'error')
  }
}
```

## Результат

### ✅ Защита данных:
- **Проверка заказов** - товар не может быть удален, если используется в заказах
- **Защита от потери данных** - предотвращение удаления товаров с активными связями
- **Валидация на сервере** - проверка выполняется на backend

### ✅ Улучшенный UX:
- **Информативные сообщения** - четкие сообщения о количестве заказов
- **Toast уведомления** - современные уведомления вместо alert
- **Правильная обработка ошибок** - разные типы ошибок обрабатываются по-разному

### ✅ API ответы:

**Успешное удаление:**
```json
{
  "message": "Товар удалён"
}
```

**Ошибка при наличии заказов:**
```json
{
  "message": "Невозможно удалить товар, который используется в 3 заказах"
}
```

**HTTP Status:** 422 (Unprocessable Entity)

## Модель Product

### Отношения:
```php
public function orders()
{
    return $this->hasMany(Order::class);
}
```

### Проверка заказов:
```php
$ordersCount = $product->orders()->count();
```

## Тестирование

### Сценарий 1: Удаление товара без заказов
1. Откройте страницу товаров
2. Найдите товар без связанных заказов
3. Нажмите "Удалить"
4. **Ожидаемый результат:**
   - Toast: "Товар успешно удален!" (success)
   - Товар исчезает из списка

### Сценарий 2: Попытка удаления товара с заказами
1. Откройте страницу товаров
2. Найдите товар, используемый в заказах
3. Нажмите "Удалить"
4. **Ожидаемый результат:**
   - Toast: "Невозможно удалить товар, который используется в X заказах" (error)
   - Товар остается в списке

### Сценарий 3: Сетевая ошибка
1. Отключите интернет
2. Попробуйте удалить товар
3. **Ожидаемый результат:**
   - Toast: "Ошибка удаления товара: Network Error" (error)

## Сравнение с UserController

### UserController (уже реализовано):
```php
// Проверяем все назначения пользователя
$assignmentsCount = $user->assignments()->count();

if ($assignmentsCount > 0) {
    return response()->json([
        'message' => "Невозможно удалить пользователя, который назначен в {$assignmentsCount} заказах"
    ], 422);
}
```

### ProductController (новое):
```php
// Проверяем все заказы, связанные с товаром
$ordersCount = $product->orders()->count();

if ($ordersCount > 0) {
    return response()->json([
        'message' => "Невозможно удалить товар, который используется в {$ordersCount} заказах"
    ], 422);
}
```

## Заключение

Защита от удаления товаров успешно реализована:
- ✅ **Проверка заказов** - товар не удаляется при наличии связанных заказов
- ✅ **Информативные сообщения** - пользователь видит точное количество заказов
- ✅ **Консистентность** - подход аналогичен защите пользователей
- ✅ **Целостность данных** - предотвращение потери связанных данных
- ✅ **Современный UX** - toast уведомления вместо alert

Теперь система безопасно удаляет товары с правильной защитой данных! 🚀 