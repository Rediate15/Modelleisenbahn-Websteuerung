from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.utils.tcp import send_async

from app.services import can as can_module


def get_base():
    base = FastAPI()
    base.add_middleware(CORSMiddleware, \
                        allow_origins=["*"], \
                        allow_credentials=True, \
                        allow_methods=["*"], \
                        allow_headers=["*"])
    return base

can = get_base()
can.include_router(can_module.router)
