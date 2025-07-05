import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ProductList from './ProductList.vue'

// Mock the dependencies
vi.mock('@/controllers/ProductController', () => ({
  ProductController: () => ({
    pagination: { value: { data: [], current_page: 1, last_page: 1, total: 0 } },
    loading: { value: false },
    error: { value: '' },
    sortBy: { value: 'id' },
    sortOrder: { value: 'desc' },
    fetchProducts: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  }),
}))

vi.mock('@/components/ui/UIButton.vue', () => ({
  default: {
    template: '<button><slot /></button>',
    props: ['variant', 'loading'],
  },
}))

vi.mock('@/components/users/UserList/Pagination.vue', () => ({
  default: {
    template: '<div>Pagination</div>',
    props: ['current-page', 'last-page'],
  },
}))

vi.mock('./ProductFormModal.vue', () => ({
  default: {
    template: '<div>ProductFormModal</div>',
    props: ['product'],
  },
}))

describe('ProductList', () => {
  it('renders correctly', () => {
    const wrapper = mount(ProductList, {
      props: {
        search: '',
      },
    })

    expect(wrapper.find('.product-list').exists()).toBe(true)
    expect(wrapper.find('table').exists()).toBe(true)
  })

  it('shows create button', () => {
    const wrapper = mount(ProductList, {
      props: {
        search: '',
      },
    })

    expect(wrapper.text()).toContain('Добавить товар')
  })

  it('has correct table columns', () => {
    const wrapper = mount(ProductList, {
      props: {
        search: '',
      },
    })

    const headers = wrapper.findAll('th')
    expect(headers).toHaveLength(6) // ID, Name, Designer, Workshop Required, Workshop Type, Created At
  })
})
