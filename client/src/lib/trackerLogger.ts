/**
 * Comprehensive logging system for the Stat Tracker page
 * Tracks all user interactions and sends them to the database
 */

import type { InsertTrackerLog } from '@shared/schema';

interface LogAction {
  action: string;
  matchId?: string;
  set?: number;
  playerId?: string;
  details?: any;
}

class TrackerLogger {
  private teamName: string = '';
  private isLoggingEnabled: boolean = true;

  // Initialize the logger with team information
  init(teamName: string) {
    this.teamName = teamName;
    this.log('Tracker Login', undefined, undefined, undefined, {
      loginTime: new Date().toISOString()
    });
  }

  // Main logging method
  async log(action: string, matchId?: string, set?: number, playerId?: string, details?: any) {
    if (!this.isLoggingEnabled || !this.teamName) {
      return;
    }

    const logData: InsertTrackerLog = {
      teamName: this.teamName,
      action,
      matchId: matchId ? parseInt(matchId) : undefined,
      set,
      playerId: playerId ? parseInt(playerId) : undefined,
      details: details ? JSON.stringify(details) : undefined,
      timestamp: new Date()
    };

    try {
      const response = await fetch('/api/tracker-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logData),
      });

      if (!response.ok) {
        console.error('Failed to log tracker action:', response.statusText);
      }
    } catch (error) {
      console.error('Error logging tracker action:', error);
    }
  }

  // Specific logging methods for different actions
  logStatAdd(action: string, matchId: string, set: number, playerId: string, playerName?: string) {
    this.log(`Add ${action}`, matchId, set, playerId, {
      playerName,
      statType: action
    });
  }

  logStatDelete(action: string, matchId: string, set: number, playerId: string, playerName?: string) {
    this.log(`Delete ${action}`, matchId, set, playerId, {
      playerName,
      statType: action
    });
  }

  logScoreChange(matchId: string, set: number, newScoreA: number, newScoreB: number, teamA?: string, teamB?: string) {
    this.log('Score Changed', matchId, set, undefined, {
      newScoreA,
      newScoreB,
      teamA,
      teamB
    });
  }

  logSetAdvance(matchId: string, fromSet: number, toSet: number) {
    this.log('Set Advanced', matchId, toSet, undefined, {
      fromSet,
      toSet
    });
  }

  logSetFinalize(matchId: string, set: number, finalScoreA: number, finalScoreB: number) {
    this.log('Set Finalized', matchId, set, undefined, {
      finalScoreA,
      finalScoreB
    });
  }

  logMatchSubmit(matchId: string) {
    this.log('Match Submitted', matchId, undefined, undefined, {
      completedAt: new Date().toISOString()
    });
  }

  logTeamSwap(matchId: string, set: number) {
    this.log('Team Positions Swapped', matchId, set, undefined, {
      swapTime: new Date().toISOString()
    });
  }

  logPlayerSelect(matchId: string, set: number, playerId: string, playerName?: string) {
    this.log('Player Selected', matchId, set, playerId, {
      playerName
    });
  }

  logMatchSelect(matchId: string, courtNumber?: number, teamA?: string, teamB?: string) {
    this.log('Match Selected', matchId, undefined, undefined, {
      courtNumber,
      teamA,
      teamB
    });
  }

  logLogout() {
    this.log('Tracker Logout', undefined, undefined, undefined, {
      logoutTime: new Date().toISOString()
    });
  }

  logAdminUnlock(matchId: string, adminUsername: string) {
    this.log('Admin Match Unlock', matchId, undefined, undefined, {
      adminUsername,
      unlockTime: new Date().toISOString()
    });
  }

  // Disable logging (for testing or maintenance)
  disable() {
    this.isLoggingEnabled = false;
  }

  // Enable logging
  enable() {
    this.isLoggingEnabled = true;
  }

  // Get current team name
  getTeamName(): string {
    return this.teamName;
  }
}

// Export a singleton instance
export const trackerLogger = new TrackerLogger();