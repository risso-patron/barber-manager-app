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

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function cleanTestData() {
  console.log("Cleaning up test data...");

  // Delete test appointments
  const { data: testUsers } = await supabase
    .from("users")
    .select("id")
    .ilike("name", "%Usuario Test%");

  if (testUsers && testUsers.length > 0) {
    const userIds = testUsers.map(u => u.id);
    
    // Appointments cascade or we delete them first
    const { error: apptErr } = await supabase
      .from("appointments")
      .delete()
      .in("client_id", userIds);
      
    if (apptErr) console.error("Error deleting appointments:", apptErr.message);
    else console.log("Deleted test appointments.");

    // Delete from public.users
    const { error: usersErr } = await supabase
      .from("users")
      .delete()
      .in("id", userIds);
      
    if (usersErr) console.error("Error deleting public.users:", usersErr.message);
    else console.log("Deleted test public users.");

    // Delete from auth.users (requires admin API loop or deleting via ID)
    for (const uid of userIds) {
      const { error: authErr } = await supabase.auth.admin.deleteUser(uid);
      if (authErr) console.error(`Error deleting auth user ${uid}:`, authErr.message);
      else console.log(`Deleted test auth user ${uid}.`);
    }
  }

  // Also delete any appointment on 09:00 that might be blocking the test
  const { error: blockErr } = await supabase
    .from("appointments")
    .delete()
    .eq("appointment_time", "09:00");
    
  if (blockErr) console.error("Error deleting blocking appointments:", blockErr.message);
  else console.log("Cleared 09:00 appointments.");

  // Clean up the specific auth user that caused the phone conflict
  const { data: usersData } = await supabase.auth.admin.listUsers();
  if (usersData?.users) {
    for (const u of usersData.users) {
      if (u.phone === "1234567890" || u.phone === "+1234567890") {
        await supabase.auth.admin.deleteUser(u.id);
        console.log("Deleted conflicting auth user by phone:", u.phone);
      }
    }
  }

  console.log("Cleanup complete!");
}

cleanTestData();
