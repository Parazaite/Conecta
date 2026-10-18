CREATE DATABASE IF NOT EXISTS conecta_bairro

USE conecta_bairro;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS categories (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(80) NOT NULL,
  slug VARCHAR(90) NOT NULL,
  icon VARCHAR(16) NOT NULL DEFAULT '✳',
  PRIMARY KEY (id),
  UNIQUE KEY uq_categories_slug (slug)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS profiles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  category_id INT UNSIGNED NOT NULL,
  phone VARCHAR(30) NOT NULL,
  neighborhood VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  bio TEXT NOT NULL,
  availability VARCHAR(180) NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_profiles_user (user_id),
  KEY idx_profiles_browse (is_active, category_id, neighborhood),
  CONSTRAINT fk_profiles_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_profiles_category FOREIGN KEY (category_id) REFERENCES categories (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS services (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  profile_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(120) NOT NULL,
  description VARCHAR(500) NOT NULL DEFAULT '',
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  price_unit VARCHAR(40) NOT NULL DEFAULT 'por serviço',
  PRIMARY KEY (id),
  KEY idx_services_profile (profile_id),
  CONSTRAINT fk_services_profile FOREIGN KEY (profile_id) REFERENCES profiles (id) ON DELETE CASCADE
) ENGINE=InnoDB;

INSERT INTO categories (name, slug, icon) VALUES
  ('Eletricista', 'eletricista', '⚡'),
  ('Costura', 'costura', '🧵'),
  ('Pintura', 'pintura', '🖌️'),
  ('Marcenaria', 'marcenaria', '🪚'),
  ('Beleza', 'beleza', '✂️'),
  ('Limpeza', 'limpeza', '🧹'),
  ('Reparos', 'reparos', '🛠️'),
  ('Aulas e reforço', 'aulas', '📚'),
  ('Outros serviços', 'outros', '✨')
ON DUPLICATE KEY UPDATE name = VALUES(name), icon = VALUES(icon);
