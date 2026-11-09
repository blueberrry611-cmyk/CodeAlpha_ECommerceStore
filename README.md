# CodeAlpha_ECommerceStore

Simple e-commerce store built for the **CodeAlpha Full Stack Development Internship – Task 1**.

## Features
- Product listing with search and category filter
- Product details page
- Shopping cart (add, change quantity, remove)
- User registration and login (passwords hashed with scrypt, cookie sessions)
- Order processing: stock check, server-side price calculation, order history
- Database storing products, users and orders (JSON file, created automatically)

## Tech stack
- **Frontend:** HTML, CSS, vanilla JavaScript
- **Backend:** Node.js + Express.js
- **Database:** JSON file at `data/db.json` (auto-created and seeded with 12 products)

## How to run
1. Install [Node.js](https://nodejs.org) (version 16 or newer).
2. Open a terminal in this folder and run:
   ```bash
   npm install
   npm start
   ```
3. Open **http://localhost:3000** in your browser.

To use another port: `PORT=4000 npm start` (Mac/Linux) or `set PORT=4000 && npm start` (Windows cmd).
To reset all data, stop the server and delete the `data` folder.

## Try it
1. Click **Sign up** and create an account.
2. Add products to the cart, open **Cart**, then **Proceed to checkout**.
3. Fill in the shipping details and place the order, then see it under **My Orders**.

## API
| Method | Route | Description |
|---|---|---|
| POST | /api/register | Create account |
| POST | /api/login | Log in |
| POST | /api/logout | Log out |
| GET | /api/me | Current user |
| GET | /api/products?q=&category= | List/search products |
| GET | /api/products/:id | Product details |
| POST | /api/orders | Place an order (login required) |
| GET | /api/orders | My orders (login required) |
| GET | /api/orders/:id | One of my orders |

## Project structure
```
server.js        Express app and API routes
lib/db.js        JSON-file database + seed products
lib/auth.js      Password hashing and sessions
public/          Frontend pages, CSS and JS
```
"# CodeAlpha_ECommerceStore" 
