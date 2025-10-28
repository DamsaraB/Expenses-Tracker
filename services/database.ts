import * as Crypto from 'expo-crypto';
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('expenseTracker_v5.db');

// Add this function to drop and recreate database
export const resetDatabase = () => {
  try {
    
    // Drop all tables
    db.execSync('DROP TABLE IF EXISTS savings_transactions;');
    db.execSync('DROP TABLE IF EXISTS savings_goals;');
    db.execSync('DROP TABLE IF EXISTS income;');
    db.execSync('DROP TABLE IF EXISTS budgets;');
    db.execSync('DROP TABLE IF EXISTS expenses;');
    db.execSync('DROP TABLE IF EXISTS expense_categories;');
    db.execSync('DROP TABLE IF EXISTS users;');
    
    
    
    // Recreate with new schema
    initDatabase();
    
    
  } catch (error) {
    throw error;
  }
};

// Initialize database with comprehensive structure
export const initDatabase = () => {
  try {
    
    // Users table with all required columns
    db.execSync(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        profile_image TEXT,
        monthly_income REAL DEFAULT 0,
        currency TEXT DEFAULT 'INR',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        sync_status TEXT DEFAULT 'pending',         
        server_id INTEGER,                          
        last_modified DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Expense Categories table
    db.execSync(`
      CREATE TABLE IF NOT EXISTS expense_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        color TEXT NOT NULL DEFAULT '#007AFF',
        icon TEXT NOT NULL DEFAULT '📝',
        is_default BOOLEAN DEFAULT 0,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        sync_status TEXT DEFAULT 'pending',         
        server_id INTEGER,                          
        last_modified DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        UNIQUE(user_id, name)
      );
    `);

    // Expenses table
    db.execSync(`
      CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        category_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        amount REAL NOT NULL CHECK(amount > 0),
        description TEXT,
        expense_date DATE NOT NULL,
        payment_method TEXT DEFAULT 'cash',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        sync_status TEXT DEFAULT 'pending',         
        server_id INTEGER,                          
        last_modified DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES expense_categories (id)
      );
    `);

    // Budgets table
    db.execSync(`
      CREATE TABLE IF NOT EXISTS budgets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        category_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        amount REAL NOT NULL CHECK(amount > 0),
        period TEXT NOT NULL DEFAULT 'monthly',
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        alert_threshold REAL DEFAULT 0.8,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        sync_status TEXT DEFAULT 'pending',         
        server_id INTEGER,                          
        last_modified DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES expense_categories (id),
        UNIQUE(user_id, category_id, start_date, end_date)
      );
    `);

    // Savings Goals table
    db.execSync(`
      CREATE TABLE IF NOT EXISTS savings_goals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        target_amount REAL NOT NULL CHECK(target_amount > 0),
        current_amount REAL DEFAULT 0 CHECK(current_amount >= 0),
        target_date DATE,
        category TEXT NOT NULL,
        priority INTEGER DEFAULT 1,
        is_achieved BOOLEAN DEFAULT 0,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        sync_status TEXT DEFAULT 'pending',         
        server_id INTEGER,                          
        last_modified DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      );
    `);

    // Savings Transactions table
    db.execSync(`
      CREATE TABLE IF NOT EXISTS savings_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        goal_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        transaction_type TEXT NOT NULL CHECK(transaction_type IN ('deposit', 'withdrawal')),
        description TEXT,
        transaction_date DATE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        sync_status TEXT DEFAULT 'pending',         
        server_id INTEGER,                          
        last_modified DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (goal_id) REFERENCES savings_goals (id) ON DELETE CASCADE
      );
    `);

    // Income table
    db.execSync(`
      CREATE TABLE IF NOT EXISTS income (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        amount REAL NOT NULL CHECK(amount > 0),
        source TEXT NOT NULL,
        description TEXT,
        income_date DATE NOT NULL,
        is_recurring BOOLEAN DEFAULT 0,
        recurring_frequency TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        sync_status TEXT DEFAULT 'pending',         
        server_id INTEGER,                          
        last_modified DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      );
    `);

    // Create indexes for better performance
    db.execSync(`CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses (user_id, expense_date DESC);`);
    db.execSync(`CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses (category_id);`);
    db.execSync(`CREATE INDEX IF NOT EXISTS idx_budgets_user_active ON budgets (user_id, is_active);`);
    db.execSync(`CREATE INDEX IF NOT EXISTS idx_savings_goals_user ON savings_goals (user_id, is_active);`);

    
  } catch (error) {
    throw error;
  }
};

// Hash password function
const hashPassword = async (password: string): Promise<string> => {
  try {
    const hashed = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      password
    );
    return hashed;
  } catch (error) {
    throw error;
  }
};

// Insert default expense categories
const insertDefaultCategories = async (userId: number) => {
  try {
    
    const defaultCategories = [
      { name: 'Food & Dining', color: '#FF6B6B', icon: '🍽️' },
      { name: 'Transportation', color: '#4ECDC4', icon: '🚗' },
      { name: 'Shopping', color: '#45B7D1', icon: '🛍️' },
      { name: 'Entertainment', color: '#96CEB4', icon: '🎬' },
      { name: 'Bills & Utilities', color: '#FFEAA7', icon: '⚡' },
      { name: 'Healthcare', color: '#DDA0DD', icon: '🏥' },
      { name: 'Education', color: '#98D8C8', icon: '📚' },
      { name: 'Travel', color: '#F7DC6F', icon: '✈️' },
      { name: 'Groceries', color: '#74B9FF', icon: '🛒' },
      { name: 'Rent', color: '#FD79A8', icon: '🏠' },
    ];

    for (const category of defaultCategories) {
      db.runSync(
        'INSERT INTO expense_categories (user_id, name, color, icon, is_default) VALUES (?, ?, ?, ?, 1)',
        [userId, category.name, category.color, category.icon]
      );
    }
    
    
  } catch (error) {
    throw error;
  }
};

// Debug function to check if user exists
export const checkUserExists = (email: string) => {
  try {
    const result = db.getFirstSync(
      'SELECT id, name, email FROM users WHERE email = ?',
      [email.toLowerCase()]
    ) as any;
    return result;
  } catch (error) {
    return null;
  }
};

// Debug function to list all users
export const getAllUsers = () => {
  try {
    const result = db.getAllSync('SELECT id, name, email FROM users') as any[];
    return result;
  } catch (error) {
    return [];
  }
};

// Register user and create default categories
export const registerUser = async (name: string, email: string, password: string) => {
  try {
    
    const hashedPassword = await hashPassword(password);
    
    // Start transaction
    db.execSync('BEGIN TRANSACTION;');
    
    // Insert user
    const userResult = db.runSync(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email.toLowerCase(), hashedPassword]
    );
    
    const userId = userResult.lastInsertRowId as number;
    
    // Insert default categories for the user
    await insertDefaultCategories(userId);
    
    db.execSync('COMMIT;');
    
    return { success: true, userId };
  } catch (error: any) {
    db.execSync('ROLLBACK;');
    
    if (error.message.includes('UNIQUE constraint failed')) {
      return { success: false, error: 'Email already exists' };
    }
    return { success: false, error: `Registration failed: ${error.message}` };
  }
};

// Login user function with enhanced debugging
export const loginUser = async (email: string, password: string) => {
  try {
    
    // First check if user exists
    const userExists = checkUserExists(email);
    if (!userExists) {
      return { success: false, error: 'User not found. Please check your email or sign up.' };
    }
    
    const hashedPassword = await hashPassword(password);
    
    const result = db.getFirstSync(
      'SELECT id, name, email, monthly_income, currency FROM users WHERE email = ? AND password = ?',
      [email.toLowerCase(), hashedPassword]
    ) as any;
    
    if (result) {
      return { success: true, user: result };
    } else {
      return { success: false, error: 'Invalid password. Please try again.' };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: `Login failed: ${message || 'Unknown error'}` };
  }
};

// Get user by ID (basic info)
export const getUserBasicInfoById = async (userId: number) => {
  try {
    
    const result = db.getFirstSync(
      'SELECT id, name, email, monthly_income, currency FROM users WHERE id = ?',
      [userId]
    ) as any;
    return result || null;
  } catch (error) {
    return null;
  }
};

// Update user's monthly income
export const updateUserMonthlyIncome = async (userId: number, monthlyIncome: number) => {
  try {
    db.runSync(
      'UPDATE users SET monthly_income = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [monthlyIncome, userId]
    );
    const updated = db.getFirstSync(
      'SELECT id, name, email, monthly_income, currency FROM users WHERE id = ?',
      [userId]
    ) as any;
    return { success: true, user: updated };
  } catch (error) {
    return { success: false, error: 'Failed to update monthly income' };
  }
};

// Update user profile locally with sync status
export const updateUserProfile = (userId: number, updateData: {
  name?: string;
  monthly_income?: number;
  currency?: string;
  profile_image?: string;
}) => {
  try {
    const setClause = [];
    const params = [];
    
    if (updateData.name !== undefined) {
      setClause.push('name = ?');
      params.push(updateData.name);
    }
    if (updateData.monthly_income !== undefined) {
      setClause.push('monthly_income = ?');
      params.push(updateData.monthly_income);
    }
    if (updateData.currency !== undefined) {
      setClause.push('currency = ?');
      params.push(updateData.currency);
    }
    if (updateData.profile_image !== undefined) {
      setClause.push('profile_image = ?');
      params.push(updateData.profile_image);
    }
    
    // Add sync status and timestamp
    setClause.push('sync_status = ?', 'updated_at = CURRENT_TIMESTAMP');
    params.push('modified');
    params.push(userId);

    const query = `UPDATE users SET ${setClause.join(', ')} WHERE id = ?`;
    
    db.runSync(query, params);
    
    // Get updated user
    const updatedUser = db.getFirstSync(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );
    
    return { success: true, user: updatedUser };
  } catch (error) {
    return { success: false, error: 'Failed to update profile' };
  }
};

// Get user by ID (for sync)
export const getUserById = (userId: number) => {
  try {
    return db.getFirstSync('SELECT * FROM users WHERE id = ?', [userId]);
  } catch (error) {
    return null;
  }
};

export { db };

