import cv2
from detection import Detection

class Camera:
    def __init__(self):
        self.camera = cv2.VideoCapture(1)

        self.camera.set(cv2.CAP_PROP_FRAME_WIDTH, 960)
        self.camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 540)
        self.detection = Detection()
        self.positions = {'zug_1':None, 'zug_2':None, 'zug_3':None, 'zug_4':None}

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
            return {'zug_1':None, 'zug_2':None, 'zug_3':None, 'zug_4':None}

        detections = self.detection.detect(im0s=frame)

        for key in detections:
            if detections[key] != None:
                xyxy = detections[key][0]
                conf = detections[key][1]

                if conf > 0.4:
                    x = (xyxy[0].item() + xyxy[2].item()) / 2
                    y = (xyxy[1].item() + xyxy[3].item()) / 2
                    self.positions[key] = (int(x), int(y))
                else:
                    self.positions[key] = None
            else:
                self.positions[key] = None
        return self.positions