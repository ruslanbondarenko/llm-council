# LLM Council

![llmcouncil](header.jpg)

The idea of this repo is that instead of asking a question to your favorite LLM provider (e.g. OpenAI GPT 5.1, Google Gemini 3.0 Pro, Anthropic Claude Sonnet 4.5, xAI Grok 4, eg.c), you can group them into your "LLM Council". This repo is a simple, local web app that essentially looks like ChatGPT except it uses OpenRouter to send your query to multiple LLMs, it then asks them to review and rank each other's work, and finally a Chairman LLM produces the final response.

In a bit more detail, here is what happens when you submit a query:

1. **Stage 1: First opinions**. The user query is given to all LLMs individually, and the responses are collected. The individual responses are shown in a "tab view", so that the user can inspect them all one by one.
2. **Stage 2: Review**. Each individual LLM is given the responses of the other LLMs. Under the hood, the LLM identities are anonymized so that the LLM can't play favorites when judging their outputs. The LLM is asked to rank them in accuracy and insight.
3. **Stage 3: Final response**. The designated Chairman of the LLM Council takes all of the model's responses and compiles them into a single final answer that is presented to the user.

## Vibe Code Alert

This project was 99% vibe coded as a fun Saturday hack because I wanted to explore and evaluate a number of LLMs side by side in the process of [reading books together with LLMs](https://x.com/karpathy/status/1990577951671509438). It's nice and useful to see multiple responses side by side, and also the cross-opinions of all LLMs on each other's outputs. I'm not going to support it in any way, it's provided here as is for other people's inspiration and I don't intend to improve it. Code is ephemeral now and libraries are over, ask your LLM to change it in whatever way you like.

## Quick Start (bolt.new Deployment)

This project is ready for immediate deployment on **bolt.new** with full HTTPS support!

**Steps:**
1. Deploy the project to bolt.new (the platform handles everything automatically)
2. Your app will be live with a unique HTTPS URL
3. All conversations are stored in Supabase PostgreSQL database
4. The Edge Function handles all LLM orchestration via OpenRouter

**What's included:**
- Supabase database schema (already migrated)
- Edge Function for 3-stage deliberation
- React frontend with streaming UI
- OpenRouter API integration for multiple LLMs

The project structure has been optimized for bolt.new with all frontend files in the root directory.

## Setup (Local Development)

### 1. Install Dependencies

The project uses [uv](https://docs.astral.sh/uv/) for project management.

**Backend:**
```bash
uv sync
```

**Frontend:**
```bash
npm install
```

### 2. Configure API Key

Create a `.env` file in the project root:

```bash
OPENROUTER_API_KEY=sk-or-v1-...
```

Get your API key at [openrouter.ai](https://openrouter.ai/). Make sure to purchase the credits you need, or sign up for automatic top up.

### 3. Configure Models (Optional)

Edit `backend/config.py` to customize the council:

```python
COUNCIL_MODELS = [
    "openai/gpt-5.1",
    "google/gemini-3-pro-preview",
    "anthropic/claude-sonnet-4.5",
    "x-ai/grok-4",
]

CHAIRMAN_MODEL = "google/gemini-3-pro-preview"
```

## Running the Application

**Option 1: Use the start script**
```bash
./start.sh
```

**Option 2: Run manually**

Terminal 1 (Backend):
```bash
uv run python -m backend.main
```

Terminal 2 (Frontend):
```bash
npm run dev
```

Then open http://localhost:5173 in your browser.

**Note**: For the serverless version, just run `npm run dev` - no Python backend needed!

## Tech Stack

### Serverless Version (Deployed)
- **Backend:** Supabase Edge Functions (Deno runtime)
- **Frontend:** React + Vite, react-markdown for rendering
- **Database:** Supabase PostgreSQL with Row Level Security
- **API:** OpenRouter for multi-model LLM access
- **Package Management:** npm

### Local Development Version (Legacy)
- **Backend:** FastAPI (Python 3.10+), async httpx, OpenRouter API
- **Frontend:** React + Vite, react-markdown for rendering
- **Storage:** JSON files in `data/conversations/`
- **Package Management:** uv for Python, npm for JavaScript

## Deployment

This application is deployed on **bolt.new** using a fully serverless architecture:

1. **Frontend**: Static React app served from bolt.new
2. **Backend**: Supabase Edge Function (`council-deliberation`) handles all LLM orchestration
3. **Database**: Supabase PostgreSQL stores conversations and messages
4. **Configuration**: Models are configured in the Edge Function code

The deployed version uses the same 3-stage deliberation process but runs entirely on serverless infrastructure, making it easily scalable and cost-effective.

**Live URL**: Your deployment will have a unique HTTPS URL provided by bolt.new

### Architecture Benefits
- No server maintenance required
- Automatic HTTPS and SSL certificates
- Global CDN distribution for the frontend
- Scales automatically with usage
- Cost-effective (pay only for actual usage)
