import datetime
import numpy as np
import os
import os.path as osp
import glob
import cv2
import insightface
from insightface.app import FaceAnalysis
from insightface.data import get_image as ins_get_image

assert insightface.__version__>='0.7'

def load_and_detect_faces(image_path, app):
    img = cv2.imread(image_path)
    faces = app.get(img)
    return img, faces

def swap_faces_in_same_image(img, faces, swapper):
    assert len(faces)==2  # Check if there are exactly two faces in the image

    res = img.copy()
    for i, face in enumerate(faces):
        source_face = faces[1 - i]  # Select the other face as the source face
        res = swapper.get(res, face, source_face, paste_back=True)
    return res
def swap_faces_between_images(img1, faces1, img2, faces2, swapper):
    assert len(faces1)==1  # Check if there's exactly one face in the first image
    assert len(faces2)==1  # Check if there's exactly one face in the second image

    source_face = faces2[0]  # Select the face from the second image as the source face

    res = img1.copy()
    res = swapper.get(res, faces1[0], source_face, paste_back=True)
    return res

if __name__ == '__main__':
    app = FaceAnalysis(name='buffalo_l')
    app.prepare(ctx_id=0, det_size=(640, 640))
    swapper = insightface.model_zoo.get_model('inswapper_128.onnx', download=True, download_zip=True)

    img, faces = load_and_detect_faces('../face-images/Elif.png', app)
    img2, faces2 = load_and_detect_faces('../face-images/FuatAltun.jpg', app)

    res = swap_faces_between_images(img, faces,img2,faces2, swapper)
    cv2.imwrite("./t1_swapped.jpg", res)