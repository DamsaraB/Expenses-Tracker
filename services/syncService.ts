import { expensesApi } from './api/api';
import { syncStorage } from './api/storage';
import { db } from './database';

export class SyncService {
  private issyncing = false;

  async syncData() {
    if (this.issyncing) return;
    this.issyncing = true;

    try {
      // 1. Push local changes to server
      await this.pushPendingChanges();
      
      // 2. Pull server updates
      await this.pullServerUpdates();
      
      // 3. Update last sync timestamp
      await syncStorage.saveLastSync(Date.now());
      
    } finally {
      this.issyncing = false;
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

    // Get updated data from server
    const serverExpenses = await expensesApi.list({ 
      modified_since: timestamp 
    });

    for (const serverExpense of serverExpenses) {
      const localExpense = db.getFirstSync(
        'SELECT * FROM expenses WHERE server_id = ?',
        [serverExpense.id]
      );

      if (localExpense) {
        // Update existing local record
        db.runSync(
          'UPDATE expenses SET title = ?, amount = ?, category_id = ?, expense_date = ?, description = ?, sync_status = "synced", last_modified = ? WHERE server_id = ?',
          [
            serverExpense.title,
            serverExpense.amount,
            serverExpense.category_id,
            serverExpense.expense_date,
            serverExpense.description ?? '',
            serverExpense.last_modified,
            serverExpense.id,
          ]
        );
      } else {
        // Insert new record from server
        db.runSync(
          'INSERT INTO expenses (title, amount, category_id, expense_date, description, server_id, sync_status, last_modified) VALUES (?, ?, ?, ?, ?, ?, "synced", ?)',
          [
            serverExpense.title,
            serverExpense.amount,
            serverExpense.category_id,
            serverExpense.expense_date,
            serverExpense.description ?? '',
            serverExpense.id,
            serverExpense.last_modified,
          ]
        );
      }
    }
  }
}

export const syncService = new SyncService();