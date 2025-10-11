import * as Crypto from 'expo-crypto';
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('expenseTracker_v5.db');

let __dbInitialized = false;

const ensureDatabaseInitialized = () => {
  if (__dbInitialized) return;
  try {
    initDatabase();
    __dbInitialized = true;
  } catch (e) {
    console.error('Failed to initialize database on module load:', e);
  }
};

export const resetDatabase = () => {
  try {
    console.log('Resetting database...');
    
    // Drop all tables
    db.execSync('DROP TABLE IF EXISTS savings_transactions;');
    db.execSync('DROP TABLE IF EXISTS savings_goals;');
    db.execSync('DROP TABLE IF EXISTS income;');
    db.execSync('DROP TABLE IF EXISTS budgets;');
    db.execSync('DROP TABLE IF EXISTS expenses;');
    db.execSync('DROP TABLE IF EXISTS expense_categories;');
    db.execSync('DROP TABLE IF EXISTS users;');
    
    console.log('All tables dropped, reinitializing...');
    
    // Recreate with new schema
    initDatabase();
    
    console.log('Database reset successfully');
  } catch (error) {
    console.error('Database reset error:', error);
    throw error;
  }
};

// Initialize database with comprehensive structure
export const initDatabase = () => {
  try {
    console.log('Initializing database...');
    
    // Users table with all required columns
    db.execSync(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        profile_image TEXT,
        phone TEXT,
        monthly_income REAL DEFAULT 0,
        currency TEXT DEFAULT 'INR',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        sync_status TEXT DEFAULT 'pending',         
        server_id INTEGER,                          
        last_modified DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Backfill/migrate: add phone column if not present on existing DBs
    try {
      const cols = db.getAllSync("PRAGMA table_info('users')") as any[];
      const hasPhone = cols?.some((c) => c?.name === 'phone');
      if (!hasPhone) {
        db.execSync('ALTER TABLE users ADD COLUMN phone TEXT;');
      }
    } catch (e) {
      // ignore if fails; column may already exist
    }

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

    console.log('Database initialized successfully with comprehensive structure');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

// Initialize immediately on module import to avoid race conditions
ensureDatabaseInitialized();

// Hash password function
const hashPassword = async (password: string): Promise<string> => {
  try {
    const hashed = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      password
    );
    console.log('Password hashed successfully');
    return hashed;
  } catch (error) {
    console.error('Password hashing error:', error);
    throw error;
  }
};

// Insert default expense categories
const insertDefaultCategories = async (userId: number) => {
  try {
    console.log('Inserting default categories for user:', userId);
    
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
    
    console.log('Default categories inserted successfully');
  } catch (error) {
    console.error('Error inserting default categories:', error);
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
    
    console.log('User check result for', email, ':', result);
    return result;
  } catch (error) {
    console.error('Error checking user exists:', error);
    return null;
  }
};

// Debug function to list all users
export const getAllUsers = () => {
  try {
    const result = db.getAllSync('SELECT id, name, email FROM users') as any[];
    console.log('All users in database:', result);
    return result;
  } catch (error) {
    console.error('Error getting all users:', error);
    return [];
  }
};

// Register user and create default categories
export const registerUser = async (name: string, email: string, password: string) => {
  try {
    console.log('Registering user:', { name, email });
    
    const hashedPassword = await hashPassword(password);
    console.log('Password hashed, starting transaction...');
    
    // Start transaction
    db.execSync('BEGIN TRANSACTION;');
    
    // Insert user
    const userResult = db.runSync(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email.toLowerCase(), hashedPassword]
    );
    
    const userId = userResult.lastInsertRowId as number;
    console.log('User inserted with ID:', userId);
    
    // Insert default categories for the user
    await insertDefaultCategories(userId);
    
    db.execSync('COMMIT;');
    console.log('User registration completed successfully');
    
    return { success: true, userId };
  } catch (error: any) {
    console.error('Registration error:', error);
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
    console.log('Login attempt for:', email);
    
    // First check if user exists
    const userExists = checkUserExists(email);
    if (!userExists) {
      console.log('User does not exist in database');
      return { success: false, error: 'User not found. Please check your email or sign up.' };
    }
    
    console.log('User exists, hashing password...');
    const hashedPassword = await hashPassword(password);
    console.log('Password hashed, querying database...');
    
    const result = db.getFirstSync(
      'SELECT id, name, email, phone, profile_image, monthly_income, currency FROM users WHERE email = ? AND password = ?',
      [email.toLowerCase(), hashedPassword]
    ) as any;
    
    console.log('Database query result:', result);
    
    if (result) {
      console.log('Login successful for user:', result.name);
      return { success: true, user: result };
    } else {
      console.log('Password mismatch or user not found');
      return { success: false, error: 'Invalid password. Please try again.' };
    }
  } catch (error) {
    console.error('Login error details:', error);
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: `Login failed: ${message || 'Unknown error'}` };
  }
};

// Get user by ID
export const getUserById = async (userId: number) => {
  try {
    console.log('Getting user by ID:', userId);
    
    const result = db.getFirstSync(
      'SELECT id, name, email, phone, profile_image, monthly_income, currency FROM users WHERE id = ?',
      [userId]
    ) as any;
    
    console.log('User found:', result);
    return result || null;
  } catch (error) {
    console.error('Get user error:', error);
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
    console.error('Update monthly income error:', error);
    return { success: false, error: 'Failed to update monthly income' };
  }
};

// Update user's name, email, and optional phone
export const updateUserProfile = async (userId: number, name: string, email: string, phone?: string) => {
  try {
    db.runSync(
      'UPDATE users SET name = ?, email = ?, phone = COALESCE(?, phone), updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, email.toLowerCase(), phone ?? null, userId]
    );
    const updated = db.getFirstSync(
      'SELECT id, name, email, phone, profile_image, monthly_income, currency FROM users WHERE id = ?',
      [userId]
    ) as any;
    return { success: true, user: updated };
  } catch (error) {
    console.error('Update user profile error:', error);
    return { success: false, error: 'Failed to update profile' };
  }
};

// Update user's profile image URI
export const updateUserProfileImage = async (userId: number, imageUri: string) => {
  try {
    db.runSync(
      'UPDATE users SET profile_image = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [imageUri, userId]
    );
    const updated = db.getFirstSync(
      'SELECT id, name, email, monthly_income, currency, profile_image FROM users WHERE id = ?',
      [userId]
    ) as any;
    return { success: true, user: updated };
  } catch (error) {
    console.error('Update profile image error:', error);
    return { success: false, error: 'Failed to update profile image' };
  }
};

// Get total expenses for a given month (YYYY-MM)
export const getMonthlyExpensesTotal = (userId: number, yearMonth: string) => {
  try {
    const result = db.getFirstSync(
      `SELECT IFNULL(SUM(amount), 0) AS total
       FROM expenses
       WHERE user_id = ? AND date LIKE ?`,
      [userId, `${yearMonth}%`]
    ) as { total: number } | undefined;
    return result?.total || 0;
  } catch (error) {
    console.error('Get monthly expenses total error:', error);
    return 0;
  }
};

// Compute remaining salary for a given month using user's monthly_income
export const getMonthlyRemainingSalary = (userId: number, yearMonth: string) => {
  try {
    const user = db.getFirstSync(
      'SELECT monthly_income FROM users WHERE id = ?',
      [userId]
    ) as { monthly_income: number } | undefined;
    const income = user?.monthly_income || 0;
    const spent = getMonthlyExpensesTotal(userId, yearMonth);
    return income - spent;
  } catch (error) {
    console.error('Get monthly remaining salary error:', error);
    return 0;
  }
};

export { db };

