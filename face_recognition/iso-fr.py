import cv2
import face_recognition
import numpy as np
# Dictionary of image files and names
image_files = {"GörkemKaramolla.jpg": "Görkem Karamolla", "FatihYavuz.jpg": "Fatih Yavuz", "FuatAltun.jpg": "Fuat Altun"}

# Lists to store the known face encodings and names
known_face_encodings = []
known_face_names = []
# Loop over the image files and load each one
for image_file, name in image_files.items():
    # Load the image
    image = face_recognition.load_image_file("face-images/"+image_file)
    # Get the face encoding of the image
    face_encoding = face_recognition.face_encodings(image)[0]
    # Add the face encoding and name to the known faces
    known_face_encodings.append(face_encoding)
    known_face_names.append(name)

# Initialize some variables
face_locations = []
face_encodings = []
face_names = []
#dlib
# Load the Haar cascade xml file for face detection
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

# Get a reference to webcam #0 (the default one)
video_capture = cv2.VideoCapture(0)

while True:
    # Grab a single frame of video
    ret, frame = video_capture.read()

    # If the frame was not grabbed, then we have reached the end of the stream
    if not ret:
        print("Unable to capture video")
        break

    # Convert the image from BGR color (which OpenCV uses) to RGB color (which face_recognition uses)
    rgb_small_frame = frame[:, :, ::-1]

    # Use the Haar cascade to detect faces
    faces = face_cascade.detectMultiScale(rgb_small_frame, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))

    face_encodings = []
    face_names = []
    for (x, y, w, h) in faces:
        # Extract the region of interest from the image
        roi = rgb_small_frame[y:y+h, x:x+w]

        # Compute the face encoding and check if it matches the known face(s)
        face_encoding = face_recognition.face_encodings(roi)
        if len(face_encoding) > 0:  # If a face is detected in the region of interest
            face_encodings.append(face_encoding[0])
            matches = face_recognition.compare_faces(known_face_encodings, face_encoding[0])
            face_distances = face_recognition.face_distance(known_face_encodings, face_encoding[0])

            name = "Unknown"
            confidence = 0  # Default confidence when no match is found
            if True in matches:
                # Find the closest match index
                best_match_index = np.argmin(face_distances)
                if matches[best_match_index]:
                    name = known_face_names[best_match_index]
                    
                    # Convert distance to confidence score
                    # This example simply inverts the distance. You may need to adjust this calculation.
                    confidence = 1 - face_distances[best_match_index]
                    
                    # Append '(confidence%)' to the name to display it
                    name += f' ({confidence:.2%})'
            face_names.append(name)

    # Display the results
    for ((x, y, w, h), name) in zip(faces, face_names):
        # Draw a box around the face
        cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 0, 255), 2)

        # Draw a label with a name below the face
        cv2.rectangle(frame, (x, y+h+35), (x+w, y+h), (0, 0, 255), cv2.FILLED)
        font = cv2.FONT_HERSHEY_DUPLEX
        cv2.putText(frame, name, (x + 6, y+h + 30), font, 1.0, (255, 255, 255), 1)

    # Display the resulting image
    cv2.imshow('Video', frame)

    # Hit 'q' on the keyboard to quit!
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Release handle to the webcam
video_capture.release()
cv2.destroyAllWindows()