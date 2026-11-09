// Tiny JSON-file database (users, products, orders, sessions).
// Writes are atomic (write temp file, then rename) so the file is never half-written.
const fs = require('fs');
const path = require('path');

const FILE = process.env.DB_FILE || path.join(__dirname, '..', 'data', 'db.json');

const PRODUCTS = [
  ['Wireless Headphones', 'Electronics', 2499, 25, '🎧', 'Over-ear Bluetooth headphones with deep bass, 30-hour battery life and a built-in microphone.'],
  ['Smart Watch', 'Electronics', 3999, 15, '⌚', 'Fitness tracker with heart-rate monitor, sleep tracking, and a bright AMOLED display.'],
  ['Bluetooth Speaker', 'Electronics', 1799, 30, '🔊', 'Portable waterproof speaker with 360° sound and 12 hours of playtime.'],
  ['Laptop Backpack', 'Fashion', 1299, 40, '🎒', 'Water-resistant backpack with padded laptop sleeve and USB charging port.'],
  ['Running Shoes', 'Fashion', 2999, 20, '👟', 'Lightweight breathable running shoes with cushioned sole for daily training.'],
  ['Sunglasses', 'Fashion', 899, 50, '🕶️', 'UV400 protected polarized sunglasses with a durable lightweight frame.'],
  ['Coffee Mug Set', 'Home', 599, 60, '☕', 'Set of 4 ceramic mugs, microwave and dishwasher safe.'],
  ['Desk Lamp', 'Home', 1099, 35, '💡', 'LED desk lamp with 3 brightness levels, touch control and flexible neck.'],
  ['Yoga Mat', 'Sports', 799, 45, '🧘', 'Non-slip 6mm thick yoga mat with carrying strap.'],
  ['Water Bottle', 'Sports', 449, 80, '🍶', 'Insulated stainless steel bottle that keeps drinks cold for 24 hours.'],
  ['Notebook Pack', 'Stationery', 299, 100, '📓', 'Pack of 5 ruled notebooks with 200 pages each.'],
  ['Gel Pen Set', 'Stationery', 199, 120, '🖊️', 'Set of 12 smooth-writing gel pens in assorted colours.']
];

let data = null;

function seed() {
  return {
    counters: { users: 0, products: PRODUCTS.length, orders: 0 },
    users: [],
    sessions: {},
    orders: [],
    products: PRODUCTS.map((p, i) => ({
      id: i + 1, name: p[0], category: p[1], price: p[2], stock: p[3], emoji: p[4], description: p[5]
    }))
  };
}

function save() {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  const tmp = FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, FILE);
}

function load() {
  if (fs.existsSync(FILE)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(FILE, 'utf8'));
      if (parsed && Array.isArray(parsed.products) && Array.isArray(parsed.users) && Array.isArray(parsed.orders)) {
        parsed.sessions = parsed.sessions || {};
        parsed.counters = parsed.counters || { users: 0, products: 0, orders: 0 };
        data = parsed;
        return;
      }
    } catch (e) { /* fall through to reset */ }
    try { fs.renameSync(FILE, FILE + '.corrupt-' + Date.now()); } catch (e) { /* ignore */ }
  }
  data = seed();
  save();
}

load();

module.exports = {
  get data() { return data; },
  save,
  nextId(table) { data.counters[table] = (data.counters[table] || 0) + 1; return data.counters[table]; }
};
