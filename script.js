// ===== CART SYSTEM =====
let pricesData = {};

// Load prices from prices.json
fetch('prices.json')
  .then((response) => response.json())
  .then((data) => {
    pricesData = data;
    const priceElements = document.querySelectorAll('[data-price-key]');
    priceElements.forEach((element) => {
      const key = element.getAttribute('data-price-key');
      const spice = data.spices.find((s) => s.name === key);
      if (spice) {
        element.textContent = `${spice.size} / LKR ${spice.price}`;
      }
    });
  })
  .catch((err) => console.warn('Prices file not found:', err));

// Cart storage and functions
class Cart {
  constructor() {
    this.items = JSON.parse(localStorage.getItem('cart')) || [];
  }

  add(spiceName, price) {
    const existing = this.items.find((item) => item.name === spiceName);
    if (existing) {
      existing.quantity += 1;
    } else {
      this.items.push({ name: spiceName, price, quantity: 1 });
    }
    this.save();
    this.updateUI();
  }

  remove(spiceName) {
    this.items = this.items.filter((item) => item.name !== spiceName);
    this.save();
    this.updateUI();
  }

  updateQuantity(spiceName, quantity) {
    const item = this.items.find((item) => item.name === spiceName);
    if (item) {
      if (quantity <= 0) {
        this.remove(spiceName);
      } else {
        item.quantity = quantity;
        this.save();
        this.updateUI();
      }
    }
  }

  save() {
    localStorage.setItem('cart', JSON.stringify(this.items));
  }

  getTotal() {
    return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  updateUI() {
    const badge = document.getElementById('cartBadge');
    const total = this.items.length;
    if (badge) {
      badge.textContent = total;
      badge.style.display = total > 0 ? 'flex' : 'none';
    }
    this.renderCart();
  }

  renderCart() {
    const cartContent = document.getElementById('cartItems');
    if (!cartContent) return;

    if (this.items.length === 0) {
      cartContent.innerHTML = '<p class="text-center text-slate-500 py-8">Your cart is empty</p>';
      return;
    }

    cartContent.innerHTML = this.items
      .map(
        (item) => `
      <div class="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
        <div>
          <p class="font-semibold text-slate-900">${item.name}</p>
          <p class="text-sm text-slate-600">LKR ${item.price} each</p>
        </div>
        <div class="flex items-center gap-2">
          <button class="qty-down px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-sm" data-name="${item.name}">−</button>
          <span class="px-3">${item.quantity}</span>
          <button class="qty-up px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-sm" data-name="${item.name}">+</button>
          <button class="remove-item px-3 py-1 rounded bg-red-100 hover:bg-red-200 text-red-600 text-sm ml-2" data-name="${item.name}">Remove</button>
        </div>
      </div>
    `
      )
      .join('');

    // Attach listeners
    document.querySelectorAll('.qty-up').forEach((btn) => {
      btn.addEventListener('click', () => {
        const name = btn.getAttribute('data-name');
        const item = this.items.find((i) => i.name === name);
        this.updateQuantity(name, item.quantity + 1);
      });
    });

    document.querySelectorAll('.qty-down').forEach((btn) => {
      btn.addEventListener('click', () => {
        const name = btn.getAttribute('data-name');
        const item = this.items.find((i) => i.name === name);
        this.updateQuantity(name, item.quantity - 1);
      });
    });

    document.querySelectorAll('.remove-item').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.remove(btn.getAttribute('data-name'));
      });
    });

    // Update total
    const totalEl = document.getElementById('cartTotal');
    if (totalEl) {
      totalEl.textContent = `Total: LKR ${this.getTotal()}`;
    }
  }
}

const cart = new Cart();

// Cart button listeners
const cartButtons = document.querySelectorAll('.cart-btn');
cartButtons.forEach((button) => {
  button.addEventListener('click', (event) => {
    event.preventDefault();
    const card = button.closest('article');
    if (!card) return;

    const spiceName = card.querySelector('h3')?.textContent || 'Spice';
    const priceEl = card.querySelector('[data-price-key]');
    let price = 0;

    if (priceEl) {
      const priceText = priceEl.textContent;
      const match = priceText.match(/(\d+)/);
      price = match ? parseInt(match[1]) : 0;
    }

    cart.add(spiceName, price);

    button.disabled = true;
    button.textContent = 'Added ✓';
    setTimeout(() => {
      button.textContent = 'Add to Cart';
      button.disabled = false;
    }, 1200);

    // Open cart modal
    const modal = document.getElementById('cartModal');
    if (modal) {
      modal.classList.remove('hidden');
    }
  });
});

// Cart modal close button
const closeCartBtn = document.getElementById('closeCart');
if (closeCartBtn) {
  closeCartBtn.addEventListener('click', () => {
    document.getElementById('cartModal').classList.add('hidden');
  });
}

// Cart icon toggle
const cartIcon = document.getElementById('cartIcon');
if (cartIcon) {
  cartIcon.addEventListener('click', () => {
    const modal = document.getElementById('cartModal');
    if (modal) {
      modal.classList.toggle('hidden');
    }
  });
}

// ===== FORM & MISC HANDLERS =====
const sizeButtons = document.querySelectorAll('.size-button');
const form = document.getElementById('contactForm');
const carousel = document.getElementById('carousel');

sizeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    sizeButtons.forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
  });
});

if (form) {
  const fields = [
    { id: 'name', errorId: 'nameError', validator: (value) => value.trim().length >= 2, message: 'Please enter your name.' },
    { id: 'phone', errorId: 'phoneError', validator: (value) => /^07\d{8}$/.test(value.trim()), message: 'Enter a valid 10-digit Sri Lankan phone number.' },
    { id: 'inquiry', errorId: 'inquiryError', validator: (value) => value.trim() !== '', message: 'Choose an inquiry type.' },
    { id: 'message', errorId: 'messageError', validator: (value) => value.trim().length >= 10, message: 'Please describe your request in a few words.' },
  ];

  const validateField = ({ id, errorId, validator, message }) => {
    const input = document.getElementById(id);
    const error = document.getElementById(errorId);
    if (!validator(input.value)) {
      error.textContent = message;
      return false;
    }
    error.textContent = '';
    return true;
  };

  fields.forEach((field) => {
    const input = document.getElementById(field.id);
    input.addEventListener('input', () => validateField(field));
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const allValid = fields.map(validateField).every(Boolean);
    if (!allValid) return;

    form.querySelector('button[type="submit"]').textContent = 'Sent ✓';
    form.reset();
    setTimeout(() => {
      form.querySelector('button[type="submit"]').textContent = 'Send Inquiry';
    }, 1800);
  });
}

if (carousel) {
  const track = carousel.querySelector('.carousel-track');
  const prev = carousel.querySelector('.prev');
  const next = carousel.querySelector('.next');
  const step = 320;

  prev.addEventListener('click', () => {
    track.scrollBy({ left: -step, behavior: 'smooth' });
  });

  next.addEventListener('click', () => {
    track.scrollBy({ left: step, behavior: 'smooth' });
  });
}

window.addEventListener('load', () => {
  document.querySelectorAll('.product-card, .grid-card, .contact-panel, .hero-copy, .hero-card').forEach((element, index) => {
    element.style.opacity = '0';
    element.style.transform = 'translateY(24px)';
    setTimeout(() => {
      element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      element.style.opacity = '1';
      element.style.transform = 'translateY(0)';
    }, index * 80);
  });
});
