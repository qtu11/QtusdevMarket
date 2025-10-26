import mysql from 'mysql2/promise';

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'qtusdevmarket',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// User operations
export async function createUser(username: string, email: string, passwordHash: string) {
  try {
    const [result] = await pool.execute(
      'INSERT INTO users (email, password_hash, username) VALUES (?, ?, ?)',
      [email, passwordHash, username]
    );
    return { id: Number((result as any).insertId), username, email, balance: 0, created_at: new Date() };
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

export async function getUserByEmail(email: string) {
  try {
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    const users = rows as any[];
    return users.length > 0 ? users[0] : null;
  } catch (error) {
    console.error('Error getting user by email:', error);
    return null;
  }
}

export async function getUserById(id: number) {
  try {
    const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
    const users = rows as any[];
    return users.length > 0 ? users[0] : null;
  } catch (error) {
    console.error('Error getting user by id:', error);
    return null;
  }
}

export async function updateUserBalance(userId: number, newBalance: number) {
  try {
    await pool.execute(
      'UPDATE users SET balance = ?, updated_at = NOW() WHERE id = ?',
      [newBalance, userId]
    );
    return { success: true };
  } catch (error) {
    console.error('Error updating user balance:', error);
    return { success: false };
  }
}

// Product operations
export async function getProducts(limit = 20, offset = 0) {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM products WHERE is_active = true LIMIT ? OFFSET ?',
      [limit, offset]
    );
    return rows as any[];
  } catch (error) {
    console.error('Error getting products:', error);
    return [];
  }
}

export async function getProductById(id: number) {
  try {
    const [rows] = await pool.execute('SELECT * FROM products WHERE id = ?', [id]);
    const products = rows as any[];
    return products.length > 0 ? products[0] : null;
  } catch (error) {
    console.error('Error getting product by id:', error);
    return null;
  }
}

export async function createProduct(
  title: string,
  description: string,
  price: number,
  category: string,
  demoUrl?: string,
  downloadUrl?: string,
  tags?: string[],
  imageUrl?: string
) {
  try {
    const [result] = await pool.execute(
      `INSERT INTO products (title, description, price, category, demo_url, download_url, tags, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description, price, category, demoUrl, downloadUrl, JSON.stringify(tags), imageUrl]
    );
    return { 
      id: Number((result as any).insertId), 
      title, description, price, category, 
      demo_url: demoUrl, download_url: downloadUrl, tags, image_url: imageUrl 
    };
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
}

// Deposit operations
export async function getDeposits(userId?: number) {
  try {
    if (userId) {
      const [rows] = await pool.execute(
        'SELECT * FROM deposits WHERE user_id = ? ORDER BY timestamp DESC',
        [userId]
      );
      return rows as any[];
    } else {
      const [rows] = await pool.execute('SELECT * FROM deposits ORDER BY timestamp DESC');
      return rows as any[];
    }
  } catch (error) {
    console.error('Error getting deposits:', error);
    return [];
  }
}

export async function createDeposit(depositData: any) {
  try {
    const [result] = await pool.execute(
      `INSERT INTO deposits (user_id, amount, method, transaction_id, status, timestamp)
       VALUES (?, ?, ?, ?, 'pending', NOW())`,
      [depositData.userId, depositData.amount, depositData.method, depositData.transactionId]
    );
    return { id: Number((result as any).insertId) };
  } catch (error) {
    console.error('Error creating deposit:', error);
    throw error;
  }
}

export async function updateDepositStatus(depositId: number, status: string, approvedBy?: string) {
  try {
    await pool.execute(
      'UPDATE deposits SET status = ?, approved_time = NOW(), approved_by = ? WHERE id = ?',
      [status, approvedBy || null, depositId]
    );
    return { success: true };
  } catch (error) {
    console.error('Error updating deposit status:', error);
    return { success: false };
  }
}

// Withdrawal operations
export async function getWithdrawals(userId?: number) {
  try {
    if (userId) {
      const [rows] = await pool.execute(
        'SELECT * FROM withdrawals WHERE user_id = ? ORDER BY created_at DESC',
        [userId]
      );
      return rows as any[];
    } else {
      const [rows] = await pool.execute('SELECT * FROM withdrawals ORDER BY created_at DESC');
      return rows as any[];
    }
  } catch (error) {
    console.error('Error getting withdrawals:', error);
    return [];
  }
}

export async function createWithdrawal(withdrawalData: any) {
  try {
    const [result] = await pool.execute(
      `INSERT INTO withdrawals (user_id, amount, bank_name, account_number, account_name, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [withdrawalData.userId, withdrawalData.amount, withdrawalData.bankName, 
       withdrawalData.accountNumber, withdrawalData.accountName]
    );
    return { id: Number((result as any).insertId) };
  } catch (error) {
    console.error('Error creating withdrawal:', error);
    throw error;
  }
}

export async function updateWithdrawalStatus(withdrawalId: number, status: string, approvedBy?: string) {
  try {
    await pool.execute(
      'UPDATE withdrawals SET status = ?, approved_time = NOW(), approved_by = ? WHERE id = ?',
      [status, approvedBy || null, withdrawalId]
    );
    return { success: true };
  } catch (error) {
    console.error('Error updating withdrawal status:', error);
    return { success: false };
  }
}

// Purchase operations
export async function getPurchases(userId?: number) {
  try {
    if (userId) {
      const [rows] = await pool.execute(
        'SELECT * FROM purchases WHERE user_id = ? ORDER BY created_at DESC',
        [userId]
      );
      return rows as any[];
    } else {
      const [rows] = await pool.execute('SELECT * FROM purchases ORDER BY created_at DESC');
      return rows as any[];
    }
  } catch (error) {
    console.error('Error getting purchases:', error);
    return [];
  }
}

export async function createPurchase(purchaseData: any) {
  try {
    const [result] = await pool.execute(
      'INSERT INTO purchases (user_id, product_id, amount) VALUES (?, ?, ?)',
      [purchaseData.userId, purchaseData.productId, purchaseData.amount]
    );
    return { id: Number((result as any).insertId) };
  } catch (error) {
    console.error('Error creating purchase:', error);
    throw error;
  }
}

// Admin operations
export async function getAllUsers() {
  try {
    const [rows] = await pool.execute('SELECT * FROM users ORDER BY created_at DESC');
    return rows as any[];
  } catch (error) {
    console.error('Error getting all users:', error);
    return [];
  }
}

export async function deleteUser(userId: number) {
  try {
    await pool.execute('DELETE FROM users WHERE id = ?', [userId]);
    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { success: false };
  }
}

export async function updateProduct(
  id: number,
  title?: string,
  description?: string,
  price?: number,
  category?: string,
  demoUrl?: string,
  downloadUrl?: string,
  tags?: string[],
  imageUrl?: string,
  isActive?: boolean
) {
  try {
    const updates: string[] = [];
    const values: any[] = [];
    
    if (title) { updates.push('title = ?'); values.push(title); }
    if (description) { updates.push('description = ?'); values.push(description); }
    if (price !== undefined) { updates.push('price = ?'); values.push(price); }
    if (category) { updates.push('category = ?'); values.push(category); }
    if (demoUrl) { updates.push('demo_url = ?'); values.push(demoUrl); }
    if (downloadUrl) { updates.push('download_url = ?'); values.push(downloadUrl); }
    if (tags) { updates.push('tags = ?'); values.push(JSON.stringify(tags)); }
    if (imageUrl) { updates.push('image_url = ?'); values.push(imageUrl); }
    if (isActive !== undefined) { updates.push('is_active = ?'); values.push(isActive); }
    
    updates.push('updated_at = NOW()');
    values.push(id);
    
    await pool.execute(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`, values);
    return { success: true };
  } catch (error) {
    console.error('Error updating product:', error);
    return { success: false };
  }
}

export async function deleteProduct(id: number) {
  try {
    await pool.execute('DELETE FROM products WHERE id = ?', [id]);
    return { success: true };
  } catch (error) {
    console.error('Error deleting product:', error);
    return { success: false };
  }
}

// User activity tracking
export async function updateUserActivity(userId: number, activityData: {
  ipAddress?: string;
  deviceInfo?: string;
  lastLogin?: Date;
}) {
  try {
    const updates: string[] = [];
    const values: any[] = [];
    
    if (activityData.ipAddress) { 
      updates.push('ip_address = ?'); 
      values.push(activityData.ipAddress); 
    }
    if (activityData.deviceInfo) { 
      updates.push('ip_address = ?'); // Store device info in ip_address temporarily
      values.push(activityData.deviceInfo); 
    }
    if (activityData.lastLogin) { 
      updates.push('last_activity = ?'); 
      values.push(activityData.lastLogin); 
    }
    
    if (updates.length > 0) {
      updates.push('updated_at = NOW()');
      values.push(userId);
      await pool.execute(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error updating user activity:', error);
    return { success: false };
  }
}

export async function updateUserLoginInfo(userId: number, ipAddress: string, deviceInfo: any) {
  try {
    await pool.execute(
      `UPDATE users 
       SET ip_address = ?, 
           last_activity = NOW(), 
           login_count = COALESCE(login_count, 0) + 1,
           updated_at = NOW()
       WHERE id = ?`,
      [ipAddress, userId]
    );
    
    // Also store device info somewhere (maybe in user_profiles or as JSON in ip_address)
    const deviceInfoJson = JSON.stringify(deviceInfo);
    await pool.execute(
      'UPDATE users SET ip_address = JSON_OBJECT("ip", ?, "device", ?) WHERE id = ?',
      [ipAddress, deviceInfoJson, userId]
    );
    
    return { success: true };
  } catch (error) {
    console.error('Error updating user login info:', error);
    // Fallback to simpler update
    try {
      await pool.execute(
        'UPDATE users SET last_activity = NOW(), updated_at = NOW() WHERE id = ?',
        [userId]
      );
    } catch (e) {
      console.error('Fallback update also failed:', e);
    }
    return { success: false };
  }
}