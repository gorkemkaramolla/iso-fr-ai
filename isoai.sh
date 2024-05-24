#!/bin/bash

# Get the current directory path
CURRENT_DIR=$(pwd)

# Open a new Terminal window and run the Flask server
osascript <<EOF
tell application "Terminal"
    do script "cd ${CURRENT_DIR}/insightface && python3 ip_cam_backend.py"
end tell
EOF

# Open a new Terminal window and run the Next.js server
osascript <<EOF
tell application "Terminal"
    do script "cd ${CURRENT_DIR}/iso-electron && npm run dev"
end tell
EOF
