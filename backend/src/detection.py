import argparse
import time
from pathlib import Path

import torch
import numpy as np

from models.experimental import attempt_load
from utils.datasets import letterbox
from utils.general import non_max_suppression, scale_coords, set_logging
from utils.torch_utils import select_device

class Detection:
    def __init__(self):

        # Initialize
        set_logging()
        self.device = select_device('')

        # Load model
        self.model = attempt_load("best.pt", map_location=self.device)  # load FP32 model
        self.stride = int(self.model.stride.max())  # model stride


    def detect(self, im0s, imgsz = 640):

        # Padded resize
        img = letterbox(im0s, imgsz, stride=self.stride)[0]

        # Convert
        img = img[:, :, ::-1].transpose(2, 0, 1)  # BGR to RGB, to 3x416x416
        img = np.ascontiguousarray(img)

        # Run inference

        img = torch.from_numpy(img).to(self.device)
        img = img.float()  # uint8 to fp16/32
        img /= 255.0  # 0 - 255 to 0.0 - 1.0
        if img.ndimension() == 3:
            img = img.unsqueeze(0)

        # Inference
        with torch.no_grad():   # Calculating gradients would cause a GPU memory leak
            pred = self.model(img)[0]

        # Apply NMS
        pred = non_max_suppression(pred, 0.05, 0.45)

        # Process detections
        det = pred[0]
        if len(det):
            # Rescale boxes from img_size to im0 size
            det[:, :4] = scale_coords(img.shape[2:], det[:, :4], im0s.shape).round()

            *xyxy, conf, cls = det[0]
        return xyxy, conf, cls