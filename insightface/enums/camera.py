from enum import Enum

class Camera(Enum):
    CAM1 = "http://root:N143g144@192.168.100.152/mjpg/video.mjpg?streamprofile=Quality"
    CAM2 = "http://root:N143g144@192.168.100.152/mjpg/video.mjpg?streamprofile=Quality"
    CAM3 = "http://root:N143g144@192.168.100.152/mjpg/video.mjpg?streamprofile=Quality"
    CAM4 = "http://root:N143g144@192.168.100.152/mjpg/video.mjpg?streamprofile=Quality"
    CAM5 = "http://root:N143g144@192.168.100.152/mjpg/video.mjpg?streamprofile=Quality"
    LOCAL_CAM1 = "http://localhost:5555/cam1"
    LOCAL_CAM2 = "http://localhost:5555/cam2"