import cv2
import json
import requests
import threading
from .pathfinding import Switch
from .pathfinding import Point
from .pathfinding import Pathfinding
import time
import asyncio

driveEvent = asyncio.Event()
class Drive:
    def __init__(self, camera, target, loc_id):
        self.camera = camera
        self.points = {}
        self.start = None
        self.target = target
        self.loc_id = loc_id

        self.url = "http://localhost:8042"

        response = requests.get(url=self.url+"/general/hash")
        self.hash = response.json()
        self.previous = self.start
        self.path = []
        self.initialDirektion = True
        self.switchesSet = False
        self.finished = False
        self.directionToggleSwitches = []
        self.toggle = False
        self.locIdLabelMap = {16391:"zug_1", 16389:"zug_2", 16392:"zug_3", 16390:"zug_4"}
        print("Init")

    def setSwitchFunction(self, url, id, position, hash):
        requests.post(url=url+"/switch/"+ id +"/position", json = {"position": position}, headers = {"x-can-hash":str(hash)})
        print("set switch " + id + " to position " + str(position))

    def loadPoints(self):
        print("Load")
        f = open('data_new3.json')
        data = json.load(f)
        for i in data['points']:
            pos = (i["pos"][0], i["pos"][1])
            connected = []
            for j in i["connected"]:
                if len(j) == 0:
                    continue
                else:
                    connected.append({"point":tuple(j["point"]), "id":j["id"], "position":j["position"]})
            if i["switch"]:
                self.points[pos] = Switch(pos, connected)
            else:
                self.points[pos] = Point(pos, connected)
        f.close()
        self.pathfinding = Pathfinding(self.points)
        print("Load finished")

    def exec_drive(self):
        requests.post(url=self.url+"/lok/"+str(self.loc_id)+"/speed", json = {"speed": 300}, headers = {"x-can-hash":str(self.hash)})

        driveEvent.clear()
        running = True
        while running:
            if driveEvent.is_set():
                print("cancel")
                break
            
            if self.camera.positions[self.locIdLabelMap[self.loc_id]] != None:
                closest_point = list(self.points.keys())[0]
                pos_x = self.camera.positions[self.locIdLabelMap[self.loc_id]][0]
                pos_y = self.camera.positions[self.locIdLabelMap[self.loc_id]][1]
                lowest_error = ((pos_x-closest_point[0])**2 + (pos_y-closest_point[1])**2)

                for i in self.points.keys():
                    error = ((pos_x-i[0])**2 + (pos_y-i[1])**2)
                    if error < lowest_error:
                        lowest_error = error
                        closest_point = i

                self.start = closest_point

                if self.start != self.previous and self.previous != None and not self.finished:
                    if (self.initialDirektion or self.toggle) and self.path != [] and closest_point != self.path[1]:
                        print("toggle")
                        
                        requests.post(url=self.url+"/lok/"+str(self.loc_id)+"/direction", json = {"direction": "Toggle"}, headers = {"x-can-hash":str(self.hash)})
                        requests.post(url=self.url+"/lok/"+str(self.loc_id)+"/speed", json = {"speed": 300}, headers = {"x-can-hash":str(self.hash)})
                        self.initialDirektion = False
                        self.toggle = False
                    elif self.initialDirektion and self.path != [] and closest_point == self.path[1]:
                        self.initialDirektion = False
                    self.path = self.pathfinding.findPath(self.start, self.target)
                    if not self.switchesSet:
                        for i, point_pos in enumerate(self.path):
                            point = self.points[point_pos]
                            if isinstance(point, Switch):
                                if i == len(self.path) -1:
                                    continue

                                prev = False
                                next = False

                                for connected in point.connected:
                                    if i > 0 and connected['point'] == self.path[i-1]:
                                        if connected['id'] != None:
                                            prev = True


                                    if connected['point'] == self.path[i+1]:
                                        if connected['id'] != None:
                                            next = True

                                            thread = threading.Thread(target=self.setSwitchFunction, args=(self.url, str(connected['id']), connected['position'], self.hash))
                                            thread.start()
                                            
                                            if "id2" in connected:
                                                thread2 = threading.Thread(target=self.setSwitchFunction, args=(self.url, str(connected['id2']), connected['position2'], self.hash))
                                                thread2.start()
                                if prev and next:
                                    self.directionToggleSwitches.append(point_pos)
                        self.switchesSet = True
                    if self.start == self.target:
                        requests.post(url=self.url+"/lok/"+str(self.loc_id)+"/direction", json = {"direction": "Toggle"}, headers = {"x-can-hash":str(self.hash)})
                        print("finished")
                        self.finished = True
                        break
                    elif len(self.directionToggleSwitches) > 0 and self.start == self.directionToggleSwitches[0]:
                        self.toggle = True
                        self.directionToggleSwitches.pop(0)

                
                self.previous = self.start
                time.sleep(0.2)