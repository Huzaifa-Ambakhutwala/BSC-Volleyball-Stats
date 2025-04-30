#!/bin/bash
# Script to update the MatchDetailsPage.tsx file to remove neutral category

# Path to the file
FILE="client/src/pages/history/MatchDetailsPage.tsx"

# Update the earned points calculations
sed -i 's/const totalEarnedPoints = (playerStats.aces || 0) + (playerStats.spikes || 0) + (playerStats.blocks || 0);/const totalEarnedPoints = (playerStats.aces || 0) + (playerStats.spikes || 0) + (playerStats.blocks || 0) + (playerStats.digs || 0) + (playerStats.tips || 0) + (playerStats.dumps || 0);/g' "$FILE"

# Update the faults calculations
sed -i 's/const totalFaults = (playerStats.serveErrors || 0) + (playerStats.spikeErrors || 0) + (playerStats.netTouches || 0) + (playerStats.footFaults || 0) + (playerStats.carries || 0);/const totalFaults = (playerStats.serveErrors || 0) + (playerStats.spikeErrors || 0) + (playerStats.netTouches || 0) + (playerStats.footFaults || 0) + (playerStats.carries || 0) + (playerStats.reaches || 0);/g' "$FILE"

# Remove totalNeutralPlays calculations
sed -i '/const totalNeutralPlays = (playerStats.digs || 0) + (playerStats.tips || 0) +/d' "$FILE"
sed -i '/(playerStats.dumps || 0) + (playerStats.reaches || 0);/d' "$FILE"

# Update hasStats condition
sed -i 's/const hasStats = totalEarnedPoints > 0 || totalFaults > 0 || totalNeutralPlays > 0;/const hasStats = totalEarnedPoints > 0 || totalFaults > 0;/g' "$FILE"

# Remove Neutral display divs
sed -i '/<div className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-md text-xs font-medium">/d' "$FILE"
sed -i '/Neutral: {totalNeutralPlays}/d' "$FILE"
sed -i '/<\/div>/s/<\/div>/<\/div>/1' "$FILE"

echo "MatchDetailsPage.tsx updated to remove neutral category"
