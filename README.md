# NutriScan — Food & Cooking Assistant

A mobile-first web app that helps you track nutrition, scan food with AI, discover recipes from your ingredients, and manage your weekly budget.

Built for a hackathon using React, Flask, Claude AI, and Supabase.

---

## Features

- **Food Scanner** — Point your camera at any food and get instant nutrition info, calories, macros, cost, and recipes powered by Claude Vision
- **Ingredient Scanner** — Scan your fridge or kitchen and get dish suggestions based on what you have
- **Meal Log** — Track everything you eat with a full 7-day history
- **Nutrition Goals** — Set daily calorie, protein, and weekly budget targets
- **AI Chef Chat** — Ask an AI nutrition coach anything about food, recipes, and health
- **Meal Planner** — Plan your meals for the week ahead
- **Friends** — Add friends, send and receive friend requests
- **Profile** — View your weekly nutrition summary and stats

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React (Create React App) |
| Backend | Python / Flask |
| Database & Auth | Supabase (PostgreSQL) |
| AI | Anthropic Claude API |
| Tunnelling | Cloudflare Tunnel |

---

## Getting Started

### Prerequisites

- Node.js v18+
- Python 3.11+
- A Supabase project
- An Anthropic API key

### 1. Clone the repo

```bash
git clone https://github.com/TLieu1738/Food-Cooking-Assistant.git
cd Food-Cooking-Assistant/Hackathon\ Project
```

### 2. Set up the backend

```bash
cd backend
pip install -r requirements.txt
```

Create a `.env` file in the `backend/` folder:

```
ANTHROPIC_API_KEY=your_anthropic_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
```

Start the backend:

```bash
python app.py
```

### 3. Set up the frontend

```bash
cd frontend-react
npm install
```

Create a `.env` file in the `frontend-react/` folder:

```
REACT_APP_BACKEND_URL=http://localhost:5000
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Start the frontend:

```bash
npm start
```

The app will be available at `http://localhost:3000`.

---

## Sharing on Other Devices

To access the app from your phone or share with others, use Cloudflare Tunnel:

```bash
# Expose the backend
cloudflared tunnel --url http://localhost:5000

# Expose the frontend
cloudflared tunnel --url http://localhost:3000
```

Update `REACT_APP_BACKEND_URL` in `frontend-react/.env` with the backend tunnel URL, then restart `npm start`. Open the frontend tunnel URL on your device.

> Note: Free Cloudflare tunnels generate a new URL each session. For a permanent URL, set up a named tunnel with a Cloudflare account.

---

## Project Structure

```
Hackathon Project/
├── backend/
│   ├── app.py          # Flask API routes
│   ├── dbClient.py     # Supabase client
│   ├── coach.py        # Nutrition coach logic
│   ├── friends.py      # Friends helpers
│   └── requirements.txt
└── frontend-react/
    └── src/
        ├── pages/      # Scanner, Log, Goals, Chat, Friends, etc.
        ├── components/ # MealCard, CalorieBar, Modals
        └── utils/      # API helpers (storage.js)
```
