# Expense Tracker (React)

A client-side expense tracker: dashboard, transactions, categories, monthly statements from Excel summaries, and XLSX import. Data persists in the browser via **localStorage** (and optionally **Supabase** when configured).

## Requirements

- **Node.js** 18+ (LTS recommended)
- **npm** 9+ (comes with Node)

## Setup

1. Clone or copy this project and open a terminal in the project folder.

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm start
   ```

   The app opens at [http://localhost:3000](http://localhost:3000) (Create React App default).

4. Production build (outputs to `build/`):

   ```bash
   npm run build
   ```

   Serve the `build` folder with any static host (e.g. Vercel, Netlify, `npx serve -s build`).

## Deploy to Vercel

This project is **Create React App** (`react-scripts`). Vercel detects it and runs `npm run build` and publishes the **`build/`** folder.

### Option A — Git integration (recommended)

1. Push the project to **GitHub**, **GitLab**, or **Bitbucket**.
2. Go to [vercel.com](https://vercel.com), sign in, and click **Add New… → Project**.
3. **Import** your repository. Leave defaults:
   - **Framework Preset:** Create React App  
   - **Build Command:** `npm run build`  
   - **Output Directory:** `build`
4. **Environment variables** (only if you use Supabase): in the project → **Settings → Environment Variables**, add the same names as in `.env`:
   - `REACT_APP_SUPABASE_URL`
   - `REACT_APP_SUPABASE_ANON_KEY`
   - optionally `REACT_APP_SUPABASE_ENABLED`  
   Redeploy after saving env vars.
5. Click **Deploy**. You’ll get a URL like `https://your-project.vercel.app`.

The repo includes a small **`vercel.json`** so all routes fall back to `index.html` (useful if you add client-side URLs later).

### Option B — Vercel CLI

```bash
npm i -g vercel
cd "path/to/Expense Tracker"
vercel
```

Follow the prompts (link to a Vercel account, confirm scope, set project name). For production: `vercel --prod`.

### After deploy

- Each visitor’s data stays in **their browser** (`localStorage`) unless you enabled **Supabase** and they sign in.
- To change the public URL or add a custom domain: **Project → Settings → Domains**.

## npm scripts

| Command       | Description                                      |
|---------------|--------------------------------------------------|
| `npm start`   | Dev server with hot reload (`react-scripts`)     |
| `npm run build` | Optimized production bundle                   |
| `npm test`    | Jest test runner (interactive)                 |
| `npm run eject` | Irreversible CRA eject — avoid unless needed |

## Optional: Supabase (cloud sync + auth)

By default the app uses **localStorage only**. To enable sign-in and cloud persistence:

1. Create a Supabase project and a table (or use your existing schema) compatible with what `src/utils/persistence.js` expects (`expense_tracker_data` with `transactions`, `categories`, `budget_data`, `accounts`).

2. Create a `.env` file in the project root (never commit real secrets):

   ```env
   REACT_APP_SUPABASE_URL=https://your-project.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your-anon-key
   ```

3. If the URL is flagged as a placeholder in code but your project is real, you can force enable:

   ```env
   REACT_APP_SUPABASE_ENABLED=true
   ```

Restart `npm start` after changing `.env`. Without valid URL + key, the app stays **offline-first** with localStorage.

## Data storage (localStorage)

Primary keys (also mirrored to legacy CRA keys for compatibility):

| Key                 | Contents |
|---------------------|----------|
| `et_transactions` | Transaction rows (import + manual entry) |
| `et_summary`      | Budget / monthly summary rows from Excel **Summary** sheets |
| `et_accounts`     | Bank accounts (`id`, `label`, `keywords`, `chipColor`, `startingBalance`, `currentBalance`) |
| `expenseTrackerCategories` | Category lists (expense / income) |

Legacy keys `expenseTrackerTransactions`, `expenseTrackerBudgetData`, and `expenseTrackerAccounts` are kept in sync when the app saves.

## Excel import (`Monthly_budget.xlsx`)

- **Summary** sheets (name contains `Summary`, case-insensitive): balances and category breakdowns are parsed into `et_summary`.
- **Transaction** sheets (name contains `Transaction`): rows are parsed into `et_transactions`.

Use **Import** in the app to upload; use **Clear & re-import summary** if you need to wipe summary data and upload again after template changes.

## Project layout (high level)

- `src/App.js` — Tab shell, persistence load/save, XLSX import handler
- `src/components/` — UI tabs and modals
- `src/utils/persistence.js` — localStorage + optional Supabase load/save
- `src/utils/accounts.js` — Account normalization and sheet-name matching

## Troubleshooting

- **Blank data after deploy:** Ensure the browser allows localStorage; same origin as when you first imported data.
- **Port in use:** CRA will suggest another port, or set `PORT=3001` (Windows: `set PORT=3001 && npm start`).
- **Build fails:** Delete `node_modules` and `package-lock.json`, run `npm install` again, then `npm run build`.

## License

Private / your use unless you add a license file.
