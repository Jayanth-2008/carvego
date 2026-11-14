# CraveGo food delivery demo

This is a beginner-friendly example project. The website is in `index.html`, its browser actions are in `app.js`, and the backend is in `server.js`.

## Start it

1. Open this project folder in VS Code.
2. Choose **Terminal → New Terminal**.
3. In the terminal, run `npm install` once to install Express.
4. Run `npm start` to start the website and backend.
5. Open [http://localhost:5000](http://localhost:5000) in your browser.

Keep the terminal open while using the website. To stop the server later, click the terminal and press **Ctrl+C**.

## What works

- Restaurant cards load from `GET /api/restaurants`.
- Search, category filters, rating, delivery time, free delivery and offers filters.
- Restaurant menus load from `GET /api/restaurants/:id/menu`.
- Add dishes to the cart, change quantities and save favorite restaurants.
- Checkout sends name, phone, address, selected dishes and payment choice to `POST /api/orders`.
- After an order, the website shows its confirmation number. Orders can be looked up through `GET /api/orders/:id`.

This is a learning demo: orders are stored in server memory and disappear when the server stops. The payment choices are only labels; the app does not collect or process payments. Restaurant and dish photos come from Unsplash and need an internet connection.
