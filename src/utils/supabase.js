import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cloud data persistence functions
export const saveDataToCloud = async (transactions, categories, budgetData) => {
  try {
    const response = await fetch('/.netlify/functions/save-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transactions,
        categories,
        budgetData
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving to cloud:', error);
    throw error;
  }
};

export const getDataFromCloud = async () => {
  try {
    const response = await fetch('/.netlify/functions/get-data');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching from cloud:', error);
    throw error;
  }
};

// Hybrid persistence: localStorage + cloud
export const saveData = async (transactions, categories, budgetData) => {
  // Always save to localStorage first (fast, offline)
  localStorage.setItem('expenseTrackerTransactions', JSON.stringify(transactions));
  localStorage.setItem('expenseTrackerCategories', JSON.stringify(categories));
  localStorage.setItem('expenseTrackerBudgetData', JSON.stringify(budgetData));
  
  // Then save to cloud (async, for persistence)
  try {
    await saveDataToCloud(transactions, categories, budgetData);
  } catch (error) {
    console.warn('Cloud save failed, data saved locally only:', error);
  }
};

export const loadData = async () => {
  // Try to load from cloud first
  try {
    const cloudData = await getDataFromCloud();
    
    // Update localStorage with cloud data
    localStorage.setItem('expenseTrackerTransactions', JSON.stringify(cloudData.transactions));
    localStorage.setItem('expenseTrackerCategories', JSON.stringify(cloudData.categories));
    localStorage.setItem('expenseTrackerBudgetData', JSON.stringify(cloudData.budget_data));
    
    return {
      transactions: cloudData.transactions,
      categories: cloudData.categories,
      budgetData: cloudData.budget_data
    };
  } catch (error) {
    console.warn('Failed to load from cloud, using local data:', error);
    
    // Fallback to localStorage
    const localTransactions = localStorage.getItem('expenseTrackerTransactions');
    const localCategories = localStorage.getItem('expenseTrackerCategories');
    const localBudgetData = localStorage.getItem('expenseTrackerBudgetData');
    
    return {
      transactions: localTransactions ? JSON.parse(localTransactions) : [],
      categories: localCategories ? JSON.parse(localCategories) : { expense: [], income: [] },
      budgetData: localBudgetData ? JSON.parse(localBudgetData) : []
    };
  }
};
