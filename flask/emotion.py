# import os
# import requests
# import onnxruntime as ort
# import cv2
# import numpy as np

# # Step 1: Install Required Packages
# # pip install onnxruntime numpy opencv-python

# # Step 2: Download the ONNX Model


# # Step 3: Load the Model
# model_path = os.path.expanduser('~/.insightface/models/buffalo_l/onnx_model.onnx')
# session = ort.InferenceSession(model_path)

# # Step 4: Preprocess the Input Image
# from PIL import Image

# def preprocess_image(image_path):
#   input_shape = (1, 1, 48, 48)
#   img = Image.open(image_path)
#   img = img.resize((48, 48), Image.Resampling.LANCZOS)
#   img_data = np.array(img).astype(np.float32)  # Convert to float
#   img_data /= 255.0  # Normalize to 0-1 if necessary
#   img_data = np.resize(img_data, input_shape)
#   return img_data

# image_path = './face-images/happy.jpg'
# input_image = preprocess_image(image_path)

# # Step 5: Run Inference
# input_name = session.get_inputs()[0].name
# output_name = session.get_outputs()[0].name
# result = session.run([output_name], {input_name: input_image})

# emotion_scores = np.squeeze(result)

# # Step 6: Interpret the Results
# emotion_labels = [
#     "neutral", "happiness", "surprise", "sadness",
#     "anger", "disgust", "fear"
# ]

# emotion_dict = {emotion_labels[i]: float(emotion_scores[i]) for i in range(len(emotion_labels))}

# # Get the emotion with the highest score
# detected_emotion = max(emotion_dict, key=emotion_dict.get)

# print(f"Detected emotion: {detected_emotion}")
# print("Emotion scores:")
# for emotion, score in emotion_dict.items():
#     print(f"{emotion}: {score:.4f}")
import os
import onnx
import onnxruntime
import numpy as np
from PIL import Image

# Load the ONNX model
model_path = os.path.expanduser('~/.insightface/models/buffalo_l/onnx_model.onnx')
session = onnxruntime.InferenceSession(model_path, providers=["CUDAExecutionProvider"])

# Preprocess the input image
def preprocess(image_path):
    image = Image.open(image_path).convert('L')  # Convert image to grayscale
    image = image.resize((48, 48))  # Resize to the model's expected input size
    image = np.array(image).astype('float32') / 255.0  # Normalize pixel values
    image = np.expand_dims(image, axis=0)  # Add channel dimension
    image = np.expand_dims(image, axis=0)  # Add batch dimension
    return image

# Run the model
def predict(image_path):
    input_image = preprocess(image_path)
    input_name = session.get_inputs()[0].name
    output_name = session.get_outputs()[0].name
    result = session.run([output_name], {input_name: input_image})
    return result

# Postprocess the output
def postprocess(result):
    emotions = ['Angry', 'Disgust', 'Fear', 'Happy', 'Sad', 'Surprise', 'Neutral']
    emotion_scores = result[0][0]
    predicted_emotion = emotions[np.argmax(emotion_scores)]
    return predicted_emotion

# Example usage
image_path = './face-images/happy.jpeg'
result = predict(image_path)
emotion = postprocess(result)
print(f'Predicted Emotion: {emotion}')
