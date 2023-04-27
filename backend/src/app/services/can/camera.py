from fastapi import APIRouter, Request, WebSocket, Response
import uvicorn
from fastapi.templating import Jinja2Templates
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.encoders import jsonable_encoder
import os
import numpy as np
import asyncio
import threading
from ...utils.camera.drive import Drive, driveEvent
from .schemas.camera import TargetModel
import json

from fastapi.responses import HTMLResponse
import cv2
from ...utils.camera.cv import Camera


router = APIRouter()

templates = Jinja2Templates(directory="templates")
camera = Camera()

@router.on_event("startup")
async def app_startup():
    loop = asyncio.get_event_loop()
    asyncio.ensure_future(camera.get_pos())
    loop.run_forever()
        

@router.get("/", response_class=HTMLResponse)
def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@router.get('/video_feed')
def video_feed():
    return StreamingResponse(camera.gen_frames(), media_type='multipart/x-mixed-replace; boundary=frame')

@router.get('/points')
def get_points():
    f = open('data_new3.json')
    json_compatible = jsonable_encoder(json.load(f))
    return JSONResponse(content=json_compatible)

@router.websocket('/position')
async def position_stream(websocket: WebSocket):
    await websocket.accept()
    while True:
        await asyncio.sleep(0.1)
        payload = camera.positions
        # payload = {"x": 10 / 2, "y": 10 / 2}
        await websocket.send_json(payload)

@router.post('/moveTo/{loc_id}', status_code=204)
async def moveTo(loc_id: int, target: TargetModel):
    def driveThread(camera, target, loc_id):
        drive = Drive(camera, target, loc_id)
        drive.loadPoints()
        driveEvent.clear()
        drive.exec_drive()
    
    driveEvent.set()
    thread = threading.Thread(target=driveThread, args=(camera, (target.target_x, target.target_y), loc_id))
    thread.start()
    return Response(status_code=204)
