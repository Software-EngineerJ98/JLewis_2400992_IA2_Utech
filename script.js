/* script.js
   IA#2 - JavaScript: DOM manipulation, Event handling, Form validation, Interactivity
   Author: Student Name */

//Sample product data
   const PRODUCTS = [
  {
    id: "p101",
    name: "Urban Classic Sneakers",
    price: 69.99,
    img: "../Assets/greyshoes.jpg",
    desc: "Lightweight daily sneakers for all-day comfort."
  },
  {
    id: "p102",
    name: "StreetFlex Runners",
    price: 79.99,
    img: "../Assets/runningshoes.jpg",
    desc: "Breathable city running shoes with flexible soles."
  },
  {
    id: "p103",
    name: "MetroSlip On",
    price: 54.99,
    img: "../Assets/slipon.jpg",
    desc: "Effortless slip-on style for fast-paced mornings."
  },
  {
    id: "p104",
    name: "UrbanStep Prime",
    price: 119.99,
    img: "../Assets/brownshoes.jpg",
    desc: "Premium leather sneaker designed for style + durability."
  },
  {
    id: "p105",
    name: "CityWalk Canvas",
    price: 49.99,
    img: "../Assets/walkingshoes.jpg",
    desc: "Minimalist canvas shoes for everyday use."
  }
];
//CART Management (localStorage) 
const CART_KEY = 'urbanstep_cart_v1';
function loadCart(){
  const raw = localStorage.getItem(CART_KEY);
  return raw ? JSON.parse(raw) : [];
}
function saveCart(cart){
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount();
}

//Utility: update cart count in header

function updateCartCount(){
  const cart = loadCart();
  const count = cart.reduce((s,i)=>s+i.qty,0);
  const el = document.getElementById('cart-count');
  if(el) el.textContent = count;
}

//PRODUCTS: render on Products.html
function renderProducts(){
  const grid = document.getElementById('products-grid');
  if(!grid) return;
  grid.innerHTML = '';
  PRODUCTS.forEach(p=>{
    const card = document.createElement('article');
    card.className = 'card product-card';
    card.innerHTML = `
      <img src="${p.img}" alt="${p.name}" onerror="this.src='../Assets/placeholder.jpg'">
      <h3>${p.name}</h3>
      <p class="text-muted">${p.desc}</p>
      <p><strong>$${p.price.toFixed(2)}</strong></p>
      <div style="margin-top:auto">
        <button class="btn add-to-cart" data-id="${p.id}">Add to cart</button>
      </div>
    `;
    grid.appendChild(card);
  });

  // Event assignment for add-to-cart (event listener #1)
  grid.addEventListener('click', (e)=>{
    if(e.target.classList.contains('add-to-cart')){
      const id = e.target.getAttribute('data-id');
      addToCart(id);
      e.target.textContent = 'Added ✓';
      setTimeout(()=> e.target.textContent = 'Add to cart', 900);
    }
  });
}

//Add to cart logic
function addToCart(productId, qty=1){
  const product = PRODUCTS.find(p=>p.id===productId);
  if(!product) return;
  const cart = loadCart();
  const existing = cart.find(i=>i.id===productId);
  if(existing){
    existing.qty += qty;
  } else {
    cart.push({id:product.id, name:product.name, price:product.price, qty});
  }
  saveCart(cart);
  showToast(`${product.name} added to cart`);
}

//Show a small toast/notification
function showToast(msg){
  let t = document.getElementById('site-toast');
  if(!t){
    t = document.createElement('div');
    t.id = 'site-toast';
    t.style = 'position:fixed;right:16px;bottom:16px;background:#222;color:#fff;padding:.6rem 1rem;border-radius:8px;z-index:9999;';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  setTimeout(()=> t.style.opacity = '0', 2000);
}

/* Render cart page
   - includes calculations for: subtotal, discount, tax, total
   - event listeners to update quantity, remove item*/
function renderCartPage(){
  const container = document.getElementById('cart-container');
  if(!container) return;
  const cart = loadCart();
  if(cart.length === 0){
    container.innerHTML = `<p>Your cart is empty. <a href="Products.html">Shop now</a></p>`;
    document.getElementById('clear-cart')?.setAttribute('disabled','true');
    return;
  }

  // Table for Items in Cart
  const table = document.createElement('table');
  table.className = 'cart-table';
  table.innerHTML = `
    <thead>
      <tr><th>Product</th><th>Price</th><th>Quantity</th><th>Sub-total</th><th></th></tr>
    </thead>
    <tbody>
      ${cart.map(item=>`
        <tr data-id="${item.id}">
          <td>${item.name}</td>
          <td>$${item.price.toFixed(2)}</td>
          <td>
            <input class="qty-input" type="number" min="1" value="${item.qty}" style="width:70px;">
          </td>
          <td class="row-sub">$${(item.price * item.qty).toFixed(2)}</td>
          <td><button class="btn ghost remove-item">Remove</button></td>
        </tr>
      `).join('')}
    </tbody>
  `;
  container.innerHTML = '';
  container.appendChild(table);

  // Summary
  const summary = document.createElement('div');
  summary.className = 'cart-summary';
  const {subtotal, discount, tax, total} = calculateTotals(cart);
  summary.innerHTML = `
    <p>Subtotal: <strong>$${subtotal.toFixed(2)}</strong></p>
    <p>Discount: <strong>$${discount.toFixed(2)}</strong></p>
    <p>Tax (8%): <strong>$${tax.toFixed(2)}</strong></p>
    <p><strong>Total: $${total.toFixed(2)}</strong></p>
  `;
  container.appendChild(summary);

  // Event listener: Delegation for quantity change and remove (event listener #2)
  table.addEventListener('input', (e)=>{
    if(e.target.classList.contains('qty-input')){
      const row = e.target.closest('tr');
      const id = row.getAttribute('data-id');
      const qty = parseInt(e.target.value) || 1;
      updateQty(id, qty);
      // update row sub-total
      const item = loadCart().find(x=>x.id===id);
      row.querySelector('.row-sub').textContent = `$${(item.price*item.qty).toFixed(2)}`;
      // update summary
      const newTotals = calculateTotals(loadCart());
      summary.innerHTML = `
        <p>Subtotal: <strong>$${newTotals.subtotal.toFixed(2)}</strong></p>
        <p>Discount: <strong>$${newTotals.discount.toFixed(2)}</strong></p>
        <p>Tax (8%): <strong>$${newTotals.tax.toFixed(2)}</strong></p>
        <p><strong>Total: $${newTotals.total.toFixed(2)}</strong></p>
      `;
    }
  });
  table.addEventListener('click', (e)=>{
    if(e.target.classList.contains('remove-item')){
      const row = e.target.closest('tr');
      const id = row.getAttribute('data-id');
      removeFromCart(id);
      row.remove();
      renderCartPage(); // re-render
    }
  });

  // Clear cart button
  const clearBtn = document.getElementById('clear-cart');
  if(clearBtn){
    clearBtn.removeAttribute('disabled');
    clearBtn.onclick = ()=>{
      localStorage.removeItem(CART_KEY);
      renderCartPage();
      updateCartCount();
    };
  }
}

/* Calculate totals
   - discount: apply 10% discount if subtotal >= 150 
   - tax: 8%*/
function calculateTotals(cart){
  const subtotal = cart.reduce((s,i)=>s + i.price * i.qty, 0);
  const discount = subtotal >= 150 ? subtotal * 0.10 : 0;
  const taxable = subtotal - discount;
  const tax = taxable * 0.08;
  const total = taxable + tax;
  return {subtotal, discount, tax, total};
}

//Update quantity
function updateQty(id, qty){
  const cart = loadCart();
  const item = cart.find(i=>i.id===id);
  if(item){
    item.qty = Math.max(1, qty);
    saveCart(cart);
  }
}

//Remove item
function removeFromCart(id){
  let cart = loadCart();
  cart = cart.filter(i=>i.id !== id);
  saveCart(cart);
  showToast('Item removed from cart');
}

//Checkout page render and handlers
function renderCheckout(){
  const summaryEl = document.getElementById('checkout-summary');
  if(!summaryEl) return;
  const cart = loadCart();
  if(cart.length === 0){
    summaryEl.innerHTML = `<p>Your cart is empty. <a href="Products.html">Shop now</a></p>`;
    return;
  }
  const {subtotal, discount, tax, total} = calculateTotals(cart);
  summaryEl.innerHTML = `
    <div class="cart-summary">
      <p>Subtotal: <strong>$${subtotal.toFixed(2)}</strong></p>
      <p>Discount: <strong>$${discount.toFixed(2)}</strong></p>
      <p>Tax (8%): <strong>$${tax.toFixed(2)}</strong></p>
      <p><strong>Total: $${total.toFixed(2)}</strong></p>
    </div>
  `;

  const shippingForm = document.getElementById('shipping-form');
  shippingForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    // Simple validation handled below
    const name = document.getElementById('ship-name').value.trim();
    const address = document.getElementById('ship-address').value.trim();
    const city = document.getElementById('ship-city').value.trim();
    const amount = parseFloat(document.getElementById('ship-amount').value);
    const msg = document.getElementById('checkout-message');

    if(!name || !address || !city || isNaN(amount) || amount <= 0){
      msg.textContent = 'Please complete all fields with valid values.';
      return;
    }

    // Confirm payment amount matches total 
    if(Math.abs(amount - total) > 0.5){
      msg.textContent = `Amount should be close to $${total.toFixed(2)}.`;
      return;
    }

    // Process order 
    localStorage.removeItem(CART_KEY);
    updateCartCount();
    msg.style.color = 'cyan';
    msg.textContent = 'Order confirmed! Thank you for shopping with UrbanStep.';
    showToast('Order confirmed!');

    // disable form to prevent double submission
    shippingForm.querySelectorAll('input,button').forEach(el=>el.disabled=true);
  });

  // cancel and close buttons
  document.getElementById('cancel-order').addEventListener('click', ()=>{
    if(confirm('Cancel order and return to shop?')){
      localStorage.removeItem(CART_KEY); // Clear cart data      
      updateCartCount();
      window.location.href = 'Products.html';
    }
  });
  document.getElementById('close-checkout').addEventListener('click', ()=>{
    window.location.href = 'cart.html';
  });
}

/*Registration & Login validators 
  - demonstrates simple form validation and error messaging*/
function setupAuthForms(){
  const reg = document.getElementById('register-form');
  if(reg){
    reg.addEventListener('submit', (e)=>{
      e.preventDefault();
      const fullname = document.getElementById('fullname').value.trim();
      const dob = document.getElementById('dob').value;
      const email = document.getElementById('email').value.trim();
      const username = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value;

      const errEl = document.getElementById('register-error');

      if(!fullname || !dob || !email || !username || password.length < 6){
        errEl.textContent = 'Please complete all fields. Password must be at least 6 characters.';
        return;
      }
      if(!validateEmail(email)){
        errEl.textContent = 'Please provide a valid email address.';
        return;
      }

      // store a simple user 
      const user = {fullname, dob, email, username};
      localStorage.setItem('urbanstep_user_demo', JSON.stringify({user, password}));
      errEl.style.color = 'green';
      errEl.textContent = 'Registration successful. You can now login.';
      setTimeout(()=> window.location.href = 'login.html', 900);
    });
  }

  const login = document.getElementById('login-form');
  if(login){
    login.addEventListener('submit', (e)=>{
      e.preventDefault();
      const username = document.getElementById('login-username').value.trim();
      const password = document.getElementById('login-password').value;
      const errEl = document.getElementById('login-error');

      const stored = JSON.parse(localStorage.getItem('urbanstep_user_demo') || 'null');
      if(!stored || stored.password !== password || stored.user.username !== username){
        errEl.textContent = 'Invalid username or password.';
        return;
      }
      errEl.style.color = 'green';
      errEl.textContent = 'Login successful — redirecting to products...';
      setTimeout(()=> window.location.href = 'Products.html', 700);
    });
  }
}

//Simple email regex
function validateEmail(email){
  // basic email validation 
  return /\S+@\S+\.\S+/.test(email);
}

//On DOM ready initializations
document.addEventListener('DOMContentLoaded', ()=>{
  renderProducts();      // product list on index
  updateCartCount();     // updates header cart count
  renderCartPage();      // renders cart if on cart.html
  renderCheckout();      // renders checkout summary if on checkout.html
  setupAuthForms();      // wire up register/login
});
