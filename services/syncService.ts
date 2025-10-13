import { authApi, budgetsApi, categoriesApi, expensesApi, savingsGoalsApi, savingsTransactionsApi } from './api/api';
import { syncStorage } from './api/storage';
import { db } from './database';

export class SyncService {
  private issyncing = false;

  async syncData() {
    if (this.issyncing) return;
    this.issyncing = true;

    try {
      // 1. Push local changes to server
      await this.pushPendingCategoryUpdates(); // <-- ADD THIS
      await this.pushPendingChanges();
      await this.pushPendingUserUpdates(); // Add user sync
      await this.pushPendingSavingsGoals();
      await this.pushPendingSavingsTransactions();
      
      // 2. Pull server updates
      await this.pullCategoryUpdates(); // <-- ADD THIS
      await this.pullServerUpdates();
      await this.pullUserUpdates(); // Add user sync
      await this.pullSavingsGoalsUpdates();
      await this.pullSavingsTransactionsUpdates();
      
      // 3. Update last sync timestamp
      await syncStorage.saveLastSync(Date.now());
    } finally {
      this.issyncing = false;
    }
  }

  // PUSH LOCAL CATEGORY CHANGES TO SERVER
  private async pushPendingCategoryUpdates() {
    const pendingCategories = db.getAllSync(
      'SELECT * FROM expense_categories WHERE sync_status IN ("pending", "modified")'
    ) as Array<{
      id: number;
      server_id?: number;
      user_id: number;
      name: string;
      color: string;
      icon: string;
      is_default: boolean;
      is_active: boolean;
      sync_status: string;
      last_modified: string;
    }>;

    for (const category of pendingCategories) {
      try {
        if (category.sync_status === 'pending') {
          // Create on backend
          const result = await categoriesApi.create({
            name: category.name,
            color: category.color,
            icon: category.icon,
          });
          db.runSync(
            'UPDATE expense_categories SET server_id = ?, sync_status = "synced", last_modified = ? WHERE id = ?',
            [result.id, new Date().toISOString(), category.id]
          );
        } else if (category.sync_status === 'modified' && category.server_id) {
          // Update on backend
          await categoriesApi.update(category.server_id, {
            name: category.name,
            color: category.color,
            icon: category.icon,
          });
          db.runSync(
            'UPDATE expense_categories SET sync_status = "synced", last_modified = ? WHERE id = ?',
            [new Date().toISOString(), category.id]
          );
        }
      } catch (error) {
        console.error('Sync error for category:', category.id, error);
      }
    }
  }

  // PULL SERVER CATEGORY UPDATES TO LOCAL
  private async pullCategoryUpdates() {
    try {
      const serverCategories = await categoriesApi.list();

      for (const serverCategory of serverCategories) {
        const localCategory = db.getFirstSync(
          'SELECT * FROM expense_categories WHERE server_id = ?',
          [serverCategory.id]
        );

        if (localCategory) {
          // Update existing local record
          db.runSync(
            'UPDATE expense_categories SET name = ?, color = ?, icon = ?, is_active = ?, sync_status = "synced", last_modified = ? WHERE server_id = ?',
            [
              serverCategory.name ?? '',
              serverCategory.color ?? '#007AFF',
              serverCategory.icon ?? '📝',
              serverCategory.is_active ? 1 : 0,
              serverCategory.updated_at ?? new Date().toISOString(),
              serverCategory.id,
            ]
          );
        } else {
          // Insert new record from server
          db.runSync(
            'INSERT INTO expense_categories (user_id, name, color, icon, is_default, is_active, server_id, sync_status, last_modified) VALUES (?, ?, ?, ?, ?, ?, ?, "synced", ?)',
            [
              serverCategory.user_id ?? 0,
              serverCategory.name ?? '',
              serverCategory.color ?? '#007AFF',
              serverCategory.icon ?? '📝',
              serverCategory.is_default ? 1 : 0,
              serverCategory.is_active ? 1 : 0,
              serverCategory.id,
              serverCategory.updated_at ?? new Date().toISOString(),
            ]
          );
        }
      }
    } catch (error) {
      console.error('Error syncing categories:', error);
    }
  }

  // USER PROFILE SYNC
  private async pushPendingUserUpdates() {
    const pendingUsers = db.getAllSync(
      'SELECT * FROM users WHERE sync_status = "modified"'
    ) as Array<{
      id: number;
      name?: string;
      email?: string;
      monthly_income?: number;
      currency?: string;
      profile_image?: string;
      sync_status: string;
    }>;

    for (const user of pendingUsers) {
      try {
         // Only send non-null values to avoid Oracle constraints
      const updateData: any = {};
      
      if (user.name) {
        updateData.name = user.name;
      }
      if (user.monthly_income !== null && user.monthly_income !== undefined) {
        updateData.monthly_income = user.monthly_income;
      }
      if (user.currency) {
        updateData.currency = user.currency;
      }
      if (user.profile_image) {
        updateData.profile_image = user.profile_image;
      }

        // Push update to backend
        await authApi.updateProfile({
          name: user.name,
          monthly_income: user.monthly_income,
          currency: user.currency,
          profile_image: user.profile_image,
        });
        
        // Mark as synced
        db.runSync(
          'UPDATE users SET sync_status = "synced", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [user.id]
        );

        console.log('User profile synced successfully:', user.id);
      } catch (error) {
        console.error('Sync error for user:', user.id, error);
      }
    }
  }

  private async pullUserUpdates() {
    try {
      // Get current user data from server
      const serverUser = await authApi.getCurrentUser();

      // Check if user exists locally
      const localUser = db.getFirstSync(
        'SELECT * FROM users WHERE id = ?',
        [serverUser.id]
      );

      if (localUser) {
        // Update local user
        db.runSync(
          'UPDATE users SET name = ?, monthly_income = ?, currency = ?, profile_image = ?, sync_status = "synced", updated_at = ? WHERE id = ?',
          [
            serverUser.name ?? '',
            serverUser.monthly_income ?? null,
            serverUser.currency ?? 'USD',
            serverUser.profile_image ?? null,
            serverUser.updated_at ?? new Date().toISOString(),
            serverUser.id,
          ]
        );
        console.log('User profile pulled from server successfully');
      } else {
        // INSERT user if not exists
        db.runSync(
          'INSERT INTO users (id, name, email, password, monthly_income, currency, profile_image, sync_status, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, "synced", ?)',
          [
            serverUser.id,
            serverUser.name ?? '',
            serverUser.email ?? '',
            'server_synced', // <-- Provide a default password
            serverUser.monthly_income ?? null,
            serverUser.currency ?? 'USD',
            serverUser.profile_image ?? null,
            serverUser.updated_at ?? new Date().toISOString(),
          ]
        );
        console.log('User profile inserted from server successfully');
      }
    } catch (error) {
      console.error('Error syncing user profile:', error);
    }
  }

  private async pushPendingChanges() {
    const pendingExpenses = db.getAllSync(
      'SELECT * FROM expenses WHERE sync_status IN ("pending", "modified")'
    ) as Array<{
      id: number;
      server_id?: number;
      title: string;
      amount: number;
      category_id: number;
      expense_date: string;
      description?: string;
      sync_status: string;
      last_modified: string;
    }>;

    for (const expense of pendingExpenses) {
      // Skip if category_id is invalid (0 or undefined)
      if (!expense.category_id || expense.category_id === 0) {
        console.warn('Skipping expense with invalid category_id:', expense.id, expense.category_id);
        continue;
      }
      try {
        if (expense.sync_status === 'pending') {
          // Create on backend
          const result = await expensesApi.create({
            title: expense.title,
            amount: expense.amount,
            category_id: expense.category_id,
            expense_date: expense.expense_date,
            description: expense.description,
          });
          db.runSync(
            'UPDATE expenses SET server_id = ?, sync_status = "synced", last_modified = ? WHERE id = ?',
            [result.id, new Date().toISOString(), expense.id]
          );
        } else if (expense.sync_status === 'modified' && expense.server_id) {
          // Update on backend
          await expensesApi.update(expense.server_id, {
            title: expense.title,
            amount: expense.amount,
            category_id: expense.category_id,
            expense_date: expense.expense_date,
            description: expense.description,
          });
          db.runSync(
            'UPDATE expenses SET sync_status = "synced", last_modified = ? WHERE id = ?',
            [new Date().toISOString(), expense.id]
          );
        }
      } catch (error) {
        console.error('Sync error for expense:', expense.id, error);
      }
    }
  }

  private async pullServerUpdates() {
    const lastSync = await syncStorage.getLastSync();
    const timestamp = lastSync ? new Date(lastSync).toISOString() : undefined;

    try {
      const serverExpenses = await expensesApi.list({
        modified_since: timestamp
      });

      for (const serverExpense of serverExpenses) {
        // ENSURE user_id is always provided
        if (!serverExpense.user_id) {
          console.warn('Skipping expense with no user_id:', serverExpense.id);
          continue;
        }

        const localExpense = db.getFirstSync(
          'SELECT * FROM expenses WHERE server_id = ?',
          [serverExpense.id]
        );

        if (localExpense) {
          // Update existing local record
          db.runSync(
            'UPDATE expenses SET title = ?, amount = ?, category_id = ?, expense_date = ?, description = ?, sync_status = "synced", last_modified = ? WHERE server_id = ?',
            [
              serverExpense.title ?? '',
              serverExpense.amount ?? 0,
              serverExpense.category_id ?? 0,
              serverExpense.expense_date ?? new Date().toISOString().split('T')[0],
              serverExpense.description ?? '',
              serverExpense.updated_at ?? new Date().toISOString(),
              serverExpense.id,
            ]
          );
        } else {
          // Insert new record from server - ALWAYS include user_id
          db.runSync(
            'INSERT INTO expenses (title, amount, category_id, expense_date, description, server_id, sync_status, last_modified, user_id) VALUES (?, ?, ?, ?, ?, ?, "synced", ?, ?)',
            [
              serverExpense.title ?? '',
              serverExpense.amount ?? 0,
              serverExpense.category_id ?? 0,
              serverExpense.expense_date ?? new Date().toISOString().split('T')[0],
              serverExpense.description ?? '',
              serverExpense.id,
              serverExpense.updated_at ?? new Date().toISOString(),
              serverExpense.user_id, // <-- CRITICAL: Always include user_id
            ]
          );
        }
      }
    } catch (error) {
      console.error('Error syncing expenses:', error);
    }
  }

  // SAVINGS GOALS SYNC
  private async pushPendingSavingsGoals() {
    const pendingGoals = db.getAllSync(
      'SELECT * FROM savings_goals WHERE sync_status IN ("pending", "modified")'
    ) as Array<{
      id: number;
      server_id?: number;
      title: string;
      description?: string;
      target_amount: number;
      target_date?: string;
      category: string;
      priority: number;
      sync_status: string;
      last_modified: string;
    }>;

    for (const goal of pendingGoals) {
      try {
        if (goal.sync_status === 'pending') {
          // Create on backend
          const result = await savingsGoalsApi.create({
            title: goal.title,
            description: goal.description,
            target_amount: goal.target_amount,
            target_date: goal.target_date,
            category: goal.category,
            priority: goal.priority,
          });
          
          db.runSync(
            'UPDATE savings_goals SET server_id = ?, sync_status = "synced", last_modified = ? WHERE id = ?',
            [result.id, new Date().toISOString(), goal.id]
          );
        } else if (goal.sync_status === 'modified' && goal.server_id) {
          // Update on backend
          await savingsGoalsApi.update(goal.server_id, {
            title: goal.title,
            description: goal.description,
            target_amount: goal.target_amount,
            target_date: goal.target_date,
            category: goal.category,
            priority: goal.priority,
          });
          
          db.runSync(
            'UPDATE savings_goals SET sync_status = "synced", last_modified = ? WHERE id = ?',
            [new Date().toISOString(), goal.id]
          );
        }
      } catch (error) {
        console.error('Sync error for savings goal:', goal.id, error);
      }
    }
  }

  private async pullSavingsGoalsUpdates() {
    const lastSync = await syncStorage.getLastSync();
    const timestamp = lastSync ? new Date(lastSync).toISOString() : undefined;

    try {
      const serverGoals = await savingsGoalsApi.list({});

      for (const serverGoal of serverGoals) {
        const localGoal = db.getFirstSync(
          'SELECT * FROM savings_goals WHERE server_id = ?',
          [serverGoal.id]
        );

        if (localGoal) {
          // Update existing local record
          db.runSync(
            'UPDATE savings_goals SET title = ?, description = ?, target_amount = ?, target_date = ?, category = ?, priority = ?, current_amount = ?, sync_status = "synced", last_modified = ? WHERE server_id = ?',
            [
              serverGoal.title ?? '',
              serverGoal.description ?? '',
              serverGoal.target_amount ?? 0,
              serverGoal.target_date ?? '',
              serverGoal.category ?? '',
              serverGoal.priority ?? 1,
              serverGoal.current_amount ?? 0,
              serverGoal.updated_at ? String(serverGoal.updated_at) : new Date().toISOString(),
              serverGoal.id ?? 0,
            ]
          );
        } else {
          // Insert new record from server
            db.runSync(
            'INSERT INTO savings_goals (title, description, target_amount, target_date, category, priority, current_amount, server_id, sync_status, last_modified, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, "synced", ?, ?)',
            [
              serverGoal.title ?? '',
              serverGoal.description ?? '',
              serverGoal.target_amount ?? 0,
              serverGoal.target_date ?? '',
              serverGoal.category ?? '',
              serverGoal.priority ?? 1,
              serverGoal.current_amount ?? 0,
              serverGoal.id ?? 0,
              serverGoal.updated_at ?? new Date().toISOString(),
              serverGoal.user_id ?? 0,
            ]
            );
        }
      }
    } catch (error) {
      console.error('Error syncing savings goals:', error);
    }
  }

  // SAVINGS TRANSACTIONS SYNC
  private async pushPendingSavingsTransactions() {
    const pendingTransactions = db.getAllSync(
      'SELECT * FROM savings_transactions WHERE sync_status IN ("pending", "modified")'
    ) as Array<{
      id: number;
      server_id?: number;
      goal_id: number;
      amount: number;
      transaction_type: string;
      description?: string;
      transaction_date: string;
      sync_status: string;
      last_modified: string;
    }>;

    for (const transaction of pendingTransactions) {
      try {
        // Get the server_id of the goal
        const localGoal = db.getFirstSync(
          'SELECT server_id FROM savings_goals WHERE id = ?',
          [transaction.goal_id]
        ) as { server_id?: number };

        if (!localGoal?.server_id) {
          console.warn('Skipping transaction - goal not synced yet:', transaction.id);
          continue;
        }

        if (transaction.sync_status === 'pending') {
          // Create on backend
          const result = await savingsTransactionsApi.create({
            goal_id: localGoal.server_id,
            amount: transaction.amount,
            transaction_type: transaction.transaction_type as 'deposit' | 'withdrawal',
            description: transaction.description,
            transaction_date: transaction.transaction_date,
          });
          
          db.runSync(
            'UPDATE savings_transactions SET server_id = ?, sync_status = "synced", last_modified = ? WHERE id = ?',
            [result.id, new Date().toISOString(), transaction.id]
          );
        }
      } catch (error) {
        console.error('Sync error for savings transaction:', transaction.id, error);
      }
    }
  }

  private async pullSavingsTransactionsUpdates() {
    const lastSync = await syncStorage.getLastSync();
    const timestamp = lastSync ? new Date(lastSync).toISOString() : undefined;

    try {
      const serverTransactions = await savingsTransactionsApi.list();

      for (const serverTransaction of serverTransactions) {
        const localTransaction = db.getFirstSync(
          'SELECT * FROM savings_transactions WHERE server_id = ?',
          [serverTransaction.id]
        );

        if (!localTransaction) {
          // Find local goal by server_id
          const localGoal = db.getFirstSync(
            'SELECT id FROM savings_goals WHERE server_id = ?',
            [serverTransaction.goal_id]
          ) as { id: number };

          if (localGoal) {
            // Insert new transaction from server
            db.runSync(
              'INSERT INTO savings_transactions (goal_id, amount, transaction_type, description, transaction_date, server_id, sync_status, last_modified, user_id) VALUES (?, ?, ?, ?, ?, ?, "synced", ?, ?)',
              [
                localGoal.id,
                serverTransaction.amount,
                serverTransaction.transaction_type,
                serverTransaction.description ?? '',
                serverTransaction.transaction_date,
                serverTransaction.id,
                serverTransaction.updated_at || new Date().toISOString(),
                serverTransaction.user_id,
              ]
            );
          }
        }
      }
    } catch (error) {
      console.error('Error syncing savings transactions:', error);
    }
  }

  // BUDGETS SYNC
  private async pullBudgetUpdates() {
    try {
      const serverBudgets = await budgetsApi.list();

      for (const serverBudget of serverBudgets) {
        // ENSURE user_id is always provided
        if (!serverBudget.user_id) {
          console.warn('Skipping budget with no user_id:', serverBudget.id);
          continue;
        }

        const localBudget = db.getFirstSync(
          'SELECT * FROM budgets WHERE server_id = ?',
          [serverBudget.id]
        );

        if (!localBudget) {
          // Insert new budget from server - ALWAYS include user_id
          db.runSync(
            'INSERT INTO budgets (user_id, category_id, amount, period, title, start_date, end_date, server_id, sync_status, last_modified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, "synced", ?)',
            [
              serverBudget.user_id, // <-- CRITICAL: Always include user_id
              serverBudget.category_id ?? 0,
              serverBudget.amount ?? 0,
              serverBudget.period ?? 'monthly',
              serverBudget.title ?? '',
              serverBudget.start_date ?? new Date().toISOString().split('T')[0],
              serverBudget.end_date ?? new Date().toISOString().split('T')[0],
              serverBudget.id,
              serverBudget.updated_at ?? new Date().toISOString(),
            ]
          );
        }
      }
    } catch (error) {
      console.error('Error syncing budgets:', error);
    }
  }
}

export const syncService = new SyncService();