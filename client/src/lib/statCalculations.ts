import type { PlayerStats } from '@shared/schema';

/**
 * Calculate total points earned from player statistics
 * Points include: Aces, Spikes, Dumps, Tips, Points (generic), Blocks
 */
export const calculateTotalPoints = (stats: PlayerStats): number => {
  return (stats.aces || 0) + 
         (stats.spikes || 0) + 
         (stats.blocks || 0) + 
         (stats.tips || 0) + 
         (stats.dumps || 0) + 
         (stats.points || 0);
};

/**
 * Calculate total faults from player statistics
 * Faults include: ServeErrors, SpikeErrors, NetTouches, FootFaults, Reaches, Carries, OutOfBounds, Faults (generic)
 */
export const calculateTotalFaults = (stats: PlayerStats): number => {
  return (stats.serveErrors || 0) + 
         (stats.spikeErrors || 0) + 
         (stats.netTouches || 0) + 
         (stats.footFaults || 0) + 
         (stats.reaches || 0) + 
         (stats.carries || 0) + 
         (stats.outOfBounds || 0) + 
         (stats.faults || 0);
};

/**
 * Calculate total earned points (legacy function name for backward compatibility)
 */
export const calculateTotalEarnedPoints = calculateTotalPoints;

/**
 * Get total points contribution (alias for calculateTotalPoints)
 */
export const getTotalPointsContribution = calculateTotalPoints;

/**
 * Get total faults (alias for calculateTotalFaults)
 */
export const getTotalFaults = calculateTotalFaults;