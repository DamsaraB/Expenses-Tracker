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
}

export interface SavingsTransaction {
  id: number;
  goal_id: number;
  amount: number;
  transaction_type: 'deposit' | 'withdrawal';
  description?: string;
  transaction_date: string;
}

// Add savings goal
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
      'INSERT INTO savings_goals (user_id, title, description, target_amount, target_date, category, priority) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, title, description || '', targetAmount, targetDate || null, category, priority]
    );
    
    return { success: true, goalId: result.lastInsertRowId };
  } catch (error) {
    console.error('Add savings goal error:', error);
    return { success: false, error: 'Failed to add savings goal' };
  }
};

// Get user's savings goals
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

// Update savings goal
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
      'UPDATE savings_goals SET title = ?, target_amount = ?, category = ?, target_date = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
      [title, targetAmount, category, targetDate || null, description || '', goalId, userId]
    );
    
    return { success: true };
  } catch (error) {
    console.error('Update savings goal error:', error);
    return { success: false, error: 'Failed to update savings goal' };
  }
};

// Delete savings goal
export const deleteSavingsGoal = (goalId: number, userId: number) => {
  try {
    db.runSync(
      'DELETE FROM savings_goals WHERE id = ? AND user_id = ?',
      [goalId, userId]
    );
    
    return { success: true };
  } catch (error) {
    console.error('Delete savings goal error:', error);
    return { success: false, error: 'Failed to delete savings goal' };
  }
};

// Add money to savings goal
export const addMoneyToGoal = (
  goalId: number,
  userId: number,
  amount: number,
  description?: string
) => {
  try {
    db.execSync('BEGIN TRANSACTION;');
    
    // Add transaction record
    db.runSync(
      'INSERT INTO savings_transactions (user_id, goal_id, amount, transaction_type, description, transaction_date) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, goalId, amount, 'deposit', description || '', new Date().toISOString().split('T')[0]]
    );
    
    // Update current amount in goal
    db.runSync(
      'UPDATE savings_goals SET current_amount = current_amount + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
      [amount, goalId, userId]
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
    return { success: true };
  } catch (error) {
    db.execSync('ROLLBACK;');
    console.error('Add money to goal error:', error);
    return { success: false, error: 'Failed to add money to goal' };
  }
};

// Get savings summary
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