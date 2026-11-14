// This small Express server sends the website files and provides the API.
const express = require("express");
const path = require("path");

const app = express();
const PORT = 5000;
const savedOrders = new Map();

// Express reads JSON sent by the checkout form.
app.use(express.json());

// Demo restaurant data. Each restaurant has a small menu for this first version.
const restaurants = [
  {
    id: 1, name: "Saffron Table", cuisine: "North Indian · Kebabs", category: "Indian",
    rating: 4.8, deliveryMinutes: 25, deliveryFee: 25, priceLabel: "₹₹", offer: "20% OFF YOUR FIRST ORDER",
    image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=900&q=85",
    menu: [
      { id: 101, name: "Butter Chicken", description: "Tandoor chicken in a creamy tomato sauce", price: 329, image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=500&q=80" },
      { id: 102, name: "Paneer Tikka", description: "Chargrilled paneer, peppers and mint chutney", price: 269, image: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=500&q=80" },
      { id: 103, name: "Garlic Naan", description: "Soft tandoor bread with garlic and herbs", price: 79, image: "https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?auto=format&fit=crop&w=500&q=80" }
    ]
  },
  {
    id: 2, name: "Miso & Matcha", cuisine: "Japanese · Ramen", category: "Asian",
    rating: 4.9, deliveryMinutes: 30, deliveryFee: 35, priceLabel: "₹₹₹", offer: "POPULAR NEAR YOU",
    image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=900&q=85",
    menu: [
      { id: 201, name: "Tonkotsu Ramen", description: "Slow-cooked broth, noodles, egg and spring onion", price: 389, image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=500&q=80" },
      { id: 202, name: "Chicken Gyoza", description: "Pan-seared dumplings with ginger soy dip", price: 219, image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=500&q=80" },
      { id: 203, name: "Matcha Cheesecake", description: "Creamy cheesecake with Japanese matcha", price: 189, image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=500&q=80" }
    ]
  },
  {
    id: 3, name: "Oven & Vine", cuisine: "Italian · Wood-fired pizza", category: "Pizza",
    rating: 4.7, deliveryMinutes: 25, deliveryFee: 0, priceLabel: "₹₹", offer: "FREE DELIVERY",
    image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=900&q=85",
    menu: [
      { id: 301, name: "Margherita Pizza", description: "Tomato, mozzarella and fresh basil", price: 349, image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=500&q=80" },
      { id: 302, name: "Mushroom Truffle Pizza", description: "Roasted mushrooms, mozzarella and truffle oil", price: 429, image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=500&q=80" },
      { id: 303, name: "Pesto Pasta", description: "Basil pesto, parmesan and toasted pine nuts", price: 289, image: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=500&q=80" }
    ]
  },
  {
    id: 4, name: "Green Fork", cuisine: "Healthy · Salads & bowls", category: "Healthy",
    rating: 4.8, deliveryMinutes: 20, deliveryFee: 20, priceLabel: "₹₹", offer: "FRESHLY PREPARED",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=85",
    menu: [
      { id: 401, name: "Harvest Grain Bowl", description: "Quinoa, avocado, greens and roasted pumpkin", price: 319, image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=500&q=80" },
      { id: 402, name: "Citrus Chicken Salad", description: "Herb chicken, leafy greens and fresh orange", price: 349, image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=500&q=80" }
    ]
  },
  {
    id: 5, name: "Bun & Barrel", cuisine: "American · Burgers", category: "Burgers",
    rating: 4.6, deliveryMinutes: 28, deliveryFee: 30, priceLabel: "₹₹", offer: "MEAL DEALS",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=85",
    menu: [
      { id: 501, name: "Classic Smash Burger", description: "Double patty, cheddar, pickles and house sauce", price: 359, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=80" },
      { id: 502, name: "Crispy Chicken Burger", description: "Buttermilk chicken, slaw and spicy mayo", price: 329, image: "https://images.unsplash.com/photo-1606755962773-d324e0a13086?auto=format&fit=crop&w=500&q=80" },
      { id: 503, name: "Seasoned Fries", description: "Golden fries with house seasoning", price: 139, image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=500&q=80" }
    ]
  },
  {
    id: 6, name: "The Daily Crumb", cuisine: "Cafe · Bakery", category: "Cafe",
    rating: 4.5, deliveryMinutes: 18, deliveryFee: 15, priceLabel: "₹", offer: "COFFEE & BAKES",
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=85",
    menu: [
      { id: 601, name: "Avocado Toast", description: "Sourdough, whipped feta, chilli and lemon", price: 249, image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=500&q=80" },
      { id: 602, name: "Almond Croissant", description: "Buttery croissant with almond cream", price: 159, image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=500&q=80" },
      { id: 603, name: "Cappuccino", description: "Espresso with steamed milk", price: 129, image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=500&q=80" }
    ]
  }
];

// Return restaurant information for the cards on the page.
app.get("/api/restaurants", (req, res) => {
  const publicList = restaurants.map(({ menu, ...restaurant }) => ({ ...restaurant, reviews: 100 + restaurant.id * 137 }));
  res.json(publicList);
});

// Return menu items for one restaurant.
app.get("/api/restaurants/:id/menu", (req, res) => {
  const restaurant = restaurants.find((item) => item.id === Number(req.params.id));
  if (!restaurant) return res.status(404).json({ error: "Restaurant not found." });
  res.json(restaurant.menu);
});

// Confirm an order using prices and delivery fees stored on the server.
app.post("/api/orders", (req, res) => {
  const { customer, phone, address, payment, items } = req.body || {};
  if (!customer || !address || !/^\d{10}$/.test(phone || "") || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Please enter your name, a 10-digit phone number, address and food items." });
  }

  const orderItems = [];
  for (const requestedItem of items) {
    const restaurant = restaurants.find((item) => item.id === Number(requestedItem.restaurantId));
    const menuItem = restaurant?.menu.find((item) => item.id === Number(requestedItem.itemId));
    const quantity = Number(requestedItem.quantity);
    if (!menuItem || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
      return res.status(400).json({ error: "One of the selected food items is invalid." });
    }
    orderItems.push({ restaurantId: restaurant.id, restaurantName: restaurant.name, itemId: menuItem.id, name: menuItem.name, price: menuItem.price, quantity });
  }

  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const restaurantIds = [...new Set(orderItems.map((item) => item.restaurantId))];
  const delivery = restaurantIds.reduce((sum, id) => sum + restaurants.find((item) => item.id === id).deliveryFee, 0);
  const tax = Math.round(subtotal * 0.05);
  const order = {
    id: `CG${Date.now().toString().slice(-8)}`,
    customer: String(customer).trim(),
    phone,
    address: String(address).trim(),
    payment: payment || "Cash on delivery",
    items: orderItems,
    totals: { subtotal, delivery, tax, total: subtotal + delivery + tax },
    status: "Confirmed",
    createdAt: new Date().toISOString()
  };

  savedOrders.set(order.id, order);
  res.status(201).json({ id: order.id, status: order.status, totals: order.totals });
});

// Look up an order number, useful for a simple tracking screen later.
app.get("/api/orders/:id", (req, res) => {
  const order = savedOrders.get(req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found." });
  res.json(order);
});

// Serve index.html, app.js, and any other frontend files from this folder.
app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log(`CraveGo is running at http://localhost:${PORT}`);
});
