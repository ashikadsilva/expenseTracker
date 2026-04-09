# My Expense Tracker

A personal daily expense tracker for Canara Bank and Union Bank accounts.

## Features

- **Dashboard** — Summary cards, donut chart by category, monthly trend line, top spending categories
- **Transactions** — Full list with filter by month / account / type / category / search, add, edit, delete
- **Categories** — Breakdown table with progress bars and % share per category
- **Manage Categories** — Add, rename, recolor, or delete expense and income categories
- **Import** — Upload your `Monthly_budget.xlsx` and auto-import all transactions
- **Export CSV** — Download all transactions as a CSV file
- **LocalStorage persistence** — All data saved in your browser, survives page refresh

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Build for production

```bash
npm run build
npm run preview
```

The `dist/` folder can be deployed to **Netlify**, **Vercel**, or any static host.

### Deploy to Netlify (free)
1. Run `npm run build`
2. Drag the `dist/` folder to https://app.netlify.com/drop

### Deploy to Vercel (free)
```bash
npx vercel --prod
```

## Import format

Upload your existing `Monthly_budget.xlsx`. The app reads all sheets with "Transactions" in the name:

- Account detected from sheet name: "Canara" → Canara Bank, anything else → Union Bank
- **Expense columns**: B (Date), C (Amount), D (Description), E (Category)
- **Income columns**: G (Date), H (Amount), I (Description), J (Category)
- Duplicate entries are skipped automatically
- New categories found in the file are added automatically

## Tech stack

- React 18 + Vite 5
- Recharts (charts)
- SheetJS / xlsx (XLSX import)
- localStorage (persistence, no backend needed)
