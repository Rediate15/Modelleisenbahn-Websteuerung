class Point:
    def __init__(self, pos, connected):
        self.pos = pos
        self.connected = connected
        self.cost = None
        self.previous = None 

    def calcDistanceToTarget(self, target):
        self.distTarget = ((target[0]-self.pos[0])**2 + (target[1]-self.pos[1])**2)**0.5

class Switch(Point):
    def __init__(self, pos, connected):
        self.pos = pos
        self.connected = connected
        self.cost = None
        self.previous = None 

class Pathfinding:
    def __init__(self, points):
        self.points = points

    def getNextNode(self, openList):
        lowestCost = openList[0].cost + openList[0].distTarget
        lowestIndex = 0
        for i in range(len(openList)):
            cost = openList[i].cost + openList[i].distTarget
            if  cost < lowestCost:
                lowestCost = cost
                lowestIndex = i
        return openList[lowestIndex].pos

    def addConnectedNodes(self, currentNode, openList, closedList):
        connectedNodes = currentNode.connected
        for i in connectedNodes:
            if i["point"] in closedList:
                continue
            elif i["point"] in openList:
                node = openList[i["point"]]
                cost = currentNode.cost + (((currentNode.pos[0]-node.pos[0])**2 + (currentNode.pos[1]-node.pos[1])**2)**0.5)
                if node.cost > cost:
                    node.cost = cost
                    node.previous = currentNode.pos
            else:
                node = self.points[i["point"]]
                node.previous = currentNode.pos
                node.cost = currentNode.cost + (((currentNode.pos[0]-node.pos[0])**2 + (currentNode.pos[1]-node.pos[1])**2)**0.5)
                openList[node.pos] = node
    
    def getPath(self, closedList, start, target):
        if target in closedList:
            path = [target]
            current = closedList[target]
            while current.pos != start:
                current = closedList[current.previous]
                path.insert(0, current.pos)
            return path
        else:
            return []

    def findPath(self, start, target):
        for i in self.points.values():
            i.calcDistanceToTarget(target)
        
        openList = {}
        closedList = {}

        self.points[start].cost = 0
        self.points[start].previous = start
        
        openList[start] = self.points[start]

        while len(openList) > 0:
            currentNode = openList[self.getNextNode(list(openList.values()))]
            
            closedList[currentNode.pos] = currentNode
            del openList[currentNode.pos]

            if currentNode.pos == target:
                break

            self.addConnectedNodes(currentNode, openList, closedList)
        
        return self.getPath(closedList, start, target)