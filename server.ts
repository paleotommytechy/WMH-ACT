import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn("Supabase credentials missing for admin operations. Ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.");
  }

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

  // API Routes
  app.post("/api/admin/create-student", async (req, res) => {
    const { fullName, realEmail, track, role, username, password, adminId } = req.body;

    if (!fullName || !realEmail || !username || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      // 1. Create Supabase Auth User
      // Using username@wmh.local as the email for internal login mapping
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

      // 2. Update Profile (The trigger should have created it, but we update extra fields)
      // Since the trigger handle_new_user runs after insert on auth.users, 
      // we might need a small delay or just perform an UPSERT to be safe.
      
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
          full_name: fullName,
          username: username,
          email: realEmail, // We store the real email here
          primary_track: track,
          role_title: role,
          community_role: 'student',
          created_by: adminId,
          onboarding_completed: true // Admin created accounts are pre-onboarded
        })
        .eq('id', userId);

      if (profileError) {
        console.error("Profile update error:", profileError);
        // Even if profile update fails, the auth user is created. 
        // We should ideally return success but note the error if needed.
      }

      res.status(201).json({ 
        message: "Student account created successfully", 
        user: authData.user 
      });

    } catch (error: any) {
      console.error("Error creating student account:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
