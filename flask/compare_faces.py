import onnxruntime
import torch
import os
import cv2
from services.camera_processor.scrfd import SCRFD
from services.camera_processor.arcface_onnx import ArcFaceONNX

device = torch.device("cpu")
print(f"Using device: {device}")

# Initialize ONNX Runtime settings
onnxruntime.set_default_logger_severity(2)

# Set the directory path for the models
assets_dir = os.path.expanduser("~/.insightface/models/buffalo_l")
# Initialize the SCRFD detector with the model file
detector_path = os.path.join(assets_dir, "det_10g.onnx")
detector = SCRFD(detector_path)
detector.prepare(0 if device == "cuda" else -1)

# Initialize the ArcFace recognizer with the model file
rec_path = os.path.join(assets_dir, "w600k_r50.onnx")
rec = ArcFaceONNX(rec_path)
rec.prepare(0 if device == "cuda" else -1)


def compare_similarity(image1, image2):
    bboxes1, kpss1 = detector.detect(
        image1,
        max_num=1,
        input_size=(128, 128),
    )
    print(kpss1)
    for kps in kpss1:
        embedding = rec.get(image1, kps)
        print(embedding)

    if bboxes1.shape[0] == 0:
        return -1.0, "Face not found in Image-1"
    else:
        # Draw a rectangle around the face in image1
        x1, y1, x2, y2 = map(int, bboxes1[0][:4])
        cv2.rectangle(image1, (x1, y1), (x2, y2), (0, 255, 0), 2)

    bboxes2, kpss2 = detector.detect(
        image2,
        max_num=1,
        input_size=(128, 128),
    )
    if bboxes2.shape[0] == 0:
        return -1.0, "Face not found in Image-2"
    else:
        # Draw a rectangle around the face in image2
        x1, y1, x2, y2 = map(int, bboxes2[0][:4])
        cv2.rectangle(image2, (x1, y1), (x2, y2), (0, 255, 0), 2)

    # Display the images
    cv2.imshow("Image 1", image1)
    cv2.imshow("Image 2", image2)
    cv2.waitKey(0)
    cv2.destroyAllWindows()

    kps1 = kpss1[0]
    kps2 = kpss2[0]
    feat1 = rec.get(image1, kps1)
    feat2 = rec.get(image2, kps2)
    sim = rec.compute_sim(feat1, feat2)
    if sim < 0.2:
        conclu = "They are NOT the same person"
    elif sim >= 0.2 and sim < 0.28:
        conclu = "They are LIKELY TO be the same person"
    else:
        conclu = "They ARE the same person"
    return sim, conclu


if __name__ == "__main__":
    # Load the images
    image1 = cv2.imread(
        "unknown_faces/FatihMehmetSimsek/Unknown-FatihMehmetSimsek-20240604-145820.jpg"
    )
    # image2 = cv2.imread('unknown_faces/gorkemkaramolla/Unknown-gorkemkaramolla-20240604-100602.jpg')
    image2 = cv2.imread(
        "unknown_faces/gorkemkaramolla/Unknown-gorkemkaramolla-20240604-145434.jpg"
    )
    # Compare the images
    sim, conclu = compare_similarity(image1, image2)
    print(f"Similarity: {sim}, Conclusion: {conclu}")
