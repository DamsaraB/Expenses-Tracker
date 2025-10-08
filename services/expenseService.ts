import { db } from './database';

export interface ExpenseCategory {
  id: number;
  name: string;
  color: string;
  icon: string;
  user_id: number;
}

export interface Expense {
  id: number;
  title: string;
  amount: number;
  description?: string;
  date: string;
  category_id: number;
  category_name?: string;
  category_icon?: string;
  category_color?: string;
  user_id: number;
}

// Get user's expense categories
export const getUserCategories = (userId: number): ExpenseCategory[] => {
  try {
    const result = db.getAllSync(
      'SELECT * FROM expense_categories WHERE user_id = ? AND is_active = 1 ORDER BY name',
      [userId]
    ) as ExpenseCategory[];
    
    return result || [];
  } catch (error) {
    console.error('Get categories error:', error);
    return [];
  }
};

// Add expense
export const addExpense = (
  userId: number,
  title: string,
  amount: number,
  categoryId: number,
  description?: string,
  date?: string
) => {
  try {
    const expenseDate = date || new Date().toISOString().split('T')[0];
    
    const result = db.runSync(
      'INSERT INTO expenses (user_id, category_id, title, amount, description, date) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, categoryId, title, amount, description || '', expenseDate]
    );
    
    return { success: true, expenseId: result.lastInsertRowId };
  } catch (error) {
    console.error('Add expense error:', error);
    return { success: false, error: 'Failed to add expense' };
  }
};

// Get user's expenses with category details
export const getUserExpenses = (userId: number, limit?: number): Expense[] => {
  try {
    const query = `
      SELECT 
        e.id,
        e.title,
        e.amount,
        e.description,
        e.date,
        e.category_id,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color,
        e.user_id
      FROM expenses e
      JOIN expense_categories c ON e.category_id = c.id
      WHERE e.user_id = ?
      ORDER BY e.date DESC, e.created_at DESC
      ${limit ? `LIMIT ${limit}` : ''}
    `;
    
    const result = db.getAllSync(query, [userId]) as Expense[];
    return result || [];
  } catch (error) {
    console.error('Get expenses error:', error);
    return [];
  }
};

// Update expense
export const updateExpense = (
  expenseId: number,
  userId: number,
  title: string,
  amount: number,
  categoryId: number,
  description?: string
) => {
  try {
    db.runSync(
      'UPDATE expenses SET title = ?, amount = ?, category_id = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
      [title, amount, categoryId, description || '', expenseId, userId]
    );
    
    return { success: true };
  } catch (error) {
    console.error('Update expense error:', error);
    return { success: false, error: 'Failed to update expense' };
  }
};

// Delete expense
export const deleteExpense = (expenseId: number, userId: number) => {
  try {
    db.runSync(
      'DELETE FROM expenses WHERE id = ? AND user_id = ?',
      [expenseId, userId]
    );
    
    return { success: true };
  } catch (error) {
    console.error('Delete expense error:', error);
    return { success: false, error: 'Failed to delete expense' };
  }
};

// Get expense summary for current month
export const getMonthlyExpenseSummary = (userId: number) => {
  try {
    const currentMonth = new Date().toISOString().substr(0, 7); // YYYY-MM
    
    const result = db.getFirstSync(
      'SELECT SUM(amount) as total FROM expenses WHERE user_id = ? AND date LIKE ?',
      [userId, `${currentMonth}%`]
    ) as { total: number };
    
    return result?.total || 0;
  } catch (error) {
    console.error('Get monthly summary error:', error);
    return 0;
  }
};

// Get expense breakdown by category
export const getExpenseBreakdown = (userId: number, startDate?: string, endDate?: string) => {
  try {
    let query = `
      SELECT 
        c.name,
        c.icon,
        c.color,
        SUM(e.amount) as total
      FROM expenses e
      JOIN expense_categories c ON e.category_id = c.id
      WHERE e.user_id = ?
    `;
    
    const params: (number | string)[] = [userId];
    
    if (startDate) {
      query += ' AND e.date >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      query += ' AND e.date <= ?';
      params.push(endDate);
    }
    
    query += ' GROUP BY c.id, c.name, c.icon, c.color ORDER BY total DESC';
    
    const result = db.getAllSync(query, params) as any[];
    return result || [];
  } catch (error) {
    console.error('Get expense breakdown error:', error);
    return [];
  }
};