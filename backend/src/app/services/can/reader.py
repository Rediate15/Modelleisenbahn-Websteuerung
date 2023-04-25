import asyncio
import websockets

from ...schemas.can import CANMessage
from ...schemas.can_commands.base import AbstractCANMessage
from ...utils.coding import obj_to_json

from config import get_settings
settings = get_settings()

HOST = settings.raw_can_receiver_host
PORT = settings.raw_can_receiver_port

class BackgroundReader(object):
    def __init__(self, broadcasterAndTypes):
        self.broadcasterAndTypes = broadcasterAndTypes
        self.connection = None
    
    async def connect(self):
        return await websockets.connect(f"ws://{HOST}:{PORT}")

    async def startup(self):
        print("starting BackgroundReader")
        self.connection = await self.connect()
        print("Connected")

    async def run_main(self):
        while True:
            try:
                async for message in self.connection:
                    can_message = CANMessage.parse_raw(message)
                    for abstractType in self.broadcasterAndTypes:
                        abstract_message = abstractType.from_can_message(can_message)
                        if abstract_message is None:
                            continue
                        else:
                            str_data = obj_to_json(abstract_message)
                            print(f"got message {str_data}")

                            await self.broadcasterAndTypes[abstractType].broadcast(str_data)
            except websockets.ConnectionClosed:
                self.connection = await self.connect()
                print("Reconnected")
                continue