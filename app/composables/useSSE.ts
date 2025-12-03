import { ref, computed } from "vue";
import type { Position } from "~/lib/game/types";

/**
 * SSE (Server-Sent Events) composable for real-time streaming
 * Handles connection management, reconnection, and message parsing
 */

export type SSEConnectionState = "disconnected" | "connecting" | "connected" | "error";

export interface SSEMessage {
  type: "reasoning_token" | "decision_made" | "round_complete" | "error";
  player?: Position;
  token?: string;
  data?: any;
}

export interface StreamingReasoning {
  [key: string]: string; // player position -> accumulated reasoning
}

const connectionState = ref<SSEConnectionState>("disconnected");
const streamingReasoning = ref<StreamingReasoning>({});
const currentEventSource = ref<EventSource | null>(null);

export function useSSE() {
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 3;

  /**
   * Connect to SSE endpoint and start streaming
   */
  function connect(url: string, onMessage?: (message: SSEMessage) => void) {
    // Close existing connection
    disconnect();

    connectionState.value = "connecting";

    try {
      const eventSource = new EventSource(url);
      currentEventSource.value = eventSource;

      eventSource.onopen = () => {
        connectionState.value = "connected";
        reconnectAttempts = 0;
      };

      eventSource.onmessage = (event) => {
        try {
          const message: SSEMessage = JSON.parse(event.data);
          handleMessage(message);

          if (onMessage) {
            onMessage(message);
          }
        } catch (error) {
          console.error("Failed to parse SSE message:", error);
        }
      };

      eventSource.onerror = (error) => {
        console.error("SSE error:", error);
        connectionState.value = "error";

        // Attempt reconnection with exponential backoff
        if (reconnectAttempts < maxReconnectAttempts) {
          const backoffMs = Math.pow(2, reconnectAttempts) * 1000;
          reconnectAttempts++;

          setTimeout(() => {
            if (connectionState.value === "error") {
              connect(url, onMessage);
            }
          }, backoffMs);
        } else {
          // Max retries exceeded
          disconnect();
        }
      };
    } catch (error) {
      console.error("Failed to create EventSource:", error);
      connectionState.value = "error";
    }
  }

  /**
   * Handle incoming SSE messages
   */
  function handleMessage(message: SSEMessage) {
    switch (message.type) {
      case "reasoning_token":
        if (message.player && message.token) {
          // Accumulate reasoning tokens for each player
          if (!streamingReasoning.value[message.player]) {
            streamingReasoning.value[message.player] = "";
          }
          streamingReasoning.value[message.player] += message.token;
        }
        break;

      case "decision_made":
        // Decision complete for a player
        break;

      case "round_complete":
        // Round finished
        disconnect();
        break;

      case "error":
        console.error("SSE error message:", message.data);
        connectionState.value = "error";
        break;
    }
  }

  /**
   * Disconnect from SSE stream
   */
  function disconnect() {
    if (currentEventSource.value) {
      currentEventSource.value.close();
      currentEventSource.value = null;
    }
    connectionState.value = "disconnected";
  }

  /**
   * Clear streaming reasoning for a new round
   */
  function clearReasoning() {
    streamingReasoning.value = {};
  }

  /**
   * Get reasoning for a specific player
   */
  function getPlayerReasoning(player: Position): string {
    return streamingReasoning.value[player] || "";
  }

  /**
   * Check if connected to SSE stream
   */
  const isConnected = computed(() => connectionState.value === "connected");

  /**
   * Check if currently connecting
   */
  const isConnecting = computed(() => connectionState.value === "connecting");

  /**
   * Check if there's a connection error
   */
  const hasError = computed(() => connectionState.value === "error");

  return {
    // State
    connectionState: computed(() => connectionState.value),
    streamingReasoning: computed(() => streamingReasoning.value),
    isConnected,
    isConnecting,
    hasError,

    // Actions
    connect,
    disconnect,
    clearReasoning,
    getPlayerReasoning,
  };
}
