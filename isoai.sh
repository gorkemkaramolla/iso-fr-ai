#!/bin/bash

# # Get the current directory path
# CURRENT_DIR=$(pwd)

# # Open a new Terminal window and run the Flask server
# osascript <<EOF
# tell application "Terminal"
#     do script "cd ${CURRENT_DIR}/insightface && python3 ip_cam_backend.py"
# end tell
# EOF

# # Open a new Terminal window and run the Next.js server
# osascript <<EOF
# tell application "Terminal"
#     do script "cd ${CURRENT_DIR}/iso-electron && npm run dev"
# end tell
# EOF
#!/bin/bash

# Function to run a command in a new GNOME Terminal tab
#!/bin/bash

# Function to run a command in a new xterm window
run_in_new_xterm() {
    xterm -hold -e "$1" &
}

# Navigate to the directory containing your docker-compose.yml file
cd ./

# Run each service in a new xterm window
run_in_new_xterm "sudo docker-compose up es01 es02 es03"
run_in_new_xterm "sudo docker-compose up kibana"
run_in_new_xterm "sudo docker-compose up mongodb"
run_in_new_xterm "sudo docker-compose up flask-backend"
run_in_new_xterm "sudo docker-compose up nextjs-frontend"

echo "All services are starting in separate xterm windows."
