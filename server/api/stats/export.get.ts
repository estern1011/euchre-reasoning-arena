/**
 * Export game statistics for README and analysis
 * GET /api/stats/export?format=json|markdown
 */

import { getAllGamesWithStats, isDbAvailable, type ModelCalibrationStats } from "../../db/logger";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const format = (query.format as string) || "json";

  if (!isDbAvailable()) {
    if (format === "markdown") {
      return "# Game Statistics\n\n*Database not available in this environment.*\n\nRun locally with `bun run dev` to collect stats.";
    }
    return { available: false, message: "Database not available" };
  }

  try {
    const games = getAllGamesWithStats();

    if (format === "markdown") {
      return generateMarkdownReport(games);
    }

    type GameData = ReturnType<typeof getAllGamesWithStats>[number];
    return {
      available: true,
      totalGames: games.length,
      games: games.map((g: GameData) => ({
        id: g.id,
        presetName: g.presetName,
        models: g.models,
        outcome: {
          winner: g.winner,
          team1Score: g.team1Score,
          team2Score: g.team2Score,
          totalHands: g.totalHands,
        },
        calibration: g.calibration.map((c: ModelCalibrationStats) => ({
          position: c.position,
          modelId: c.modelId,
          calibrationScore: c.calibrationScore,
          brierScore: c.brierScore,
          avgConfidence: c.averageConfidence,
          actualSuccessRate: c.actualSuccessRate,
          toolUsageRate: c.toolUsageRate,
          buckets: c.buckets,
        })),
        performance: {
          durationMs: g.durationMs,
        },
        timestamp: new Date(g.completedAt).toISOString(),
      })),
    };
  } catch (error) {
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : "Failed to export stats",
    });
  }
});

interface GameWithCalibration {
  id: number;
  presetName: string | null;
  winner: string;
  team1Score: number;
  team2Score: number;
  totalHands: number;
  durationMs: number;
  completedAt: number;
  models: { north: string; east: string; south: string; west: string };
  calibration: ModelCalibrationStats[];
}

function generateMarkdownReport(games: GameWithCalibration[]): string {
  if (games.length === 0) {
    return "# Metacognition Arena - Game Statistics\n\nNo completed games yet. Run some games locally to collect data!";
  }

  // Aggregate stats by model
  const modelStats = new Map<
    string,
    {
      decisions: number;
      successfulDecisions: number;
      totalConfidence: number;
      toolRequests: number;
      games: number;
      wins: number;
    }
  >();

  for (const game of games) {
    for (const cal of game.calibration) {
      if (!modelStats.has(cal.modelId)) {
        modelStats.set(cal.modelId, {
          decisions: 0,
          successfulDecisions: 0,
          totalConfidence: 0,
          toolRequests: 0,
          games: 0,
          wins: 0,
        });
      }
      const stats = modelStats.get(cal.modelId)!;
      stats.decisions += cal.totalDecisions;
      stats.successfulDecisions += Math.round((cal.actualSuccessRate / 100) * cal.totalDecisions);
      stats.totalConfidence += cal.averageConfidence * cal.totalDecisions;
      stats.toolRequests += Math.round((cal.toolUsageRate / 100) * cal.totalDecisions);
      stats.games++;

      // Check if this model won
      const isTeam1 = cal.position === "north" || cal.position === "south";
      if ((isTeam1 && game.winner === "team1") || (!isTeam1 && game.winner === "team2")) {
        stats.wins++;
      }
    }
  }

  let markdown = "# Metacognition Arena - Game Statistics\n\n";
  markdown += `> *Generated: ${new Date().toISOString()}*\n\n`;
  markdown += `**Total Games Played:** ${games.length}\n\n`;

  // Model Comparison Table
  markdown += "## Model Calibration Rankings\n\n";
  markdown += "| Model | Games | Win Rate | Avg Confidence | Success Rate | Calibration Gap | Tool Usage |\n";
  markdown += "|-------|-------|----------|----------------|--------------|-----------------|------------|\n";

  const sortedModels = [...modelStats.entries()]
    .map(([modelId, stats]) => {
      const avgConf = stats.decisions > 0 ? stats.totalConfidence / stats.decisions : 50;
      const successRate = stats.decisions > 0 ? (stats.successfulDecisions / stats.decisions) * 100 : 50;
      const gap = Math.abs(avgConf - successRate);
      const toolRate = stats.decisions > 0 ? (stats.toolRequests / stats.decisions) * 100 : 0;
      const winRate = stats.games > 0 ? (stats.wins / stats.games) * 100 : 0;

      return { modelId, stats, avgConf, successRate, gap, toolRate, winRate };
    })
    .sort((a, b) => a.gap - b.gap); // Best calibration (lowest gap) first

  for (const { modelId, stats, avgConf, successRate, gap, toolRate, winRate } of sortedModels) {
    const displayName = modelId.split("/")[1] || modelId;
    const gapEmoji = gap < 10 ? "🎯" : gap < 20 ? "✓" : "⚠️";
    markdown += `| ${displayName} | ${stats.games} | ${winRate.toFixed(0)}% | ${avgConf.toFixed(1)}% | ${successRate.toFixed(1)}% | ${gapEmoji} ${gap.toFixed(1)}% | ${toolRate.toFixed(1)}% |\n`;
  }

  markdown += "\n*Calibration Gap = |Avg Confidence - Success Rate|. Lower is better (🎯 < 10%, ✓ < 20%, ⚠️ ≥ 20%)*\n\n";

  // Key Insights
  markdown += "## Key Insights\n\n";

  const bestCalibrated = sortedModels[0];
  const worstCalibrated = sortedModels[sortedModels.length - 1];
  const mostConfident = [...sortedModels].sort((a, b) => b.avgConf - a.avgConf)[0];
  const mostToolUse = [...sortedModels].sort((a, b) => b.toolRate - a.toolRate)[0];

  if (bestCalibrated) {
    markdown += `- **Best Calibrated:** ${bestCalibrated.modelId.split("/")[1]} (${bestCalibrated.gap.toFixed(1)}% gap)\n`;
  }
  if (worstCalibrated && worstCalibrated !== bestCalibrated) {
    markdown += `- **Worst Calibrated:** ${worstCalibrated.modelId.split("/")[1]} (${worstCalibrated.gap.toFixed(1)}% gap)\n`;
  }
  if (mostConfident) {
    markdown += `- **Most Confident:** ${mostConfident.modelId.split("/")[1]} (${mostConfident.avgConf.toFixed(1)}% avg)\n`;
  }
  if (mostToolUse && mostToolUse.toolRate > 0) {
    markdown += `- **Most Tool Use:** ${mostToolUse.modelId.split("/")[1]} (${mostToolUse.toolRate.toFixed(1)}%)\n`;
  }

  markdown += "\n";

  // Recent Games
  markdown += "## Recent Games\n\n";
  markdown += "| Game | Preset | Winner | Score | Hands | Duration |\n";
  markdown += "|------|--------|--------|-------|-------|----------|\n";

  games.slice(0, 10).forEach((game, idx) => {
    const preset = game.presetName || "custom";
    const winner = game.winner === "team1" ? "N-S" : "E-W";
    const duration = Math.round(game.durationMs / 1000);
    markdown += `| #${game.id} | ${preset} | ${winner} | ${game.team1Score}-${game.team2Score} | ${game.totalHands} | ${duration}s |\n`;
  });

  markdown += "\n---\n\n";
  markdown += "*Data collected with [Euchre Arena](https://github.com/your-repo) during local testing.*\n";

  return markdown;
}
