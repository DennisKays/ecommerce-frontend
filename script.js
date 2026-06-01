const API_URL = 'https://ecommerce-api-david.onrender.com';

let cart = [];
let products = [];

// Load products on page load
async function loadProducts(category = 'all') {
    try {
        const url = category === 'all' ? `${API_URL}/products` : `${API_URL}/products?category=${category}`;
        const response = await fetch(url);
        products = await response.json();
        renderProducts(products);
    } catch (error) {
        console.error('Error loading products:', error);
        document.getElementById('productsGrid').innerHTML = '<p style="text-align:center;color:#6b7280;">Failed to load products. Make sure the backend is running.</p>';
    }
}

function renderProducts(products) {
    const grid = document.getElementById('productsGrid');
    
    if (products.length === 0) {
        grid.innerHTML = '<p style="text-align:center;color:#6b7280;">No products found.</p>';
        return;
    }
    
    grid.innerHTML = products.map(product => `
    <div class="product-card" onclick="openProduct(${product.id})">
        <img src="${product.image_url}" alt="${product.name}" class="product-image">
        <div class="product-info">
            <div class="product-category">${product.category}</div>
            <div class="product-name">${product.name}</div>
            <div class="product-price">$${product.price.toFixed(2)}</div>
            <div class="product-stock">${product.stock} in stock</div>
            <button class="quick-add-btn" onclick="event.stopPropagation(); addToCart(${product.id})">Add to Cart</button>
        </div>
    </div>
`).join('');
}

function filterProducts(category) {
    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    loadProducts(category);
}

async function openProduct(id) {
    try {
        const response = await fetch(`${API_URL}/products/${id}`);
        const product = await response.json();
        
        document.getElementById('modalBody').innerHTML = `
            <img src="${product.image_url}" alt="${product.name}" class="modal-image">
            <div class="product-category">${product.category}</div>
            <h2>${product.name}</h2>
            <p style="color: #6b7280; margin: 12px 0;">${product.description}</p>
            <div class="product-price" style="font-size: 1.5rem;">$${product.price.toFixed(2)}</div>
            <div class="product-stock" style="margin-top: 8px;">${product.stock} in stock</div>
            <button class="add-to-cart" onclick="addToCart(${product.id})">Add to Cart</button>
        `;
        
        document.getElementById('productModal').classList.add('active');
    } catch (error) {
        console.error('Error loading product:', error);
    }
}

function closeModal() {
    document.getElementById('productModal').classList.remove('active');
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    
    updateCart();
    closeModal();
}

function updateCart() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cartCount').textContent = count;
    
    const cartItems = document.getElementById('cartItems');
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    document.getElementById('cartTotal').textContent = total.toFixed(2);
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<div class="empty-cart">Your cart is empty</div>';
        return;
    }
    
    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <img src="${item.image_url}" alt="${item.name}">
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <p>$${item.price.toFixed(2)} x ${item.quantity}</p>
                <p style="color: #2563eb; cursor: pointer;" onclick="removeFromCart(${item.id})">Remove</p>
            </div>
        </div>
    `).join('');
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCart();
}

function toggleCart() {
    document.getElementById('cartSidebar').classList.toggle('active');
}

function checkout() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    
    const customerName = prompt('Enter your name:');
    if (!customerName) return;
    
    const customerEmail = prompt('Enter your email:');
    if (!customerEmail) return;
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const order = {
        customer_name: customerName,
        customer_email: customerEmail,
        items: cart.map(item => ({
            product_id: item.id,
            quantity: item.quantity
        })),
        total: total
    };
    
    fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(order)
    })
    .then(response => response.json())
    .then(data => {
        alert(`Order placed! Order ID: ${data.order_id}`);
        cart = [];
        updateCart();
        toggleCart();
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to place order. Please try again.');
    });
}

// Close modal on outside click
document.getElementById('productModal').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
});

// Load products on startup
loadProducts();
