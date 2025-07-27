-- Crear extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  balance DECIMAL(10,2) DEFAULT 0.00,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de productos
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  discount DECIMAL(5,2) DEFAULT 0.00,
  image VARCHAR(500),
  category VARCHAR(100),
  duration VARCHAR(100) DEFAULT '1 mes',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de órdenes
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  user_email VARCHAR(255) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
  payment_method VARCHAR(100) NOT NULL,
  shipping_address JSONB,
  billing_address JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancelled_reason TEXT
);

-- Tabla de cuentas de productos
CREATE TABLE IF NOT EXISTS product_accounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  additional_info TEXT,
  is_sold BOOLEAN DEFAULT FALSE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  sold_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de items de órdenes
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10,2) NOT NULL,
  type VARCHAR(20) DEFAULT 'digital' CHECK (type IN ('physical', 'digital')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de relación entre order_items y product_accounts
CREATE TABLE IF NOT EXISTS order_item_accounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_item_id UUID REFERENCES order_items(id) ON DELETE CASCADE,
  product_account_id UUID REFERENCES product_accounts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_product_accounts_product_id ON product_accounts(product_id);
CREATE INDEX IF NOT EXISTS idx_product_accounts_is_sold ON product_accounts(is_sold);
CREATE INDEX IF NOT EXISTS idx_product_accounts_order_id ON product_accounts(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_email ON orders(user_email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_item_accounts_order_item_id ON order_item_accounts(order_item_id);
CREATE INDEX IF NOT EXISTS idx_order_item_accounts_product_account_id ON order_item_accounts(product_account_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_accounts_updated_at BEFORE UPDATE ON product_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Políticas de seguridad RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_item_accounts ENABLE ROW LEVEL SECURITY;

-- Políticas para usuarios (acceso público para autenticación)
CREATE POLICY "Public access for authentication" ON users
    FOR SELECT USING (true);

CREATE POLICY "Users can insert" ON users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (true);

-- Políticas para productos (acceso público)
CREATE POLICY "Public access to products" ON products
    FOR ALL USING (true);

-- Políticas para cuentas de productos (acceso público)
CREATE POLICY "Public access to product accounts" ON product_accounts
    FOR ALL USING (true);

-- Políticas para órdenes (acceso público)
CREATE POLICY "Public access to orders" ON orders
    FOR ALL USING (true);

-- Políticas para items de órdenes (acceso público)
CREATE POLICY "Public access to order items" ON order_items
    FOR ALL USING (true);

-- Políticas para relación order_item_accounts (acceso público)
CREATE POLICY "Public access to order item accounts" ON order_item_accounts
    FOR ALL USING (true);

-- Insertar usuario administrador por defecto
INSERT INTO users (email, username, password, balance, is_admin) 
VALUES (
    'admin@admin.com', 
    'Administrador', 
    '$2b$10$rQZ8kHWKtGkVQhzQzQzQzOzQzQzQzQzQzQzQzQzQzQzQzQzQzQzQz', -- password: admin123
    1000.00, 
    TRUE
) ON CONFLICT (email) DO NOTHING;

-- Insertar productos de ejemplo
INSERT INTO products (name, description, price, discount, image, category) VALUES
('Netflix Premium', 'Cuenta Netflix Premium con 4 pantallas simultáneas', 15.99, 20, '/assets/images/netflix.jpg', 'Streaming'),
('Spotify Premium', 'Cuenta Spotify Premium sin anuncios', 9.99, 15, '/assets/images/spotify.jpg', 'Música'),
('Disney+ Premium', 'Acceso completo a Disney+ con contenido 4K', 12.99, 10, '/assets/images/disney.jpg', 'Streaming'),
('YouTube Premium', 'YouTube sin anuncios y YouTube Music incluido', 11.99, 25, '/assets/images/youtube.jpg', 'Streaming')
ON CONFLICT DO NOTHING;

-- Insertar cuentas de ejemplo para los productos
DO $$
DECLARE
    netflix_id UUID;
    spotify_id UUID;
    disney_id UUID;
    youtube_id UUID;
BEGIN
    -- Obtener IDs de productos
    SELECT id INTO netflix_id FROM products WHERE name = 'Netflix Premium' LIMIT 1;
    SELECT id INTO spotify_id FROM products WHERE name = 'Spotify Premium' LIMIT 1;
    SELECT id INTO disney_id FROM products WHERE name = 'Disney+ Premium' LIMIT 1;
    SELECT id INTO youtube_id FROM products WHERE name = 'YouTube Premium' LIMIT 1;
    
    -- Insertar cuentas de ejemplo si los productos existen
    IF netflix_id IS NOT NULL THEN
        INSERT INTO product_accounts (product_id, email, password, additional_info) VALUES
        (netflix_id, 'netflix1@example.com', 'password123', 'Cuenta Premium - 4 pantallas'),
        (netflix_id, 'netflix2@example.com', 'password456', 'Cuenta Premium - 4 pantallas'),
        (netflix_id, 'netflix3@example.com', 'password789', 'Cuenta Premium - 4 pantallas')
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF spotify_id IS NOT NULL THEN
        INSERT INTO product_accounts (product_id, email, password, additional_info) VALUES
        (spotify_id, 'spotify1@example.com', 'spotifypass1', 'Cuenta Premium sin anuncios'),
        (spotify_id, 'spotify2@example.com', 'spotifypass2', 'Cuenta Premium sin anuncios')
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF disney_id IS NOT NULL THEN
        INSERT INTO product_accounts (product_id, email, password, additional_info) VALUES
        (disney_id, 'disney1@example.com', 'disneypass1', 'Acceso completo 4K'),
        (disney_id, 'disney2@example.com', 'disneypass2', 'Acceso completo 4K')
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF youtube_id IS NOT NULL THEN
        INSERT INTO product_accounts (product_id, email, password, additional_info) VALUES
        (youtube_id, 'youtube1@example.com', 'youtubepass1', 'Premium + Music incluido'),
        (youtube_id, 'youtube2@example.com', 'youtubepass2', 'Premium + Music incluido')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;