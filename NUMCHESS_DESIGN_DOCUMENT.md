# Numchess Ultimate
## Game Design, Rules Analysis, Mechanics & Future Development

**Status:** Design document based on the current prototype and our game-design discussion  
**Current board:** 6 × 6  
**Players:** 2  
**Core identity:** Shared numerical board, asymmetric directional objectives, pattern construction, finite number inventory

---

# 1. Executive Summary

Numchess is an original abstract strategy board game built around a deceptively simple action:

1. Select a number from a limited personal pool.
2. Place that number on any empty square of a shared 6×6 board.
3. Alternate turns until the board is full.
4. Evaluate the completed board through rows, columns and two shared diagonals.
5. Determine the winner from the strongest level of pattern advantage.

The most important characteristic of Numchess is that **players do not own squares in the normal board-game sense**. Both players construct one common numerical board, but they evaluate that board from different directional perspectives:

- **Player 1:** horizontal lines are their primary scoring space.
- **Player 2:** vertical lines are their primary scoring space.
- **Both players:** the two main diagonals are shared strategic territory.

The game therefore combines several forms of strategy at once:

- finite resource management,
- spatial placement,
- offensive construction,
- defensive denial,
- hidden/implicit threats,
- repetition patterns,
- diversity patterns,
- and high-level tactical timing.

The strongest design principle discovered in the prototype is that a line can become powerful through **concentration** (repeated values) or **diversity** (many distinct values). In particular, a line containing all five values `1, 2, 3, 4, 5` reaches Level 5 power even without repetition. This makes the game fundamentally a **pattern-construction game**, rather than merely a number-matching game.

The recommended development philosophy is to preserve this compact core and make the game deeper primarily through **interaction and information**, not by piling on dozens of unrelated rules.

---

# 2. Core Game Identity

## 2.1 Board

Numchess uses a 6×6 board:

```text
□ □ □ □ □ □
□ □ □ □ □ □
□ □ □ □ □ □
□ □ □ □ □ □
□ □ □ □ □ □
□ □ □ □ □ □
```

There are exactly 36 cells.

The game ends when every cell is occupied.

## 2.2 Player inventory

Each player receives the same number pool:

```text
1 × 3
2 × 4
3 × 4
4 × 4
5 × 3
```

That is 18 tiles per player and 36 tiles total.

Therefore the final board always contains:

```text
1 → 6 total
2 → 8 total
3 → 8 total
4 → 8 total
5 → 6 total
```

This fixed inventory is an important source of strategic tension. Numbers are not infinitely available.

## 2.3 Turn structure

Each turn has two decisions:

### Decision 1 — Number selection

Choose one remaining number from the player's personal inventory.

### Decision 2 — Placement

Place the selected number into any empty square.

The selected inventory tile is then permanently consumed.

Players alternate until all 36 spaces are filled.

---

# 3. The Most Important Mechanical Idea: Shared Ownership

Unlike chess, checkers or traditional territory games, players do not permanently own the number tile after playing it.

A `3` placed by Player 1 is simply a `3` on the common board.

That `3` can simultaneously affect:

- Player 1's horizontal scoring,
- Player 2's vertical scoring,
- and possibly a shared diagonal.

This creates the central Numchess tension:

> **Every move constructs your own possibilities while simultaneously shaping the opponent's possibilities.**

This should remain a core principle of every future version.

---

# 4. Directional Objectives

## 4.1 Player 1 — Horizontal perspective

Player 1's primary lines are the six rows.

```text
Row 1
Row 2
Row 3
Row 4
Row 5
Row 6
```

Player 1 wants strong numerical patterns to appear across those lines.

## 4.2 Player 2 — Vertical perspective

Player 2's primary lines are the six columns.

```text
Column 1
Column 2
Column 3
Column 4
Column 5
Column 6
```

Player 2 wants strong numerical patterns to appear down those lines.

## 4.3 Shared diagonals

The two main diagonals are evaluated for both players.

```text
↘ diagonal
↙ diagonal
```

Therefore diagonal squares are especially important because they can affect:

- a horizontal line,
- a vertical line,
- and a shared diagonal.

This creates strategically dense squares, especially near the center.

---

# 5. The Pattern System

A critical clarification from the prototype is that Numchess does **not** have only one kind of scoring pattern.

A line can be strong because of:

1. **repetition**, or
2. **diversity**.

These can coexist.

---

# 6. Repetition Patterns

A line can contain multiple copies of the same number.

Examples:

```text
1 1 2 3 4 5
```

contains a pair of `1`s.

```text
2 2 2 3 4 5
```

contains a triple of `2`s.

```text
4 4 4 4 1 2
```

contains four `4`s.

A line with five equal values can reach Level 5 repetition:

```text
5 5 5 5 5 X
```

The exact higher-level scoring rules should be formally documented before the production implementation is finalized, but the prototype clearly treats multiplicity as a central source of level power.

---

# 7. Diversity Patterns

The prototype contains a separate mechanism that counts the number of **distinct numerical values** in a line.

Conceptually:

```text
D = number of distinct values in the line
```

Examples:

```text
1 1 1 1 1 2
```

has two distinct values → diversity Level 2.

```text
1 1 2 2 3 4
```

has four distinct values → diversity Level 4.

```text
1 2 3 4 5 5
```

has five distinct values → diversity Level 5.

Most importantly:

```text
1 2 3 4 5 X
```

can reach Level 5 because all five numerical values are represented.

## Important terminology

The underlying prototype logic is based on **set membership**, not order. Therefore these all contain the five-number diversity structure:

```text
1 2 3 4 5
5 4 3 2 1
2 5 1 4 3
3 1 5 2 4
```

The current implementation's `remove_duplicates()` logic does not care about ordering.

Therefore the more precise term for this mechanic is **five-value set / five-set**, rather than "straight", unless future rules explicitly require numerical order.

---

# 8. Repetition and Diversity Can Coexist

One of the strongest characteristics of Numchess is that a single six-cell line can contain more than one useful pattern property.

Example:

```text
1 1 2 3 4 5
```

This line has:

- 5 distinct values → Level 5 diversity
- a pair of `1`s → Level 2 repetition

Another example:

```text
1 1 1 2 3 4
```

This line has:

- 4 distinct values → Level 4 diversity
- three `1`s → Level 3 repetition

This means that a line is better understood as having a **pattern profile**, rather than one isolated score.

---

# 9. The Two-Dimensional Pattern Model

A particularly useful abstraction is to represent each line with two values:

```text
(R, D)
```

where:

- `R` = maximum repetition of any single number
- `D` = number of distinct numerical values

Examples:

```text
1 1 1 2 4 5
R = 3
D = 4
```

Pattern profile:

```text
(3,4)
```

Another:

```text
1 2 3 4 5 5
R = 2
D = 5
```

Pattern profile:

```text
(2,5)
```

Another:

```text
3 3 3 3 3 2
R = 5
D = 2
```

Pattern profile:

```text
(5,2)
```

This is arguably the mathematical heart of Numchess:

> **Players manipulate lines along two competing dimensions: concentration and diversity.**

---

# 10. Why Level 5 Is Special

Level 5 can be reached through fundamentally opposite structures.

## Concentration

```text
1 1 1 1 1 X
```

## Diversity

```text
1 2 3 4 5 X
```

These represent:

- maximum sameness,
- versus maximum diversity.

Giving both the same strategic level is an unusually strong design choice because it prevents the game from collapsing into a single obvious strategy.

A player may pursue:

> **concentration**

or

> **diversity**

or transition between them during the game.

---

# 11. The Sixth Cell Is Strategically Important

A scoring line contains six cells but only five numerical values exist.

That creates a built-in extra slot.

For example:

```text
1 2 3 4 5 1
```

still has all five values.

Likewise:

```text
1 1 2 3 4 5
```

has five distinct values and a pair.

This sixth-cell structure is useful because it allows diversity and repetition to coexist inside the same line.

That should be protected rather than simplified away.

---

# 12. Final Winner Logic

The prototype uses hierarchical levels rather than simple total-point accumulation.

The effective meaningful scoring range is currently centered on:

```text
Level 2
Level 3
Level 4
Level 5
```

The decisive principle is:

> **The highest level at which the players differ determines the winner.**

Conceptually:

```text
Compare Level 5
↓
If tied, compare Level 4
↓
If tied, compare Level 3
↓
If tied, compare Level 2
```

This is a lexicographic-style victory system.

## Example

```text
Player 1
Level 5: 2
Level 4: 2
Level 3: 8
Level 2: 9

Player 2
Level 5: 1
Level 4: 9
Level 3: 1
Level 2: 2
```

Player 1 wins because Level 5 is decisive even though Player 2 dominates Level 4 and below.

This produces the desired property that **one exceptional high-level structure can outweigh many weaker structures**.

---

# 13. Emergent Tactical Concepts

The current rules naturally produce several tactical concepts without needing explicit extra scoring rules.

## 13.1 Threat

A line one move away from a higher-level structure.

Example:

```text
1 2 3 4 _ _
```

may represent a Level 5 diversity threat.

Likewise:

```text
4 4 4 4 _ _
```

may represent a Level 5 repetition threat.

## 13.2 Fork

One move creates two serious threats on different lines.

An opponent may only be able to neutralize one.

## 13.3 Denial

A player occupies a critical empty square or consumes a key number to prevent an opponent from completing a pattern.

## 13.4 Pattern collapse

A high-level threat can be destroyed but transformed into a weaker pattern rather than disappearing completely.

Example:

```text
Potential Level 5
        ↓
opponent interference
        ↓
Level 3 pattern remains
```

## 13.5 Crossfire

A move improves one player's main line while simultaneously harming the opponent's perpendicular line.

## 13.6 Triad

A particularly powerful placement can affect:

- the current player's row/column,
- the opponent's perpendicular line,
- and a shared diagonal.

These are useful as future strategic vocabulary even if they never become formal bonuses.

---

# 14. Resource Management

Because each player has a finite inventory, every number has an opportunity cost.

A `5` can be useful for:

```text
5 5 5 5 5
```

but it can also be essential to complete:

```text
1 2 3 4 5
```

A player may therefore face a real decision:

> **Spend the number now to strengthen a repetition pattern, or preserve it for a future diversity pattern?**

This makes tile selection part of the strategy rather than a preliminary step before the "real" placement decision.

---

# 15. Inventory as Information

Remaining inventory is not merely a resource; it is information.

Suppose a player has exhausted all of their `5`s.

Then an apparent position such as:

```text
1 2 3 4 _ _
```

may visually resemble a Level 5 diversity threat but actually be impossible for that player to complete through their own remaining resources.

Therefore strong play requires combining:

```text
Board state
+
Remaining inventory
+
Opponent's likely intentions
```

This is one of the most interesting sources of hidden tactical depth in Numchess.

---

# 16. Why the Board Is More Strategic Than It Looks

Each normal square belongs simultaneously to:

- one horizontal line,
- one vertical line.

Each diagonal square may belong to:

- one horizontal line,
- one vertical line,
- one or two shared diagonal contexts depending on location.

Therefore a placement can have several consequences at once.

The center of the board is naturally more strategically dense because central cells often participate in more meaningful interactions.

The recommendation is **not** to give the center arbitrary bonus points. Its importance should emerge naturally from line geometry.

---

# 17. Strategic Phases of a Game

Numchess naturally divides into three phases.

## Opening

The board has little pattern information.

Players are primarily:

- distributing scarce numbers,
- establishing possible future lines,
- testing the opponent's intentions,
- creating seeds for repetition or diversity.

## Midgame

Patterns become visible.

Players begin:

- creating threats,
- denying key squares,
- sacrificing one pattern for another,
- exploiting number scarcity,
- creating forks and crossfire positions.

## Endgame

The remaining empty squares become extremely valuable.

The question becomes:

> **Which exact final placements produce the best highest-level pattern profile?**

This should be treated as the tactical climax of Numchess.

---

# 18. Recommended Improvements to the Core Game

The goal should not be to replace the existing rules. It should be to make their implications clearer and deepen their strategic consequences.

## 18.1 Threat indicators

Visually identify lines that are close to a higher-level pattern.

Possible states:

```text
Safe
Developing
Threat
Critical
```

The game should expose strategic information without telling the player the optimal move.

## 18.2 Double-threat / fork recognition

Detect positions where one move creates two meaningful threats.

This should be a recognized tactical concept rather than necessarily a scoring bonus.

## 18.3 Inventory visualization

Show remaining tiles clearly:

```text
1: ●●●
2: ●●●●
3: ●●●●
4: ●●●●
5: ●●●
```

This turns the finite pool into visible strategy.

## 18.4 Pattern-collapse feedback

When a move destroys a stronger pattern but creates or preserves a weaker pattern, make the transformation visible.

Example:

```text
LEVEL 5 THREAT
      ↓
BLOCKED
      ↓
LEVEL 3 REMAINS
```

## 18.5 Endgame presentation

When only a few empty squares remain, show:

- remaining inventory,
- strongest current patterns,
- active threats,
- critical lines.

This should make the last moves feel like the game's climax.

## 18.6 Replay

Every match should be replayable move by move.

A replay should show the board, inventory and scoring implications at every position.

This is important for competitive play and learning.

---

# 19. Experimental Advanced Mechanics

These should be tested **after** the pure core game is stable.

## 19.1 One Reserve Slot

Each player gets one reserve slot.

A selected number can be held temporarily rather than immediately placed.

Potential benefit:

> Protect a strategically important number until the right square appears.

The reserve should be strictly limited so players cannot simply hoard resources.

## 19.2 One Pass / Sacrifice

A player gets one special action per game that removes a selected number from their remaining inventory without placing it.

This creates a deliberate sacrifice:

> **I would rather lose this resource than allow it to become useful to my opponent.**

This should be tested carefully because it directly changes resource economics.

## 19.3 One Wildcard

An advanced variant could give each player one wildcard.

The wildcard can imitate a number for a pattern calculation, but should have strict limitations.

A likely restriction:

> A wildcard may contribute to only one scoring interpretation at a time.

Without strong restrictions, it could become too powerful.

## 19.4 Momentum

A player who creates a new highest-level threat could gain one Momentum token.

A possible effect:

> On the next turn, the player sees the opponent's selected number before choosing their own number.

This should be capped at one token and tested for snowball effects.

---

# 20. Mechanics to Avoid for Now

Some additions are likely to hurt Numchess's elegance more than they help it.

Avoid, at least until the core has been mathematically tested:

- arbitrary center bonuses,
- excessive special tiles,
- too many resource types,
- random dice effects,
- complicated movement rules,
- permanent tile ownership,
- large numbers of exceptions to the pattern system,
- arbitrary tie-breakers,
- and dozens of disconnected bonus-point rules.

The strength of Numchess comes from the fact that **many consequences emerge from a small number of rules**.

---

# 21. Classic vs Advanced Modes

A useful product structure would be:

## Numchess Classic

Pure original rules:

- 6×6 board
- fixed inventories
- alternate number selection and placement
- horizontal vs vertical evaluation
- shared diagonals
- repetition + diversity patterns
- hierarchical Level 2–5 victory

## Numchess Ultimate

Classic plus:

- threat visualization,
- inventory visibility enhancements,
- replay and analysis,
- optional advanced mechanics.

## Numchess Arena

Competitive mode:

- timed games,
- rating system,
- tournament rules,
- leaderboards,
- replays.

The classic rules should remain available and respected as the pure form of the game.

---

# 22. AI and Game-Theory Development

Numchess is unusually suitable for computational analysis because it is:

- finite,
- deterministic,
- perfect information,
- fixed in board size,
- fixed in move count,
- and based on a finite resource pool.

A proper game simulator should represent the state as:

```javascript
{
  board,
  player1Inventory,
  player2Inventory,
  currentPlayer,
  moveNumber
}
```

The DOM should only render that state.

The game engine should not rely on HTML as the source of truth.

---

# 23. Recommended Scoring Engine Architecture

The current prototype mixes state, rendering and scoring logic. A production version should separate them.

Suggested structure:

```text
GameState
   ↓
LegalMoves
   ↓
ApplyMove
   ↓
LineAnalyzer
   ↓
PatternDetector
   ↓
LevelAggregator
   ↓
WinnerEvaluator
   ↓
UI Renderer
```

The pattern detector should explicitly preserve both:

```text
frequency information
+
set/diversity information
```

rather than collapsing everything into one object.

For each line, conceptually calculate:

```javascript
{
  maxRepetition: R,
  distinctValues: D,
  frequencies: {...},
  patterns: [...]
}
```

This would make future extensions much easier.

---

# 24. Important Implementation Findings From the Prototype

The current code contains a mechanism:

```javascript
counth[9] = remove_duplicates(hors).length;
```

and equivalent vertical/diagonal logic.

This means the prototype explicitly computes the number of distinct values in a line.

However, the later logic does:

```javascript
top.pop();
```

and the equivalent vertical operation.

Because object-key enumeration places numeric keys in numeric order, the special diversity value can effectively be removed from the final aggregation. Therefore the code **contains the intended diversity mechanism but does not currently preserve it cleanly in the final scoring path**.

This is an implementation issue, not a reason to remove the mechanic.

The diversity mechanic should instead be modeled explicitly as its own pattern dimension.

---

# 25. Rule Clarifications That Should Be Formalized

Before adding advanced mechanics, the following rules should be written explicitly.

## 25.1 Diversity rule

Does any line containing all five values count as Level 5 regardless of order?

The current `remove_duplicates()` logic strongly implies **yes**.

## 25.2 Sixth-cell rule

Does:

```text
1 2 3 4 5 5
```

count as Level 5 diversity?

The current distinct-value logic implies **yes**.

## 25.3 Coexistence rule

Does the same line receive both:

- Level 5 diversity,
- and Level 2 repetition?

The structure of the prototype strongly suggests that multiple pattern properties are intended to coexist.

## 25.4 Pattern priority

If multiple pattern families produce the same level, do they simply contribute to the same level count?

This should be specified.

## 25.5 Level 6

A 6-cell line can theoretically contain six identical values.

The current implementation's handling effectively removes the highest frequency in certain cases, making Level 6 non-meaningful.

A deliberate decision should be made whether:

- Level 5 is intentionally the maximum possible tier,
- or a future Level 6 system should exist.

Recommendation: **keep Level 5 as the natural maximum until testing proves a Level 6 is desirable.**

---

# 26. Strategic Philosophy of Numchess

Numchess should be understood as a game of **constructive conflict**.

Players do not directly attack each other's pieces.

Instead, they:

- consume scarce numbers,
- occupy critical squares,
- reshape lines,
- create patterns,
- suppress patterns,
- and manipulate the final mathematical structure of the board.

A move can be simultaneously:

```text
Offensive
+ Defensive
+ Resource-efficient
+ Geometrically important
```

That is what makes Numchess distinct.

---

# 27. The Core Design Principle

The most important principle for future development is:

> **Do not make Numchess deeper by adding random rules. Make it deeper by making the existing interactions matter more.**

The ideal Numchess experience should feel like:

> "There are only a few rules, but every square and every number matters."

rather than:

> "There are dozens of special mechanics to memorize."

---

# 28. Proposed Development Roadmap

## Phase 1 — Formalize the rules

Write the exact pattern table for Levels 2–5.

Define:

- repetition scoring,
- diversity scoring,
- coexistence of patterns,
- diagonal handling,
- winner hierarchy,
- and edge cases.

## Phase 2 — Rebuild the engine

Separate:

- game state,
- move legality,
- scoring,
- UI rendering.

Build automated tests for pattern detection.

## Phase 3 — Build the simulator

Run large numbers of games under different strategies.

Test:

- first-player advantage,
- number-value balance,
- center-square value,
- diversity vs repetition strength,
- diagonal influence,
- opening move strength,
- and forced strategies.

## Phase 4 — Improve presentation

Add:

- inventory display,
- threat visualization,
- pattern previews,
- endgame mode,
- replay.

## Phase 5 — Test advanced mechanics

One at a time:

- reserve,
- pass/sacrifice,
- wildcard,
- momentum.

Any mechanic that creates dominant strategies should be removed or redesigned.

## Phase 6 — Competitive system

Add:

- timers,
- matchmaking,
- ratings,
- tournament play,
- replay sharing,
- AI analysis.

---

# 29. Long-Term AI Vision

A mature Numchess platform could eventually provide:

```text
NUMCHESS AI

Opening evaluation
Threat detection
Pattern recognition
Move analysis
Blunder detection
Endgame solving
Position evaluation
```

A finished game could produce analysis such as:

```text
Move 17 — Strong
Created a Level-5 diversity threat.

Move 21 — Critical
Blocked opponent's Level-5 repetition route.

Move 28 — Missed opportunity
A double threat was available.

Final result
Level 5: 3–2
Level 4: 5–7
Winner: Player 1
```

This would make the game not only playable but learnable.

---

# 30. Final Design Assessment

Numchess has a strong foundation because the central rules generate multiple layers of strategy without requiring complicated movement mechanics.

Its most promising properties are:

1. **Shared board with asymmetric perspectives**
2. **Finite number inventory**
3. **Number choice plus square choice**
4. **Repetition patterns**
5. **Diversity patterns**
6. **Pattern coexistence**
7. **Shared diagonals**
8. **Highest-level-first victory**
9. **Natural threats and forks**
10. **Perfect-information game theory**

The strongest conceptual description is:

> **Numchess is a two-dimensional numerical pattern-construction game in which two players manipulate the same finite board from perpendicular strategic perspectives. Repetition and diversity are competing but equally legitimate routes to high-level patterns, while the final winner is determined by the highest level of pattern advantage.**

The prototype's implementation is rough, but the underlying design is worth formalizing and testing rather than discarding.

The next major milestone should therefore be **a precise Numchess rules specification plus a correct simulation engine**. Once that exists, the game can be tested mathematically and improved based on evidence rather than intuition alone.

---

# Appendix A — Core Examples

## A.1 Level 5 by repetition

```text
1 1 1 1 1 X
```

## A.2 Level 5 by diversity

```text
1 2 3 4 5 X
```

## A.3 Level 5 diversity plus Level 2 repetition

```text
1 1 2 3 4 5
```

## A.4 Level 4 diversity plus Level 3 repetition

```text
1 1 1 2 3 4
```

## A.5 High repetition but low diversity

```text
3 3 3 3 3 2
```

Pattern profile:

```text
R = 5
D = 2
```

## A.6 High diversity but low repetition

```text
1 2 3 4 5 2
```

Pattern profile:

```text
R = 2
D = 5
```

---

# Appendix B — One-Sentence Design Rule

> **Select a scarce number, place it in a shared space, shape your lines, disrupt your opponent's lines, and seek the strongest pattern you can create from either repetition or diversity.**
