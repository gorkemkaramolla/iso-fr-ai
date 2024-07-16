import os
import onnx
import onnxruntime
import numpy as np
from PIL import Image

onnxruntime.set_default_logger_severity(3)  # Disable onnxruntime logging
# Load the ONNX model
model_path = os.path.expanduser('~/.insightface/models/buffalo_l/emotion_model.onnx')
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
image_path = './face-images/angry1.jpg'
result = predict(image_path)
emotion = postprocess(result)
print(f'Predicted Emotion: {emotion}')
