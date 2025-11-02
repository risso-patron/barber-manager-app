-- Fix appointments RLS policies to allow admins to create appointments for clients
-- Run this in your Supabase SQL Editor

-- Drop existing policies
DROP POLICY IF EXISTS "Clients can create appointments" ON public.appointments;
DROP POLICY IF EXISTS "Barbers and admins can update appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admin can delete appointments" ON public.appointments;

-- Create new policies with admin support

-- INSERT: Clients can create for themselves, Admins can create for anyone
CREATE POLICY "Clients and admins can create appointments" ON public.appointments
  FOR INSERT WITH CHECK (
    client_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- UPDATE: Clients can update their own, Barbers can update their appointments, Admins can update any
CREATE POLICY "Users can update appointments" ON public.appointments
  FOR UPDATE USING (
    client_id = auth.uid() OR
    barber_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- DELETE: Only admins can delete appointments
CREATE POLICY "Admins can delete appointments" ON public.appointments
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );
