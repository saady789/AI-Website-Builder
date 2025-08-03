import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "redis";
import { BASE_PROMPT, getSystemPrompt } from "./prompts";
import { ContentBlock, TextBlock } from "@anthropic-ai/sdk/resources";
import { basePrompt as nodeBasePrompt } from "./defaults/node";
import { basePrompt as reactBasePrompt } from "./defaults/react";
import { Request, Response, NextFunction } from "express";

// Create Redis client
const redis = createClient({
  url: process.env.REDIS_URL,
});

redis.on("error", (err) => console.error("❌ Redis error:", err));

const rateLimitOncePerWeek = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const ip = req.ip;
  const key = `limit:${req.path}:${ip}`;
  const oneWeekInSeconds = 7 * 24 * 60 * 60;

  try {
    const count = await redis.get(key);

    if (count !== null && parseInt(count) >= 2) {
      console.log("❌ Rate limit hit for", key);

      const ttl = await redis.ttl(key); // Get time-to-live in seconds
      const retryTimestamp = new Date(Date.now() + ttl * 1000).toISOString();

      res.status(429).json({
        message: `Rate limit exceeded. Try again after ${retryTimestamp}`,
        retryAt: retryTimestamp,
      });
      return;
    }

    // Either increment or set the counter with TTL
    const tx = redis.multi();
    tx.incr(key);
    if (count === null) {
      tx.expire(key, oneWeekInSeconds);
    }
    await tx.exec();

    console.log("✅ Rate limit passed for", key);
    next();
  } catch (err) {
    console.error("⚠️ Redis failed:", err);
    next(); // Fail open on Redis error
  }
};

// Start everything inside a function
async function main() {
  await redis.connect();
  const anthropic = new Anthropic();

  const app = express();
  app.use(
    cors({
      origin: "https://alora.saady.dev",
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    })
  );

  app.use((req, res, next) => {
    res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    next();
  });

  // 3. JSON parser
  app.use(express.json());

  app.post("/template", async (req: Request, res: Response): Promise<void> => {
    console.log("\n template function got called ");
    const prompt = req.body.prompt;

    const response = await anthropic.messages.create({
      messages: [{ role: "user", content: prompt }],
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 200,
      system:
        "Return either node or react based on what do you think this project should be. Only return a single word either 'node' or 'react'. Do not return anything extra",
    });

    const answer = (response.content[0] as TextBlock).text?.trim();

    if (answer === "react") {
      res.json({
        prompts: [
          BASE_PROMPT,
          `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`,
        ],
        uiPrompts: [reactBasePrompt],
      });
      return; // ✅ void return (not the res.json result)
    }

    if (answer === "node") {
      res.json({
        prompts: [
          `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`,
        ],
        uiPrompts: [nodeBasePrompt],
      });
      return;
    }

    res.status(403).json({ message: "You can't access this" });
    return;
  });

  app.post("/chat", rateLimitOncePerWeek, async (req, res) => {
    console.log("\n the chat function got called");
    const messages = req.body.messages;

    const response = await anthropic.messages.create({
      messages,
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 8000,
      system: getSystemPrompt(),
    });

    res.json({
      response: (response.content[0] as TextBlock)?.text,
    });
  });

  app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", message: "Server is running!" });
  });

  app.listen(3000, () => {
    console.log("🚀 Server running at port 3000");
  });
}

main().catch((err) => {
  console.error(" Failed to start server:", err);
});
