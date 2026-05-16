import express, { Express } from "express";
import path from "path";
import { fileURLToPath } from "url";
// No top-level vite import to avoid serverless issues
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

  // --- Notification System API ---

  // Trigger a notification (internal or admin)
  app.post("/api/notifications/send", async (req, res) => {
    const { userId, title, message, type, channels } = req.body;
    
    try {
      // 1. Create In-App Notification
      const { data: notification, error: nError } = await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: userId,
          title,
          message,
          type: type || 'system',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (nError) throw nError;

      // 2. Log Channel Deliveries (Simulation for now)
      const logs = [];
      if (channels?.includes('push')) {
        // Here you would call FCM or Web Push API
        logs.push({
          notification_id: notification.id,
          user_id: userId,
          channel: 'push',
          status: 'sent'
        });
      }

      if (channels?.includes('whatsapp')) {
        // Here you would call Twilio or WhatsApp Business API
        logs.push({
          notification_id: notification.id,
          user_id: userId,
          channel: 'whatsapp',
          status: 'sent'
        });
      }

      if (logs.length > 0) {
        await supabaseAdmin.from('notification_logs').insert(logs);
      }

      res.status(200).json({ success: true, notificationId: notification.id });
    } catch (error: any) {
      console.error('Notification API error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Scheduled Reminder Trigger (Simplified - can be called by a cron)
  app.post("/api/notifications/process-queue", async (req, res) => {
    try {
      const now = new Date().toISOString();
      const { data: queue, error: qError } = await supabaseAdmin
        .from('notification_queue')
        .select('*')
        .eq('status', 'pending')
        .lte('scheduled_for', now);

      if (qError) throw qError;

      for (const item of (queue || [])) {
        // Process each item (send via API, then update status)
        // This is where real delivery logic goes
        await supabaseAdmin
          .from('notification_queue')
          .update({ status: 'sent', updated_at: new Date().toISOString() })
          .eq('id', item.id);
      }

      res.status(200).json({ processed: queue?.length || 0 });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
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

let isInitialized = false;

export async function createServer() {
  if (isInitialized) return app;
  
  setupRoutes(app);
  isInitialized = true;

  if (process.env.NODE_ENV !== "production") {
    // Dynamic import for vite to avoid issues in production/serverless environments
    const { createServer: createViteServer } = await import("vite");
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

