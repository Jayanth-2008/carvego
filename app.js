/*
  CraveGo page behavior.
  The browser asks server.js for restaurant and menu data, then sends checkout
  details back to the server when the customer places an order.
*/

const state = {
  restaurants: [],
  category: "All",
  filter: "all",
  search: "",
  cart: readSavedList("cravego-beginner-cart"),
  favorites: readSavedList("cravego-beginner-favorites")
};

const getElement = (id) => document.getElementById(id);
const currency = (amount) => `₹${Number(amount).toLocaleString("en-IN")}`;

function readSavedList(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

function saveLists() {
  localStorage.setItem("cravego-beginner-cart", JSON.stringify(state.cart));
  localStorage.setItem("cravego-beginner-favorites", JSON.stringify(state.favorites));
}

// Restaurant names and dish details are inserted into HTML, so escape text first.
function safeText(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

function showToast(message) {
  const toast = getElement("toast");
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => { toast.hidden = true; }, 2400);
}

function getVisibleRestaurants() {
  let visible = state.restaurants.filter((restaurant) => {
    const matchesCategory = state.category === "All" || restaurant.category === state.category;
    const searchText = `${restaurant.name} ${restaurant.cuisine} ${restaurant.category}`.toLowerCase();
    const matchesSearch = searchText.includes(state.search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (state.filter === "rating") visible = visible.filter((restaurant) => restaurant.rating >= 4.7);
  if (state.filter === "fast") visible = visible.filter((restaurant) => restaurant.deliveryMinutes <= 30);
  if (state.filter === "free") visible = visible.filter((restaurant) => restaurant.deliveryFee === 0);
  if (state.filter === "offers") visible = visible.filter((restaurant) => restaurant.offer);
  return visible;
}

function renderRestaurants() {
  const restaurantGrid = getElement("restaurantGrid");
  const restaurants = getVisibleRestaurants();

  if (restaurants.length === 0) {
    restaurantGrid.innerHTML = `<p class="status-message">No restaurants match that. Try another search or filter.</p>`;
    return;
  }

  restaurantGrid.innerHTML = restaurants.map((restaurant) => {
    const isFavorite = state.favorites.includes(restaurant.id);
    const offerText = restaurant.offer ? `<span class="offer">${safeText(restaurant.offer)}</span>` : "";
    return `
      <article class="restaurant-card">
        <div class="restaurant-photo">
          <img src="${safeText(restaurant.image)}" alt="Food from ${safeText(restaurant.name)}" loading="lazy">
          ${offerText}
          <button class="favorite-button ${isFavorite ? "is-favorite" : ""}" data-favorite="${restaurant.id}" aria-label="Save ${safeText(restaurant.name)}">${isFavorite ? "♥" : "♡"}</button>
        </div>
        <div class="restaurant-details">
          <div class="restaurant-name">
            <div><h3>${safeText(restaurant.name)}</h3><p>${safeText(restaurant.cuisine)}</p></div>
            <span class="rating">★ ${restaurant.rating}</span>
          </div>
          <div class="restaurant-info"><span>${restaurant.deliveryMinutes}–${restaurant.deliveryMinutes + 8} min</span><span>${restaurant.deliveryFee ? `${currency(restaurant.deliveryFee)} delivery` : "Free delivery"}</span><span>${safeText(restaurant.priceLabel)}</span></div>
          <button class="restaurant-action" data-menu="${restaurant.id}">View menu →</button>
        </div>
      </article>`;
  }).join("");
}

async function getJson(url, options) {
  const response = await fetch(url, options);
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "The server could not complete that request.");
  return result;
}

async function loadRestaurants() {
  try {
    state.restaurants = await getJson("/api/restaurants");
    renderRestaurants();
  } catch (error) {
    getElement("restaurantGrid").innerHTML = `<p class="status-message">Couldn't reach the backend. Start the server and refresh this page.</p>`;
    showToast(error.message);
  }
}

function setCategory(category) {
  state.category = category;
  renderRestaurants();
  getElement("restaurants").scrollIntoView({ behavior: "smooth" });
}

async function showMenu(restaurantId) {
  const restaurant = state.restaurants.find((item) => item.id === restaurantId);
  try {
    const menuItems = await getJson(`/api/restaurants/${restaurantId}/menu`);
    getElement("cartTitle").textContent = `${restaurant.name} menu`;
    getElement("cartContent").innerHTML = menuItems.map((item) => {
      const savedItem = state.cart.find((cartItem) => cartItem.key === `${restaurantId}-${item.id}`);
      const buttonText = savedItem ? `Added (${savedItem.quantity}) ✓` : "Add";
      return `
      <div class="menu-row">
        <img src="${safeText(item.image)}" alt="${safeText(item.name)}">
        <div><strong>${safeText(item.name)}</strong><p>${safeText(item.description)}</p><strong>${currency(item.price)}</strong></div>
        <button class="add-button" data-add-item="${item.id}" data-restaurant="${restaurant.id}">${buttonText}</button>
      </div>`;
    }).join("");
    getElement("cartSummary").innerHTML = `<button class="primary-button" id="backToCart">View cart (${getCartCount()})</button>`;
    getElement("cartDialog").showModal();
  } catch (error) {
    showToast(error.message);
  }
}

function getCartCount() {
  return state.cart.reduce((total, item) => total + item.quantity, 0);
}

function getTotals() {
  const subtotal = state.cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const restaurantIds = [...new Set(state.cart.map((item) => item.restaurantId))];
  const delivery = restaurantIds.reduce((total, id) => {
    const restaurant = state.restaurants.find((item) => item.id === id);
    return total + (restaurant ? restaurant.deliveryFee : 0);
  }, 0);
  const tax = Math.round(subtotal * 0.05);
  return { subtotal, delivery, tax, total: subtotal + delivery + tax };
}

function renderCart() {
  getElement("cartTitle").textContent = "Your cart";
  getElement("cartCount").textContent = getCartCount();

  if (state.cart.length === 0) {
    getElement("cartContent").innerHTML = `<p class="empty-message">Your cart is empty. Choose a restaurant and add a dish to get started.</p>`;
    getElement("cartSummary").innerHTML = "";
    return;
  }

  getElement("cartContent").innerHTML = state.cart.map((item) => `
    <div class="cart-row">
      <img src="${safeText(item.image)}" alt="">
      <div>
        <strong>${safeText(item.name)}</strong>
        <small>${safeText(item.restaurantName)}</small>
        <div class="quantity-controls">
          <button data-change="-1" data-item="${item.key}" aria-label="Remove one">−</button>
          <span>${item.quantity}</span>
          <button data-change="1" data-item="${item.key}" aria-label="Add one">+</button>
        </div>
      </div>
      <strong>${currency(item.price * item.quantity)}</strong>
    </div>`).join("");

  const totals = getTotals();
  getElement("cartSummary").innerHTML = `
    <div class="summary-line"><span>Subtotal</span><span>${currency(totals.subtotal)}</span></div>
    <div class="summary-line"><span>Delivery</span><span>${currency(totals.delivery)}</span></div>
    <div class="summary-line"><span>Tax</span><span>${currency(totals.tax)}</span></div>
    <div class="summary-line"><strong>Total</strong><strong>${currency(totals.total)}</strong></div>
    <button class="primary-button" id="checkoutButton">Continue to checkout</button>`;
}

function openCart() {
  renderCart();
  getElement("cartDialog").showModal();
}

function closeDialog(id) {
  getElement(id).close();
}

// Category tiles apply a filter. The cards themselves come from the backend.
document.querySelectorAll("[data-category]").forEach((tile) => {
  tile.addEventListener("click", () => setCategory(tile.dataset.category));
});

// The search boxes at the top of the page use the same search value.
function updateSearch(value) {
  state.search = value.trim();
  getElement("searchInput").value = value;
  getElement("heroSearch").value = value;
  renderRestaurants();
}

getElement("searchInput").addEventListener("input", (event) => updateSearch(event.target.value));
getElement("heroSearch").addEventListener("input", (event) => updateSearch(event.target.value));
getElement("findFoodButton").addEventListener("click", () => {
  getElement("restaurants").scrollIntoView({ behavior: "smooth" });
});

// The filter buttons change which restaurant cards are shown.
document.querySelector(".filter-buttons").addEventListener("click", (event) => {
  const button = event.target.closest("[data-filter]");
  if (!button) return;
  state.filter = button.dataset.filter;
  document.querySelectorAll("[data-filter]").forEach((item) => item.classList.toggle("active-filter", item === button));
  renderRestaurants();
});

// Restaurant card buttons either open the menu or save a favourite.
getElement("restaurantGrid").addEventListener("click", async (event) => {
  const menuButton = event.target.closest("[data-menu]");
  const favoriteButton = event.target.closest("[data-favorite]");

  if (menuButton) await showMenu(Number(menuButton.dataset.menu));
  if (favoriteButton) {
    const id = Number(favoriteButton.dataset.favorite);
    state.favorites = state.favorites.includes(id)
      ? state.favorites.filter((favoriteId) => favoriteId !== id)
      : [...state.favorites, id];
    saveLists();
    renderRestaurants();
    showToast(state.favorites.includes(id) ? "Saved to favorites" : "Removed from favorites");
  }
});

// Add a menu item to the saved cart. The price comes from the backend menu.
getElement("cartContent").addEventListener("click", async (event) => {
  const addButton = event.target.closest("[data-add-item]");
  const quantityButton = event.target.closest("[data-change]");

  if (addButton) {
    const restaurantId = Number(addButton.dataset.restaurant);
    const itemId = Number(addButton.dataset.addItem);
    try {
      const menuItems = await getJson(`/api/restaurants/${restaurantId}/menu`);
      const menuItem = menuItems.find((item) => item.id === itemId);
      const restaurant = state.restaurants.find((item) => item.id === restaurantId);
      const key = `${restaurantId}-${itemId}`;
      const existing = state.cart.find((item) => item.key === key);
      if (existing) existing.quantity += 1;
      else state.cart.push({
        key,
        restaurantId,
        restaurantName: restaurant.name,
        itemId,
        name: menuItem.name,
        image: menuItem.image,
        price: menuItem.price,
        quantity: 1
      });
      saveLists();
      getElement("cartCount").textContent = getCartCount();
      addButton.textContent = `Added (${existing ? existing.quantity : 1}) ✓`;
      const viewCartButton = getElement("backToCart");
      if (viewCartButton) viewCartButton.textContent = `View cart (${getCartCount()})`;
      showToast(`${menuItem.name} added to cart`);
    } catch (error) {
      showToast(error.message);
    }
  }

  if (quantityButton) {
    const item = state.cart.find((cartItem) => cartItem.key === quantityButton.dataset.item);
    if (item) {
      item.quantity += Number(quantityButton.dataset.change);
      if (item.quantity <= 0) state.cart = state.cart.filter((cartItem) => cartItem !== item);
      saveLists();
      renderCart();
    }
  }

  if (event.target.closest("#backToCart")) renderCart();
});

getElement("cartButton").addEventListener("click", openCart);
getElement("cartSummary").addEventListener("click", (event) => {
  if (event.target.closest("#checkoutButton")) {
    closeDialog("cartDialog");
    getElement("checkoutDialog").showModal();
  }
});

document.querySelectorAll("[data-close-cart]").forEach((button) => button.addEventListener("click", () => closeDialog("cartDialog")));
document.querySelectorAll("[data-close-checkout]").forEach((button) => button.addEventListener("click", () => closeDialog("checkoutDialog")));
document.querySelectorAll("[data-close-success]").forEach((button) => button.addEventListener("click", () => closeDialog("successDialog")));

// Send the checkout form to the backend and show its order number.
getElement("checkoutForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const checkoutForm = event.currentTarget;
  const button = getElement("placeOrderButton");
  const form = new FormData(checkoutForm);
  const order = {
    customer: form.get("name"),
    phone: form.get("phone"),
    address: form.get("address"),
    payment: form.get("payment"),
    items: state.cart.map((item) => ({ restaurantId: item.restaurantId, itemId: item.itemId, quantity: item.quantity }))
  };

  button.disabled = true;
  button.textContent = "Sending your order…";
  try {
    const result = await getJson("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order)
    });
    state.cart = [];
    saveLists();
    renderCart();
    checkoutForm.reset();
    closeDialog("checkoutDialog");
    getElement("orderMessage").textContent = `Your order number is ${result.id}. The restaurant has received your order.`;
    getElement("successDialog").showModal();
  } catch (error) {
    showToast(error.message);
  } finally {
    button.disabled = false;
    button.textContent = "Place order";
  }
});

getElement("signInButton").addEventListener("click", () => {
  showToast("Account sign-in can be added after the ordering flow.");
});

// Load restaurant cards from the backend when the page opens.
loadRestaurants();
renderCart();
