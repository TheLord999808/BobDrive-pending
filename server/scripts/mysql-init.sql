-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS filemanager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Use the file manager database
USE filemanager;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) NOT NULL,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  displayName VARCHAR(100) NOT NULL,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY (username),
  UNIQUE KEY (email)
);

-- Create folders table
CREATE TABLE IF NOT EXISTS folders (
  id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  ownerId VARCHAR(36) NOT NULL,
  parentFolderId VARCHAR(36),
  isPublic BOOLEAN DEFAULT FALSE,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (ownerId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parentFolderId) REFERENCES folders(id) ON DELETE CASCADE
);

-- Create files table
CREATE TABLE IF NOT EXISTS files (
  id VARCHAR(36) NOT NULL,
  fileName VARCHAR(255) NOT NULL,
  originalName VARCHAR(255) NOT NULL,
  mimeType VARCHAR(100) NOT NULL,
  size BIGINT NOT NULL,
  path VARCHAR(512) NOT NULL,
  isPublic BOOLEAN DEFAULT FALSE,
  ownerId VARCHAR(36) NOT NULL,
  parentFolderId VARCHAR(36),
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (ownerId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parentFolderId) REFERENCES folders(id) ON DELETE SET NULL
);

-- Insert a default admin user
INSERT INTO users (id, username, email, displayName, isActive, createdAt, updatedAt)
VALUES (
  UUID(),
  'admin',
  'admin@example.com',
  'Administrator',
  TRUE,
  NOW(),
  NOW()
) ON DUPLICATE KEY UPDATE updatedAt = NOW();

-- Get the admin user ID
SET @adminId = (SELECT id FROM users WHERE username = 'admin');

-- Insert default folders
INSERT INTO folders (id, name, ownerId, parentFolderId, isPublic, createdAt, updatedAt)
VALUES 
  (UUID(), 'Documents', @adminId, NULL, FALSE, NOW(), NOW()),
  (UUID(), 'Images', @adminId, NULL, TRUE, NOW(), NOW())
ON DUPLICATE KEY UPDATE updatedAt = NOW();

-- Get the Documents folder ID
SET @docsId = (SELECT id FROM folders WHERE name = 'Documents' AND ownerId = @adminId);

-- Insert Work subfolder under Documents
INSERT INTO folders (id, name, ownerId, parentFolderId, isPublic, createdAt, updatedAt)
VALUES (UUID(), 'Work', @adminId, @docsId, FALSE, NOW(), NOW())
ON DUPLICATE KEY UPDATE updatedAt = NOW();