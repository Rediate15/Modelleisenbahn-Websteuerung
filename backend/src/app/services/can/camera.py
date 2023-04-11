from fastapi import APIRouter, Request, WebSocket
import uvicorn
from fastapi.templating import Jinja2Templates
from fastapi.responses import StreamingResponse
import os
import numpy as np
import asyncio

from fastapi.responses import HTMLResponse
import cv2
from ...utils.camera.cv import Camera

router = APIRouter()

templates = Jinja2Templates(directory="templates")
camera = Camera()

    
        

@router.get("/", response_class=HTMLResponse)
def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@router.get('/video_feed')
def video_feed():
    return StreamingResponse(camera.gen_frames(), media_type='multipart/x-mixed-replace; boundary=frame')

@router.websocket('/position')
async def position_stream(websocket: WebSocket):
    await websocket.accept()
    while True:
        await asyncio.sleep(0.1)
        payload = camera.get_pos()
        # payload = {"x": 10 / 2, "y": 10 / 2}
        await websocket.send_json(payload)