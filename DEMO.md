# Demo Script - Euchre Reasoning Arena

**Time:** ~5 minutes
**Goal:** Show that this platform evaluates AI metacognition, not just game performance

---

## Opening (30 sec)

> "Traditional benchmarks test what AI models know. But in production, we care more about whether models know what they DON'T know. A confidently wrong model is dangerous. We built Euchre Reasoning Arena to evaluate AI calibration - do models' confidence levels match their actual accuracy?"

---

## 1. Setup Page (45 sec)

**Show:** Landing page with model/preset configuration

**Talk through:**
- "We can pit different models against each other - Claude vs GPT vs Gemini"
- "Each player can have a different prompt strategy"
- Point to the preset buttons: "Raw gives no guidance, Safe is conservative, YOLO encourages risk-taking"
- "This lets us A/B test how the same model behaves with different prompts"

**Action:** Set up an interesting mix:
- North: Claude Haiku (yolo - red dot)
- East: Gemini Flash (safe - green dot)
- South: GPT-5 mini (neutral - yellow dot)
- West: Claude Haiku (raw - grey dot)

Click **startGame()**

---

## 2. Live Game (90 sec)

**Show:** Game board with real-time reasoning

**Talk through as it plays:**

### During Trump Selection:
- "Watch the reasoning stream in real-time - we're seeing the model's actual thought process"
- "Each model reports a confidence level from 0-100%"
- "Notice the colored dots show which prompt mode each player is using"

### When a tool is used (if it happens):
- "Here's where it gets interesting - the model can request a 'lifeline' tool"
- "Ask Audience costs 2 points, Situation Lookup costs 1, 50/50 costs 3"
- "A well-calibrated model uses tools when uncertain and saves points when confident"

### During Card Play:
- "The intelligence panel on the right shows hand strength analysis"
- "We track Brier scores - a statistical measure of calibration quality"

**If tool isn't used naturally:**
- "Models don't always use tools - that's actually good! It means they're confident and saving points"

---

## 3. Intelligence Panel (45 sec)

**Show:** Click through the right panel tabs

**Talk through:**
- **Performance tab:** "This shows each player's calibration score and decision accuracy"
- **Tools tab:** "Here's the tool usage - which models asked for help and at what cost"
- **Hand Strength:** "We calculate optimal plays so we can measure decision quality"

---

## 4. View Prompt Modal (30 sec)

**Show:** Click "viewPrompt()" button

**Talk through:**
- "You can inspect exactly what prompt each model receives"
- "Notice the mode badge - this player is in YOLO mode, so they get aggressive strategy hints"
- "This transparency is key for understanding model behavior"

---

## 5. Reasoning History (30 sec)

**Show:** Click "viewHistory()" button

**Talk through:**
- "Every decision is logged with full reasoning, confidence, and any tools used"
- "You can see the mode badge for each player's decisions"
- "This creates a complete audit trail for analysis"

---

## 6. Analysis Page (if time permits)

**Show:** Navigate to /analysis or wait for game to complete

**Talk through:**
- "Post-game, we generate AI insights about patterns observed"
- "The scoreboard ranks players by calibration, not just wins"

---

## Closing (30 sec)

> "Euchre is just the testbed - this framework could evaluate calibration in any domain. The key insight is that we're measuring something traditional benchmarks miss: does the model know when to ask for help?"

**Key differentiators to emphasize:**
1. Real-time reasoning visibility
2. Tool-use as a calibration signal
3. Per-agent prompt configuration for A/B testing
4. Comprehensive audit trail

---

## Backup Talking Points

**If asked "Why Euchre?"**
> "Card games have hidden information and require reasoning about uncertainty - perfect for testing calibration. Plus it's fast enough to demo in real-time."

**If asked about tool implementation:**
> "Tools are implemented as AI SDK tool calls. The model can request them mid-reasoning, we execute them, and feed results back into context."

**If asked about scoring:**
> "We use Brier scores - a proper scoring rule that rewards confidence on correct answers and penalizes overconfidence on wrong ones. Tool costs create an economic incentive to only use help when needed."

**If demo breaks:**
> "Live AI demos are unpredictable - that's actually part of what we're trying to measure! Let me show you the reasoning history where you can see recorded decisions."
