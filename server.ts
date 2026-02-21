import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Proxy Endpoint
  app.post("/api/proxy", async (req, res) => {
    const { url, method = "GET", headers = {}, body } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    try {
      console.log(`Proxying ${method} request to: ${url}`);
      
      const response = await fetch(url, {
        method,
        headers: {
          ...headers,
          "User-Agent": "Universal-Proxy-App/1.0",
        },
        body: method !== "GET" && method !== "HEAD" ? JSON.stringify(body) : undefined,
      });

      const contentType = response.headers.get("content-type");
      let data;

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      res.status(response.status).json({
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data,
      });
    } catch (error: any) {
      console.error("Proxy error:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  // Web View Proxy Endpoint
  app.get("/proxy/view", async (req, res) => {
    const targetUrl = req.query.url as string;

    if (!targetUrl) {
      return res.status(400).send("URL is required");
    }

    try {
      const url = targetUrl.startsWith("http") ? targetUrl : `https://${targetUrl}`;
      console.log(`Web Proxying: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });

      if (!response.ok) {
        return res.status(response.status).send(`Failed to fetch: ${response.statusText}`);
      }

      const contentType = response.headers.get("content-type") || "text/html";
      
      // If it's HTML, we inject a <base> tag so relative links work (mostly)
      if (contentType.includes("text/html")) {
        let html = await response.text();
        const baseTag = `<base href="${url}">`;
        
        // Inject base tag after <head>
        if (html.includes("<head>")) {
          html = html.replace("<head>", `<head>${baseTag}`);
        } else if (html.includes("<html>")) {
          html = html.replace("<html>", `<html><head>${baseTag}</head>`);
        } else {
          html = baseTag + html;
        }
        
        res.setHeader("Content-Type", "text/html");
        return res.send(html);
      }

      // For other assets, just pipe them or send as is (limited support)
      const buffer = await response.arrayBuffer();
      res.setHeader("Content-Type", contentType);
      res.send(Buffer.from(buffer));
    } catch (error: any) {
      console.error("Web Proxy error:", error);
      res.status(500).send(`Proxy Error: ${error.message}`);
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
