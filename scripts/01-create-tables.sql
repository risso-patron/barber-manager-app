-- Enable RLS (Row Level Security)
-- Note: JWT secret is managed by Supabase automatically

-- Create custom types
CREATE TYPE user_role AS ENUM ('client', 'employee', 'admin');
CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'client',
  phone VARCHAR(20),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Services table
CREATE TABLE public.services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  duration INTEGER NOT NULL, -- in minutes
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Appointments table
CREATE TABLE public.appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.users(id) NOT NULL,
  barber_id UUID REFERENCES public.users(id) NOT NULL,
  service_id UUID REFERENCES public.services(id) NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status appointment_status DEFAULT 'pending',
  notes TEXT,
  feedback TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventory table
CREATE TABLE public.inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_name VARCHAR(100) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 5,
  supplier VARCHAR(100),
  cost_per_unit DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventory movements table
CREATE TABLE public.inventory_movements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inventory_id UUID REFERENCES public.inventory(id) NOT NULL,
  movement_type VARCHAR(20) NOT NULL, -- 'in', 'out', 'adjustment'
  quantity INTEGER NOT NULL,
  reason TEXT,
  created_by UUID REFERENCES public.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Time logs table for employee attendance
CREATE TABLE public.time_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES public.users(id) NOT NULL,
  date DATE NOT NULL,
  time_in TIME,
  time_out TIME,
  break_start TIME,
  break_end TIME,
  total_hours DECIMAL(4,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Business settings table
CREATE TABLE public.business_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key VARCHAR(50) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Financial transactions table (Contabilidad)
CREATE TABLE public.financial_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_type VARCHAR(20) NOT NULL, -- 'income', 'expense'
  category VARCHAR(50) NOT NULL, -- 'service', 'product_sale', 'salary', 'supplies', 'rent', 'utilities', 'other'
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  reference_id UUID, -- Could reference appointment_id or other entities
  payment_method VARCHAR(30), -- 'cash', 'card', 'transfer', 'other'
  created_by UUID REFERENCES public.users(id) NOT NULL,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (amount > 0)
);

-- Employee commissions table
CREATE TABLE public.employee_commissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES public.users(id) NOT NULL,
  appointment_id UUID REFERENCES public.appointments(id),
  amount DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(5,2), -- percentage (e.g., 40.00 for 40%)
  payment_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'paid'
  payment_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer loyalty points (optional feature for future)
CREATE TABLE public.customer_loyalty (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.users(id) NOT NULL,
  points INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  last_visit DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_loyalty ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can read their own data, admins can read all
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Appointments policies
CREATE POLICY "Users can view their appointments" ON public.appointments
  FOR SELECT USING (
    client_id = auth.uid() OR 
    barber_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Clients can create appointments" ON public.appointments
  FOR INSERT WITH CHECK (client_id = auth.uid());

CREATE POLICY "Barbers and admins can update appointments" ON public.appointments
  FOR UPDATE USING (
    barber_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Inventory policies (admin only)
CREATE POLICY "Admin can manage inventory" ON public.inventory
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Time logs policies
CREATE POLICY "Employees can manage their time logs" ON public.time_logs
  FOR ALL USING (
    employee_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Services policies
CREATE POLICY "Everyone can view services" ON public.services
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admin can manage services" ON public.services
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Financial transactions policies (admin and employee can view, admin can manage)
CREATE POLICY "Admin and employees can view transactions" ON public.financial_transactions
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'employee')
  ));

CREATE POLICY "Admin can manage transactions" ON public.financial_transactions
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Employee commissions policies
CREATE POLICY "Employees can view their commissions" ON public.employee_commissions
  FOR SELECT USING (
    employee_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin can manage commissions" ON public.employee_commissions
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Customer loyalty policies
CREATE POLICY "Clients can view their loyalty points" ON public.customer_loyalty
  FOR SELECT USING (client_id = auth.uid());

CREATE POLICY "Admin and employees can view all loyalty" ON public.customer_loyalty
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'employee')
  ));

CREATE POLICY "Admin can manage loyalty" ON public.customer_loyalty
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'client')::user_role
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX idx_appointments_client ON public.appointments(client_id);
CREATE INDEX idx_appointments_barber ON public.appointments(barber_id);
CREATE INDEX idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX idx_appointments_status ON public.appointments(status);
CREATE INDEX idx_financial_transactions_date ON public.financial_transactions(transaction_date);
CREATE INDEX idx_financial_transactions_type ON public.financial_transactions(transaction_type);
CREATE INDEX idx_time_logs_employee ON public.time_logs(employee_id);
CREATE INDEX idx_time_logs_date ON public.time_logs(date);
CREATE INDEX idx_inventory_movements_inventory ON public.inventory_movements(inventory_id);
CREATE INDEX idx_employee_commissions_employee ON public.employee_commissions(employee_id);

-- Create function to update appointment and create financial transaction
CREATE OR REPLACE FUNCTION public.complete_appointment_with_payment()
RETURNS TRIGGER AS $$
DECLARE
  service_price DECIMAL(10,2);
  commission_rate DECIMAL(5,2) := 40.00; -- 40% commission by default
  commission_amount DECIMAL(10,2);
BEGIN
  -- Only process if status changed to 'completed'
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    
    -- Get service price
    SELECT price INTO service_price FROM public.services WHERE id = NEW.service_id;
    
    -- Create income transaction
    INSERT INTO public.financial_transactions (
      transaction_type, 
      category, 
      amount, 
      description, 
      reference_id,
      payment_method,
      created_by,
      transaction_date
    ) VALUES (
      'income',
      'service',
      service_price,
      'Servicio completado: ' || NEW.id,
      NEW.id,
      'cash', -- Default, can be updated later
      NEW.barber_id,
      CURRENT_DATE
    );
    
    -- Calculate and create employee commission
    commission_amount := service_price * (commission_rate / 100);
    
    INSERT INTO public.employee_commissions (
      employee_id,
      appointment_id,
      amount,
      commission_rate,
      payment_status
    ) VALUES (
      NEW.barber_id,
      NEW.id,
      commission_amount,
      commission_rate,
      'pending'
    );
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for appointment completion
CREATE OR REPLACE TRIGGER on_appointment_completed
  AFTER UPDATE ON public.appointments
  FOR EACH ROW 
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION public.complete_appointment_with_payment();

-- Create function to update inventory stock alerts
CREATE OR REPLACE FUNCTION public.check_low_stock()
RETURNS TABLE(product_name VARCHAR, current_stock INTEGER, min_required INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    inventory.product_name,
    inventory.quantity,
    inventory.min_stock
  FROM public.inventory
  WHERE inventory.quantity <= inventory.min_stock
  ORDER BY (inventory.quantity - inventory.min_stock);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

