import os
import onnxruntime
import numpy as np
from PIL import Image

class EmotionDetector:
    def __init__(self, model_path: str, providers=["CUDAExecutionProvider", "CPUExecutionProvider"]):
        onnxruntime.set_default_logger_severity(3)  # Disable onnxruntime logging
        self.model_path = os.path.expanduser(model_path)
        assert os.path.exists(self.model_path), f"Model file not found: {self.model_path}"
        self.session = onnxruntime.InferenceSession(self.model_path, providers=providers)
        self.emotions = ['Angry', 'Disgust', 'Fear', 'Happy', 'Sad', 'Surprise', 'Neutral']

    def preprocess_image_path(self, image_path: str) -> np.ndarray:
        assert os.path.exists(image_path), f"Image file not found: {image_path}"
        image = Image.open(image_path).convert('L')  # Convert image to grayscale
        image = image.resize((48, 48))  # Resize to the model's expected input size
        image = np.array(image).astype('float32') / 255.0  # Normalize pixel values
        assert image.shape == (48, 48), f"Preprocessed image has incorrect shape: {image.shape}"
        image = np.expand_dims(image, axis=0)  # Add channel dimension
        image = np.expand_dims(image, axis=0)  # Add batch dimension
        return image

    def preprocess_array(self, image_array: np.ndarray) -> np.ndarray:
        assert isinstance(image_array, np.ndarray), "Input must be a numpy array"
        image = Image.fromarray(image_array).convert('L')  # Convert image to grayscale
        image = image.resize((48, 48))  # Resize to the model's expected input size
        image = np.array(image).astype('float32') / 255.0  # Normalize pixel values
        assert image.shape == (48, 48), f"Preprocessed image has incorrect shape: {image.shape}"
        image = np.expand_dims(image, axis=0)  # Add channel dimension
        image = np.expand_dims(image, axis=0)  # Add batch dimension
        return image

    def predict(self, input_image: np.ndarray) -> np.ndarray:
        input_name = self.session.get_inputs()[0].name
        output_name = self.session.get_outputs()[0].name
        result = self.session.run([output_name], {input_name: input_image})
        assert len(result) > 0, "No output from the model"
        return result

    def postprocess(self, result: np.ndarray) -> str:
        assert len(result[0][0]) == len(self.emotions), f"Output size {len(result[0][0])} does not match number of emotions {len(self.emotions)}"
        emotion_scores = result[0][0]
        predicted_emotion = self.emotions[np.argmax(emotion_scores)]
        return predicted_emotion

    def detect_emotion_from_path(self, image_path: str) -> str:
        input_image = self.preprocess_image_path(image_path)
        result = self.predict(input_image)
        emotion = self.postprocess(result)
        return emotion

    def detect_emotion_from_array(self, image_array: np.ndarray) -> str:
        input_image = self.preprocess_array(image_array)
        result = self.predict(input_image)
        emotion = self.postprocess(result)
        return emotion

# Example usage
if __name__ == "__main__":
    model_path = '~/.insightface/models/buffalo_l/emotion_model.onnx'
    image_path = './face-images/angry1.jpg'
    emotion_detector = EmotionDetector(model_path)
    emotion = emotion_detector.detect_emotion_from_path(image_path)
    print(f'Predicted Emotion: {emotion}')

    # Example with numpy array
    image_array = np.random.randint(0, 255, (100, 100), dtype=np.uint8)
    emotion = emotion_detector.detect_emotion_from_array(image_array)
    print(f'Predicted Emotion from array: {emotion}')
