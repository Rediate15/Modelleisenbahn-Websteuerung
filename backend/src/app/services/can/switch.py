from fastapi import APIRouter, Header, WebSocket, WebSocketDisconnect
from typing import Type
import asyncio

from ...utils.communication import send_can_message
from .helper import connect, get_single_response_timeout, return204

from ...schemas.can_commands.loc import LocomotiveSpeedCommand, LocomotiveDirectionCommand, LocomotiveFunctionCommand, SwitchingAccessoriesCommand
from ...schemas.can_commands import AbstractCANMessage, CommandSchema

from .schemas.lok import FunctionValueModel, SpeedModel, DirectionModel, PositionModel

from .configs import get_config

from ...utils.communication import ConnectionManager
from .reader import BackgroundReader


router = APIRouter()
manager = ConnectionManager()
reader = BackgroundReader({SwitchingAccessoriesCommand: manager})

@router.post("/{loc_id}/position", status_code=204)
async def set_switch(loc_id: int, position: PositionModel, x_can_hash: str = Header(None)):
    message = SwitchingAccessoriesCommand(loc_id = loc_id, position = position.position, power = 1, hash_value = x_can_hash, response = False)

    def check(m):
        if not m.response or m.get_command() != CommandSchema.SwitchingAccessories:
            return False
        if m.loc_id != loc_id or m.position != position.position:
            return False
        return True

    async with connect() as connection:
        await send_can_message(message)
        return await get_single_response_timeout(connection, check, return204)



@router.on_event("startup")
async def app_startup():
    await reader.startup()
    loop = asyncio.get_event_loop()
    loop.create_task(reader.run_main())

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)