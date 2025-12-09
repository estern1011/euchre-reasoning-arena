-- Metacognition Arena Database Schema
-- SQLite schema for tracking AI calibration and tool usage in Euchre

-- Games: Individual Euchre games with model configurations
CREATE TABLE IF NOT EXISTS games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Model configuration
  north_model TEXT NOT NULL,  -- e.g., "anthropic/claude-sonnet-4.5"
  east_model TEXT NOT NULL,
  south_model TEXT NOT NULL,
  west_model TEXT NOT NULL,

  -- Game configuration
  winning_score INTEGER NOT NULL DEFAULT 10,
  preset_name TEXT, -- e.g., "budgetBattle", "premiumShowdown"

  -- Game outcome
  team1_score INTEGER,  -- North-South team
  team2_score INTEGER,  -- East-West team
  winner TEXT CHECK(winner IN ('team1', 'team2')),
  total_hands INTEGER,

  -- Calibration metrics (aggregated at end of game)
  north_calibration_score REAL,
  east_calibration_score REAL,
  south_calibration_score REAL,
  west_calibration_score REAL,

  -- Tool usage stats
  north_tool_count INTEGER DEFAULT 0,
  east_tool_count INTEGER DEFAULT 0,
  south_tool_count INTEGER DEFAULT 0,
  west_tool_count INTEGER DEFAULT 0,

  -- Cost tracking
  total_input_tokens INTEGER DEFAULT 0,
  total_output_tokens INTEGER DEFAULT 0,
  estimated_cost_usd REAL DEFAULT 0.0,

  -- Timestamps
  started_at INTEGER NOT NULL, -- Unix timestamp
  completed_at INTEGER,
  duration_ms INTEGER,

  -- Metadata
  error_count INTEGER DEFAULT 0,
  metadata TEXT -- JSON string for additional data
);

-- Hands: Individual hands within a game
CREATE TABLE IF NOT EXISTS hands (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  hand_number INTEGER NOT NULL,

  -- Trump selection
  trump_suit TEXT CHECK(trump_suit IN ('hearts', 'diamonds', 'clubs', 'spades')),
  trump_maker_position INTEGER CHECK(trump_maker_position IN (0, 1, 2, 3)), -- 0=north, 1=east, 2=south, 3=west
  turned_up_card TEXT,

  -- Hand outcome
  team1_tricks INTEGER DEFAULT 0,
  team2_tricks INTEGER DEFAULT 0,
  team1_points INTEGER DEFAULT 0,
  team2_points INTEGER DEFAULT 0,
  euchred INTEGER DEFAULT 0, -- Boolean (0 or 1)
  going_alone INTEGER DEFAULT 0, -- Boolean
  going_alone_position INTEGER,

  -- Dealer info
  dealer_position INTEGER NOT NULL CHECK(dealer_position IN (0, 1, 2, 3)),
  dealer_discard_card TEXT,

  created_at INTEGER NOT NULL -- Unix timestamp
);

-- Decisions: All AI decisions (trump bids, card plays, discards) with confidence
CREATE TABLE IF NOT EXISTS decisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hand_id INTEGER NOT NULL REFERENCES hands(id) ON DELETE CASCADE,

  -- Decision context
  decision_type TEXT NOT NULL CHECK(decision_type IN ('trump_bid', 'card_play', 'discard')),
  agent_position INTEGER NOT NULL CHECK(agent_position IN (0, 1, 2, 3)),
  model_id TEXT NOT NULL,

  -- Decision specifics
  action TEXT NOT NULL, -- e.g., "order_up", "pass", "call_trump", card name
  reasoning TEXT NOT NULL,

  -- Metacognition features
  confidence INTEGER NOT NULL CHECK(confidence >= 0 AND confidence <= 100),
  tool_requested TEXT, -- e.g., "ask_audience", "situation_lookup", "fifty_fifty", "none"
  tool_used TEXT, -- What tool was actually executed (if any)

  -- Decision outcome
  was_legal INTEGER NOT NULL DEFAULT 1, -- Boolean
  was_successful INTEGER, -- Boolean - did this decision contribute to winning?
  trick_number INTEGER, -- For card plays
  trump_round INTEGER, -- For trump bids (1 or 2)

  -- Performance tracking
  decision_time_ms INTEGER,
  input_tokens INTEGER,
  output_tokens INTEGER,

  -- Game state snapshot
  game_state TEXT, -- JSON string of game state
  legal_options TEXT, -- JSON array of legal options

  created_at INTEGER NOT NULL -- Unix timestamp
);

-- Tool Executions: Track tool usage details
CREATE TABLE IF NOT EXISTS tool_executions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  decision_id INTEGER NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,

  -- Tool details
  tool_name TEXT NOT NULL CHECK(tool_name IN ('ask_audience', 'situation_lookup', 'fifty_fifty')),
  agent_position INTEGER NOT NULL CHECK(agent_position IN (0, 1, 2, 3)),

  -- Execution details
  success INTEGER NOT NULL DEFAULT 1, -- Boolean
  result TEXT NOT NULL, -- JSON string of tool result
  cost_points INTEGER NOT NULL, -- Point cost for using this tool

  -- Performance
  execution_time_ms INTEGER NOT NULL,

  -- Did it help?
  decision_changed INTEGER, -- Boolean - did agent change decision after tool?
  improved_outcome INTEGER, -- Boolean - did tool improve the outcome?

  created_at INTEGER NOT NULL -- Unix timestamp
);

-- Card Plays: Detailed tracking of every card played (denormalized for analysis)
CREATE TABLE IF NOT EXISTS card_plays (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hand_id INTEGER NOT NULL REFERENCES hands(id) ON DELETE CASCADE,
  decision_id INTEGER NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,

  trick_number INTEGER NOT NULL,
  agent_position INTEGER NOT NULL CHECK(agent_position IN (0, 1, 2, 3)),
  play_order INTEGER NOT NULL CHECK(play_order IN (1, 2, 3, 4)),

  -- Card played
  card_rank TEXT NOT NULL,
  card_suit TEXT NOT NULL,

  -- Context
  lead_suit TEXT,
  trump_suit TEXT NOT NULL,
  legal_cards TEXT, -- JSON array
  cards_played_before TEXT, -- JSON array

  -- Outcome
  won_trick INTEGER NOT NULL DEFAULT 0, -- Boolean

  created_at INTEGER NOT NULL -- Unix timestamp
);

-- Calibration Analysis: Post-game calibration metrics per player
CREATE TABLE IF NOT EXISTS calibration_analysis (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  agent_position INTEGER NOT NULL CHECK(agent_position IN (0, 1, 2, 3)),
  model_id TEXT NOT NULL,

  -- Calibration metrics
  total_decisions INTEGER NOT NULL,
  average_confidence REAL NOT NULL,
  actual_success_rate REAL NOT NULL,
  calibration_score REAL NOT NULL, -- 0-100, higher is better

  -- Confidence buckets (for calibration curves)
  low_conf_decisions INTEGER DEFAULT 0,    -- 0-40% confidence
  low_conf_success_rate REAL,
  medium_conf_decisions INTEGER DEFAULT 0, -- 40-70% confidence
  medium_conf_success_rate REAL,
  high_conf_decisions INTEGER DEFAULT 0,   -- 70-100% confidence
  high_conf_success_rate REAL,

  -- Tool usage analysis
  total_tool_requests INTEGER DEFAULT 0,
  tools_on_low_confidence INTEGER DEFAULT 0,  -- Good behavior
  tools_on_high_confidence INTEGER DEFAULT 0, -- Potentially wasteful
  tool_success_rate REAL,

  -- Cost analysis
  total_input_tokens INTEGER DEFAULT 0,
  total_output_tokens INTEGER DEFAULT 0,
  estimated_cost_usd REAL DEFAULT 0.0,
  tool_points_spent INTEGER DEFAULT 0,

  created_at INTEGER NOT NULL -- Unix timestamp
);

-- Hand Strength Rankings: Track post-hand analysis of hand strength
CREATE TABLE IF NOT EXISTS hand_strength_rankings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hand_id INTEGER NOT NULL REFERENCES hands(id) ON DELETE CASCADE,

  -- Rankings
  north_rank INTEGER CHECK(north_rank BETWEEN 1 AND 4),
  east_rank INTEGER CHECK(east_rank BETWEEN 1 AND 4),
  south_rank INTEGER CHECK(south_rank BETWEEN 1 AND 4),
  west_rank INTEGER CHECK(west_rank BETWEEN 1 AND 4),

  -- Strength scores
  north_strength REAL,
  east_strength REAL,
  south_strength REAL,
  west_strength REAL,

  -- Analysis
  analysis_reasoning TEXT,
  created_at INTEGER NOT NULL -- Unix timestamp
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_games_completed ON games(completed_at);
CREATE INDEX IF NOT EXISTS idx_games_preset ON games(preset_name);
CREATE INDEX IF NOT EXISTS idx_hands_game ON hands(game_id);
CREATE INDEX IF NOT EXISTS idx_decisions_hand ON decisions(hand_id);
CREATE INDEX IF NOT EXISTS idx_decisions_position ON decisions(agent_position);
CREATE INDEX IF NOT EXISTS idx_decisions_confidence ON decisions(confidence);
CREATE INDEX IF NOT EXISTS idx_decisions_tool ON decisions(tool_requested);
CREATE INDEX IF NOT EXISTS idx_tool_executions_decision ON tool_executions(decision_id);
CREATE INDEX IF NOT EXISTS idx_card_plays_hand ON card_plays(hand_id);
CREATE INDEX IF NOT EXISTS idx_calibration_game ON calibration_analysis(game_id);
CREATE INDEX IF NOT EXISTS idx_hand_strength_hand ON hand_strength_rankings(hand_id);
