import express from "express";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    env: process.env.NODE_ENV,
    supabaseConfigured: !!process.env.VITE_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    isVercel: !!process.env.VERCEL
  });
});

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseServiceKey || "placeholder",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

app.post("/api/admin/create-student", async (req, res) => {
  const { fullName, realEmail, track, role, username, password, adminId } = req.body;

  if (!fullName || !realEmail || !username || !password) {
    return res.status(400).json({ error: "Missing required fields: fullName, realEmail, username, and password are required." });
  }

  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.VITE_SUPABASE_URL) {
      throw new Error("Supabase service role key or URL is not configured in environment variables. Please check AI Studio Secrets.");
    }

    // 1. Create Supabase Auth User
    const internalEmail = `${username}@wmh.local`;
    
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: internalEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        username: username,
        real_email: realEmail,
        track: track,
        role: role
      }
    });

    if (authError) throw authError;

    const userId = authData.user.id;

    // 2. Update Profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name: fullName,
        username: username,
        email: realEmail,
        primary_track: track,
        role_title: role,
        community_role: 'student',
        created_by: adminId,
        onboarding_completed: true
      })
      .eq('id', userId);

    if (profileError) {
      console.error("Profile update error:", profileError);
    }

    res.status(201).json({ 
      message: "Student account created successfully", 
      user: authData.user 
    });

  } catch (error: any) {
    console.error("Error creating student account:", error);
    res.status(error.status || 500).json({ 
      error: error.message || "Internal server error",
      details: error
    });
  }
});

// Global error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error("Global Error Handler:", err);
  res.status(500).json({ 
    error: "An unexpected server error occurred.", 
    message: err.message 
  });
});

export default app;
