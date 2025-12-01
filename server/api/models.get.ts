/**
 * API endpoint to get available AI models via Vercel AI Gateway
 */

interface ModelConfig {
  id: string;
  name: string;
  provider: "openai" | "anthropic" | "google" | "xai";
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
  // Only fast and cheap models from Vercel AI Gateway
  const models: ModelConfig[] = [
    {
      id: "google/gemini-2.5-flash-lite",
      name: "Gemini 2.5 Flash-Lite",
      provider: "google",
      description:
        "Cheapest and fastest - optimized for speed and cost-efficiency",
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
      description: "Fast code-focused model from xAI",
      speed: "fast",
      cost: "low",
      pricing: {
        input: "$0.20/M",
        output: "$1.50/M",
      },
      contextWindow: "256K",
    },
    {
      id: "google/gemini-2.5-flash",
      name: "Gemini 2.5 Flash",
      provider: "google",
      description: "Fast model with good capabilities and low cost",
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
      description: "Fast, low-latency Claude model - great for quick decisions",
      speed: "fast",
      cost: "low",
      pricing: {
        input: "$1.00/M",
        output: "$5.00/M",
      },
      contextWindow: "200K",
    },
    {
      id: "openai/gpt-5",
      name: "GPT-5",
      provider: "openai",
      description:
        "Latest flagship - state-of-the-art reasoning (slightly more expensive)",
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
        "Most intelligent Gemini - tops benchmarks (mid-range pricing)",
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
      description: "Best coding model in the world (mid-range pricing)",
      speed: "medium",
      cost: "medium",
      pricing: {
        input: "$3.00/M",
        output: "$15.00/M",
      },
      contextWindow: "200K",
    },
  ];

  return {
    models,
  };
});
