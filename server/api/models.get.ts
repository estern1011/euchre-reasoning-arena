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
    // OpenAI models
    {
      id: "gpt-4",
      name: "GPT-4",
      provider: "openai",
      description: "Most capable OpenAI model, best for complex reasoning",
      speed: "slow",
      cost: "high",
    },
    {
      id: "gpt-4-turbo",
      name: "GPT-4 Turbo",
      provider: "openai",
      description: "Faster GPT-4 variant with good reasoning",
      speed: "medium",
      cost: "medium",
    },
    {
      id: "gpt-3.5-turbo",
      name: "GPT-3.5 Turbo",
      provider: "openai",
      description: "Fast and cost-effective, good for simple tasks",
      speed: "fast",
      cost: "low",
    },

    // Anthropic models
    {
      id: "claude-3-5-sonnet-20241022",
      name: "Claude 3.5 Sonnet",
      provider: "anthropic",
      description: "Most intelligent Claude model, excellent reasoning",
      speed: "medium",
      cost: "medium",
    },
    {
      id: "claude-3-haiku-20240307",
      name: "Claude 3 Haiku",
      provider: "anthropic",
      description: "Fastest Claude model, good for quick decisions",
      speed: "fast",
      cost: "low",
    },

    // Google models
    {
      id: "gemini-1.5-pro",
      name: "Gemini 1.5 Pro",
      provider: "google",
      description: "Advanced Google model with strong reasoning",
      speed: "medium",
      cost: "medium",
    },
    {
      id: "gemini-1.5-flash",
      name: "Gemini 1.5 Flash",
      provider: "google",
      description: "Fast Google model for quick responses",
      speed: "fast",
      cost: "low",
    },
  ];

  return {
    models,
  };
});
