from fastapi import APIRouter, Request
import uvicorn
from fastapi.templating import Jinja2Templates
from fastapi.responses import StreamingResponse
import os
import numpy as np

from fastapi.responses import HTMLResponse
import cv2

camera = cv2.VideoCapture(0)

router = APIRouter()

templates = Jinja2Templates(directory="templates")


def gen_frames(filter=False):  
    while True:
        success, frame = camera.read()  # read the camera frame
        if not success:
            break
        else:
            if filter:
                hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
                
                lower_gray = np.array([0, 0, 140])
                upper_gray = np.array([120, 20, 170])

                mask = cv2.inRange(hsv, lower_gray, upper_gray)

                frame = cv2.bitwise_and(frame, frame, mask=mask)    

            ret, buffer = cv2.imencode('.jpg', frame)
            frame = buffer.tobytes()

            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

@router.get("/", response_class=HTMLResponse)
def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@router.get('/video_feed')
def video_feed():
    return StreamingResponse(gen_frames(), media_type='multipart/x-mixed-replace; boundary=frame')

@router.get('/video_feed/filter')
def filter():    
    return StreamingResponse(gen_frames(filter=True), media_type='multipart/x-mixed-replace; boundary=frame')