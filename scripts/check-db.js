/* eslint-disable @typescript-eslint/no-require-imports */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manual env loader
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
}

async function checkDatabase() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('--- Database Check ---');
  
  // Check Services
  const { data: services, error: sError } = await supabase.from('services').select('name');
  console.log(`Services found: ${services?.length || 0}`);
  if (services) services.forEach(s => console.log(` - ${s.name}`));
  
  // Check Employees
  const { data: employees, error: eError } = await supabase.from('users').select('name, role').eq('role', 'employee');
  console.log(`Employees (role='employee') found: ${employees?.length || 0}`);
  if (employees) employees.forEach(e => console.log(` - ${e.name}`));

  // Check ALL Users roles
  const { data: allUsers } = await supabase.from('users').select('role');
  const roles = allUsers?.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});
  console.log('Roles distribution:', roles);

  if (eError) console.error('Error fetching employees:', eError);
}

checkDatabase();
