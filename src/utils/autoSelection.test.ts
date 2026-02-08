import { describe, it, expect, beforeEach, vi } from 'vitest';
import { selectPlayers } from './autoSelection';
import type { PlayerWithStats, TeamForSelection } from '../types';

describe('Player Auto-Selection Algorithm', () => {
  let mockRandomSequence: number[];
  let mockRandomIndex: number;

  beforeEach(() => {
    // Mock Math.random to return predictable sequence
    mockRandomSequence = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
    mockRandomIndex = 0;
    vi.spyOn(Math, 'random').mockImplementation(() => {
      const value = mockRandomSequence[mockRandomIndex % mockRandomSequence.length];
      mockRandomIndex++;
      return value;
    });
  });

  // Helper function to create players with stats
  const createPlayer = (
    id: string,
    firstName: string,
    level: number,
    selectedCount: number,
    invitedCount: number,
    acceptedCount: number
  ): PlayerWithStats => ({
    id,
    firstName,
    lastName: 'TestPlayer',
    birthYear: 2010,
    level,
    selectedCount,
    invitedCount,
    acceptedCount,
  });

  describe('Scenario 1: One team with fewer players than max', () => {
    it('should assign all players to the team', () => {
      const players: PlayerWithStats[] = [
        createPlayer('p1', 'Alice', 3, 0, 5, 4),
        createPlayer('p2', 'Bob', 4, 1, 5, 5),
      ];

      const teams: TeamForSelection[] = [
        { id: 't1', strength: 2, maxPlayers: 4 },
      ];

      const result = selectPlayers(players, teams);

      expect(result['p1']).toBe('t1');
      expect(result['p2']).toBe('t1');
      expect(Object.keys(result).length).toBe(2);
    });
  });

  describe('Scenario 2: One team with more players than max', () => {
    it('should select top 4 players based on selection count and acceptance rate', () => {
      const players: PlayerWithStats[] = [
        createPlayer('p1', 'Alice', 3, 0, 5, 5), // Never selected, 100% acceptance
        createPlayer('p2', 'Bob', 4, 0, 5, 4), // Never selected, 80% acceptance (threshold)
        createPlayer('p3', 'Carol', 5, 1, 5, 5), // Selected once, 100% acceptance
        createPlayer('p4', 'Dave', 3, 2, 5, 4), // Selected twice, 80% acceptance
        createPlayer('p5', 'Eve', 4, 0, 10, 7), // Never selected, 70% acceptance
        createPlayer('p6', 'Frank', 2, 1, 5, 3), // Selected once, 60% acceptance
      ];

      const teams: TeamForSelection[] = [
        { id: 't1', strength: 2, maxPlayers: 4 },
      ];

      const result = selectPlayers(players, teams);

      // Should select p1, p2, p5, p3 (in priority order: 0 selections with best acceptance first)
      expect(Object.keys(result).length).toBe(4);
      expect(result['p1']).toBe('t1'); // 0 selections, 100%
      expect(result['p2']).toBe('t1'); // 0 selections, 80%
      expect(result['p5']).toBe('t1'); // 0 selections, 70%
      expect(result['p3']).toBe('t1'); // 1 selection, 100%
    });
  });

  describe('Scenario 3: Two same-strength teams with fewer players than total max', () => {
    it('should distribute players fairly across both teams', () => {
      const players: PlayerWithStats[] = [
        createPlayer('p1', 'Alice', 5, 0, 5, 5),
        createPlayer('p2', 'Bob', 4, 0, 5, 4),
        createPlayer('p3', 'Carol', 4, 1, 5, 5),
        createPlayer('p4', 'Dave', 3, 1, 5, 4),
        createPlayer('p5', 'Eve', 3, 2, 5, 5),
        createPlayer('p6', 'Frank', 2, 0, 5, 3),
      ];

      const teams: TeamForSelection[] = [
        { id: 't1', strength: 2, maxPlayers: 4 },
        { id: 't2', strength: 2, maxPlayers: 4 },
      ];

      const result = selectPlayers(players, teams);

      // All 6 players should be assigned
      expect(Object.keys(result).length).toBe(6);
      
      // Count players per team
      const t1Players = Object.values(result).filter(t => t === 't1').length;
      const t2Players = Object.values(result).filter(t => t === 't2').length;
      
      // Should be balanced (3-3 distribution)
      expect(t1Players).toBe(3);
      expect(t2Players).toBe(3);
    });
  });

  describe('Scenario 4: Two same-strength teams with more players than total max', () => {
    it('should select best 8 players and balance them across teams', () => {
      const players: PlayerWithStats[] = [
        createPlayer('p1', 'Alice', 5, 0, 5, 5),
        createPlayer('p2', 'Bob', 5, 0, 5, 4),
        createPlayer('p3', 'Carol', 4, 0, 5, 5),
        createPlayer('p4', 'Dave', 4, 1, 5, 5),
        createPlayer('p5', 'Eve', 3, 0, 5, 4),
        createPlayer('p6', 'Frank', 3, 1, 5, 4),
        createPlayer('p7', 'Grace', 3, 2, 5, 5),
        createPlayer('p8', 'Henry', 2, 0, 5, 3),
        createPlayer('p9', 'Ivy', 2, 2, 5, 4),
        createPlayer('p10', 'Jack', 1, 3, 5, 2),
      ];

      const teams: TeamForSelection[] = [
        { id: 't1', strength: 2, maxPlayers: 4 },
        { id: 't2', strength: 2, maxPlayers: 4 },
      ];

      const result = selectPlayers(players, teams);

      // Should select exactly 8 players
      expect(Object.keys(result).length).toBe(8);
      
      // Count players per team
      const t1Players = Object.values(result).filter(t => t === 't1').length;
      const t2Players = Object.values(result).filter(t => t === 't2').length;
      
      // Should be balanced (4-4 distribution)
      expect(t1Players).toBe(4);
      expect(t2Players).toBe(4);

      // Top priority players (0 selections) should be included
      expect(result['p1']).toBeDefined();
      expect(result['p2']).toBeDefined();
      expect(result['p3']).toBeDefined();
      expect(result['p5']).toBeDefined();
      expect(result['p8']).toBeDefined();
    });
  });

  describe('Scenario 5: Two different-strength teams with more players than total max', () => {
    it('should assign strongest players to highest-strength team first', () => {
      const players: PlayerWithStats[] = [
        createPlayer('p1', 'Alice', 5, 0, 5, 5), // Level 5
        createPlayer('p2', 'Bob', 5, 0, 5, 4),   // Level 5
        createPlayer('p3', 'Carol', 4, 0, 5, 5), // Level 4
        createPlayer('p4', 'Dave', 4, 1, 5, 5),  // Level 4
        createPlayer('p5', 'Eve', 3, 0, 5, 4),   // Level 3
        createPlayer('p6', 'Frank', 3, 1, 5, 4), // Level 3
        createPlayer('p7', 'Grace', 2, 0, 5, 5), // Level 2
        createPlayer('p8', 'Henry', 2, 1, 5, 3), // Level 2
        createPlayer('p9', 'Ivy', 1, 0, 5, 4),   // Level 1
        createPlayer('p10', 'Jack', 1, 2, 5, 2), // Level 1
      ];

      const teams: TeamForSelection[] = [
        { id: 't1', strength: 1, maxPlayers: 4 }, // Highest strength team
        { id: 't2', strength: 2, maxPlayers: 4 }, // Lower strength team
      ];

      const result = selectPlayers(players, teams);

      // Should select exactly 8 players
      expect(Object.keys(result).length).toBe(8);
      
      // Count players per team
      const t1Players = Object.values(result).filter(t => t === 't1').length;
      const t2Players = Object.values(result).filter(t => t === 't2').length;
      
      expect(t1Players).toBe(4);
      expect(t2Players).toBe(4);

      // Team 1 (strength 1) should get the highest level players
      // p1 and p2 are level 5 and should go to t1
      expect(result['p1']).toBe('t1');
      expect(result['p2']).toBe('t1');

      // Lower level players should be in team 2
      // Check that at least some lower-level players are in t2
      const t2PlayerIds = Object.keys(result).filter(id => result[id] === 't2');
      const t2Levels = t2PlayerIds.map(id => players.find(p => p.id === id)!.level);
      const avgT2Level = t2Levels.reduce((a, b) => a + b, 0) / t2Levels.length;

      const t1PlayerIds = Object.keys(result).filter(id => result[id] === 't1');
      const t1Levels = t1PlayerIds.map(id => players.find(p => p.id === id)!.level);
      const avgT1Level = t1Levels.reduce((a, b) => a + b, 0) / t1Levels.length;

      // Team 1 should have higher average level than team 2
      expect(avgT1Level).toBeGreaterThan(avgT2Level);
    });
  });

  describe('Scenario 6: Three teams with different strengths and level-based preferences', () => {
    it('should assign players to teams based on strength preferences despite high selection rates', () => {
      const players: PlayerWithStats[] = [
        // Level 5 players with high selection count - should still go to strength 1 team
        createPlayer('p1', 'Alice', 5, 5, 10, 10), // High selections, but level 5
        createPlayer('p2', 'Bob', 5, 4, 10, 9),    // High selections, but level 5
        
        // Level 4 players with high selection count - should go to strength 1 team
        createPlayer('p3', 'Carol', 4, 6, 10, 10), // Very high selections, but level 4
        createPlayer('p4', 'Dave', 4, 5, 10, 9),   // High selections, but level 4
        
        // Level 3 players with low selection count - should go to strength 2 team
        createPlayer('p5', 'Eve', 3, 0, 10, 10),   // Never selected, level 3
        createPlayer('p6', 'Frank', 3, 1, 10, 9),  // Low selections, level 3
        
        // Level 2 players with low selection count - should go to strength 2 team
        createPlayer('p7', 'Grace', 2, 0, 10, 10), // Never selected, level 2
        createPlayer('p8', 'Henry', 2, 1, 10, 8),  // Low selections, level 2
        
        // Level 1 players with low selection count - should go to strength 3 team
        createPlayer('p9', 'Ivy', 1, 0, 10, 10),   // Never selected, level 1
        createPlayer('p10', 'Jack', 1, 1, 10, 9),  // Low selections, level 1
        
        // Level 1 player to fill strength 3 team
        createPlayer('p11', 'Kate', 1, 1, 10, 9),  // Level 1, low selections
        
        // Extra players to exceed capacity
        createPlayer('p12', 'Leo', 4, 7, 10, 8),   // Level 4, very high selections
        createPlayer('p13', 'Mia', 3, 2, 10, 8),   // Level 3, low selections
        createPlayer('p14', 'Noah', 2, 2, 10, 7),  // Level 2, low selections
        createPlayer('p15', 'Olivia', 1, 3, 10, 8), // Level 1, high selections
      ];

      const teams: TeamForSelection[] = [
        { id: 't1', strength: 1, maxPlayers: 4 }, // Should get levels 4-5
        { id: 't2', strength: 2, maxPlayers: 4 }, // Should get levels 2-4
        { id: 't3', strength: 3, maxPlayers: 4 }, // Should get level 1
      ];

      const result = selectPlayers(players, teams);

      // Should select exactly 12 players (total capacity)
      expect(Object.keys(result).length).toBe(12);
      
      // Count players per team
      const t1Players = Object.values(result).filter(t => t === 't1').length;
      const t2Players = Object.values(result).filter(t => t === 't2').length;
      const t3Players = Object.values(result).filter(t => t === 't3').length;
      
      expect(t1Players).toBe(4);
      expect(t2Players).toBe(4);
      expect(t3Players).toBe(4);

      // Team 1 (strength 1) should get level 4-5 players despite their high selection count
      const t1PlayerIds = Object.keys(result).filter(id => result[id] === 't1');
      const t1Levels = t1PlayerIds.map(id => players.find(p => p.id === id)!.level);
      t1Levels.forEach(level => {
        expect(level).toBeGreaterThanOrEqual(4);
        expect(level).toBeLessThanOrEqual(5);
      });

      // Team 2 (strength 2) should get level 2-4 players
      const t2PlayerIds = Object.keys(result).filter(id => result[id] === 't2');
      const t2Levels = t2PlayerIds.map(id => players.find(p => p.id === id)!.level);
      t2Levels.forEach(level => {
        expect(level).toBeGreaterThanOrEqual(2);
        expect(level).toBeLessThanOrEqual(4);
      });

      // Team 3 (strength 3) should get level 1 players
      const t3PlayerIds = Object.keys(result).filter(id => result[id] === 't3');
      const t3Levels = t3PlayerIds.map(id => players.find(p => p.id === id)!.level);
      t3Levels.forEach(level => {
        expect(level).toBeGreaterThanOrEqual(1);
        expect(level).toBeLessThanOrEqual(2);
      });

      // Verify that high selection count level 4-5 players went to strength 1 team
      // Players p1, p2 (level 5 with high selections) should be in t1
      expect(result['p1']).toBe('t1');
      expect(result['p2']).toBe('t1');
      
      // Players p3, p4 (level 4 with high selections) should be in t1
      expect(result['p3']).toBe('t1');
      expect(result['p4']).toBe('t1');
    });
  });
});
