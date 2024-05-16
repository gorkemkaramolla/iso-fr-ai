import os
import subprocess
import sys

def main():
    # Get the current directory
    current_dir = os.getcwd()

    # Change directory to the backend directory
    backend_dir = os.path.join(current_dir, 'googleSP2T')
    os.chdir(backend_dir)

    # If arguments are provided, execute the specified command
    if len(sys.argv) > 1:
        subprocess.Popen(['poetry', 'run', 'python3'] + sys.argv[1:])
    else:
        # Run poetry run python3 ip_cam_backend.py in the foreground
        subprocess.Popen(['poetry', 'run', 'python3', 'speaker-diarization.py'])

        # Change directory to the client directory
        client_dir = os.path.join(current_dir, 'iso-electron')
        os.chdir(client_dir)

        # Run npm run dev in the background
        npm_process = subprocess.Popen(['npm', 'run', 'dev'])

        # Wait for npm run dev to finish before exiting
        npm_process.wait()

    # Change back to the original directory
    # os.chdir(current_dir)

if __name__ == "__main__":
    main()
