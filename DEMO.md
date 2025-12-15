# Demo Guide - Euchre Reasoning Arena

Welcome to the Euchre Reasoning Arena! This guide walks you through the platform's key features for evaluating AI metacognition.

---

## What This Platform Does

Traditional AI benchmarks measure what models know. This platform measures something different: **whether models know what they don't know**.

We call this *calibration* - the alignment between a model's confidence and its actual accuracy. A well-calibrated model:
- Is confident when it's right
- Is uncertain when it's unsure
- Asks for help when it needs it

---

## Getting Started

### 1. Configure Your Game

On the landing page, you'll assign AI models to each seat at the table:

- **North/South** are teammates (Team 1)
- **East/West** are teammates (Team 2)

Each player can have a different **prompt mode**:
| Mode | Dot Color | Strategy |
|------|-----------|----------|
| raw | Grey | No strategic guidance |
| safe | Green | Conservative play |
| neutral | Yellow | Balanced tips |
| yolo | Red | Aggressive risk-taking |

Try mixing models and modes to see how behavior changes!

### 2. Watch the Game

Click **startGame()** to begin. You'll see:

- **Game Board** - Cards dealt to each player, with the turned-up card in the center
- **Colored Dots** - Each player's prompt mode at a glance
- **Real-time Reasoning** - Watch models think through decisions as they stream

### 3. Observe Tool Usage

Models can request "lifeline" tools when uncertain:

| Tool | Cost | What It Does |
|------|------|--------------|
| Ask Audience | 2 pts | Polls simulated audience |
| Situation Lookup | 1 pt | References play recommendations |
| 50/50 | 3 pts | Eliminates wrong options |

**Key insight:** Well-calibrated models use tools when uncertain and save points when confident.

---

## Exploring the Interface

### Intelligence Panel (Right Side)

- **Performance** - Calibration scores and decision accuracy per player
- **Hand Strength** - Analysis of optimal plays
- **Tools** - Which models asked for help and at what cost

### View Prompt Button

Click **viewPrompt()** to inspect exactly what prompt each model receives. Notice how the mode badge shows which strategy is active.

### View History Button

Click **viewHistory()** to see every decision with:
- Full reasoning text
- Confidence level reported
- Any tools used
- Mode badge for context

---

## What to Look For

1. **Confidence vs Accuracy** - Do high-confidence decisions tend to be correct?
2. **Tool Usage Patterns** - Which models ask for help? When?
3. **Mode Effects** - How does "yolo" vs "safe" change behavior?
4. **Calibration Scores** - Lower Brier scores indicate better calibration

---

## After the Game

Navigate to the **Analysis** page for:
- AI-generated insights about patterns observed
- Performance scoreboard ranked by calibration
- Complete audit trail of all decisions

---

## Tips for Interesting Experiments

- **Same model, different modes** - Put Claude Haiku in all 4 seats with different presets
- **Cross-model comparison** - Pit Claude vs GPT vs Gemini
- **Watch for overconfidence** - Some models rarely admit uncertainty
- **Look for tool avoiders** - Some models never ask for help even when wrong

---

## Technical Notes

- Games use Server-Sent Events for real-time streaming
- All reasoning is captured and can be exported
- Scoring uses Brier scores (proper scoring rule for calibration)
- Tool calls are implemented via AI SDK tool use

Enjoy exploring AI metacognition!
