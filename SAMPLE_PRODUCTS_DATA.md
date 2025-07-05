# Sample Products Data

## Laravel Seeder

```php
<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run()
    {
        // Create some designers first
        $designer1 = User::create([
            'name' => 'Анна Петрова',
            'username' => 'anna_designer',
            'email' => 'anna@example.com',
            'password' => bcrypt('password'),
            'role' => 'designer',
        ]);

        $designer2 = User::create([
            'name' => 'Михаил Иванов',
            'username' => 'mikhail_designer',
            'email' => 'mikhail@example.com',
            'password' => bcrypt('password'),
            'role' => 'designer',
        ]);

        // Create sample products
        Product::create([
            'name' => 'Визитки',
            'designer_id' => $designer1->id,
            'is_workshop_required' => false,
        ]);

        Product::create([
            'name' => 'Буклеты А4',
            'designer_id' => $designer2->id,
            'is_workshop_required' => true,
            'workshop_type' => 'binding',
        ]);

        Product::create([
            'name' => 'Плакаты А1',
            'designer_id' => $designer1->id,
            'is_workshop_required' => true,
            'workshop_type' => 'montage',
        ]);

        Product::create([
            'name' => 'Листовки А5',
            'designer_id' => null,
            'is_workshop_required' => false,
        ]);

        Product::create([
            'name' => 'Каталоги',
            'designer_id' => $designer2->id,
            'is_workshop_required' => true,
            'workshop_type' => 'binding',
        ]);

        Product::create([
            'name' => 'Баннеры',
            'designer_id' => $designer1->id,
            'is_workshop_required' => true,
            'workshop_type' => 'montage',
        ]);

        Product::create([
            'name' => 'Наклейки',
            'designer_id' => null,
            'is_workshop_required' => false,
        ]);

        Product::create([
            'name' => 'Календари',
            'designer_id' => $designer2->id,
            'is_workshop_required' => true,
            'workshop_type' => 'binding',
        ]);
    }
}
```

## API Test Data

### Sample API Response for Products

```json
{
  "data": [
    {
      "id": 1,
      "name": "Визитки",
      "designer_id": 1,
      "is_workshop_required": false,
      "workshop_type": null,
      "created_at": "2024-01-15T10:30:00.000000Z",
      "updated_at": "2024-01-15T10:30:00.000000Z",
      "designer": {
        "id": 1,
        "name": "Анна Петрова",
        "username": "anna_designer"
      }
    },
    {
      "id": 2,
      "name": "Буклеты А4",
      "designer_id": 2,
      "is_workshop_required": true,
      "workshop_type": "binding",
      "created_at": "2024-01-15T11:00:00.000000Z",
      "updated_at": "2024-01-15T11:00:00.000000Z",
      "designer": {
        "id": 2,
        "name": "Михаил Иванов",
        "username": "mikhail_designer"
      }
    }
  ],
  "current_page": 1,
  "last_page": 1,
  "per_page": 10,
  "total": 2,
  "from": 1,
  "to": 2
}
```

### Sample API Response for Designers

```json
[
  {
    "id": 1,
    "name": "Анна Петрова",
    "username": "anna_designer"
  },
  {
    "id": 2,
    "name": "Михаил Иванов",
    "username": "mikhail_designer"
  }
]
```

## Test Commands

### Laravel Commands

```bash
# Run the seeder
php artisan db:seed --class=ProductSeeder

# Or run all seeders
php artisan db:seed

# Clear and re-seed
php artisan migrate:fresh --seed
```

### API Testing with curl

```bash
# Get products (replace with your token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Accept: application/json" \
     "http://localhost:8000/api/products"

# Get products with search
curl -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Accept: application/json" \
     "http://localhost:8000/api/products?search=визитки"

# Get products with pagination
curl -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Accept: application/json" \
     "http://localhost:8000/api/products?page=1&per_page=5"

# Get designers
curl -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Accept: application/json" \
     "http://localhost:8000/api/users/role/designer"

# Create a product
curl -X POST \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Accept: application/json" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Тестовый товар",
       "designer_id": 1,
       "is_workshop_required": true,
       "workshop_type": "montage"
     }' \
     "http://localhost:8000/api/products"
```

## Frontend Testing

### Manual Testing Checklist

- [ ] Navigate to Products page
- [ ] Verify table loads with data
- [ ] Test pagination (if more than 10 items)
- [ ] Test sorting by clicking column headers
- [ ] Test search functionality
- [ ] Create a new product
- [ ] Edit an existing product
- [ ] Delete a product
- [ ] Verify designer dropdown loads
- [ ] Test workshop type conditional display
- [ ] Test form validation

### Browser Console Testing

```javascript
// Test API calls in browser console
fetch('/api/products', {
  headers: {
    Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
    Accept: 'application/json',
  },
})
  .then((r) => r.json())
  .then(console.log)

// Test designers endpoint
fetch('/api/users/role/designer', {
  headers: {
    Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
    Accept: 'application/json',
  },
})
  .then((r) => r.json())
  .then(console.log)
```
