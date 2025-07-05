# Products Laravel API Setup

## Updated ProductController with Search

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
    // Используем существующий роут для получения пользователей по роли
    Route::get('users/role/{role}', [UserController::class, 'getByRole']);
});
```

## Designer API Endpoint

Используется существующий метод `getByRole` в UserController:

```php
// В UserController уже есть метод getByRole
// GET /api/users/role/designer - вернет всех дизайнеров
```

## Commands to Run

```bash
# Create migration
php artisan make:migration create_products_table

# Run migration
php artisan migrate

# Create seeder (optional)
php artisan make:seeder ProductSeeder
```

## Sample Data (ProductSeeder)

```php
<?php

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run()
    {
        Product::create([
            'name' => 'Визитки',
            'is_workshop_required' => false,
        ]);

        Product::create([
            'name' => 'Буклеты',
            'is_workshop_required' => true,
            'workshop_type' => 'binding',
        ]);

        Product::create([
            'name' => 'Плакаты',
            'is_workshop_required' => true,
            'workshop_type' => 'montage',
        ]);
    }
}
```
