import { ref } from "vue";
import type { GameState } from "~/types/game";
import type { SSEMessage } from "../../lib/types/sse";

export type { SSEMessage } from "../../lib/types/sse";

export function useGameStreaming() {
  const isStreaming = ref(false);

  async function* streamGameRound(gameState: GameState): AsyncGenerator<SSEMessage> {
    isStreaming.value = true;

    try {
      const response = await fetch("/api/stream-next-round", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameState }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim() || !line.startsWith("data: ")) continue;

          try {
            const jsonStr = line.substring(6);
            const message = JSON.parse(jsonStr) as SSEMessage;
            yield message;
          } catch (parseError) {
            console.error("SSE Parse Error:", parseError);
          }
        }
      }
    } catch (error) {
      console.error("Streaming Error:", error);
      throw error;
    } finally {
      isStreaming.value = false;
    }
  }

  return {
    isStreaming,
    streamGameRound,
  };
}
