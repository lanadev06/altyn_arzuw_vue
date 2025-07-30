// Тест защиты от удаления товаров с заказами
// Запуск: node test-product-deletion-protection.js

const API_BASE = 'http://localhost:8000/api'

async function testProductDeletionProtection() {
  console.log('🧪 Тестирование защиты от удаления товаров с заказами...\n')

  // 1. Получаем список товаров
  console.log('1️⃣ Получаем список товаров...')
  const productsResponse = await fetch(`${API_BASE}/products?per_page=10`)
  const productsData = await productsResponse.json()

  if (!productsData.data || productsData.data.length === 0) {
    console.log('❌ Нет товаров для тестирования')
    return
  }

  const products = productsData.data
  console.log(`✅ Найдено ${products.length} товаров`)

  // 2. Получаем список заказов
  console.log('\n2️⃣ Получаем список заказов...')
  const ordersResponse = await fetch(`${API_BASE}/orders?per_page=10`)
  const ordersData = await ordersResponse.json()

  if (!ordersData.data || ordersData.data.length === 0) {
    console.log('❌ Нет заказов для тестирования')
    return
  }

  const orders = ordersData.data
  console.log(`✅ Найдено ${orders.length} заказов`)

  // 3. Анализируем связи товаров и заказов
  console.log('\n3️⃣ Анализируем связи товаров и заказов...')

  const productOrderCounts = {}
  const productsWithOrders = []
  const productsWithoutOrders = []

  // Подсчитываем заказы для каждого товара
  orders.forEach((order) => {
    const productId = order.product_id
    productOrderCounts[productId] = (productOrderCounts[productId] || 0) + 1
  })

  // Разделяем товары на категории
  products.forEach((product) => {
    const orderCount = productOrderCounts[product.id] || 0
    if (orderCount > 0) {
      productsWithOrders.push({ ...product, orderCount })
    } else {
      productsWithoutOrders.push(product)
    }
  })

  console.log(`📊 Товары с заказами: ${productsWithOrders.length}`)
  console.log(`📊 Товары без заказов: ${productsWithoutOrders.length}`)

  // 4. Тестируем удаление товара без заказов
  if (productsWithoutOrders.length > 0) {
    console.log('\n4️⃣ Тестируем удаление товара БЕЗ заказов...')
    const testProduct = productsWithoutOrders[0]
    console.log(`🎯 Тестируем товар: "${testProduct.name}" (ID: ${testProduct.id})`)

    try {
      const deleteResponse = await fetch(`${API_BASE}/products/${testProduct.id}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token') || 'test-token'}`,
        },
      })

      if (deleteResponse.ok) {
        console.log('✅ Товар без заказов успешно удален (как и ожидалось)')
      } else {
        const errorData = await deleteResponse.json()
        console.log(`❌ Ошибка удаления товара без заказов: ${errorData.message}`)
      }
    } catch (error) {
      console.log(`❌ Ошибка при тестировании: ${error.message}`)
    }
  } else {
    console.log('\n4️⃣ Пропускаем тест удаления товара без заказов (нет таких товаров)')
  }

  // 5. Тестируем удаление товара С заказами
  if (productsWithOrders.length > 0) {
    console.log('\n5️⃣ Тестируем удаление товара С заказами...')
    const testProduct = productsWithOrders[0]
    console.log(`🎯 Тестируем товар: "${testProduct.name}" (ID: ${testProduct.id})`)
    console.log(`📦 У товара ${testProduct.orderCount} заказов`)

    try {
      const deleteResponse = await fetch(`${API_BASE}/products/${testProduct.id}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token') || 'test-token'}`,
        },
      })

      if (deleteResponse.status === 422) {
        const errorData = await deleteResponse.json()
        console.log('✅ Защита работает! Товар с заказами не удален')
        console.log(`📝 Сообщение об ошибке: "${errorData.message}"`)

        // Проверяем, что сообщение содержит правильную информацию
        if (
          errorData.message.includes('Невозможно удалить товар') &&
          errorData.message.includes('заказах')
        ) {
          console.log('✅ Сообщение об ошибке корректное')
        } else {
          console.log('⚠️ Сообщение об ошибке не соответствует ожидаемому формату')
        }
      } else if (deleteResponse.ok) {
        console.log('❌ ОШИБКА! Товар с заказами был удален (защита не работает)')
      } else {
        const errorData = await deleteResponse.json()
        console.log(`❌ Неожиданная ошибка: ${deleteResponse.status} - ${errorData.message}`)
      }
    } catch (error) {
      console.log(`❌ Ошибка при тестировании: ${error.message}`)
    }
  } else {
    console.log('\n5️⃣ Пропускаем тест удаления товара с заказами (нет таких товаров)')
  }

  // 6. Выводим статистику
  console.log('\n6️⃣ Статистика связей товаров и заказов:')
  productsWithOrders.forEach((product) => {
    console.log(`   📦 "${product.name}" (ID: ${product.id}) - ${product.orderCount} заказов`)
  })

  console.log('\n✅ Тестирование завершено!')
}

// Запускаем тест
testProductDeletionProtection().catch(console.error)
