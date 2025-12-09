/**
 * API endpoint to get available AI models via Vercel AI Gateway
 */

interface ModelConfig {
  id: string;
  name: string;
  provider: "openai" | "anthropic" | "google" | "xai" | "deepseek";
  description: string;
  speed: "fast" | "medium" | "slow";
  cost: "low" | "medium" | "high";
  pricing: {
    input: string;
    output: string;
  };
  contextWindow: string;
}

interface ModelsResponse {
  models: ModelConfig[];
}

export default defineEventHandler(async (event): Promise<ModelsResponse> => {
  // Curated models for Metacognition Arena - all support streamObject with Zod schemas
  const models: ModelConfig[] = [
    // Tier 1: Ultra-Fast & Cheap (Great for rapid gameplay)
    {
      id: "google/gemini-2.5-flash-lite",
      name: "Gemini 2.5 Flash Lite",
      provider: "google",
      description:
        "Ultra-fast, ultra-cheap - test if cheap models are overconfident",
      speed: "fast",
      cost: "low",
      pricing: {
        input: "$0.10/M",
        output: "$0.40/M",
      },
      contextWindow: "1M",
    },
    {
      id: "xai/grok-code-fast-1",
      name: "Grok Code Fast",
      provider: "xai",
      description: "Fast code-focused model from xAI with structured output",
      speed: "fast",
      cost: "low",
      pricing: {
        input: "$0.20/M",
        output: "$1.50/M",
      },
      contextWindow: "256K",
    },
    {
      id: "openai/gpt-5-mini",
      name: "GPT-5 mini",
      provider: "openai",
      description: "Compact flagship - fast with great structured output support",
      speed: "fast",
      cost: "low",
      pricing: {
        input: "$0.25/M",
        output: "$2.00/M",
      },
      contextWindow: "400K",
    },

    // Tier 2: Fast & Balanced (Sweet spot for demos)
    {
      id: "google/gemini-2.5-flash",
      name: "Gemini 2.5 Flash",
      provider: "google",
      description: "Fast and capable - good balance of speed and intelligence",
      speed: "fast",
      cost: "low",
      pricing: {
        input: "$0.30/M",
        output: "$2.50/M",
      },
      contextWindow: "1M",
    },
    {
      id: "anthropic/claude-haiku-4.5",
      name: "Claude Haiku 4.5",
      provider: "anthropic",
      description: "Fast Claude with excellent calibration and tool-use",
      speed: "fast",
      cost: "medium",
      pricing: {
        input: "$1.00/M",
        output: "$5.00/M",
      },
      contextWindow: "200K",
    },

    // Tier 3: Premium Intelligence (Show calibration quality)
    {
      id: "openai/gpt-5",
      name: "GPT-5",
      provider: "openai",
      description:
        "Latest flagship - state-of-the-art reasoning and calibration",
      speed: "medium",
      cost: "medium",
      pricing: {
        input: "$1.25/M",
        output: "$10.00/M",
      },
      contextWindow: "400K",
    },
    {
      id: "google/gemini-3-pro-preview",
      name: "Gemini 3 Pro Preview",
      provider: "google",
      description:
        "Most intelligent Gemini - tops benchmarks, strong calibration",
      speed: "medium",
      cost: "medium",
      pricing: {
        input: "$2.00/M",
        output: "$12.00/M",
      },
      contextWindow: "1M",
    },
    {
      id: "anthropic/claude-sonnet-4.5",
      name: "Claude Sonnet 4.5",
      provider: "anthropic",
      description: "Premium Claude - exceptional reasoning and self-awareness",
      speed: "medium",
      cost: "high",
      pricing: {
        input: "$3.00/M",
        output: "$15.00/M",
      },
      contextWindow: "200K",
    },

    // Tier 4: Reasoning Models (Research Question)
    {
      id: "openai/o3-mini",
      name: "o3-mini",
      provider: "openai",
      description: "Reasoning model - extended chain-of-thought, test calibration",
      speed: "slow",
      cost: "medium",
      pricing: {
        input: "$1.10/M",
        output: "$4.40/M",
      },
      contextWindow: "200K",
    },
    {
      id: "deepseek/deepseek-r1",
      name: "DeepSeek R1",
      provider: "deepseek",
      description: "Open reasoning model - explicit thinking process",
      speed: "medium",
      cost: "low",
      pricing: {
        input: "$0.55/M",
        output: "$2.19/M",
      },
      contextWindow: "64K",
    },
  ];

  return {
    models,
  };
});
