import express, { Express } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

// Define __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function setupRoutes(app: Express) {
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
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      env: process.env.NODE_ENV,
      supabaseConfigured: !!process.env.VITE_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY
    });
  });

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

  // Global error handler for JSON responses
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Global Error Handler:", err);
    res.status(500).json({ 
      error: "An unexpected server error occurred.", 
      message: err.message 
    });
  });
}

const app = express();

export async function createServer() {
  setupRoutes(app);

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else if (!process.env.VERCEL) {
    // In production (not Vercel), serve static files from dist
    // Vercel handles static serving automatically via the "dist" directory and rewrites
    const possiblePaths = [
      path.resolve(process.cwd(), "dist"),
      path.join(__dirname, "dist"),
      path.join(__dirname, "..", "dist")
    ];
    
    let distPath = possiblePaths[0];
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: `API route not found: ${req.path}` });
      }
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  return app;
}

// Start the server (but skip if in Vercel/imported as module)
if (process.env.NODE_ENV !== "production" || (!process.env.VERCEL && import.meta.url === `file://${process.argv[1]}`)) {
  const PORT = Number(process.env.PORT) || 3000;
  createServer().then((server) => {
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    });
  }).catch(err => {
    console.error("Failed to start server:", err);
  });
}

export default app;

