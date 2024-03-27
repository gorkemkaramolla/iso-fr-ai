import cv2
from transformers import AutoModelForImageClassification, AutoImageProcessor
import torch
from PIL import Image
import numpy as np

# Define the mapping from class IDs to labels
id_to_label = {0: 'sad', 1: 'disgust', 2: 'angry', 3: 'neutral', 4: 'fear', 5: 'surprise', 6: 'happy',}

# Load the model and processor
processor = AutoImageProcessor.from_pretrained("dima806/facial_emotions_image_detection")
model = AutoModelForImageClassification.from_pretrained("dima806/facial_emotions_image_detection")

# Initialize the webcam
cap = cv2.VideoCapture(0)

while True:
    # Capture frame-by-frame
    ret, frame = cap.read()
    if not ret:
        break
    
    # Convert the captured frame to PIL Image
    color_coverted = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    pil_image = Image.fromarray(color_coverted)

    # Process the image and predict with the model
    inputs = processor(images=pil_image, return_tensors="pt")
    outputs = model(**inputs)
    probabilities = torch.nn.functional.softmax(outputs.logits, dim=-1)
    top_prob, top_class_id = probabilities.topk(1, dim=-1)
    predicted_label = id_to_label[top_class_id.item()]
    predicted_probability = top_prob.item()

    # Display the resulting frame with predictions
    cv2.putText(frame, f"{predicted_label}: {predicted_probability:.2%}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
    
    cv2.imshow('Frame', frame)

    # Break the loop
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# When everything done, release the capture
cap.release()
cv2.destroyAllWindows()
