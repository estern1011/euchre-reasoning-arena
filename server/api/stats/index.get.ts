/**
 * GET /api/stats
 * Main stats API endpoint for visualization
 * Returns calibration data structured for charts and stats pages
 */

import {
  getAllGamesWithStats,
  getModelAggregateStats,
  isDbAvailable,
  type ModelCalibrationStats,
} from "../../db/logger";

export interface StatsResponse {
  available: boolean;
  totalGames: number;
  models: ModelSummary[];
  recentGames: GameSummary[];
  calibrationCurve: CalibrationCurvePoint[];
}

interface ModelSummary {
  modelId: string;
  displayName: string;
  provider: string;
  gamesPlayed: number;
  wins: number;
  winRate: number;
  avgCalibrationScore: number;
  avgConfidence: number;
  avgSuccessRate: number;
  avgToolUsage: number;
  calibrationGap: number; // abs(confidence - success rate)
}

interface GameSummary {
  id: number;
  presetName: string | null;
  winner: "team1" | "team2";
  score: string;
  totalHands: number;
  duration: string;
  timestamp: string;
  models: {
    north: string;
    east: string;
    south: string;
    west: string;
  };
  calibration: {
    north: number;
    east: number;
    south: number;
    west: number;
  };
}

interface CalibrationCurvePoint {
  confidenceBucket: string;
  avgConfidence: number;
  avgSuccessRate: number;
  totalDecisions: number;
  // Per-model breakdown
  byModel: Record<string, { confidence: number; successRate: number; decisions: number }>;
}

export default defineEventHandler(async (event): Promise<StatsResponse> => {
  if (!isDbAvailable()) {
    return {
      available: false,
      totalGames: 0,
      models: [],
      recentGames: [],
      calibrationCurve: [],
    };
  }

  try {
    const games = getAllGamesWithStats();

    // Aggregate model stats
    const modelIds = new Set<string>();
    games.forEach((g) => {
      modelIds.add(g.models.north);
      modelIds.add(g.models.east);
      modelIds.add(g.models.south);
      modelIds.add(g.models.west);
    });

    const models: ModelSummary[] = [];
    for (const modelId of modelIds) {
      const stats = getModelAggregateStats(modelId);
      if (stats) {
        const [provider, name] = modelId.split("/");
        models.push({
          modelId,
          displayName: formatModelName(name || modelId),
          provider: provider || "unknown",
          gamesPlayed: stats.gamesPlayed,
          wins: stats.wins,
          winRate:
            stats.gamesPlayed > 0
              ? Math.round((stats.wins / stats.gamesPlayed) * 1000) / 10
              : 0,
          avgCalibrationScore: stats.avgCalibrationScore,
          avgConfidence: stats.avgConfidence,
          avgSuccessRate: stats.avgSuccessRate,
          avgToolUsage: stats.avgToolUsage,
          calibrationGap: Math.round(Math.abs(stats.avgConfidence - stats.avgSuccessRate) * 10) / 10,
        });
      }
    }

    // Sort by calibration score (best first)
    models.sort((a, b) => b.avgCalibrationScore - a.avgCalibrationScore);

    // Format recent games
    type GameData = ReturnType<typeof getAllGamesWithStats>[number];
    const recentGames: GameSummary[] = games.slice(0, 20).map((g: GameData) => {
      const calibrationByPos = g.calibration.reduce(
        (acc: Record<string, number>, c: ModelCalibrationStats) => {
          acc[c.position] = c.calibrationScore;
          return acc;
        },
        {} as Record<string, number>,
      );

      return {
        id: g.id,
        presetName: g.presetName,
        winner: g.winner as "team1" | "team2",
        score: `${g.team1Score}-${g.team2Score}`,
        totalHands: g.totalHands,
        duration: formatDuration(g.durationMs),
        timestamp: new Date(g.completedAt).toISOString(),
        models: g.models,
        calibration: {
          north: calibrationByPos.north || 0,
          east: calibrationByPos.east || 0,
          south: calibrationByPos.south || 0,
          west: calibrationByPos.west || 0,
        },
      };
    });

    // Build calibration curve data
    const calibrationCurve = buildCalibrationCurve(games);

    return {
      available: true,
      totalGames: games.length,
      models,
      recentGames,
      calibrationCurve,
    };
  } catch (error) {
    console.error("[Stats API] Error:", error);
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : "Failed to fetch stats",
    });
  }
});

function formatModelName(name: string): string {
  return name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

function buildCalibrationCurve(
  games: Array<{ calibration: ModelCalibrationStats[] }>,
): CalibrationCurvePoint[] {
  const bucketLabels = ["0-20%", "20-40%", "40-60%", "60-80%", "80-100%"];
  const bucketMidpoints = [10, 30, 50, 70, 90];

  // Aggregate bucket data across all games
  const aggregated = bucketLabels.map((label, idx) => {
    const byModel: Record<string, { totalConf: number; totalSuccess: number; count: number }> = {};
    let totalDecisions = 0;
    let totalSuccessful = 0;

    for (const game of games) {
      for (const cal of game.calibration) {
        const bucket = cal.buckets.find((b: { confidenceRange: string; totalDecisions: number; successfulDecisions: number }) => b.confidenceRange === label);
        if (bucket && bucket.totalDecisions > 0) {
          if (!byModel[cal.modelId]) {
            byModel[cal.modelId] = { totalConf: 0, totalSuccess: 0, count: 0 };
          }
          byModel[cal.modelId]!.totalConf += bucketMidpoints[idx]! * bucket.totalDecisions;
          byModel[cal.modelId]!.totalSuccess += bucket.successfulDecisions;
          byModel[cal.modelId]!.count += bucket.totalDecisions;

          totalDecisions += bucket.totalDecisions;
          totalSuccessful += bucket.successfulDecisions;
        }
      }
    }

    const modelBreakdown: Record<
      string,
      { confidence: number; successRate: number; decisions: number }
    > = {};
    for (const [modelId, data] of Object.entries(byModel)) {
      if (data.count > 0) {
        modelBreakdown[modelId] = {
          confidence: Math.round((data.totalConf / data.count) * 10) / 10,
          successRate: Math.round((data.totalSuccess / data.count) * 1000) / 10,
          decisions: data.count,
        };
      }
    }

    return {
      confidenceBucket: label,
      avgConfidence: bucketMidpoints[idx]!,
      avgSuccessRate:
        totalDecisions > 0 ? Math.round((totalSuccessful / totalDecisions) * 1000) / 10 : 0,
      totalDecisions,
      byModel: modelBreakdown,
    };
  });

  return aggregated;
}
