import { createClient } from '@supabase/supabase-js';
import { normalizeAccounts } from './accounts';

const LS_TXN = 'expenseTrackerTransactions';
const LS_CAT = 'expenseTrackerCategories';
const LS_BUDGET = 'expenseTrackerBudgetData';
const LS_ACCOUNTS = 'expenseTrackerAccounts';

/** Primary keys used by deployed app (Netlify); legacy keys kept in sync for migration. */
export const LS_ET_TRANSACTIONS = 'et_transactions';
export const LS_ET_SUMMARY = 'et_summary';
export const LS_ET_ACCOUNTS = 'et_accounts';

/** Default category lists when there is no saved data yet. */
export const DEFAULT_CATEGORIES = {
  expense: [
    { name: 'Food', color: '#185FA5' },
    { name: 'Home', color: '#3B6D11' },
    { name: 'Shopping', color: '#BA7517' },
    { name: 'SIP', color: '#534AB7' },
    { name: 'Transportation', color: '#0F6E56' },
    { name: 'Recharge', color: '#993556' },
    { name: 'Investment', color: '#A32D2D' },
    { name: 'Gifts', color: '#D85A30' },
    { name: 'Health/medical', color: '#D4537E' },
    { name: 'Travel', color: '#639922' },
    { name: 'Utilities', color: '#888780' },
    { name: 'Debt', color: '#E24B4A' },
    { name: 'Rent', color: '#3266ad' },
    { name: 'Other', color: '#73726c' },
    { name: 'Union', color: '#1D9E75' },
    { name: 'Mom', color: '#EF9F27' },
    { name: 'Trip', color: '#97C459' },
  ],
  income: [
    { name: 'Paycheck', color: '#3B6D11' },
    { name: 'Credited Amount', color: '#185FA5' },
    { name: 'Savings', color: '#534AB7' },
    { name: 'Bonus', color: '#BA7517' },
    { name: 'Interest', color: '#0F6E56' },
    { name: 'Reward', color: '#D85A30' },
  ],
};

function normalizeCategories(raw) {
  if (!raw || typeof raw !== 'object')
    return {
      ...DEFAULT_CATEGORIES,
      expense: [...DEFAULT_CATEGORIES.expense],
      income: [...DEFAULT_CATEGORIES.income],
    };
  const expense = Array.isArray(raw.expense) ? raw.expense : [];
  const income = Array.isArray(raw.income) ? raw.income : [];
  if (expense.length === 0 && income.length === 0) {
    return {
      expense: [...DEFAULT_CATEGORIES.expense],
      income: [...DEFAULT_CATEGORIES.income],
    };
  }
  return { expense, income };
}

const PLACEHOLDER_FRAGMENTS = ['your-project-id.supabase.co', 'your-project.supabase.co'];

/**
 * Cloud + auth when URL/key look real, OR when REACT_APP_SUPABASE_ENABLED=true (use on Netlify if the URL
 * is flagged incorrectly, or after setting real keys — still requires both URL and key non-empty).
 */
export function isCloudPersistenceEnabled() {
  const url = (process.env.REACT_APP_SUPABASE_URL || '').trim();
  const key = (process.env.REACT_APP_SUPABASE_ANON_KEY || '').trim();
  if (!url || !key) return false;
  const force = /^true$/i.test((process.env.REACT_APP_SUPABASE_ENABLED || '').trim());
  if (force) return true;
  if (PLACEHOLDER_FRAGMENTS.some((f) => url.includes(f))) return false;
  if (/^your-anon-key$/i.test(key) || /^your-supabase-anon-key$/i.test(key)) return false;
  return true;
}

let supabaseClient = null;

function getClient() {
  if (!isCloudPersistenceEnabled()) return null;
  if (!supabaseClient) {
    supabaseClient = createClient(
      process.env.REACT_APP_SUPABASE_URL.trim(),
      process.env.REACT_APP_SUPABASE_ANON_KEY.trim(),
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: 'expense-tracker-supabase-auth',
        },
      }
    );
  }
  return supabaseClient;
}

export function getSupabaseClient() {
  return getClient();
}

function parseJsonArray(raw, fallback = []) {
  if (raw == null || raw === '') return fallback;
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : fallback;
  } catch {
    return fallback;
  }
}

function readLocalStorage() {
  try {
    const etTxn = localStorage.getItem(LS_ET_TRANSACTIONS);
    const legacyTxn = localStorage.getItem(LS_TXN);
    const transactions = parseJsonArray(
      etTxn != null ? etTxn : legacyTxn,
      []
    );

    const etSummary = localStorage.getItem(LS_ET_SUMMARY);
    const legacyBudget = localStorage.getItem(LS_BUDGET);
    const budgetData = parseJsonArray(etSummary != null ? etSummary : legacyBudget, []);

    const localCategories = localStorage.getItem(LS_CAT);
    const localAccounts = localStorage.getItem(LS_ACCOUNTS);

    return {
      transactions,
      categories: localCategories ? JSON.parse(localCategories) : null,
      budgetData,
      accounts: localAccounts ? JSON.parse(localAccounts) : null,
    };
  } catch {
    return { transactions: [], categories: null, budgetData: [], accounts: null };
  }
}

function writeLocalStorage(transactions, categories, budgetData, accounts) {
  const txnStr = JSON.stringify(Array.isArray(transactions) ? transactions : []);
  const budgetStr = JSON.stringify(Array.isArray(budgetData) ? budgetData : []);
  const accStr = JSON.stringify(Array.isArray(accounts) ? accounts : []);
  localStorage.setItem(LS_ET_TRANSACTIONS, txnStr);
  localStorage.setItem(LS_ET_SUMMARY, budgetStr);
  localStorage.setItem(LS_TXN, txnStr);
  localStorage.setItem(LS_BUDGET, budgetStr);
  localStorage.setItem(LS_CAT, JSON.stringify(categories));
  localStorage.setItem(LS_ACCOUNTS, accStr);
  localStorage.setItem(LS_ET_ACCOUNTS, accStr);
}

/** Reload accounts array from localStorage (same keys as write). */
export function readStoredAccounts() {
  try {
    const raw = localStorage.getItem(LS_ET_ACCOUNTS) || localStorage.getItem(LS_ACCOUNTS);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * @param {string | undefined} userId
 */
export async function loadAppData(userId) {
  const client = getClient();

  if (client && userId) {
    const { data, error } = await client
      .from('expense_tracker_data')
      .select('transactions,categories,budget_data,accounts')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.warn('Cloud load error, falling back to local:', error.message);
    } else if (data) {
      const transactions = Array.isArray(data.transactions) ? data.transactions : [];
      const categories = normalizeCategories(data.categories);
      const budgetData = Array.isArray(data.budget_data) ? data.budget_data : [];
      const accounts = normalizeAccounts(data.accounts);
      writeLocalStorage(transactions, categories, budgetData, accounts);
      return { transactions, categories, budgetData, accounts };
    } else {
      const local = readLocalStorage();
      const categories = local.categories
        ? normalizeCategories(local.categories)
        : normalizeCategories(null);
      const accounts = normalizeAccounts(local.accounts);
      const hasAny =
        (Array.isArray(local.transactions) && local.transactions.length > 0) ||
        (Array.isArray(local.budgetData) && local.budgetData.length > 0) ||
        (local.categories &&
          (local.categories.expense?.length || local.categories.income?.length));
      if (hasAny) {
        const out = {
          transactions: Array.isArray(local.transactions) ? local.transactions : [],
          categories,
          budgetData: Array.isArray(local.budgetData) ? local.budgetData : [],
          accounts,
        };
        writeLocalStorage(out.transactions, out.categories, out.budgetData, out.accounts);
        return out;
      }
      const defaults = {
        transactions: [],
        categories: normalizeCategories(null),
        budgetData: [],
        accounts: normalizeAccounts(null),
      };
      writeLocalStorage(
        defaults.transactions,
        defaults.categories,
        defaults.budgetData,
        defaults.accounts
      );
      return defaults;
    }
  }

  const local = readLocalStorage();
  const categories = local.categories ? normalizeCategories(local.categories) : normalizeCategories(null);
  const accounts = normalizeAccounts(local.accounts);
  const hasAny =
    (Array.isArray(local.transactions) && local.transactions.length > 0) ||
    (Array.isArray(local.budgetData) && local.budgetData.length > 0) ||
    (local.categories && (local.categories.expense?.length || local.categories.income?.length));

  if (hasAny) {
    return {
      transactions: Array.isArray(local.transactions) ? local.transactions : [],
      categories,
      budgetData: Array.isArray(local.budgetData) ? local.budgetData : [],
      accounts,
    };
  }

  return {
    transactions: [],
    categories: normalizeCategories(null),
    budgetData: [],
    accounts: normalizeAccounts(null),
  };
}

/**
 * @param {string | undefined} userId
 * @param {unknown} accounts
 */
export async function saveAppData(transactions, categories, budgetData, userId, accounts) {
  const acct = normalizeAccounts(accounts);
  writeLocalStorage(transactions, categories, budgetData, acct);

  const client = getClient();
  if (!client || !userId) return;

  const { error } = await client.from('expense_tracker_data').upsert(
    {
      id: userId,
      transactions,
      categories,
      budget_data: budgetData,
      accounts: acct,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  if (error) {
    console.error('Cloud save failed:', error.message);
  }
}
