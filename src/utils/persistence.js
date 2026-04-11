import { createClient } from '@supabase/supabase-js';

const LS_TXN = 'expenseTrackerTransactions';
const LS_CAT = 'expenseTrackerCategories';
const LS_BUDGET = 'expenseTrackerBudgetData';

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
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_CATEGORIES, expense: [...DEFAULT_CATEGORIES.expense], income: [...DEFAULT_CATEGORIES.income] };
  const expense = Array.isArray(raw.expense) ? raw.expense : [];
  const income = Array.isArray(raw.income) ? raw.income : [];
  if (expense.length === 0 && income.length === 0) {
    return { expense: [...DEFAULT_CATEGORIES.expense], income: [...DEFAULT_CATEGORIES.income] };
  }
  return { expense, income };
}

const PLACEHOLDER_FRAGMENTS = ['your-project-id.supabase.co', 'your-project.supabase.co'];

export function isCloudPersistenceEnabled() {
  const url = (process.env.REACT_APP_SUPABASE_URL || '').trim();
  const key = (process.env.REACT_APP_SUPABASE_ANON_KEY || '').trim();
  if (!url || !key) return false;
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
      process.env.REACT_APP_SUPABASE_ANON_KEY.trim()
    );
  }
  return supabaseClient;
}

function readLocalStorage() {
  try {
    const localTransactions = localStorage.getItem(LS_TXN);
    const localCategories = localStorage.getItem(LS_CAT);
    const localBudgetData = localStorage.getItem(LS_BUDGET);
    return {
      transactions: localTransactions ? JSON.parse(localTransactions) : [],
      categories: localCategories ? JSON.parse(localCategories) : null,
      budgetData: localBudgetData ? JSON.parse(localBudgetData) : [],
    };
  } catch {
    return { transactions: [], categories: null, budgetData: [] };
  }
}

function writeLocalStorage(transactions, categories, budgetData) {
  localStorage.setItem(LS_TXN, JSON.stringify(transactions));
  localStorage.setItem(LS_CAT, JSON.stringify(categories));
  localStorage.setItem(LS_BUDGET, JSON.stringify(budgetData));
}

/**
 * Load from Supabase when configured, else from localStorage.
 * New visitors get default categories and empty transactions/budget.
 */
export async function loadAppData() {
  const client = getClient();

  if (client) {
    const { data, error } = await client
      .from('expense_tracker_data')
      .select('transactions,categories,budget_data')
      .eq('id', 'main')
      .maybeSingle();

    if (error) {
      console.warn('Cloud load error, falling back to local:', error.message);
    } else if (data) {
      const transactions = Array.isArray(data.transactions) ? data.transactions : [];
      const categories = normalizeCategories(data.categories);
      const budgetData = Array.isArray(data.budget_data) ? data.budget_data : [];
      writeLocalStorage(transactions, categories, budgetData);
      return { transactions, categories, budgetData };
    }
  }

  const local = readLocalStorage();
  const categories = local.categories ? normalizeCategories(local.categories) : normalizeCategories(null);
  const hasAny =
    (local.transactions && local.transactions.length > 0) ||
    (local.budgetData && local.budgetData.length > 0) ||
    (local.categories && (local.categories.expense?.length || local.categories.income?.length));

  if (hasAny) {
    return {
      transactions: Array.isArray(local.transactions) ? local.transactions : [],
      categories,
      budgetData: Array.isArray(local.budgetData) ? local.budgetData : [],
    };
  }

  return {
    transactions: [],
    categories: normalizeCategories(null),
    budgetData: [],
  };
}

/** Persist to localStorage and Supabase (when configured). */
export async function saveAppData(transactions, categories, budgetData) {
  writeLocalStorage(transactions, categories, budgetData);

  const client = getClient();
  if (!client) return;

  const { error } = await client.from('expense_tracker_data').upsert(
    {
      id: 'main',
      transactions,
      categories,
      budget_data: budgetData,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  if (error) {
    console.error('Cloud save failed:', error.message);
  }
}
