I want an algorithm to select players fairly. The algorithm shall work as follows:

* prefer players that have been selected for the fewest events
* give a bonus to players that have accepted the most invitations (in percentage)
* assign players according to their strength (assign the strongest players to the teams with the highest level, then the remaining players to the next team, ...)
* if there are multiple teams with the same level, assign players fairly (according to their strenght)

write a test first that given a set of players (that accepted) with their statistics (acceptance rate & number of selections) and a set of teams with their strength, assigns players to teams. 

do not yet implement code yet, but just the test for the following scenarios:

* one team and less players than the max players of the team (assign all players)
* one team and more players than the max players of the team (assign players according to the algorithm)
* two teams with the same level and less players than the sum of max players of the team
* two teams with the same level and more players than the sum of max players of the team
* two teams with different levels and more players than the sum of max players

to make the tests readable, use team size 4.

## Design Decisions

### Data Structure
- Tests use simplified player statistics (acceptedCount, selectedCount, invitedCount) instead of full Event[] array
- Players passed to the algorithm must have been invited to the current event (pre-condition: only invited players are eligible for selection)

### Scoring Algorithm
Player priority score formula:
```
score = (baseWeight - selectedCount * penaltyPerSelection) + (min(acceptanceRate, acceptanceThreshold) * acceptanceBonus)
```

Parameters:
- `baseWeight = 100` - Starting score for all players
- `penaltyPerSelection = 30` - Points deducted per previous selection (prioritizes fairness)
- `acceptanceBonus = 0.5` - Weight for acceptance rate bonus
- `acceptanceThreshold = 80%` - Players with 80-100% acceptance rate get same max bonus (no penalty for high participation)
- `acceptanceRate = (acceptedCount / invitedCount) * 100`

### Tie Breaking
- When players have identical scores, use random selection (Math.random())
- Tests mock Math.random() with predictable sequence for deterministic test results

### Team Assignment Strategy
1. Sort teams by strength (1 = highest, 3 = lowest)
2. For teams with same strength level, distribute players fairly by level
3. Assign strongest available players to highest-strength teams first
4. Within same-strength team groups, balance player levels across teams

### Edge Cases
- Players with `invitedCount = 0` are never passed to algorithm (filtered out beforehand)
- Acceptance rate between 80-100% treated equally (threshold caps bonus)
- When total players exceed total team capacity, select only top-scored players