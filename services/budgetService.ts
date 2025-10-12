import { db } from './database';

export interface Budget {
  server_id: any;
  id: number;
  category_id: number;
  category_name: string;
  category_icon: string;
  amount: number;
  period: string;
  start_date: string;
  end_date: string;
  spent?: number;
  user_id: number;
  title: string; // <-- Add this line
}

// Add budget
export const addBudget = (
  userId: number,
  categoryId: number,
  amount: number,
  period: string = 'monthly',
  title: string, // <-- Add this parameter
  startDate?: string,
  endDate?: string
) => {
  try {
    // Calculate dates if not provided
    const now = new Date();
    const start = startDate || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const end = endDate || new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    
    const result = db.runSync(
      'INSERT INTO budgets (user_id, category_id, amount, period, title, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, categoryId, amount, period, title, start, end] // <-- Add title here
    );
    
    return { success: true, budgetId: result.lastInsertRowId };
  } catch (error) {
    console.error('Add budget error:', error);
    return { success: false, error: 'Failed to add budget' };
  }
};

// Get user's budgets with spending information
export const getUserBudgets = (userId: number): Budget[] => {
  try {
    const query = `
      SELECT 
        b.id,
        b.category_id,
        c.name as category_name,
        c.icon as category_icon,
        b.amount,
        b.period,
        b.title,         -- <-- Add this line
        b.start_date,
        b.end_date,
        COALESCE(SUM(e.amount), 0) as spent,
        b.user_id
      FROM budgets b
      JOIN expense_categories c ON b.category_id = c.id
      LEFT JOIN expenses e ON e.category_id = b.category_id 
        AND e.user_id = b.user_id 
        AND e.expense_date BETWEEN b.start_date AND b.end_date
      WHERE b.user_id = ? AND b.is_active = 1
      GROUP BY b.id, b.category_id, c.name, c.icon, b.amount, b.period, b.title, b.start_date, b.end_date, b.user_id
      ORDER BY b.created_at DESC
    `;
    const result = db.getAllSync(query, [userId]) as Budget[];
    return result || [];
  } catch (error) {
    console.error('Get budgets error:', error);
    return [];
  }
};

// Update budget
export const updateBudget = (
  budgetId: number,
  userId: number,
  amount: number,
  period?: string
) => {
  try {
    db.runSync(
      'UPDATE budgets SET amount = ?, period = COALESCE(?, period), updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
      [amount, period ?? null, budgetId, userId]
    );
    
    return { success: true };
  } catch (error) {
    console.error('Update budget error:', error);
    return { success: false, error: 'Failed to update budget' };
  }
};

// Delete budget
export const deleteBudget = (budgetId: number, userId: number) => {
  try {
    db.runSync(
      'DELETE FROM budgets WHERE id = ? AND user_id = ?',
      [budgetId, userId]
    );
    
    return { success: true };
  } catch (error) {
    console.error('Delete budget error:', error);
    return { success: false, error: 'Failed to delete budget' };
  }
};

// Get budget summary
export const getBudgetSummary = (userId: number) => {
  try {
    const result = db.getFirstSync(`
      SELECT 
        SUM(b.amount) as total_budget,
        SUM(COALESCE(spent_data.spent, 0)) as total_spent
      FROM budgets b
      LEFT JOIN (
        SELECT 
          b.id as budget_id,
          SUM(e.amount) as spent
        FROM budgets b
        LEFT JOIN expenses e ON e.category_id = b.category_id 
          AND e.user_id = b.user_id 
          AND e.expense_date BETWEEN b.start_date AND b.end_date
        WHERE b.user_id = ? AND b.is_active = 1
        GROUP BY b.id
      ) spent_data ON spent_data.budget_id = b.id
      WHERE b.user_id = ? AND b.is_active = 1
    `, [userId, userId]) as { total_budget: number; total_spent: number };
    
    return {
      totalBudget: result?.total_budget || 0,
      totalSpent: result?.total_spent || 0,
      remaining: (result?.total_budget || 0) - (result?.total_spent || 0)
    };
  } catch (error) {
    console.error('Get budget summary error:', error);
    return { totalBudget: 0, totalSpent: 0, remaining: 0 };
  }
};