// Тестовый скрипт для проверки API назначений
const API_BASE = 'http://localhost:8000/api'

async function testAssignments() {
  try {
    console.log('🔍 Тестируем API назначений...')

    // 1. Получаем список заказов
    const ordersResponse = await fetch(`${API_BASE}/orders`)
    const ordersData = await ordersResponse.json()
    console.log('📋 Заказы:', ordersData.data?.length || 0, 'заказов')

    if (ordersData.data && ordersData.data.length > 0) {
      const firstOrder = ordersData.data[0]
      console.log('📋 Первый заказ:', firstOrder.id, firstOrder.stage)

      // 2. Получаем назначения для первого заказа
      const assignmentsResponse = await fetch(`${API_BASE}/assignments?order_id=${firstOrder.id}`)
      const assignmentsData = await assignmentsResponse.json()
      console.log('📋 Назначения для заказа', firstOrder.id, ':', assignmentsData)

      // 3. Получаем детали заказа
      const orderDetailsResponse = await fetch(`${API_BASE}/orders/${firstOrder.id}`)
      const orderDetails = await orderDetailsResponse.json()
      console.log('📋 Детали заказа:', orderDetails)

      // 4. Проверяем, есть ли назначения в деталях заказа
      if (orderDetails.assignments) {
        console.log('✅ Назначения найдены в деталях заказа:', orderDetails.assignments.length)
        orderDetails.assignments.forEach((assignment, index) => {
          console.log(
            `  ${index + 1}. ${assignment.user?.name} (${assignment.role_type}) - ${assignment.status}`,
          )
        })
      } else {
        console.log('❌ Назначения не найдены в деталях заказа')
      }
    }
  } catch (error) {
    console.error('❌ Ошибка тестирования:', error)
  }
}

// Запускаем тест
testAssignments()
