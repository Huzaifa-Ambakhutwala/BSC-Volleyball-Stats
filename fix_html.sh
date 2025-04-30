#!/bin/bash
# Script to fix HTML structure in MatchDetailsPage.tsx

# Create a backup
cp client/src/pages/history/MatchDetailsPage.tsx client/src/pages/history/MatchDetailsPage.tsx.bak

# 1. Extract the content with context
cat > temp_fix.py << 'PYEOF'
import re
import sys

with open('client/src/pages/history/MatchDetailsPage.tsx', 'r') as file:
    content = file.read()

# Fix Team A stats section
pattern = r'<div className="flex space-x-2 mb-3">\s+<div.*?Points.*?</div>\s+<div.*?Faults.*?</div>\s+</div>\s+</div>'
replacement = '<div className="flex space-x-2 mb-3">\n                              <div className="px-2 py-1 bg-green-100 text-green-800 rounded-md text-xs font-medium">\n                                Points: {totalEarnedPoints}\n                              </div>\n                              <div className="px-2 py-1 bg-red-100 text-red-800 rounded-md text-xs font-medium">\n                                Faults: {totalFaults}\n                              </div>\n                            </div>'
modified_content = re.sub(pattern, replacement, content, flags=re.DOTALL)

# Fix Team B stats section
pattern = r'<div className="flex space-x-2 mb-3">\s+<div.*?Points.*?</div>\s+<div.*?Faults.*?</div>\s+</div>\s+</div>'
replacement = '<div className="flex space-x-2 mb-3">\n                              <div className="px-2 py-1 bg-green-100 text-green-800 rounded-md text-xs font-medium">\n                                Points: {totalEarnedPoints}\n                              </div>\n                              <div className="px-2 py-1 bg-red-100 text-red-800 rounded-md text-xs font-medium">\n                                Faults: {totalFaults}\n                              </div>\n                            </div>'
modified_content = re.sub(pattern, replacement, modified_content, flags=re.DOTALL)

with open('client/src/pages/history/MatchDetailsPage.tsx', 'w') as file:
    file.write(modified_content)

print("HTML structure fixed")
PYEOF

# Run the Python script
python3 temp_fix.py

# Clean up
rm temp_fix.py

echo "Fixed HTML structure in MatchDetailsPage.tsx"
