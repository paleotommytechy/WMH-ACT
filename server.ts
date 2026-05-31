import express, { Express } from "express";
import path from "path";
import { fileURLToPath } from "url";
// No top-level vite import to avoid serverless issues
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import webpush from "web-push";
import OpenAI from "openai";

dotenv.config();

console.log("OPENAI_API_KEY exists:", !!process.env.OPENAI_API_KEY);

// Define __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let aiInstance: OpenAI | null = null;
function getOpenAIClient(): OpenAI {
  console.log("OPENAI_API_KEY exists:", !!process.env.OPENAI_API_KEY);
  if (!aiInstance) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is required but missing. Please configure it in your Settings > Secrets.");
    }
    aiInstance = new OpenAI({
      apiKey,
    });
  }
  return aiInstance;
}

async function generateContentWithFallback(client: OpenAI, params: {
  prompt: string;
  systemInstruction: string;
}) {
  const models = ["gpt-4o-mini", "gpt-4-turbo"];
  let lastError: any = null;

  for (const model of models) {
    try {
      console.log(`Attempting content generation using model: ${model}`);
      const response = await client.chat.completions.create({
        model,
        messages: [
          {
            role: "system",
            content: params.systemInstruction,
          },
          {
            role: "user",
            content: params.prompt,
          },
        ],
        response_format: { type: "json_object" },
      });
      return response;
    } catch (err: any) {
      console.warn(`Model ${model} failed, trying next fallback:`, err.message || err);
      lastError = err;
    }
  }

  throw lastError || new Error("All configured OpenAI models failed to generate content.");
}

function setupRoutes(app: Express) {
  app.use(express.json());

  // AI Generation Routes
  app.post("/api/ai/whatsapp", async (req, res, next) => {
    const { taskCompleted, timeSpent, reflection, submittedDate } = req.body;
    
    if (!taskCompleted && !reflection) {
      return res.status(400).json({ error: "Missing required submission details." });
    }

    try {
      const client = getOpenAIClient();
      const prompt = `Analyze this daily accountability submission and generate a conversational, human-sounding WhatsApp post, including the tag '#WilsonMasteryHub #LearningInPublic'.

Here is the daily accountability submission:
- Task completed: ${taskCompleted || 'N/A'}
- Time Spent: ${timeSpent || 0} minutes
- Reflection: ${reflection || 'N/A'}
- Date: ${submittedDate || 'N/A'}

Return a JSON object with a "post" field containing the generated WhatsApp post.`;

      const response = await generateContentWithFallback(client, {
        prompt,
        systemInstruction: "Act as an AI WhatsApp Specialist. Rewrite daily accountability submissions into a conversational, human-sounding WhatsApp status update. Ensure your output is perfectly formatted JSON only, containing no HTML, DOCTYPE tags, markdown code blocks, or any other introductory text. Return JSON with a 'post' field."
      });

      const responseText = response.choices[0]?.message?.content || "{}";
      let parsedData;
      try {
        parsedData = JSON.parse(responseText.trim());
      } catch (parseErr) {
        // Fallback robust clean-up parsing
        let cleaned = responseText.trim();
        if (cleaned.startsWith("```json")) {
          cleaned = cleaned.substring(7);
        } else if (cleaned.startsWith("```")) {
          cleaned = cleaned.substring(3);
        }
        if (cleaned.endsWith("```")) {
          cleaned = cleaned.substring(0, cleaned.length - 3);
        }
        cleaned = cleaned.trim();
        parsedData = JSON.parse(cleaned);
      }

      res.status(200).json({ post: parsedData.post || responseText });
    } catch (err: any) {
      console.error("WhatsApp AI Generation Error:", err);
      res.status(500).json({ error: err.message || "Failed to generate humanized WhatsApp post." });
    }
  });

  app.post("/api/ai/linkedin-weekly", async (req, res, next) => {
    const { submissions, rangeText } = req.body;

    if (!submissions || !Array.isArray(submissions) || submissions.length === 0) {
      return res.status(400).json({ error: "No submissions provided to analyze." });
    }

    try {
      const client = getOpenAIClient();
      
      const submissionsList = submissions.map((sub: any, i: number) => {
        return `Submission ${i + 1}:
- Task Completed: ${sub.task_completed}
- Time Spent: ${sub.time_spent} minutes
- Reflection: ${sub.reflection}
- Date: ${sub.submitted_date}`;
      }).join("\n\n");

      const prompt = `Analyze the week's submissions and generate a professional, engaging LinkedIn post summarizing achievements and consistency based on the platform's focus, including the tag '#WilsonMasteryHub #LearningInPublic' @wilsonmasteryhub.

Here is context about the week's review period: ${rangeText || "Focus Week"}
Here are the daily submissions for this week:
${submissionsList}

Return a JSON object with a "post" field containing the generated LinkedIn post.`;

      const response = await generateContentWithFallback(client, {
        prompt,
        systemInstruction: "Act as an AI LinkedIn Weekly Specialist. Analyze all submissions and generate an inspiring, professional LinkedIn summary. Ensure your output is perfectly formatted JSON only, containing no HTML, DOCTYPE tags, markdown code blocks, or any other introductory text. Return JSON with a 'post' field."
      });

      const responseText = response.choices[0]?.message?.content || "{}";
      let parsedData;
      try {
        parsedData = JSON.parse(responseText.trim());
      } catch (parseErr) {
        // Fallback robust clean-up parsing
        let cleaned = responseText.trim();
        if (cleaned.startsWith("```json")) {
          cleaned = cleaned.substring(7);
        } else if (cleaned.startsWith("```")) {
          cleaned = cleaned.substring(3);
        }
        if (cleaned.endsWith("```")) {
          cleaned = cleaned.substring(0, cleaned.length - 3);
        }
        cleaned = cleaned.trim();
        parsedData = JSON.parse(cleaned);
      }

      res.status(200).json({ post: parsedData.post || responseText });
    } catch (err: any) {
      console.error("LinkedIn AI Summary Error:", err);
      res.status(500).json({ error: err.message || "Failed to generate weekly LinkedIn summary." });
    }
  });

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

  // --- VAPID / Web Push Setup ---
  let vapidPublic = process.env.VITE_VAPID_PUBLIC_KEY;
  let vapidPrivate = process.env.VAPID_PRIVATE_KEY;

  async function getOrInitVapidKeys() {
    // 1. Try to use process.env keys first if they exist and are valid URL-safe base64 keys
    if (vapidPublic && vapidPrivate) {
      try {
        webpush.setVapidDetails(
          "mailto:olusegunifetomiwa2000@gmail.com",
          vapidPublic,
          vapidPrivate
        );
        return { publicKey: vapidPublic, privateKey: vapidPrivate };
      } catch (e: any) {
        console.warn("Process environment VAPID keys were defined but invalid. Clearing and falling back:", e.message);
        vapidPublic = undefined;
        vapidPrivate = undefined;
      }
    }

    // 2. Try to load from database system_configs table
    try {
      const { data: configs, error } = await supabaseAdmin
        .from('system_configs')
        .select('*');

      if (!error && configs) {
        const pubKeyDb = configs.find(c => c.key === 'vapid_public_key')?.value;
        const privKeyDb = configs.find(c => c.key === 'vapid_private_key')?.value;

        if (pubKeyDb && privKeyDb) {
          try {
            webpush.setVapidDetails(
              "mailto:olusegunifetomiwa2000@gmail.com",
              pubKeyDb,
              privKeyDb
            );
            vapidPublic = pubKeyDb;
            vapidPrivate = privKeyDb;
            return { publicKey: vapidPublic, privateKey: vapidPrivate };
          } catch (validateErr: any) {
            console.warn("Database VAPID keys were invalid or corrupted, recreating:", validateErr.message);
          }
        }
      }
    } catch (dbErr: any) {
      console.warn("Could not query system_configs table:", dbErr.message);
    }

    // 3. Generate completely fresh valid keys and attempt to save to database
    try {
      const keys = webpush.generateVAPIDKeys();
      vapidPublic = keys.publicKey;
      vapidPrivate = keys.privateKey;

      webpush.setVapidDetails(
        "mailto:olusegunifetomiwa2000@gmail.com",
        vapidPublic,
        vapidPrivate
      );

      // Attempt DB storage of newly generated keys
      try {
        const { error: upsertErr } = await supabaseAdmin.from('system_configs').upsert([
          { key: 'vapid_public_key', value: vapidPublic },
          { key: 'vapid_private_key', value: vapidPrivate }
        ]);
        if (upsertErr) {
          console.warn("Insert of VAPID configs failed:", upsertErr.message);
        }
      } catch (upsertErr: any) {
        console.warn("Insert of VAPID configs failed:", upsertErr.message);
      }

      return { publicKey: vapidPublic, privateKey: vapidPrivate };
    } catch (fallbackErr: any) {
      console.error("Critical failure during ephemeral VAPID keys generation:", fallbackErr);
      return { publicKey: "", privateKey: "" };
    }
  }

  // Background Notification Dispatcher (Poller for Push and real-time PWA channels)
  let isPolling = false;

  async function startNotificationDispatcher() {
    try {
      const keys = await getOrInitVapidKeys();
      console.log("VAPID Keys active. Public Key exists:", !!keys.publicKey);
    } catch (dispatchErr: any) {
      console.error("Failed to initialize VAPID keys for dispatcher:", dispatchErr);
    }

    setInterval(async () => {
      if (isPolling) return;
      isPolling = true;

      try {
        const { data: unsentNotifications, error: fetchError } = await supabaseAdmin
          .from('notifications')
          .select('*')
          .is('metadata->pushed', null)
          .order('created_at', { ascending: true })
          .limit(10);

        if (fetchError) {
          if (fetchError.message?.includes('JSON') || fetchError.code === 'PGRST100') {
             const { data: allUnsent, error: fbError } = await supabaseAdmin
               .from('notifications')
               .select('*')
               .order('created_at', { ascending: true })
               .limit(50);
             
             if (!fbError && allUnsent) {
               const unsentFiltered = allUnsent.filter(n => !n.metadata || n.metadata.pushed !== true).slice(0, 10);
               await dispatchBatch(unsentFiltered);
             }
          } else {
             console.error("Error fetching unsent notifications in worker:", fetchError);
          }
        } else if (unsentNotifications && unsentNotifications.length > 0) {
          await dispatchBatch(unsentNotifications);
        }
      } catch (err) {
        console.error("Notification Poller Exception:", err);
      } finally {
        isPolling = false;
      }
    }, 5000);
  }

  async function dispatchBatch(batch: any[]) {
    for (const notification of batch) {
      try {
        const { data: tokens, error: tokenError } = await supabaseAdmin
          .from('push_tokens')
          .select('*')
          .eq('user_id', notification.user_id);

        if (tokenError) {
          console.error(`Error querying push tokens for user ${notification.user_id}:`, tokenError);
          continue;
        }

        if (tokens && tokens.length > 0) {
          for (const tokenRow of tokens) {
            try {
              const subscription = JSON.parse(tokenRow.token);
              const payload = JSON.stringify({
                title: notification.title,
                message: notification.message,
                url: notification.action_url || '/'
              });

              await webpush.sendNotification(subscription, payload);
              console.log(`Web push notification sent to token ${tokenRow.id} for user ${notification.user_id}`);
            } catch (pushErr: any) {
              console.warn(`Failed to push notification to device token ${tokenRow.id}:`, pushErr.message);
              if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
                console.log(`Revoking inactive/expired push token: ${tokenRow.id}`);
                await supabaseAdmin
                  .from('push_tokens')
                  .delete()
                  .eq('id', tokenRow.id);
              }
            }
          }
        }

        const updatedMetadata = { ...(notification.metadata || {}), pushed: true };
        await supabaseAdmin
          .from('notifications')
          .update({ metadata: updatedMetadata })
          .eq('id', notification.id);

      } catch (singleErr) {
        console.error(`Failed to process notification ${notification.id}:`, singleErr);
      }
    }
  }

  // Start back-end notification poller worker
  startNotificationDispatcher();

  // Handshake route for front-end dynamic VAPID enrollment
  app.get("/api/notifications/vapid-public-key", async (req, res) => {
    try {
      const { publicKey } = await getOrInitVapidKeys();
      res.status(200).json({ publicKey });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
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

  // --- Infrastructure & Storage Setup ---
  app.post("/api/admin/init-infrastructure", async (req, res) => {
    try {
      // 1. Create Avatars Bucket if it doesn't exist
      const { data: bucket, error: bError } = await supabaseAdmin.storage.createBucket('avatars', {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif'],
        fileSizeLimit: 2 * 1024 * 1024 // 2MB
      });

      if (bError && bError.message !== 'Bucket already exists') {
        throw bError;
      }

      res.status(200).json({ 
        success: true, 
        message: "Infrastructure initialized successfully." 
      });
    } catch (error: any) {
      console.error('Infrastructure init error:', error);
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

