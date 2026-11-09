const path = require('path');
const express = require('express');
const db = require('./lib/db');
const auth = require('./lib/auth');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '100kb' }));
app.use(auth.loadUser);
app.use(express.static(path.join(__dirname, 'public')));

const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email });
const clean = (v, max) => String(v === undefined || v === null ? '' : v).trim().slice(0, max || 200);
const money = (n) => Math.round(n * 100) / 100;

// ---------- Auth ----------
app.post('/api/register', (req, res) => {
  const body = req.body || {};
  const name = clean(body.name, 60);
  const email = clean(body.email, 120).toLowerCase();
  const password = String(body.password || '');
  if (!name) return res.status(400).json({ error: 'Name is required.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  if (db.data.users.some((u) => u.email === email)) return res.status(409).json({ error: 'An account with this email already exists.' });

  const user = { id: db.nextId('users'), name, email, passwordHash: auth.hashPassword(password), createdAt: new Date().toISOString() };
  db.data.users.push(user);
  db.save();
  auth.setCookie(res, auth.createSession(user.id));
  res.status(201).json({ user: publicUser(user) });
});

app.post('/api/login', (req, res) => {
  const body = req.body || {};
  const email = clean(body.email, 120).toLowerCase();
  const password = String(body.password || '');
  const user = db.data.users.find((u) => u.email === email);
  if (!user || !auth.verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Incorrect email or password.' });
  }
  auth.setCookie(res, auth.createSession(user.id));
  res.json({ user: publicUser(user) });
});

app.post('/api/logout', (req, res) => {
  auth.destroySession(req.sessionToken);
  auth.clearCookie(res);
  res.json({ ok: true });
});

app.get('/api/me', (req, res) => {
  res.json({ user: req.user ? publicUser(req.user) : null });
});

// ---------- Products ----------
app.get('/api/products', (req, res) => {
  const q = clean(req.query.q, 80).toLowerCase();
  const category = clean(req.query.category, 40);
  let list = db.data.products;
  if (category) list = list.filter((p) => p.category === category);
  if (q) list = list.filter((p) => (p.name + ' ' + p.description).toLowerCase().includes(q));
  const categories = Array.from(new Set(db.data.products.map((p) => p.category))).sort();
  res.json({ products: list, categories });
});

app.get('/api/products/:id', (req, res) => {
  const product = db.data.products.find((p) => p.id === Number(req.params.id));
  if (!product) return res.status(404).json({ error: 'Product not found.' });
  res.json({ product });
});

// ---------- Orders ----------
app.post('/api/orders', auth.requireAuth, (req, res) => {
  const body = req.body || {};
  const items = Array.isArray(body.items) ? body.items : [];
  const shipping = {
    name: clean(body.shipping && body.shipping.name, 80),
    phone: clean(body.shipping && body.shipping.phone, 20),
    address: clean(body.shipping && body.shipping.address, 200),
    city: clean(body.shipping && body.shipping.city, 80),
    pincode: clean(body.shipping && body.shipping.pincode, 12)
  };
  if (!items.length) return res.status(400).json({ error: 'Your cart is empty.' });
  if (!shipping.name || !shipping.phone || !shipping.address || !shipping.city || !shipping.pincode) {
    return res.status(400).json({ error: 'Please fill in all shipping details.' });
  }

  // Merge duplicates and validate against the database (prices always come from the server).
  const wanted = {};
  for (const it of items) {
    const id = Number(it && it.productId);
    const qty = Number(it && it.qty);
    if (!Number.isInteger(id) || !Number.isInteger(qty) || qty < 1 || qty > 99) {
      return res.status(400).json({ error: 'Invalid item in cart.' });
    }
    wanted[id] = (wanted[id] || 0) + qty;
  }

  const lines = [];
  for (const idStr of Object.keys(wanted)) {
    const product = db.data.products.find((p) => p.id === Number(idStr));
    if (!product) return res.status(400).json({ error: 'A product in your cart no longer exists.' });
    if (product.stock < wanted[idStr]) {
      return res.status(409).json({ error: 'Only ' + product.stock + ' left in stock for "' + product.name + '".' });
    }
    lines.push({ product, qty: wanted[idStr] });
  }

  const orderItems = lines.map((l) => ({
    productId: l.product.id, name: l.product.name, emoji: l.product.emoji,
    price: l.product.price, qty: l.qty, subtotal: money(l.product.price * l.qty)
  }));
  const order = {
    id: db.nextId('orders'),
    userId: req.user.id,
    items: orderItems,
    total: money(orderItems.reduce((s, i) => s + i.subtotal, 0)),
    shipping,
    status: 'Processing',
    createdAt: new Date().toISOString()
  };
  lines.forEach((l) => { l.product.stock -= l.qty; });
  db.data.orders.push(order);
  db.save();
  res.status(201).json({ order });
});

app.get('/api/orders', auth.requireAuth, (req, res) => {
  const orders = db.data.orders.filter((o) => o.userId === req.user.id).slice().reverse();
  res.json({ orders });
});

app.get('/api/orders/:id', auth.requireAuth, (req, res) => {
  const order = db.data.orders.find((o) => o.id === Number(req.params.id) && o.userId === req.user.id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  res.json({ order });
});

// Unknown API routes return JSON instead of an HTML page.
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

app.listen(PORT, () => {
  console.log('Store running at http://localhost:' + PORT);
});
