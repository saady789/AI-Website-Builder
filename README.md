CodeWeave
Prototype: Turn natural-language prompts into runnable React apps with a live preview powered by StackBlitz WebContainers.
Public demo is paused (cost + WebContainers domain limits). Run locally in ~1–2 minutes.


Why it exists
Spinning up a new UI from scratch is slow. CodeWeave lets you describe the app you want, then generates a scaffolded React project you can run instantly in the browser. It’s a learning/prototyping tool, not production software.

Features (scope you can defend)
Prompt → React: Multi-step prompt pipeline (system + planner + generator) to produce component code, routes, and minimal styles.

Live preview (local/dev): Runs in WebContainers to execute the generated app directly in the browser—no server deployment.

One-click export: Download the generated project to continue locally.

Deterministic runs: Saves the prompt + outputs for reproducibility.

Note: WebContainers restrict custom domains. The public preview is disabled; local/dev preview works as expected.

Architecture (high-level)
bash
Copy
Edit
client/           # Next.js/React UI (prompting, preview, file viewer)
  └─ webcontainer # Runs the generated project in-browser (dev/local)
server/           # Minimal proxy for LLM calls (keeps API keys safe)
  └─ routes/ai    # Anthropic (and optional OpenAI) endpoints
docs/             # demo.gif, diagram.png, sample prompts

LLM: Anthropic Claude (primary). Optional OpenAI fallback.

Preview: StackBlitz WebContainers (dev/local only).

Security: API keys never exposed to the browser; server proxies requests.

Getting started (local)
Prereqs
Node 18+

PNPM or NPM

Anthropic API key (and optionally OpenAI)

1) Clone & install
bash
Copy
Edit
git clone https://github.com/saady789/codeweave
cd codeweave
pnpm install   # or npm install
2) Environment
Create server/.env:

bash
Copy
Edit
ANTHROPIC_API_KEY=sk-ant-xxxxxxxx
OPENAI_API_KEY=sk-xxxxxxxxxxxx     # optional
PORT=3001
3) Run (two terminals or concurrently)
bash
Copy
Edit
# terminal A
pnpm run server   # starts the proxy on :3001

# terminal B
pnpm run dev      # starts the UI on :3000
Open http://localhost:3000.

If you prefer a single command, add concurrently and a script like:

json
Copy
Edit
"dev:all": "concurrently \"pnpm run server\" \"pnpm run dev\""
Usage
Enter a short prompt (e.g., “Todo app with add/complete filters and local storage.”).

Pick “React + Vite” preset (example).

Click Generate → review the proposed file tree and code.

Click Run Preview → WebContainers boots the generated app.

Click Export to download the project.

Sample prompts
“Dashboard with a sidebar, top nav, and cards showing fake metrics.”

“Markdown editor with preview pane and keyboard shortcuts.”

“Kanban board with draggable columns and tasks (no backend).”

Limitations (transparent)
Public demo: Off by design (cloud costs + WebContainers domain restrictions).

Preview scope: Browser-only execution (no DB/network-heavy backends).

Production: This is a prototype; treat generated code as a starting point.

Roadmap (nice-to-have, not promises)
 Prompt “critique & fix” loop

 Component library presets (shadcn/ui, MUI)

 Unit test scaffolds for generated code

 Basic telemetry (generation time, preview boot time)

 Export to GitHub gist/repo

Troubleshooting
Preview doesn’t start
Make sure you’re running locally (WebContainers can block custom domains). Open devtools → Console for stack traces.

401/LLM errors
Check server/.env keys; restart pnpm run server.

Slow boots
First WebContainers run downloads toolchains; second run is faster.

Tech stack
UI: Next.js/React, TypeScript

LLM: Anthropic Claude (optional OpenAI)

Preview: StackBlitz WebContainers

Server: Node/Express (or Fastify) proxy for API keys

Security note
Keys are stored on the server only and proxied to the LLM. Do not put API keys in the client bundle.

License
MIT (see LICENSE).

Acknowledgements
Inspired by the WebContainers team and community examples; built as a learning/prototyping project.
