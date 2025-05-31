import { logTrackerAction } from './firebase';

// Get the current team information from localStorage
const getCurrentTeam = () => {
  try {
    const trackerUser = localStorage.getItem('trackerUser');
    if (trackerUser) {
      return JSON.parse(trackerUser);
    }
  } catch (error) {
    console.error('Error getting current team:', error);
  }
  return null;
};

// Main logging function
export const logAction = async (
  action: string,
  details?: string,
  matchId?: string,
  set?: number,
  playerId?: string,
  playerName?: string
) => {
  const currentTeam = getCurrentTeam();
  if (!currentTeam) {
    console.warn('No team logged in, skipping log action');
    return;
  }

  const logData = {
    teamName: currentTeam.teamName,
    action,
    matchId,
    set,
    playerId,
    details: details || `${action}${playerName ? ` for ${playerName}` : ''}`
  };

  await logTrackerAction(logData);
};

// Specific logging functions for different actions
export const logStatAction = async (
  statType: string,
  operation: 'add' | 'delete',
  playerName: string,
  matchId: string,
  set: number,
  playerId: string
) => {
  await logAction(
    `${operation === 'add' ? 'Add' : 'Delete'} ${statType}`,
    `${operation === 'add' ? 'Added' : 'Deleted'} ${statType} for ${playerName}`,
    matchId,
    set,
    playerId,
    playerName
  );
};

export const logScoreChange = async (
  newScoreA: number,
  newScoreB: number,
  matchId: string,
  set: number
) => {
  await logAction(
    'Score Changed',
    `Score updated to ${newScoreA}-${newScoreB}`,
    matchId,
    set
  );
};

export const logTeamLogin = async (teamName: string) => {
  await logAction('Team Login', `${teamName} logged into stat tracker`);
};

export const logTeamLogout = async (teamName: string) => {
  await logAction('Team Logout', `${teamName} logged out of stat tracker`);
};

export const logMatchSelection = async (matchId: string, courtNumber: number) => {
  await logAction(
    'Match Selected',
    `Selected match on Court ${courtNumber}`,
    matchId
  );
};

export const logSetAdvance = async (matchId: string, newSet: number) => {
  await logAction(
    'Set Advanced',
    `Advanced to Set ${newSet}`,
    matchId,
    newSet
  );
};