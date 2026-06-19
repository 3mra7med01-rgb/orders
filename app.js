// ============================================
//   Memories Store - Final App.js
//   Full E-commerce with Supabase, Offline Sync, Credit Card, Address
// ============================================

// ===== Supabase Config =====
const SUPABASE_URL = 'https://ghrxtscgldzjjssatan.supabase.co';
const SUPABASE_KEY = 'sb_publishable_m8jpbERc9RptnLNi-LI0GA_o2TdUB-w';

// ===== Offline Sync =====
async function syncOfflineOrders() {
    if (!navigator.onLine) return;
    const offlineOrders = JSON.parse(localStorage.getItem('memories_offline_orders') || '[]');
    if (offlineOrders.length === 0) return;

    console.log(`[Sync] Found ${offlineOrders.length} offline order(s)...`);

    for (let i = offlineOrders.length - 1; i >= 0; i--) {
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify(offlineOrders[i])
            });

            if (response.ok) {
                offlineOrders.splice(i, 1);
                localStorage.setItem('memories_offline_orders', JSON.stringify(offlineOrders));
                console.log('[Sync] Order synced!');
            }
        } catch (e) {
            console.error('[Sync] Failed:', e);
        }
    }
}
window.addEventListener('online', syncOfflineOrders);

// ===== Product Database =====
const products = [
    { id: 1, name: "Classic Camera", price: 2500, oldPrice: 3200, image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500", category: "cameras", rating: 4.8, reviews: 124, badge: "hot", description: "Authentic vintage camera from the 1950s, in excellent condition." },
    { id: 2, name: "Antique Pocket Watch", price: 1800, image: "https://images.unsplash.com/photo-1509048191080-d2984bad6ae5?w=500", category: "watches", rating: 4.5, reviews: 89, badge: "sale", description: "Genuine Swiss pocket watch, fully mechanical." },
    { id: 3, name: "Vinyl Record Player", price: 3200, oldPrice: 4000, image: "https://images.unsplash.com/photo-1546707012-c46675f12716?w=500", category: "audio", rating: 4.9, reviews: 215, badge: "new", description: "Vintage record player with built-in speakers." },
    { id: 4, name: "Typewriter", price: 4500, image: "https://images.unsplash.com/photo-1515630278258-407f66498911?w=500", category: "office", rating: 4.7, reviews: 67, badge: "hot", description: "Old German typewriter, working efficiently." },
    { id: 5, name: "Retro Radio", price: 1200, oldPrice: 1500, image: "https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=500", category: "audio", rating: 4.3, reviews: 45, badge: "sale", description: "Elegant radio from the 1960s, works on AM/FM." },
    { id: 6, name: "Classic Telephone", price: 800, image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=500", category: "office", rating: 4.6, reviews: 156, badge: "new", description: "Classic rotary telephone, working efficiently." },
    { id: 7, name: "Polaroid Camera", price: 2100, image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500", category: "cameras", rating: 4.4, reviews: 98, badge: "", description: "Original Polaroid camera, works with instant film." },
    { id: 8, name: "Antique Wall Clock", price: 1500, oldPrice: 2000, image: "https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=500", category: "watches", rating: 4.2, reviews: 34, badge: "sale", description: "Old wooden wall clock, mechanical movement." }
];

let cart = [];
let wishlist = [];
let currentFilter = 'all';
let currentSort = 'default';
let searchQuery = '';

const productsContainer = document.getElementById("products-container");
const cartDrawer = document.getElementById("cartDrawer");
const cartOverlay = document.getElementById("cartOverlay");
const cartToggle = document.getElementById("cartToggle");
const cartClose = document.getElementById("cartClose");
const cartItemsContainer = document.getElementById("cart-items");
const totalPriceEl = document.getElementById("total-price");
const cartCountEl = document.getElementById("cartCount");
const toast = document.getElementById("toast");

const wishlistDrawer = document.getElementById("wishlistDrawer");
const wishlistOverlay = document.getElementById("wishlistOverlay");
const wishlistToggle = document.getElementById("wishlistToggle");
const wishlistClose = document.getElementById("wishlistClose");
const wishlistItemsContainer = document.getElementById("wishlist-items");
const wishlistCountEl = document.getElementById("wishlistCount");
const wishlistEmpty = document.getElementById("wishlistEmpty");

const filterBar = document.getElementById("filterBar");
const searchInput = document.getElementById("searchInput");
const searchClear = document.getElementById("searchClear");
const sortSelect = document.getElementById("sortSelect");
const noResults = document.getElementById("noResults");

const quickViewModal = document.getElementById("quickViewModal");
const modalClose = document.getElementById("modalClose");
const modalBody = document.getElementById("modalBody");
const checkoutModal = document.getElementById("checkoutModal");
const checkoutClose = document.getElementById("checkoutClose");
const checkoutBtn = document.getElementById("checkoutBtn");
const checkoutForm = document.getElementById("checkoutForm");
const successModal = document.getElementById("successModal");
const successBtn = document.getElementById("successBtn");
const themeToggle = document.getElementById("themeToggle");

document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    loadCart();
    loadWishlist();
    setTimeout(() => displayProducts(), 800);
    initEventListeners();
    initScrollReveal();
    initParticles();
    syncOfflineOrders();
});

function displayProducts() {
    let filtered = [...products];
    if (currentFilter !== 'all') filtered = filtered.filter(p => p.category === currentFilter);
    if (searchQuery) filtered = filtered.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase()));

    switch(currentSort) {
        case 'price-asc': filtered.sort((a, b) => a.price - b.price); break;
        case 'price-desc': filtered.sort((a, b) => b.price - a.price); break;
        case 'name': filtered.sort((a, b) => a.name.localeCompare(b.name)); break;
        case 'rating': filtered.sort((a, b) => b.rating - a.rating); break;
    }

    if (filtered.length === 0) {
        productsContainer.innerHTML = '';
        noResults.style.display = 'block';
        return;
    }

    noResults.style.display = 'none';
    productsContainer.innerHTML = filtered.map((product, index) => {
        const isWishlisted = wishlist.includes(product.id);
        const stars = '★'.repeat(Math.floor(product.rating)) + '☆'.repeat(5 - Math.floor(product.rating));
        const badgeHTML = product.badge ? `<span class="badge badge-${product.badge}">${getBadgeText(product.badge)}</span>` : '';
        const oldPriceHTML = product.oldPrice ? `<span class="old-price">${product.oldPrice} LE</span>` : '';

        return `
            <div class="product-card" style="animation: fadeInUp 0.5s ${index * 0.1}s both;">
                <div class="product-badges">${badgeHTML}</div>
                <div class="product-image-wrapper">
                    <img src="${product.image}" alt="${product.name}" loading="lazy">
                    <div class="product-overlay">
                        <button class="overlay-btn" onclick="openQuickView(${product.id})" title="Quick View"><i class="fas fa-eye"></i></button>
                        <button class="overlay-btn wishlist-btn ${isWishlisted ? 'active' : ''}" onclick="toggleWishlist(${product.id})" title="Wishlist"><i class="fas fa-heart"></i></button>
                    </div>
                </div>
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <div class="product-rating"><span class="stars">${stars}</span><span class="rating-count">(${product.reviews})</span></div>
                    <div class="product-price-row"><span class="price">${product.price} LE ${oldPriceHTML}</span></div>
                    <button class="add-btn" onclick="addToCart(${product.id})"><i class="fas fa-cart-plus"></i> Add to Cart</button>
                </div>
            </div>
        `;
    }).join('');

    if (!document.getElementById('dynamicStyles')) {
        const style = document.createElement('style');
        style.id = 'dynamicStyles';
        style.textContent = `@keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }`;
        document.head.appendChild(style);
    }
}

function getBadgeText(badge) {
    const badges = { new: 'NEW', sale: 'SALE', hot: 'HOT' };
    return badges[badge] || badge;
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) existingItem.quantity += 1;
    else cart.push({ ...product, quantity: 1 });

    saveCart();
    updateCartUI();
    showToast(`Added ${product.name} to cart 🛍️`, 'success');
    fireConfetti();
    cartToggle.style.transform = 'scale(1.2)';
    setTimeout(() => cartToggle.style.transform = '', 200);
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartUI();
    showToast('Removed from cart', 'info');
}

function updateQuantity(productId, delta) {
    const item = cart.find(item => item.id === productId);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) { removeFromCart(productId); return; }
    saveCart();
    updateCartUI();
}

function updateCartUI() {
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `<div class="cart-empty"><i class="fas fa-shopping-bag"></i><h3>Your cart is empty</h3><p>Start shopping and discover our amazing products</p></div>`;
    } else {
        cartItemsContainer.innerHTML = cart.map(item => `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}" class="cart-item-img">
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <span class="item-price">${item.price} LE</span>
                    <div class="quantity-controls">
                        <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)">−</button>
                        <span class="qty-value">${item.quantity}</span>
                        <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                    </div>
                </div>
                <div style="text-align: left;">
                    <strong style="color: var(--primary); font-size: 1.1rem;">${item.price * item.quantity} LE</strong>
                    <button class="remove-btn" onclick="removeFromCart(${item.id})" title="Remove"><i class="fas fa-trash-alt"></i></button>
                </div>
            </div>
        `).join('');
    }

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    totalPriceEl.textContent = total.toLocaleString();
    cartCountEl.textContent = count;

    const subtotalEl = document.getElementById('subtotalPrice');
    const checkoutTotalEl = document.getElementById('checkoutTotal');
    if (subtotalEl) subtotalEl.textContent = total.toLocaleString() + ' LE';
    if (checkoutTotalEl) checkoutTotalEl.textContent = total.toLocaleString() + ' LE';
}

function saveCart() { localStorage.setItem('memories_cart', JSON.stringify(cart)); }
function loadCart() {
    const saved = localStorage.getItem('memories_cart');
    if (saved) { cart = JSON.parse(saved); updateCartUI(); }
}

function toggleWishlist(productId) {
    const index = wishlist.indexOf(productId);
    const product = products.find(p => p.id === productId);
    if (index > -1) { wishlist.splice(index, 1); showToast(`Removed ${product.name} from wishlist`, 'info'); }
    else { wishlist.push(productId); showToast(`Added ${product.name} to wishlist ❤️`, 'success'); wishlistToggle.style.transform = 'scale(1.2)'; setTimeout(() => wishlistToggle.style.transform = '', 200); }
    saveWishlist();
    updateWishlistUI();
    displayProducts();
}

function updateWishlistUI() {
    wishlistCountEl.textContent = wishlist.length;
    if (wishlist.length === 0) {
        wishlistItemsContainer.innerHTML = '';
        wishlistEmpty.classList.add('visible');
    } else {
        wishlistEmpty.classList.remove('visible');
        const wishlistProducts = products.filter(p => wishlist.includes(p.id));
        wishlistItemsContainer.innerHTML = wishlistProducts.map(product => `
            <div class="wishlist-item">
                <img src="${product.image}" alt="${product.name}">
                <div class="wishlist-item-details"><h4>${product.name}</h4><span class="price">${product.price} LE</span></div>
                <button class="add-btn" style="padding: 8px 16px; font-size: 0.85rem;" onclick="addToCart(${product.id}); toggleWishlist(${product.id})"><i class="fas fa-cart-plus"></i></button>
                <button class="remove-btn" onclick="toggleWishlist(${product.id})"><i class="fas fa-times"></i></button>
            </div>
        `).join('');
    }
}

function saveWishlist() { localStorage.setItem('memories_wishlist', JSON.stringify(wishlist)); }
function loadWishlist() {
    const saved = localStorage.getItem('memories_wishlist');
    if (saved) { wishlist = JSON.parse(saved); updateWishlistUI(); }
}

function openQuickView(productId) {
    const product = products.find(p => p.id === productId);
    const isWishlisted = wishlist.includes(productId);
    const stars = '★'.repeat(Math.floor(product.rating)) + '☆'.repeat(5 - Math.floor(product.rating));

    modalBody.innerHTML = `
        <img src="${product.image}" alt="${product.name}" class="modal-image">
        <div class="modal-info">
            <h2>${product.name}</h2>
            <div class="modal-rating product-rating"><span class="stars">${stars}</span><span class="rating-count">(${product.reviews} reviews)</span></div>
            <div class="modal-price">${product.price} LE</div>
            <p class="modal-desc">${product.description}</p>
            <div class="modal-actions">
                <button class="add-btn" onclick="addToCart(${product.id}); closeModal();"><i class="fas fa-cart-plus"></i> Add to Cart</button>
                <button class="wishlist-btn ${isWishlisted ? 'active' : ''}" onclick="toggleWishlist(${product.id}); this.classList.toggle('active');"><i class="fas fa-heart"></i></button>
            </div>
        </div>
    `;
    quickViewModal.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    quickViewModal.classList.remove('open');
    checkoutModal.classList.remove('open');
    successModal.classList.remove('open');
    document.body.style.overflow = '';
}

function toggleCart() {
    cartDrawer.classList.toggle('open');
    cartOverlay.classList.toggle('open');
    document.body.style.overflow = cartDrawer.classList.contains('open') ? 'hidden' : '';
}

function toggleWishlistDrawer() {
    wishlistDrawer.classList.toggle('open');
    wishlistOverlay.classList.toggle('open');
    document.body.style.overflow = wishlistDrawer.classList.contains('open') ? 'hidden' : '';
}

function showToast(message, type = 'success') {
    toast.textContent = '';
    toast.className = 'toast';
    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
    toast.innerHTML = `<span style="font-size: 1.2rem;">${icon}</span> ${message}`;
    toast.classList.add('show', type);
    clearTimeout(toast.timeout);
    toast.timeout = setTimeout(() => toast.classList.remove('show'), 4000);
}

function loadTheme() {
    const savedTheme = localStorage.getItem('memories_theme');
    if (savedTheme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    updateThemeIcon();
}

function toggleTheme() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) { document.documentElement.removeAttribute('data-theme'); localStorage.setItem('memories_theme', 'light'); }
    else { document.documentElement.setAttribute('data-theme', 'dark'); localStorage.setItem('memories_theme', 'dark'); }
    updateThemeIcon();
}

function updateThemeIcon() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    themeToggle.innerHTML = `<i class="fas fa-${isDark ? 'sun' : 'moon'}"></i>`;
}

function handleSearch(e) {
    searchQuery = e.target.value.trim();
    searchClear.classList.toggle('visible', searchQuery.length > 0);
    displayProducts();
}

function clearSearch() {
    searchInput.value = '';
    searchQuery = '';
    searchClear.classList.remove('visible');
    displayProducts();
}

function openCheckout() {
    if (cart.length === 0) { showToast('Cart is empty! Add products first', 'error'); return; }
    toggleCart();
    checkoutModal.classList.add('open');
    document.body.style.overflow = 'hidden';
}

// Format card number (auto-space every 4 digits)
function formatCardNumber(input) {
    let value = input.value.replace(/\s/g, '').replace(/\D/g, '');
    let formattedValue = '';
    for (let i = 0; i < value.length; i++) {
        if (i > 0 && i % 4 === 0) formattedValue += ' ';
        formattedValue += value[i];
    }
    input.value = formattedValue;
}

// Format expiry date (auto slash)
function formatExpiry(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length >= 2) value = value.substring(0, 2) + '/' + value.substring(2, 4);
    input.value = value;
}

// Toggle credit card fields
function toggleCardFields() {
    const cardFields = document.getElementById('cardFields');
    const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
    if (cardFields) cardFields.style.display = paymentMethod === 'card' ? 'block' : 'none';
}

// ===== CHECKOUT =====
async function handleCheckout(e) {
    e.preventDefault();

    const name = document.getElementById('fullName').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const city = document.getElementById('city').value.trim();
    const area = document.getElementById('area').value.trim();
    const street = document.getElementById('street').value.trim();
    const building = document.getElementById('building').value.trim();
    const apartment = document.getElementById('apartment').value.trim();
    const landmark = document.getElementById('landmark').value.trim();
    const paymentMethod = document.querySelector('input[name="payment"]:checked').value;

    if (!name || !phone || !city || !area || !street) {
        showToast('Please fill all required fields (*)', 'error');
        return;
    }

    // Validate credit card
    if (paymentMethod === 'card') {
        const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
        const cardExpiry = document.getElementById('cardExpiry').value.trim();
        const cardCvv = document.getElementById('cardCvv').value.trim();
        const cardName = document.getElementById('cardName').value.trim();

        if (!cardNumber || !cardExpiry || !cardCvv || !cardName) {
            showToast('Please fill all card details', 'error');
            return;
        }

        // Luhn Algorithm
        let sum = 0, isEven = false;
        for (let i = cardNumber.length - 1; i >= 0; i--) {
            let digit = parseInt(cardNumber.charAt(i), 10);
            if (isEven) { digit *= 2; if (digit > 9) digit -= 9; }
            sum += digit; isEven = !isEven;
        }
        if (sum % 10 !== 0) { showToast('Invalid card number', 'error'); return; }

        // Expiry
        const [month, year] = cardExpiry.split('/');
        const currentYear = new Date().getFullYear() % 100;
        const currentMonth = new Date().getMonth() + 1;
        if (!month || !year || month < 1 || month > 12 || parseInt(year) < currentYear || (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
            showToast('Invalid or expired card', 'error'); return;
        }

        // CVV
        if (!/^\d{3,4}$/.test(cardCvv)) { showToast('CVV must be 3-4 digits', 'error'); return; }
    }

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const itemsText = cart.map(item => `${item.name} x${item.quantity} = ${item.quantity * item.price}LE`).join(' | ');
    const fullAddress = `${city} - ${area} - ${street}${building ? ' - Building ' + building : ''}${apartment ? ' - Apt ' + apartment : ''}${landmark ? ' - Landmark: ' + landmark : ''}`;
    const orderRef = `MEM-${Math.floor(100000 + Math.random() * 900000)}`;

    const orderData = {
        order_reference: orderRef,
        customer_name: name,
        phone: phone,
        city: city,
        area: area,
        street: street,
        building: building || null,
        apartment: apartment || null,
        landmark: landmark || null,
        address: fullAddress,
        payment_method: paymentMethod === 'cod' ? 'Cash on Delivery' : 'Credit Card',
        items: itemsText,
        total: total,
        status: 'pending'
    };

    const submitBtn = checkoutForm.querySelector('.checkout-submit');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    submitBtn.disabled = true;

    let saved = false;

    // Try Supabase
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify(orderData)
        });

        if (response.ok) {
            saved = true;
            console.log('Order saved to Supabase!');
        } else {
            const errorText = await response.text();
            console.error('Supabase error:', response.status, errorText);
        }
    } catch (error) {
        console.error('Connection error:', error);
    }

    // If failed, save offline
    if (!saved) {
        const offlineOrders = JSON.parse(localStorage.getItem('memories_offline_orders') || '[]');
        offlineOrders.push(orderData);
        localStorage.setItem('memories_offline_orders', JSON.stringify(offlineOrders));
        showToast(`Order saved offline! Ref: ${orderRef} 💾`, 'info');
    } else {
        showToast(`Order placed! Ref: ${orderRef} ✅`, 'success');
    }

    // Clear cart
    cart = [];
    saveCart();
    updateCartUI();

    checkoutModal.classList.remove('open');
    successModal.classList.add('open');

    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
    checkoutForm.reset();

    fireConfetti(100);
}

// ===== CONFETTI =====
function fireConfetti(count = 30) {
    const canvas = document.createElement('canvas');
    canvas.id = 'confettiCanvas';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const particles = [];
    const colors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];

    for (let i = 0; i < count; i++) {
        particles.push({
            x: canvas.width / 2, y: canvas.height / 2,
            vx: (Math.random() - 0.5) * 15, vy: (Math.random() - 0.5) * 15 - 5,
            size: Math.random() * 8 + 4, color: colors[Math.floor(Math.random() * colors.length)],
            rotation: Math.random() * 360, rotationSpeed: (Math.random() - 0.5) * 10, life: 1
        });
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.x += p.vx; p.y += p.vy; p.vy += 0.3;
            p.rotation += p.rotationSpeed; p.life -= 0.015;
            if (p.life > 0) {
                ctx.save(); ctx.translate(p.x, p.y); ctx.rotate((p.rotation * Math.PI) / 180);
                ctx.globalAlpha = p.life; ctx.fillStyle = p.color;
                ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size); ctx.restore();
            }
        });
        if (particles.some(p => p.life > 0)) requestAnimationFrame(animate);
        else canvas.remove();
    }
    animate();
}

// ===== PARTICLES =====
function initParticles() {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    resize(); window.addEventListener('resize', resize);
    const particles = [];
    for (let i = 0; i < 50; i++) {
        particles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, size: Math.random() * 2 + 0.5, speedX: (Math.random() - 0.5) * 0.3, speedY: (Math.random() - 0.5) * 0.3, opacity: Math.random() * 0.5 + 0.1 });
    }
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.x += p.speedX; p.y += p.speedY;
            if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(99, 102, 241, ${p.opacity})`; ctx.fill();
        });
        requestAnimationFrame(animate);
    }
    animate();
}

// ===== SCROLL REVEAL =====
function initScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('revealed'); });
    }, { threshold: 0.1 });
    document.querySelectorAll('.scroll-reveal').forEach(el => observer.observe(el));
}

// ===== EVENT LISTENERS =====
function initEventListeners() {
    cartToggle.addEventListener('click', toggleCart);
    cartClose.addEventListener('click', toggleCart);
    cartOverlay.addEventListener('click', toggleCart);

    wishlistToggle.addEventListener('click', toggleWishlistDrawer);
    wishlistClose.addEventListener('click', toggleWishlistDrawer);
    wishlistOverlay.addEventListener('click', toggleWishlistDrawer);

    modalClose.addEventListener('click', closeModal);
    checkoutClose.addEventListener('click', closeModal);
    successBtn.addEventListener('click', closeModal);

    quickViewModal.addEventListener('click', (e) => { if (e.target === quickViewModal) closeModal(); });
    checkoutModal.addEventListener('click', (e) => { if (e.target === checkoutModal) closeModal(); });
    successModal.addEventListener('click', (e) => { if (e.target === successModal) closeModal(); });

    themeToggle.addEventListener('click', toggleTheme);

    searchInput.addEventListener('input', handleSearch);
    searchClear.addEventListener('click', clearSearch);

    filterBar.addEventListener('click', (e) => {
        if (e.target.classList.contains('filter-btn')) {
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.filter;
            displayProducts();
        }
    });

    sortSelect.addEventListener('change', (e) => { currentSort = e.target.value; displayProducts(); });

    checkoutBtn.addEventListener('click', openCheckout);
    checkoutForm.addEventListener('submit', handleCheckout);

    // Card formatting
    const cardNumberInput = document.getElementById('cardNumber');
    if (cardNumberInput) cardNumberInput.addEventListener('input', () => formatCardNumber(cardNumberInput));
    const cardExpiryInput = document.getElementById('cardExpiry');
    if (cardExpiryInput) cardExpiryInput.addEventListener('input', () => formatExpiry(cardExpiryInput));

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
            cartDrawer.classList.remove('open'); cartOverlay.classList.remove('open');
            wishlistDrawer.classList.remove('open'); wishlistOverlay.classList.remove('open');
            document.body.style.overflow = '';
        }
    });

    let touchStartX = 0;
    cartDrawer.addEventListener('touchstart', (e) => touchStartX = e.touches[0].clientX);
    cartDrawer.addEventListener('touchend', (e) => { if (touchStartX - e.changedTouches[0].clientX > 100) toggleCart(); });
    wishlistDrawer.addEventListener('touchstart', (e) => touchStartX = e.touches[0].clientX);
    wishlistDrawer.addEventListener('touchend', (e) => { if (e.changedTouches[0].clientX - touchStartX > 100) toggleWishlistDrawer(); });
}