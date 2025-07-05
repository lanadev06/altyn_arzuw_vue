#!/bin/bash

echo "🚀 Setting up Products Management System"
echo "========================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "✅ Project structure verified"

# Create necessary directories if they don't exist
echo "📁 Creating directories..."
mkdir -p src/components/products/ProductList
mkdir -p src/types
mkdir -p src/controllers

echo "✅ Directories created"

# Check if files exist
echo "📋 Checking required files..."

files=(
    "src/types/product.ts"
    "src/types/designer.ts"
    "src/controllers/ProductController.ts"
    "src/components/products/ProductList/ProductList.vue"
    "src/components/products/ProductList/ProductFormModal.vue"
    "src/views/ProductsView.vue"
    "PRODUCTS_LARAVEL_SETUP.md"
    "PRODUCTS_README.md"
    "SAMPLE_PRODUCTS_DATA.md"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
    fi
done

echo ""
echo "🎯 Next Steps:"
echo "=============="
echo ""
echo "1. 📚 Read the documentation:"
echo "   - PRODUCTS_README.md - Complete guide"
echo "   - PRODUCTS_LARAVEL_SETUP.md - Backend setup"
echo "   - SAMPLE_PRODUCTS_DATA.md - Test data"
echo ""
echo "2. 🛠️ Backend Setup (Laravel):"
echo "   - Create migration: php artisan make:migration create_products_table"
echo "   - Run migration: php artisan migrate"
echo "   - Add routes to routes/api.php"
echo "   - Create ProductController"
echo "   - Designer endpoint already exists: /api/users/role/designer"
echo ""
echo "3. 🎨 Frontend Setup:"
echo "   - Install dependencies: npm install"
echo "   - Start dev server: npm run dev"
echo "   - Navigate to /products"
echo ""
echo "4. 🧪 Testing:"
echo "   - Run tests: npm run test"
echo "   - Test API endpoints with curl"
echo "   - Manual testing checklist in SAMPLE_PRODUCTS_DATA.md"
echo ""
echo "5. 🔧 Configuration:"
echo "   - Update API base URL in src/config/api.ts"
echo "   - Configure authentication tokens"
echo "   - Customize workshop types if needed"
echo ""
echo "📖 For detailed instructions, see PRODUCTS_README.md"
echo ""
echo "🎉 Setup complete! Happy coding! 🚀" 