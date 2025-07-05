# Products Management System

Complete CRUD system for managing products with Laravel backend and Vue.js frontend.

## 🚀 Features

- ✅ **Full CRUD Operations** - Create, Read, Update, Delete products
- ✅ **Pagination** - Server-side pagination with configurable page size
- ✅ **Sorting** - Sort by any column (ID, name, workshop required, etc.)
- ✅ **Search** - Search products by name
- ✅ **Form Validation** - Client-side validation with error messages
- ✅ **Designer Assignment** - Assign designers to products
- ✅ **Workshop Integration** - Configure workshop requirements and types
- ✅ **Responsive Design** - Works on all screen sizes
- ✅ **Loading States** - Loading indicators during API calls
- ✅ **Error Handling** - Proper error display and handling

## 📁 File Structure

```
src/
├── types/
│   ├── product.ts          # Product interface
│   └── designer.ts         # Designer interface
├── controllers/
│   └── ProductController.ts # Product state management
├── services/
│   └── api.ts              # API functions (products section)
├── components/
│   └── products/
│       └── ProductList/
│           ├── ProductList.vue        # Main products table
│           ├── ProductFormModal.vue   # Create/Edit form
│           └── ProductList.test.ts    # Unit tests
├── views/
│   └── ProductsView.vue    # Products page
└── router/
    └── index.ts            # Products route
```

## 🛠️ Backend Setup (Laravel)

### 1. Create Migration

```bash
php artisan make:migration create_products_table
```

### 2. Run Migration

```bash
php artisan migrate
```

### 3. Create Model

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

### 4. Create Controller

See `PRODUCTS_LARAVEL_SETUP.md` for complete controller code.

### 5. Add Routes

```php
// routes/api.php
Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('products', ProductController::class);
    Route::get('designers', [UserController::class, 'getDesigners']);
});
```

### 6. Add Designer Endpoint

```php
// In UserController
public function getDesigners()
{
    return User::where('role', 'designer')
        ->select('id', 'name', 'username')
        ->get();
}
```

## 🎯 Frontend Usage

### Navigation

1. Click "Товары" in the sidebar
2. You'll see the products table with pagination

### Creating a Product

1. Click "Добавить товар" button
2. Fill in the form:
   - **Name** (required): Product name
   - **Designer** (optional): Assign a designer
   - **Workshop Required**: Check if workshop processing is needed
   - **Workshop Type**: Select "Монтаж" or "Переплет" if workshop is required
3. Click "Создать"

### Editing a Product

1. Click on any row in the products table
2. Modify the fields in the modal
3. Click "Сохранить"

### Deleting a Product

1. Open the edit modal for the product
2. Click "Удалить" button
3. Confirm the deletion

### Sorting

- Click on column headers to sort
- Arrows indicate sort direction (↑ ascending, ↓ descending)

### Search

- Use the search bar to filter products by name
- Search is performed on the backend

## 🔧 API Endpoints

| Method | Endpoint                   | Description                             |
| ------ | -------------------------- | --------------------------------------- |
| GET    | `/api/products`            | Get paginated products with search/sort |
| GET    | `/api/products/{id}`       | Get single product                      |
| POST   | `/api/products`            | Create new product                      |
| PUT    | `/api/products/{id}`       | Update product                          |
| DELETE | `/api/products/{id}`       | Delete product                          |
| GET    | `/api/users/role/designer` | Get all designers                       |

### Query Parameters

- `page`: Page number (default: 1)
- `per_page`: Items per page (default: 10)
- `search`: Search term for product name
- `sort_by`: Column to sort by (default: id)
- `sort_order`: Sort direction (asc/desc, default: desc)

## 📊 Data Structure

### Product

```typescript
interface Product {
  id: number
  name: string
  designer_id?: number | null
  is_workshop_required: boolean
  workshop_type?: 'montage' | 'binding' | null
  created_at: string
  updated_at: string
  designer?: {
    id: number
    name: string
    username: string
  } | null
}
```

### Designer

```typescript
interface Designer {
  id: number
  name: string
  username: string
}
```

## 🧪 Testing

Run the unit tests:

```bash
npm run test
```

## 🎨 Customization

### Adding New Fields

1. Update the Product interface in `src/types/product.ts`
2. Add the field to the Laravel migration and model
3. Update the form in `ProductFormModal.vue`
4. Add the column to the table in `ProductList.vue`

### Changing Workshop Types

1. Update the enum in the Laravel migration
2. Update the `getWorkshopTypeLabel` function in `ProductList.vue`
3. Update the select options in `ProductFormModal.vue`

### Styling

The components use Tailwind CSS classes. You can customize the styling by modifying the class names in the Vue components.

## 🚨 Troubleshooting

### Common Issues

1. **Designers not loading**: Check if the `/api/users/role/designer` endpoint exists and returns data
2. **Search not working**: Ensure the Laravel controller has search functionality implemented
3. **Pagination issues**: Verify the API returns the correct pagination structure
4. **Form validation errors**: Check that all required fields are properly validated

### Debug Mode

Enable Vue devtools and check the browser console for any JavaScript errors.

## 📝 Notes

- The system assumes you have a `users` table with a `role` field to identify designers
- Workshop types are hardcoded as 'montage' and 'binding' - customize as needed
- The search functionality searches only by product name
- All API calls require authentication via Bearer token
