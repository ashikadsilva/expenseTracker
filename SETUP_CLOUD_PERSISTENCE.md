# Cloud Persistence Setup for Netlify Deployment

## Overview
Your expense tracker now supports cloud-based data persistence using Supabase and Netlify Functions. This ensures data persists across all users and sessions when deployed on Netlify.

## Quick Setup Steps

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up/login with GitHub
4. Create new project
5. Note your project URL and anon key

### 2. Create Database Table
In your Supabase project SQL Editor, run:

```sql
CREATE TABLE expense_tracker_data (
  id TEXT PRIMARY KEY,
  transactions JSONB,
  categories JSONB,
  budget_data JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default data
INSERT INTO expense_tracker_data (id, transactions, categories, budget_data)
VALUES (
  'main',
  '[]',
  '{"expense": [], "income": []}',
  '[]'
);

-- Allow the browser app (anon key) to read and update this single row.
-- For a household app this is usually enough; add auth + RLS per-user later if needed.
ALTER TABLE expense_tracker_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expense_tracker_anon_rw"
  ON expense_tracker_data
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);
```

If you prefer **not** to use RLS, you can instead run `ALTER TABLE expense_tracker_data DISABLE ROW LEVEL SECURITY;` (less secure on shared projects).

### 3. Set Environment Variables

#### For Local Development:
Create `.env.local` file:
```bash
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
```

#### For Netlify Deployment:
1. Go to your Netlify site dashboard
2. Site settings > Build & deploy > Environment > Environment variables
3. Add these variables (Create React App only exposes names starting with `REACT_APP_` to the browser):
   - `REACT_APP_SUPABASE_URL` = `https://your-project-id.supabase.co`
   - `REACT_APP_SUPABASE_ANON_KEY` = your Supabase **anon** public key

4. **Redeploy** the site after saving variables (Environment > Trigger deploy), so the new build picks them up.

Optional (only if you use Netlify Functions `get-data` / `save-data` instead of direct browser sync):
   - `SUPABASE_URL` and `SUPABASE_ANON_KEY` for the serverless functions.

### 4. Deploy to Netlify
```bash
# Install dependencies
npm install

# Build and deploy
npm run build
netlify deploy --prod --dir=build
```

## How It Works

### Hybrid Persistence Strategy
- **LocalStorage**: Fast, offline-first storage
- **Cloud Storage**: Persistent, shared across all users
- **Automatic Sync**: Changes saved to both locations

### Data Flow
1. **App Loads**: Checks cloud first, falls back to localStorage
2. **User Adds Entry**: Saves to localStorage immediately, then syncs to cloud
3. **Cloud Sync**: All users see latest data on next page load

### Benefits
- **No Data Loss**: Data persists even if browser is cleared
- **Multi-User**: All users see same data
- **Offline Support**: Works offline, syncs when online
- **Instant Updates**: Local changes visible immediately

## Testing

### Local Testing
1. Set up `.env.local` with Supabase credentials
2. Run `npm start`
3. Add entries, check they persist across browser refreshes

### Deployed Testing
1. Deploy to Netlify with environment variables set
2. Open your app in multiple browser tabs/devices
3. Add entry in one tab
4. Refresh other tabs - data should appear

## Troubleshooting

### Common Issues
1. **CORS Errors**: Ensure Supabase allows your Netlify domain
2. **401 Unauthorized**: Check environment variables are correct
3. **No Data Sync**: Verify Netlify Functions are deployed correctly

### Debug Mode
Add this to your browser console to see sync status:
```javascript
// Check if cloud sync is working
fetch('/.netlify/functions/get-data')
  .then(r => r.json())
  .then(console.log);
```

## Security Notes
- Supabase anon key is safe to expose in frontend
- Data is shared across all users (public app)
- For private data, implement Row Level Security in Supabase

## Next Steps
- Add user authentication for private data
- Implement real-time updates with Supabase subscriptions
- Add data export/import functionality
