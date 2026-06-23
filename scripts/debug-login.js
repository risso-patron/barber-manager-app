/* eslint-disable @typescript-eslint/no-require-imports */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf8');
envContent.split('\n').forEach(line => {
  const trimmedLine = line.trim();
  if (trimmedLine && !trimmedLine.startsWith('#')) {
    const [key, ...valueParts] = trimmedLine.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  }
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const admin = createClient(supabaseUrl, supabaseKey, {auth: {persistSession: false}});
const client = createClient(supabaseUrl, supabaseAnonKey, {auth: {persistSession: false}});

async function test() {
  const email = 'test_login_x@example.com';
  const password = 'Password123!';
  
  await admin.auth.admin.createUser({email, password, email_confirm: true});
  
  const { data, error } = await client.auth.signInWithPassword({email, password});
  console.log(error ? 'LOGIN FAILED: ' + error.message : 'LOGIN SUCCESS');
  
  await admin.auth.admin.deleteUser((await admin.auth.admin.listUsers()).data.users.find(u => u.email === email).id);
}
test();
