import { db } from './database';

export interface SavingsGoal {
  id: number;
  title: string;
  description?: string;
  target_amount: number;
  current_amount: number;
  target_date?: string;
  category: string;
  priority: number;
  is_achieved: boolean;
  user_id: number;
  server_id?: number;
  sync_status?: string;
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
}

export interface SavingsTransaction {
  id: number;
  goal_id: number;
  amount: number;
  transaction_type: 'deposit' | 'withdrawal';
  description?: string;
  transaction_date: string;
  user_id: number;
  server_id?: number;
  sync_status?: string;
  created_at?: string;
}

// Add savings goal (LOCAL FIRST - like budget)
export const addSavingsGoal = (
  userId: number,
  title: string,
  targetAmount: number,
  category: string,
  targetDate?: string,
  description?: string,
  priority: number = 1
) => {
  try {
    const result = db.runSync(
      'INSERT INTO savings_goals (user_id, title, description, target_amount, target_date, category, priority, current_amount, is_achieved, is_active, sync_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, title, description || '', targetAmount, targetDate || null, category, priority, 0, 0, 1, 'pending']
    );
    
    return { success: true, goalId: result.lastInsertRowId };
  } catch (error) {
    console.error('Add savings goal error:', error);
    return { success: false, error: 'Failed to add savings goal' };
  }
};

// Get user's savings goals (LOCAL ONLY - like budget)
export const getUserSavingsGoals = (userId: number): SavingsGoal[] => {
  try {
    const result = db.getAllSync(
      'SELECT * FROM savings_goals WHERE user_id = ? AND is_active = 1 ORDER BY priority DESC, created_at DESC',
      [userId]
    ) as SavingsGoal[];
    
    return result || [];
  } catch (error) {
    console.error('Get savings goals error:', error);
    return [];
  }
};

// Update savings goal (LOCAL FIRST - like budget)
export const updateSavingsGoal = (
  goalId: number,
  userId: number,
  title: string,
  targetAmount: number,
  category: string,
  targetDate?: string,
  description?: string
) => {
  try {
    db.runSync(
      'UPDATE savings_goals SET title = ?, target_amount = ?, category = ?, target_date = ?, description = ?, sync_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
      [title, targetAmount, category, targetDate || null, description || '', 'modified', goalId, userId]
    );
    
    return { success: true };
  } catch (error) {
    console.error('Update savings goal error:', error);
    return { success: false, error: 'Failed to update savings goal' };
  }
};

// Delete savings goal (LOCAL FIRST - like budget)
export const deleteSavingsGoal = (goalId: number, userId: number) => {
  try {
    db.runSync(
      'UPDATE savings_goals SET is_active = 0, sync_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
      ['deleted', goalId, userId]
    );
    
    return { success: true };
  } catch (error) {
    console.error('Delete savings goal error:', error);
    return { success: false, error: 'Failed to delete savings goal' };
  }
};

// Add money to savings goal (LOCAL FIRST - like budget)
export const addMoneyToGoal = (
  goalId: number,
  userId: number,
  amount: number,
  description?: string
) => {
  try {
    db.execSync('BEGIN TRANSACTION;');
    
    // Add transaction record with sync status
    db.runSync(
      'INSERT INTO savings_transactions (user_id, goal_id, amount, transaction_type, description, transaction_date, sync_status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, goalId, amount, 'deposit', description || '', new Date().toISOString().split('T')[0], 'pending']
    );
    
    // Update current amount in goal and mark as modified
    db.runSync(
      'UPDATE savings_goals SET current_amount = current_amount + ?, sync_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
      [amount, 'modified', goalId, userId]
    );
    
    // Check if goal is achieved
    const goal = db.getFirstSync(
      'SELECT current_amount, target_amount FROM savings_goals WHERE id = ? AND user_id = ?',
      [goalId, userId]
    ) as { current_amount: number; target_amount: number };
    
    if (goal && goal.current_amount >= goal.target_amount) {
      db.runSync(
        'UPDATE savings_goals SET is_achieved = 1 WHERE id = ? AND user_id = ?',
        [goalId, userId]
      );
    }
    
    db.execSync('COMMIT;');
    
    console.log('Money added successfully. New current amount:', goal?.current_amount); // Debug log
    
    return { success: true };
  } catch (error) {
    db.execSync('ROLLBACK;');
    console.error('Add money to goal error:', error);
    return { success: false, error: 'Failed to add money to goal' };
  }
};

// Get savings summary (LOCAL ONLY - like budget)
export const getSavingsSummary = (userId: number) => {
  try {
    const result = db.getFirstSync(
      'SELECT SUM(target_amount) as total_target, SUM(current_amount) as total_saved FROM savings_goals WHERE user_id = ? AND is_active = 1',
      [userId]
    ) as { total_target: number; total_saved: number };
    
    return {
      totalTarget: result?.total_target || 0,
      totalSaved: result?.total_saved || 0,
      progress: result?.total_target > 0 ? (result?.total_saved / result?.total_target) * 100 : 0
    };
  } catch (error) {
    console.error('Get savings summary error:', error);
    return { totalTarget: 0, totalSaved: 0, progress: 0 };
  }
};

export const getSavingsTransactionsForGoal = (goalId: number): SavingsTransaction[] => {
  try {
    const transactions = db.getAllSync(
      'SELECT * FROM savings_transactions WHERE goal_id = ? ORDER BY transaction_date DESC',
      [goalId]
    ) as SavingsTransaction[];
    console.log('Fetched transactions for goal', goalId, transactions); // <-- Log to console
    return transactions;
  } catch (error) {
    console.error('Get savings transactions error:', error);
    return [];
  }
};