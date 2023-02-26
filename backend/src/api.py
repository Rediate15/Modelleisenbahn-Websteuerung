from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from app.utils.tcp import send_async

from app.services import raw_can_send as raw_can_send_module
from app.services import can_send as can_send_module
from app.services import raw_can_recv as raw_can_recv_module
from app.services import can_recv as can_recv_module
from app.services import can as can_module
from app.services import database_read as database_read_module
from app.services import camera as camera_module


def get_base():
    base = FastAPI()
    base.add_middleware(CORSMiddleware, \
                        allow_origins=["*"], \
                        allow_credentials=True, \
                        allow_methods=["*"], \
                        allow_headers=["*"])
    return base

app = get_base()
app.include_router(raw_can_send_module.router, prefix="/raw_can_send")
app.include_router(can_send_module.router, prefix="/can_send")
# app.include_router(raw_can_recv_module.router, prefix="/raw_can_recv")
# app.include_router(can_recv_module.router, prefix="/can_recv")
app.include_router(can_module.router, prefix="/can")
app.include_router(database_read_module.router, prefix="/database_read")
app.include_router(camera_module.router, prefix="/camera")

if __name__ == '__main__':
    uvicorn.run(app, host='127.0.0.1', port=8000)
