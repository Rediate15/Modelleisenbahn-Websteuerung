import { Component, ElementRef, ViewChild } from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import { WebsocketService } from './services/websocket.service';
import { MatDialog } from '@angular/material/dialog';
import { ErrorDialogComponent } from './error-dialog/error-dialog.component';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  // public server_address = "10.43.10.16:8042"
  public server_address = "localhost:8042"
  public hash: number | undefined
  public selectedTrainID: number | undefined
  public mapPerspective = false
  public moveTo = false

  private listOfColors = {
    16391: "#ff0000",
    16389: "#ffff00",
    16392: "#00ff00",
    16390: "#00ffff"
  }

  public trains: any[] = []

  public allTrains: any[] = [];

  private labelLocIdMap = {"zug_1": 16391, "zug_2": 16389, "zug_3": 16392, "zug_4": 16390}
  private locIdLabelMap = {16391:"zug_1", 16389:"zug_2", 16392:"zug_3", 16390:"zug_4"}

  private zugPosition = {"zug_1": null, "zug_2": null, "zug_3": null, "zug_4": null}

  public systemState = "Go"

  public points: any
  public switches: any[] = []

  @ViewChild('canvas', { static: true }) 
  canvas: ElementRef<HTMLCanvasElement>;

  private ctx: CanvasRenderingContext2D;

  private speedWebsocket = new WebsocketService((message)=>{
    this.trains.forEach((train: any) => {
      if(train.loc_id == message.loc_id) {
        if (message.speed) {
          train.speed = Math.ceil(message.speed/10)
        }
        
      }
    })
  })
  private directionWebsocket = new WebsocketService((message)=>{
    this.trains.forEach((train: any) => {
      if(train.loc_id == message.loc_id) {
        if (message.direction) {
          train.direction = message.direction
        }
        
      }
    })
  })
  private switchWebsocket = new WebsocketService((message)=>{
    this.switches.forEach((point: any) => {
      if (message.loc_id) {
        if(point.id == message.loc_id) {
          point.position = message.position
        }
        else if (point.id2 == message.loc_id) {
          point.position2 = message.position
        }
      }
    })
  })
  private positionWebsocket = new WebsocketService((message)=>{
    this.zugPosition = message
    this.filterTrains()
  })
  

  constructor(private httpClient: HttpClient, public dialog: MatDialog){
    this.httpClient.get<number>(`http://${this.server_address}/general/hash`).subscribe(hash => {
      this.hash = hash;
      console.log(this.hash)
      this.getAllTrains()
      this.sendSystemCommand()
      this.getSwitches()
    }, error => {
      this.openDialog(error)
    })
  }

  openDialog(error: any) {
    this.dialog.open(ErrorDialogComponent, {
      data: {
        reload: () => {this.refresh()},
        error: error
      }
    });
  }

  filterTrains() {
    this.trains = []
    this.allTrains.forEach((train: any) => {
      if (this.zugPosition[this.locIdLabelMap[train.loc_id as keyof typeof this.locIdLabelMap] as keyof typeof this.zugPosition]) {
        this.trains.push(train)
      }
    })
  }

  getSwitches() {
    const headers = new HttpHeaders({'x-can-hash':String(this.hash)})
      this.httpClient.get<any>(`http://${this.server_address}/accessory/list`, {headers: headers}).subscribe((accessories: any) => {
        console.log(accessories)
        accessories.forEach((accessory: any) => {
          console.log(this.switches)
          this.switches.forEach((point: any) => {
            if (accessory.loc_id == point.id) {
              point.position = parseInt(accessory.stellung)
            } else if (accessory.loc_id == point.id2) {
              point.position2 = parseInt(accessory.stellung)
            }
          })
        })
      }, error => {
        this.openDialog(error)
      })
  }

  refresh() {
    this.httpClient.get<number>(`http://${this.server_address}/general/hash`).subscribe(hash => {
      this.hash = hash;
      console.log(this.hash)
      this.getAllTrains()
      this.sendSystemCommand()
      this.getSwitches()
    }, error => {
      this.openDialog(error)
    })
  }

  getAllTrains() {
    const headers = new HttpHeaders({'x-can-hash':String(this.hash)})
    this.httpClient.get<any[]>(`http://${this.server_address}/lok/list`, {headers: headers}).subscribe(trainList => {
      this.allTrains = trainList
      this.filterTrains()
      console.log(this.trains)
      this.selectedTrainID = trainList[0].loc_id
      this.trains.forEach(train => {
        train.speed = undefined
        train.direction = undefined
        train.color = this.listOfColors[train.loc_id  as keyof typeof this.listOfColors]
        this.httpClient.get<any>(`http://${this.server_address}/lok/${train.loc_id}/speed`, {headers: headers}).subscribe(speedResponse => {
          train.speed = Math.ceil(speedResponse.speed/10)
        })
        this.httpClient.get<any>(`http://${this.server_address}/lok/${train.loc_id}/direction`, {headers: headers}).subscribe(directionResponse => {
          train.direction = directionResponse.direction
        })
      });
    }, error => {
      this.openDialog(error)
    })
  }

  toggleMap(event:any) {
    this.mapPerspective = event.checked
  }

  setMoveTo(event:any) {
    this.moveTo = event.checked
  }

  sendSystemCommand() {
    const headers = new HttpHeaders({'x-can-hash':String(this.hash)})
    if (this.systemState == "Stop") {
      this.httpClient.post(`http://${this.server_address}/system/status?status=${"Go"}`, {}, {headers: headers}).subscribe(() => {
        this.systemState = "Go"
      }, error => {
        this.openDialog(error)
      })
    }
    else if (this. systemState == "Go") {
      this.httpClient.post(`http://${this.server_address}/system/status?status=${"Stop"}`, {}, {headers: headers}).subscribe(() => {
        this.systemState = "Stop"
      }, error => {
        this.openDialog(error)
      })
    }
  }

  changeTrainSelection(event: any) {
    this.selectedTrainID = this.trains[event].loc_id
  }

  formatLabel(value: number): string {
    return `${value}`;
  }

  onSpeedChange(value:number) {
      const headers = new HttpHeaders({'x-can-hash':String(this.hash)})
      this.httpClient.post<any>(`http://${this.server_address}/lok/${this.selectedTrainID}/speed`, {
        "speed": value * 10
      }, { headers: headers }).subscribe(() => { }, error => {
        this.openDialog(error)
      })
  }

  onDirectionChange(direction: string) {
    const headers = new HttpHeaders({'x-can-hash':String(this.hash)})
    this.httpClient.post<any>(`http://${this.server_address}/lok/${this.selectedTrainID}/direction`, {
      direction: direction
    }, {headers: headers}).subscribe(() => {
      this.trains.forEach((train) => {
        if (train.loc_id == this.selectedTrainID) {
          train.speed = 0
          return
        }
      })
    }, error => {
      this.openDialog(error)
    })
  }

  getStateColor(state: string): string {
    if (state == "Stop") {
      return "#ff0000"
    }
    else if (state == "Go") {
      return "#00aa00"
    }
    return ''
  }

  ngOnInit(): void {
    this.positionWebsocket.openWebSocket(`ws://${this.server_address}/camera/position`);
    this.switchWebsocket.openWebSocket(`ws://${this.server_address}/switch/ws`)
    this.speedWebsocket.openWebSocket(`ws://${this.server_address}/lok/speed`)
    this.directionWebsocket.openWebSocket(`ws://${this.server_address}/lok/direction`)

    this.httpClient.get("assets/data_new3.json").subscribe((data:any) =>{
      this.points = data.points;
      data.points.forEach((point: any) => {
        if (point.switch) {
          console.log(point)
          point.connected.forEach((connection: any) => {
            if (!point.id) {
              point.id = connection.id
            }
            if (!point.id2 && connection.id2) {
              point.id2 = connection.id2
            }
            if (!point.id2 && connection["id2:"]) {
              
              point.id2 = connection["id2:"]
            }
          })
          this.switches.push(point)
          console.log(point)
        }
      })

      //request um switches auszulesen

      // let counter = 0

      // this.switches.forEach((point: any) => {
      //   point.position = 0
      //   point.id = counter
      //   counter++
      //   if (point.connected.length > 3) {
      //     point.position2 = 0
      //     point.id2 = counter
      //     counter++
      //   }
      // })

      


    }, error => {
      this.openDialog(error)
    })
    const res = this.canvas.nativeElement.getContext('2d');
    if (!res || !(res instanceof CanvasRenderingContext2D)) {
        throw new Error('Failed to get 2D context');
    }
    this.ctx = res;
    this.canvas.nativeElement.addEventListener('click', (evt: MouseEvent) => {
      this.onCanvasClick(evt, this.canvas.nativeElement)
    }, false)
    setInterval(() => {
      this.animate()
    }, 25);
  }

  ngOnDestroy(): void {
    this.positionWebsocket.closeWebSocket();
    this.speedWebsocket.closeWebSocket();
    this.directionWebsocket.closeWebSocket();
    this.switchWebsocket.closeWebSocket();
  }

  onCanvasClick(evt: MouseEvent, canvasElement: any) {
    var rect = canvasElement.getBoundingClientRect();
    const x = evt.clientX - rect.left;
    const y = evt.clientY - rect.top;
    console.log(x, y)

    if (this.moveTo && this.points.length > 0) {
      let closestPoint = this.points[0]
      let closestPointError = (closestPoint.pos[0] - x)**2 + (closestPoint.pos[1] - y)**2
      this.points.forEach((point: any) => {
        const pointError = (point.pos[0] - x)**2 + (point.pos[1] - y)**2
        if (pointError < closestPointError) {
          closestPointError = pointError
          closestPoint = point
        }
        
      })
      console.log(closestPoint)
      const headers = new HttpHeaders({'x-can-hash':String(this.hash)})
      this.httpClient.post<any>(`http://${this.server_address}/camera/moveTo/${this.selectedTrainID}`, {
        "target_x": closestPoint.pos[0],
        "target_y": closestPoint.pos[1]
      }, { headers: headers }).subscribe(() => { }, error => {
        this.openDialog(error)
      })

      return
    }


    this.switches.forEach((point: any) => {
      if (x > point.pos[0]-10 && x < point.pos[0]+10 && y > point.pos[1]-10 && y < point.pos[1]+10) {
        console.log(point)
        const headers = new HttpHeaders({'x-can-hash':String(this.hash)})
        if (point.position == 0) {
          point.position++
          this.httpClient.post<any>(`http://${this.server_address}/switch/${point.id}/position`, {
              "position": 1
          }, { headers: headers }).subscribe(() => { }, error => {
            this.openDialog(error)
          })
        } else {
          if (point.position2 == 0) {
            point.position2++
            this.httpClient.post<any>(`http://${this.server_address}/switch/${point.id2}/position`, {
              "position": 1
            }, { headers: headers }).subscribe(() => { }, error => {
              this.openDialog(error)
            })
          } else if (point.position2 == 1) {
            point.position2 = 0
            this.httpClient.post<any>(`http://${this.server_address}/switch/${point.id2}/position`, {
              "position": 0
            }, { headers: headers }).subscribe(() => { }, error => {
              this.openDialog(error)
            })
            point.position = 0
            this.httpClient.post<any>(`http://${this.server_address}/switch/${point.id}/position`, {
              "position": 0
            }, { headers: headers }).subscribe(() => { }, error => {
              this.openDialog(error)
            })
          } else {
            
            this.httpClient.post<any>(`http://${this.server_address}/switch/${point.id}/position`, {
              "position": 0
            }, { headers: headers }).subscribe(() => { }, error => {
              this.openDialog(error)
            })
            point.position = 0
          }
        }
        return
      }
      
    })
  }

  animate(): void {
    this.ctx.clearRect(0, 0, 960, 540)
    this.ctx.fillStyle = 'blue';

    if(this.points) {
      this.points.forEach((point: any) => {

        point.connected.forEach((connected: any) => {
          
          if (connected.id) {
            this.ctx.strokeStyle = '#ff0000'
            this.ctx.lineWidth = 5;
          }
          else {
            this.ctx.strokeStyle = '#444444'
            this.ctx.lineWidth = 3;
          }
          this.ctx.beginPath();
          this.ctx.moveTo(point.pos[0], point.pos[1]);
          this.ctx.lineTo(connected.point[0], connected.point[1]);
          this.ctx.stroke();
        })
      })
    }
    if(this.switches) {
      this.switches.forEach((point: any) => {
        
        point.connected.forEach((connected: any) => {
          
          if (connected.id) {
            this.ctx.strokeStyle = '#ff0000'
            this.ctx.lineWidth = 5;
            this.ctx.beginPath();
            this.ctx.moveTo(point.pos[0], point.pos[1]);
            this.ctx.lineTo(connected.point[0], connected.point[1]);
            this.ctx.stroke();
          }
          
        })
      })
      this.switches.forEach((point: any) => {
        this.ctx.fillStyle = 'blue';
        this.ctx.fillRect(point.pos[0] -7, point.pos[1] -7, 14, 14);
        point.connected.forEach((connection: any) => {
          
          if (connection.position2 != undefined) {
            if (connection.position == point.position && connection.position2 == point.position2) {
              this.ctx.strokeStyle = '#0000ff'
              this.ctx.lineWidth = 5;
              this.ctx.beginPath();
              this.ctx.moveTo(point.pos[0], point.pos[1]);
              this.ctx.lineTo(connection.point[0], connection.point[1]);
              this.ctx.stroke();
            }
          } else if (connection.position == point.position) {
              this.ctx.strokeStyle = '#0000ff'
              this.ctx.lineWidth = 5;
              this.ctx.beginPath();
              this.ctx.moveTo(point.pos[0], point.pos[1]);
              this.ctx.lineTo(connection.point[0], connection.point[1]);
              this.ctx.stroke();
          }
        })
      })
    }   

    

    for(const key in this.zugPosition) {
      this.ctx.fillStyle = 'blue';
      const position = this.zugPosition[key as keyof typeof this.zugPosition]
      const loc_id = this.labelLocIdMap[key as keyof typeof this.labelLocIdMap]
      const color = this.listOfColors[loc_id as keyof typeof this.listOfColors];
      if (position) {
        this.ctx.fillStyle = color
        this.ctx.fillRect(position[0] -10, position[1] -10, 20, 20);
      }
      
    }
    
  }
}
