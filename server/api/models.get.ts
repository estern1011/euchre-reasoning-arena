/**
 * API endpoint to get available AI models
 */

interface ModelConfig {
  id: string;
  name: string;
  provider: "openai" | "anthropic" | "google";
  description: string;
  speed: "fast" | "medium" | "slow";
  cost: "low" | "medium" | "high";
}

interface ModelsResponse {
  models: ModelConfig[];
}

export default defineEventHandler(async (event): Promise<ModelsResponse> => {
  const models: ModelConfig[] = [
    // OpenAI models (2025 latest)
    {
      id: "gpt-5",
      name: "GPT-5",
      provider: "openai",
      description:
        "Latest flagship - state-of-the-art reasoning and multimodal (Jan 2025)",
      speed: "medium",
      cost: "high",
    },
    {
      id: "o3-pro",
      name: "o3-pro",
      provider: "openai",
      description: "Most intelligent reasoning model, thinks longest (2025)",
      speed: "slow",
      cost: "high",
    },
    {
      id: "o3",
      name: "o3",
      provider: "openai",
      description:
        "Advanced reasoning with tool use - 20% fewer errors than o1 (2025)",
      speed: "slow",
      cost: "high",
    },
    {
      id: "o3-mini",
      name: "o3-mini",
      provider: "openai",
      description: "Cost-efficient reasoning for coding, math, science (2025)",
      speed: "medium",
      cost: "medium",
    },
    {
      id: "gpt-4o",
      name: "GPT-4o",
      provider: "openai",
      description: "Fast general-purpose model",
      speed: "fast",
      cost: "medium",
    },

    // Anthropic models (2025 latest)
    {
      id: "claude-opus-4-5",
      name: "Claude Opus 4.5",
      provider: "anthropic",
      description:
        "Most intelligent Claude - excels at coding and agents (Nov 2025)",
      speed: "slow",
      cost: "high",
    },
    {
      id: "claude-sonnet-4-5",
      name: "Claude Sonnet 4.5",
      provider: "anthropic",
      description: "Best coding model in the world (Sep 2025)",
      speed: "medium",
      cost: "medium",
    },
    {
      id: "claude-haiku-4-5",
      name: "Claude Haiku 4.5",
      provider: "anthropic",
      description: "Fast, low-latency model optimized for cost (Oct 2025)",
      speed: "fast",
      cost: "low",
    },
    {
      id: "claude-opus-4",
      name: "Claude Opus 4",
      provider: "anthropic",
      description: "Advanced reasoning and coding (May 2025)",
      speed: "slow",
      cost: "high",
    },
    {
      id: "claude-sonnet-4",
      name: "Claude Sonnet 4",
      provider: "anthropic",
      description: "Balanced reasoning and speed (May 2025)",
      speed: "medium",
      cost: "medium",
    },

    // Google models (2025 latest)
    {
      id: "gemini-3-pro",
      name: "Gemini 3 Pro",
      provider: "google",
      description:
        "Most intelligent - tops 19/20 benchmarks, 1M context (Nov 2025)",
      speed: "medium",
      cost: "high",
    },
    {
      id: "gemini-3-deep-think",
      name: "Gemini 3 Deep Think",
      provider: "google",
      description: "Advanced reasoning model (Nov 2025)",
      speed: "slow",
      cost: "high",
    },
    {
      id: "gemini-2-5-pro",
      name: "Gemini 2.5 Pro",
      provider: "google",
      description: "Thinking model with enhanced reasoning (Mar 2025)",
      speed: "medium",
      cost: "medium",
    },
    {
      id: "gemini-2-5-flash",
      name: "Gemini 2.5 Flash",
      provider: "google",
      description: "Fast model with good capabilities (Jun 2025)",
      speed: "fast",
      cost: "low",
    },
    {
      id: "gemini-2-5-flash-lite",
      name: "Gemini 2.5 Flash-Lite",
      provider: "google",
      description: "Optimized for speed and cost-efficiency (Jun 2025)",
      speed: "fast",
      cost: "low",
    },
  ];

  return {
    models,
  };
});
