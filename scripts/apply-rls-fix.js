const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function applyRLS() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('Applying RLS fix for public employee access...');

  const sql = `
    DROP POLICY IF EXISTS "Everyone can read employees" ON public.users;
    CREATE POLICY "Everyone can read employees"
      ON public.users
      FOR SELECT
      USING (role = 'employee'::user_role);
  `;

  // Supabase JS SDK doesn't support raw SQL easily unless through RPC or special extensions
  // But we can try to use the REST API if configured, or just inform the user.
  // Actually, standard supabase-js doesn't have a .sql() method.
  
  console.log('NOTE: The Supabase JS SDK does not support raw DDL (SQL) execution directly.');
  console.log('Please copy and paste the following SQL into your Supabase SQL Editor:');
  console.log('------------------------------------------------------------');
  console.log(sql);
  console.log('------------------------------------------------------------');
}

applyRLS();
