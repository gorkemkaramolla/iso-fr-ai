from deepface import DeepFace
import cv2
import os

# Path to the directory containing images for comparison
database_path = 'database'

# Load all images from the database directory and prepare them for comparison
database = {}
for file in os.listdir(database_path):
    if file.endswith(('.png', '.jpg', '.jpeg')):
        identity = os.path.splitext(file)[0]
        database[identity] = f'{database_path}/{file}'

# Start capturing video from the webcam
cap = cv2.VideoCapture(0)

while True:
    ret, frame = cap.read()
    if not ret:
        print("Failed to grab frame")
        break
    
    cv2.imshow('Webcam', frame)
    
    # Use 'q' to quit the loop
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break
    
    try:
        # Attempt to find a face in the captured frame and match it against the database
        result = DeepFace.find(frame, db_path=database_path, enforce_detection=False)
        
        # If a match is found, display the identity
        if result.shape[0] > 0:
            matched_identity = result.iloc[0]['identity']
            print(f"Match found: {matched_identity}")
        else:
            print("No match found")
    except Exception as e:
        print(f"Error: {e}")

# Release the capture and destroy all OpenCV windows
cap.release()
cv2.destroyAllWindows()
