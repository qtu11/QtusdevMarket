-- Create database
CREATE DATABASE IF NOT EXISTS qtusdevmarket;
USE qtusdevmarket;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    name VARCHAR(100),
    balance DECIMAL(15,2) DEFAULT 0,
    avatar VARCHAR(255),
    provider VARCHAR(50),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP,
    login_count INT DEFAULT 0,
    ip_address VARCHAR(45),
    password VARCHAR(255),
    device_info JSON
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(100),
    image_url VARCHAR(500),
    download_url VARCHAR(500),
    demo_url VARCHAR(500),
    tags TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INT,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Deposits table
CREATE TABLE IF NOT EXISTS deposits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    userEmail VARCHAR(255),
    userName VARCHAR(255),
    amount DECIMAL(15,2) NOT NULL,
    method VARCHAR(100),
    transaction_id VARCHAR(255),
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_time TIMESTAMP,
    approved_by VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Withdrawals table
CREATE TABLE IF NOT EXISTS withdrawals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    userEmail VARCHAR(255),
    userName VARCHAR(255),
    amount DECIMAL(15,2) NOT NULL,
    bank_name VARCHAR(100),
    account_number VARCHAR(50),
    account_name VARCHAR(100),
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_time TIMESTAMP,
    approved_by VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Purchases table
CREATE TABLE IF NOT EXISTS purchases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT,
    user_email VARCHAR(100),
    user_name VARCHAR(100),
    admin_email VARCHAR(100),
    admin_name VARCHAR(100),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    device VARCHAR(100),
    ip VARCHAR(45),
    read_status BOOLEAN DEFAULT FALSE
);

-- Insert default admin user
INSERT INTO users (id, email, username, name, status, created_at)
VALUES (1, 'admin@gmail.com', 'admin', 'Admin', 'active', NOW())
ON DUPLICATE KEY UPDATE email = email;
