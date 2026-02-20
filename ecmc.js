// ===================== THEME TOGGLE =====================
const toggleBtn = document.getElementById('theme-toggle');
const body = document.body;
const icon = toggleBtn.querySelector('i');

if (localStorage.getItem('theme') === 'dark') {
    body.classList.add('dark-mode');
    icon.classList.replace('fa-moon', 'fa-sun');
}

toggleBtn.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    const dark = body.classList.contains('dark-mode');
    icon.classList.replace(dark ? 'fa-moon' : 'fa-sun', dark ? 'fa-sun' : 'fa-moon');
    localStorage.setItem('theme', dark ? 'dark' : 'light');
});

// ===================== CART STATE =====================
let cart = JSON.parse(localStorage.getItem('greenCart') || '[]');

function saveCart() {
    localStorage.setItem('greenCart', JSON.stringify(cart));
}

function getItem(id) {
    return cart.find(i => i.id === id);
}

// ===================== CART UI =====================
const cartSidebar = document.getElementById('cart-sidebar');
const cartOverlay = document.getElementById('cart-overlay');
const cartToggleBtn = document.getElementById('cart-toggle-btn');
const cartCloseBtn = document.getElementById('cart-close-btn');
const cartBadge = document.getElementById('cart-badge');
const cartItemsEl = document.getElementById('cart-items');
const cartEmpty = document.getElementById('cart-empty');
const cartFooter = document.getElementById('cart-footer');
const cartSubtotal = document.getElementById('cart-subtotal');
const cartTotal = document.getElementById('cart-total');
const btnClearCart = document.getElementById('btn-clear-cart');

function openCart() {
    cartSidebar.classList.add('active');
    cartOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCart() {
    cartSidebar.classList.remove('active');
    cartOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

cartToggleBtn.addEventListener('click', openCart);
cartCloseBtn.addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeCart();
});

// ===================== RENDER CART =====================
function renderCart() {
    // Badge
    const totalQty = cart.reduce((sum, i) => sum + i.qty, 0);
    cartBadge.textContent = totalQty;
    cartBadge.style.display = totalQty > 0 ? 'flex' : 'none';

    // Calculate totals
    const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
    cartSubtotal.textContent = `$${subtotal.toFixed(2)}`;
    cartTotal.textContent = `$${subtotal.toFixed(2)}`;

    // Show/hide empty state & footer
    if (cart.length === 0) {
        cartEmpty.style.display = 'flex';
        cartFooter.style.display = 'none';
        cartItemsEl.innerHTML = '';
        cartItemsEl.appendChild(cartEmpty);
        return;
    }

    cartEmpty.style.display = 'none';
    cartFooter.style.display = 'block';

    // Render items
    const existing = cartItemsEl.querySelector('.cart-empty');
    if (existing) cartItemsEl.innerHTML = '';

    // Remove items not in cart
    [...cartItemsEl.querySelectorAll('.cart-item')].forEach(el => {
        if (!cart.find(i => i.id === el.dataset.id)) el.remove();
    });

    cart.forEach(item => {
        const existingEl = cartItemsEl.querySelector(`.cart-item[data-id="${item.id}"]`);
        if (existingEl) {
            existingEl.querySelector('.qty-display').textContent = item.qty;
            existingEl.querySelector('.cart-item-price').textContent = `$${(item.price * item.qty).toFixed(2)}`;
        } else {
            const el = document.createElement('div');
            el.className = 'cart-item';
            el.dataset.id = item.id;
            el.innerHTML = `
                <img class="cart-item-img" src="${item.img}" alt="${item.name}" onerror="this.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80&q=60'">
                <div class="cart-item-details">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-cat">${item.category}</div>
                    <div class="cart-item-qty">
                        <button class="qty-btn qty-minus" data-id="${item.id}" aria-label="Decrease quantity">−</button>
                        <span class="qty-display">${item.qty}</span>
                        <button class="qty-btn qty-plus" data-id="${item.id}" aria-label="Increase quantity">+</button>
                    </div>
                </div>
                <div style="display:flex;flex-direction:column;align-items:flex-end;gap:12px;">
                    <button class="cart-item-remove" data-id="${item.id}" aria-label="Remove item">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                    <span class="cart-item-price">$${(item.price * item.qty).toFixed(2)}</span>
                </div>
            `;
            cartItemsEl.appendChild(el);
        }
    });
}

// Event delegation for cart interactions
cartItemsEl.addEventListener('click', e => {
    const id = e.target.closest('[data-id]')?.dataset.id;
    if (!id) return;

    if (e.target.closest('.qty-minus')) {
        const item = getItem(id);
        if (item) {
            item.qty--;
            if (item.qty <= 0) cart = cart.filter(i => i.id !== id);
        }
    } else if (e.target.closest('.qty-plus')) {
        const item = getItem(id);
        if (item) item.qty++;
    } else if (e.target.closest('.cart-item-remove')) {
        cart = cart.filter(i => i.id !== id);
    }

    saveCart();
    renderCart();
});

btnClearCart.addEventListener('click', () => {
    cart = [];
    saveCart();
    renderCart();
});

// ===================== ADD TO CART =====================
function addToCart(card) {
    const id = card.dataset.id;
    const name = card.dataset.name;
    const price = parseFloat(card.dataset.price);
    const category = card.dataset.category;
    const img = card.querySelector('.product-image img')?.src || '';

    const existing = getItem(id);
    if (existing) {
        existing.qty++;
    } else {
        cart.push({ id, name, price, category, img, qty: 1 });
    }

    saveCart();
    renderCart();

    // Button animation
    const btn = card.querySelector('.add-to-cart');
    btn.classList.add('added');
    setTimeout(() => btn.classList.remove('added'), 400);

    showToast(`${name} added to cart!`);
}

document.querySelectorAll('.add-to-cart').forEach(btn => {
    btn.addEventListener('click', () => addToCart(btn.closest('.product-card')));
});

// ===================== WISHLIST TOGGLE =====================
document.querySelectorAll('.wishlist-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        btn.classList.toggle('active');
        const icon = btn.querySelector('i');
        icon.classList.toggle('fas');
        icon.classList.toggle('far');
    });
});

// ===================== TOAST =====================
const toast = document.getElementById('toast');
const toastMsg = document.getElementById('toast-msg');
let toastTimeout;

function showToast(msg) {
    toastMsg.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove('show'), 2800);
}

// ===================== CATEGORY SLIDER =====================
const track = document.getElementById('category-track');
const container = track.parentElement;
const prevBtn = document.getElementById('slider-prev');
const nextBtn = document.getElementById('slider-next');
const dotsContainer = document.getElementById('slider-dots');

const cardWidth = 260 + 24; // width + gap
const visibleCount = Math.floor(container.clientWidth / cardWidth) || 1;
const totalCards = track.children.length;
const maxIndex = Math.max(0, totalCards - visibleCount);
let currentIndex = 0;

// Create dots
for (let i = 0; i <= maxIndex; i++) {
    const dot = document.createElement('button');
    dot.className = 'slider-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
    dot.addEventListener('click', () => goToSlide(i));
    dotsContainer.appendChild(dot);
}

function goToSlide(index) {
    currentIndex = Math.max(0, Math.min(index, maxIndex));
    track.style.transform = `translateX(-${currentIndex * cardWidth}px)`;
    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex >= maxIndex;
    document.querySelectorAll('.slider-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === currentIndex);
    });
}

prevBtn.addEventListener('click', () => goToSlide(currentIndex - 1));
nextBtn.addEventListener('click', () => goToSlide(currentIndex + 1));
goToSlide(0);

// Touch/drag support for slider
let isDragging = false;
let startX = 0;
let startTranslate = 0;

container.addEventListener('mousedown', e => {
    isDragging = true;
    startX = e.pageX;
    startTranslate = currentIndex * cardWidth;
    container.style.cursor = 'grabbing';
});
document.addEventListener('mouseup', e => {
    if (!isDragging) return;
    isDragging = false;
    container.style.cursor = 'grab';
    const moved = startX - e.pageX;
    if (Math.abs(moved) > 60) {
        goToSlide(moved > 0 ? currentIndex + 1 : currentIndex - 1);
    } else {
        goToSlide(currentIndex);
    }
});
document.addEventListener('mousemove', e => {
    if (!isDragging) return;
    const moved = startX - e.pageX;
    const raw = startTranslate + moved;
    const clamped = Math.max(0, Math.min(raw, maxIndex * cardWidth));
    track.style.transform = `translateX(-${clamped}px)`;
});

// Touch
container.addEventListener('touchstart', e => { startX = e.touches[0].pageX; startTranslate = currentIndex * cardWidth; }, { passive: true });
container.addEventListener('touchend', e => {
    const moved = startX - e.changedTouches[0].pageX;
    if (Math.abs(moved) > 50) goToSlide(moved > 0 ? currentIndex + 1 : currentIndex - 1);
}, { passive: true });

// Auto-slide every 4 seconds
let autoSlide = setInterval(() => {
    goToSlide(currentIndex >= maxIndex ? 0 : currentIndex + 1);
}, 4000);

container.addEventListener('mouseenter', () => clearInterval(autoSlide));
container.addEventListener('mouseleave', () => {
    autoSlide = setInterval(() => goToSlide(currentIndex >= maxIndex ? 0 : currentIndex + 1), 4000);
});

// ===================== SCROLL ANIMATIONS =====================
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.08 });

document.querySelectorAll('.product-card').forEach((card, i) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(28px)';
    card.style.transition = `opacity 0.55s ease ${i * 0.08}s, transform 0.55s ease ${i * 0.08}s, box-shadow 0.3s ease`;
    observer.observe(card);
});

document.querySelectorAll('.category-card').forEach((card, i) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = `opacity 0.5s ease ${i * 0.07}s, transform 0.5s ease ${i * 0.07}s, box-shadow 0.35s ease`;
    observer.observe(card);
});

// ===================== INIT =====================
renderCart();
