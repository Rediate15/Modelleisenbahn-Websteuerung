import cv2
from detection import Detection

class Camera:
    def __init__(self):
        self.camera = cv2.VideoCapture(1)

        self.camera.set(cv2.CAP_PROP_FRAME_WIDTH, 960)
        self.camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 540)
        self.detection = Detection()
        self.x = None
        self.y = None
        self.conf = None

    def gen_frames(self):  
        while True:
            success, frame = self.camera.read()  # read the camera frame
            if not success:
                break
            else:
                ret, buffer = cv2.imencode('.jpg', frame)
                frame = buffer.tobytes()

                yield (b'--frame\r\n'
                    b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
    
    def get_pos(self):
        success, frame = self.camera.read()  # read the camera frame
        if not success:
            raise Exception("Camera Error")
        xyxy, conf, _ = self.detection.detect(im0s=frame)
        self.x = (xyxy[0].item() + xyxy[2].item()) / 2
        self.y = (xyxy[1].item() + xyxy[3].item()) / 2
        self.conf = conf
        return {"x": self.x, "y": self.y}