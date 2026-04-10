const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { transactions, categories, budgetData } = JSON.parse(event.body);
    
    // Save data to Supabase
    const { data, error } = await supabase
      .from('expense_tracker_data')
      .upsert({
        id: 'main',
        transactions: transactions,
        categories: categories,
        budget_data: budgetData,
        updated_at: new Date().toISOString()
      })
      .eq('id', 'main');

    if (error) {
      throw error;
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        message: 'Data saved successfully',
        data: data 
      })
    };

  } catch (error) {
    console.error('Error saving data:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to save data',
        details: error.message 
      })
    };
  }
};
