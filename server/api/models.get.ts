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
    // OpenAI models (latest)
    {
      id: "gpt-4o",
      name: "GPT-4o",
      provider: "openai",
      description: "Latest flagship model, fastest and most capable GPT-4",
      speed: "fast",
      cost: "medium",
    },
    {
      id: "gpt-4o-mini",
      name: "GPT-4o Mini",
      provider: "openai",
      description: "Smaller, faster GPT-4o variant, cost-effective",
      speed: "fast",
      cost: "low",
    },
    {
      id: "o1-preview",
      name: "o1-preview",
      provider: "openai",
      description: "Reasoning model optimized for complex strategic thinking",
      speed: "slow",
      cost: "high",
    },
    {
      id: "o1-mini",
      name: "o1-mini",
      provider: "openai",
      description: "Faster reasoning model, good for strategic tasks",
      speed: "medium",
      cost: "medium",
    },

    // Anthropic models (latest)
    {
      id: "claude-3-5-sonnet-20241022",
      name: "Claude 3.5 Sonnet (New)",
      provider: "anthropic",
      description: "Latest Claude with improved reasoning and analysis",
      speed: "medium",
      cost: "medium",
    },
    {
      id: "claude-3-5-haiku-20241022",
      name: "Claude 3.5 Haiku",
      provider: "anthropic",
      description: "Fast, intelligent Claude model for quick decisions",
      speed: "fast",
      cost: "low",
    },
    {
      id: "claude-3-opus-20240229",
      name: "Claude 3 Opus",
      provider: "anthropic",
      description: "Most capable Claude 3 model for complex reasoning",
      speed: "slow",
      cost: "high",
    },

    // Google models (latest)
    {
      id: "gemini-2.0-flash-exp",
      name: "Gemini 2.0 Flash (Experimental)",
      provider: "google",
      description: "Next-gen Gemini with enhanced multimodal capabilities",
      speed: "fast",
      cost: "low",
    },
    {
      id: "gemini-1.5-pro",
      name: "Gemini 1.5 Pro",
      provider: "google",
      description: "Advanced Google model with 1M token context",
      speed: "medium",
      cost: "medium",
    },
    {
      id: "gemini-1.5-flash",
      name: "Gemini 1.5 Flash",
      provider: "google",
      description: "Fast and efficient Gemini model",
      speed: "fast",
      cost: "low",
    },
  ];

  return {
    models,
  };
});
