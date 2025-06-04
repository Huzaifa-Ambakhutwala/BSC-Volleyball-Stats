import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files from public directory
app.use(express.static(path.join(process.cwd(), 'public')));

// Downtime middleware - check before serving the main app
app.use(async (req, res, next) => {
  // Skip downtime check for API routes, maintenance page, static assets, and Vite dev files
  if (req.path.startsWith('/api') || 
      req.path === '/maintenance.html' || 
      req.path.startsWith('/assets/') ||
      req.path.startsWith('/@') ||
      req.path.startsWith('/src/') ||
      req.path.includes('.js') ||
      req.path.includes('.css') ||
      req.path.includes('.ts') ||
      req.path.includes('.tsx') ||
      req.path.includes('.ico') ||
      req.path.includes('.png') ||
      req.path.includes('.jpg') ||
      req.path.includes('.svg')) {
    return next();
  }

  try {
    const fs = await import('fs/promises');
    const downtimeData = await fs.readFile(path.join(process.cwd(), 'data/downtime.json'), 'utf8');
    const downtime = JSON.parse(downtimeData);

    if (downtime.active && !downtime.overriddenByAdmin) {
      const now = new Date();
      const start = downtime.start ? new Date(downtime.start) : null;
      const end = downtime.end ? new Date(downtime.end) : null;
      
      const isDowntimeActive = 
        (!start || now >= start) && 
        (!end || now <= end);
      
      if (isDowntimeActive) {
        return res.redirect('/maintenance.html');
      }
    }
  } catch (error) {
    console.error('Error checking downtime:', error);
  }

  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
    // Add catch-all route handler for client-side routing
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(import.meta.dirname, 'dist/public/index.html'));
    });
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
