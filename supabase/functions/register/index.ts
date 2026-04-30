import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL     = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TS_SECRET        = Deno.env.get("TURNSTILE_SECRET_KEY")!;
const ALLOWED_ORIGIN   = Deno.env.get("ALLOWED_ORIGIN") ?? "*";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+91\d{10}$/;
const PIN_RE   = /^\d{6}$/;

const VALID_COURSES = new Set([
  "Class VI","Class VII","Class VIII","Class IX","Class X",
  "Class XI - Math","Class XI - Bio",
  "Class XII - Math","Class XII - Bio",
  "Class XII Pass - Math","Class XII Pass - Bio",
  "JEE MAIN","JEE ADVANCED","KVPY","NTSE","OLYMPIADS",
]);

function cors(origin: string) {
  return {
    "Access-Control-Allow-Origin":  origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

function json(status: number, body: object, origin: string) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(origin), "Content-Type": "application/json" },
  });
}

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

async function verifyTurnstile(token: string, ip: string | null) {
  const form = new URLSearchParams({ secret: TS_SECRET, response: token });
  if (ip) form.set("remoteip", ip);
  const res  = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST", body: form,
  });
  const data = await res.json();
  return data.success === true;
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin") ?? ALLOWED_ORIGIN;

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors(origin) });
  }

  if (req.method !== "POST") {
    return json(405, { message: "Method not allowed." }, origin);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json(400, { message: "Invalid JSON." }, origin);
  }

  // 1. Verify Turnstile
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? null;
  const ok = await verifyTurnstile(str(body.cfToken), ip);
  if (!ok) {
    return json(403, { message: "Security check failed. Please refresh and try again." }, origin);
  }

  // 2. Validate fields
  const errors: string[] = [];
  if (!str(body.studentName))                   errors.push("Student name is required.");
  if (!str(body.fatherName))                    errors.push("Father name is required.");
  if (!str(body.motherName))                    errors.push("Mother name is required.");
  if (!str(body.birthDate))                     errors.push("Birth date is required.");
  if (!["Male","Female","Other"].includes(str(body.gender)))
                                                errors.push("Valid gender is required.");
  if (!str(body.fullAddress))                   errors.push("Full address is required.");
  if (!str(body.district))                      errors.push("District is required.");
  if (!PIN_RE.test(str(body.pincode)))          errors.push("PIN code must be 6 digits.");
  if (!PHONE_RE.test(str(body.phone)))          errors.push("Phone must be +91 followed by 10 digits.");
  if (str(body.email) && !EMAIL_RE.test(str(body.email)))
                                                errors.push("Email format is invalid.");
  if (!str(body.nationality))                   errors.push("Nationality is required.");
  if (!str(body.bloodGroup))                    errors.push("Blood group is required.");
  if (!VALID_COURSES.has(str(body.courseName))) errors.push("Please select a valid course.");

  if (errors.length) {
    return json(422, { message: errors[0], errors }, origin);
  }

  // 3. Insert with service role — bypasses RLS
  const { error } = await supabase.from("registrations").insert({
    course_name:    str(body.courseName),
    student_name:  str(body.studentName),
    father_name:   str(body.fatherName),
    mother_name:   str(body.motherName),
    birth_date:    str(body.birthDate),
    gender:        str(body.gender),
    full_address:  str(body.fullAddress),
    district:      str(body.district),
    pincode:       str(body.pincode),
    religion:      str(body.religion) || null,
    nationality:   str(body.nationality),
    phone:         str(body.phone),
    email:         str(body.email).toLowerCase() || null,
    blood_group:   str(body.bloodGroup),
    occupation:    str(body.occupation) || null,
    marital_status: str(body.maritalStatus) || null,
  });

  if (error) {
    console.error("DB insert failed:", error.message);
    return json(500, { message: "Could not save registration. Please try again." }, origin);
  }

  return json(200, { message: "Registration submitted successfully!" }, origin);
});
