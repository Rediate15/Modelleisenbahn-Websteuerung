from pydantic import BaseModel

class TargetModel(BaseModel):
    target_x: int
    target_y: int