from fastapi import APIRouter, Request
import uvicorn
from fastapi.templating import Jinja2Templates
from fastapi.responses import StreamingResponse
import os

from fastapi.responses import HTMLResponse
import cv2

camera = cv2.VideoCapture(0)

router = APIRouter()

templates = Jinja2Templates(directory="templates")


def gen_frames():  
    while True:
        success, frame = camera.read()  # read the camera frame
        if not success:
            break
        else:
            ret, buffer = cv2.imencode('.jpg', frame)
            frame = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')  # concat frame one

@router.get("/", response_class=HTMLResponse)
def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@router.get('/video_feed')
def video_feed():
    return StreamingResponse(gen_frames(), media_type='multipart/x-mixed-replace; boundary=frame')