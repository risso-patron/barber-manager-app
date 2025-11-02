-- Migration: Convert 'employee' role to 'barber'
-- This script updates existing data to match the new role naming convention
-- Run this BEFORE 05-add-employee-position.sql

-- Step 1: Update all existing 'employee' role users to 'barber'
UPDATE public.users 
SET role = 'barber' 
WHERE role = 'employee';

-- Verify the migration
SELECT 
  role, 
  COUNT(*) as total_users 
FROM public.users 
GROUP BY role 
ORDER BY role;
