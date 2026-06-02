-- Migration 25: Point of Sale system
-- Run in Supabase SQL Editor

-- 1. POS sales header
CREATE TABLE IF NOT EXISTS pos_sales (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id      uuid        REFERENCES users(id) ON DELETE SET NULL,
  payment_method text        NOT NULL CHECK (payment_method IN ('cash', 'card', 'transfer')),
  subtotal       numeric(10,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  discount       numeric(10,2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
  total          numeric(10,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  notes          text,
  created_by     uuid        REFERENCES users(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- 2. POS sale line items
CREATE TABLE IF NOT EXISTS pos_sale_items (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id    uuid        NOT NULL REFERENCES pos_sales(id) ON DELETE CASCADE,
  item_type  text        NOT NULL CHECK (item_type IN ('service', 'product')),
  item_id    uuid,                                   -- optional FK to services / inventory
  name       text        NOT NULL,
  price      numeric(10,2) NOT NULL CHECK (price >= 0),
  quantity   integer     NOT NULL DEFAULT 1 CHECK (quantity > 0),
  subtotal   numeric(10,2) NOT NULL CHECK (subtotal >= 0)
);

CREATE INDEX IF NOT EXISTS idx_pos_sales_created_at ON pos_sales(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pos_sales_client_id  ON pos_sales(client_id);
CREATE INDEX IF NOT EXISTS idx_pos_items_sale_id    ON pos_sale_items(sale_id);

-- 3. Row Level Security
ALTER TABLE pos_sales      ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_sale_items ENABLE ROW LEVEL SECURITY;

-- Admin: full access
CREATE POLICY "admin_all_pos_sales"
  ON pos_sales FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "admin_all_pos_items"
  ON pos_sale_items FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- 4. Function: award loyalty points when a POS sale has a linked client
CREATE OR REPLACE FUNCTION award_loyalty_points_pos()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_points integer;
BEGIN
  IF NEW.client_id IS NOT NULL THEN
    v_points := GREATEST(1, FLOOR(NEW.total)::integer);

    UPDATE users SET loyalty_points = loyalty_points + v_points
    WHERE id = NEW.client_id;

    INSERT INTO loyalty_transactions(user_id, points, type, description)
    VALUES (NEW.client_id, v_points, 'earn', 'Venta en tienda (POS)');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_award_loyalty_pos ON pos_sales;
CREATE TRIGGER trg_award_loyalty_pos
  AFTER INSERT ON pos_sales
  FOR EACH ROW
  EXECUTE FUNCTION award_loyalty_points_pos();

-- 5. Grants
GRANT SELECT, INSERT ON pos_sales      TO authenticated;
GRANT SELECT, INSERT ON pos_sale_items TO authenticated;
