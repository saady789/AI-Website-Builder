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

// Rate limiting middleware
const rateLimitOncePerWeek = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const ip = req.ip;
  const key = `limit:${ip}`;
  const now = Date.now();
  const oneWeek = 7 * 24 * 60 * 60 * 1000;

  try {
    const lastTime = await redis.get(key);
    if (lastTime && now - parseInt(lastTime) < oneWeek) {
      const nextTry = new Date(parseInt(lastTime) + oneWeek).toLocaleString();
      res
        .status(429)
        .json({ message: `Rate limit: try again after ${nextTry}` });
      return; // 👈 prevent continuation but don't return a value
    }

    await redis.set(key, now.toString());
    next(); // ✅ Let the request pass
  } catch (err) {
    console.error("Redis check failed:", err);
    next(); // Let it through if Redis fails
  }
};

// Start everything inside a function
async function main() {
  await redis.connect();
  const anthropic = new Anthropic();

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.post(
    "/template",
    rateLimitOncePerWeek,
    async (req: Request, res: Response): Promise<void> => {
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
    }
  );

  app.post("/chat", rateLimitOncePerWeek, async (req, res) => {
    const messages = req.body.messages;

    const response = await anthropic.messages.create({
      messages,
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 8000,
      system: getSystemPrompt(),
    });

    console.log(response);

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
