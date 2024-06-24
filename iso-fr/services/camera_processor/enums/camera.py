from enum import Enum

class Camera(Enum):
    CAM1 = "http://root:N143g144@192.168.100.152/mjpg/video.mjpg?streamprofile="
    CAM2 = "http://root:N143g144@192.168.100.152/mjpg/video.mjpg?streamprofile="
    CAM3 = "http://root:N143g144@192.168.100.152/mjpg/video.mjpg?streamprofile="
    CAM4 = "http://root:N143g144@192.168.100.152/mjpg/video.mjpg?streamprofile="
    CAM5 = "http://root:N143g144@192.168.100.152/mjpg/video.mjpg?streamprofile="
    LOCAL_CAM1 = "http://127.0.0.1:5004/camera/0?streamprofile="
    LOCAL_CAM2 = "http://127.0.0.1:5004/camera/1?streamprofile="