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
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  console.log("Fetching a service and an employee...");
  const { data: services, error: sErr } = await supabase.from("services").select("id, name, duration, price").limit(1);
  const { data: employees, error: eErr } = await supabase.from("users").select("id, name").eq("role", "employee").limit(1);
  
  if (sErr || eErr) console.error("Supabase Error:", sErr || eErr);

  if (!services?.length || !employees?.length) {
    console.error("Missing service or employee data");
    console.log("Services:", services);
    console.log("Employees:", employees);
    return;
  }
  
  const service = services[0];
  const employee = employees[0];
  
  // Future date
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const dateStr = d.toISOString().slice(0, 10);
  
  const payload = {
    barbershop: "barber-manager",
    clientName: "Usuario Test",
    clientPhone: "1234567890",
    clientEmail: "test@example.com",
    serviceId: service.id,
    serviceName: service.name,
    employeeId: employee.id,
    employeeName: employee.name,
    date: dateStr,
    time: "09:00",
    duration: service.duration,
    price: service.price
  };

  console.log("Simulating API call to /api/bookings/public with payload:");
  console.log(payload);

  // Directly call the logic that the API uses to see if it fails
  console.log("\nChecking for conflicts...");
  const { data: conflictingAppointment } = await supabase
    .from("appointments")
    .select("id")
    .eq("barber_id", payload.employeeId)
    .eq("appointment_date", payload.date)
    .eq("appointment_time", payload.time)
    .maybeSingle();
    
  if (conflictingAppointment) {
    console.log("ERROR: Conflict found!", conflictingAppointment);
  } else {
    console.log("No conflict. Proceeding with user logic...");
  }
  
  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("phone", payload.clientPhone)
    .eq("role", "client")
    .maybeSingle();
    
  console.log("Existing user by phone:", existingUser);
  
  if (!existingUser) {
    console.log("Would create user auth...");
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: payload.clientEmail,
      phone: payload.clientPhone,
      email_confirm: true,
      user_metadata: { name: payload.clientName },
    });
    console.log("Create auth user result:", { user: authData?.user?.id, error: authError?.message });
  }

  // Also actually hit the local dev server
  try {
    const res = await fetch("http://localhost:3000/api/bookings/public", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    console.log("\nHTTP POST RESULT:", result);
  } catch (e) {
    console.error("HTTP POST failed (is server running?):", e.message);
  }
}

run();
