import { Component, ElementRef, ViewChild } from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Injectable} from '@angular/core';
import { WebsocketService } from './services/websocket.service';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
@Injectable()
export class AppComponent {

  public trains: Array<any> = [];
  public selected: number | undefined;
  public server_address = "http://localhost:8042";
  public hash: number | undefined;
  public systemNextState: string = "Go"
  public points: any
  

  @ViewChild('canvas', { static: true }) 
  canvas: ElementRef<HTMLCanvasElement>;

  private ctx: CanvasRenderingContext2D;

  

  constructor(private httpClient: HttpClient, private webSocketService: WebsocketService) {

    this.httpClient.get<number>(`${this.server_address}/general/hash`).subscribe(hash => {
      this.hash = hash;
      console.log(this.hash)
      this.getAllTrains()
      this.systemStop()
    })
    
  }

  ngOnInit(): void {
    this.webSocketService.openWebSocket("ws://localhost:8042/camera/position");


    this.httpClient.get("assets/data_new3.json").subscribe((data:any) =>{
      console.log(data);
      this.points = data.points;
    })
    const res = this.canvas.nativeElement.getContext('2d');
    if (!res || !(res instanceof CanvasRenderingContext2D)) {
        throw new Error('Failed to get 2D context');
    }
    this.ctx = res;
    setInterval(() => {
      this.animate()
    }, 25);
  }

  ngOnDestroy(): void {
    this.webSocketService.closeWebSocket();
  }

  animate(): void {
    this.ctx.clearRect(0, 0, 960, 540)
    this.ctx.fillStyle = 'blue';
    
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

      
      if (point.switch) {
        this.ctx.fillStyle = 'blue';
        this.ctx.fillRect(point.pos[0] -5, point.pos[1] -5, 10, 10);
      }
      
    })
    this.ctx.fillStyle = 'green';
    this.ctx.fillRect(this.webSocketService.trainPosition.x -5, this.webSocketService.trainPosition.y -5, 10, 10);
  }

  systemStop() {
    const headers = new HttpHeaders({'x-can-hash':String(this.hash)})
    this.httpClient.post(`${this.server_address}/system/status?status=Stop`, {}, {headers: headers}).subscribe(() => {
      this.systemNextState = "Go"
    })
  }

  systemGo() {
    const headers = new HttpHeaders({'x-can-hash':String(this.hash)})
    this.httpClient.post(`${this.server_address}/system/status?status=Go`, {}, {headers: headers}).subscribe(() => {
      this.systemNextState = "Stop"
    })
  }

  getAllTrains() {
    const headers = new HttpHeaders({'x-can-hash':String(this.hash)})
    this.httpClient.get<any[]>(`${this.server_address}/lok/list`, {headers: headers}).subscribe(trainList => {
      this.trains = trainList
      console.log(this.trains)
      this.trains.forEach(train => {
        train.speed = 0
        train.background = "#dddddd"
      });
    })
    if (this.trains.length > 0) {
      this.trains[0].background = "#aaaaaa"
    }
  }

  formatLabel(value: number): string {
    return `${value}`;
  }

  onForwards() {
    if (this.selected) {
      const headers = new HttpHeaders({'x-can-hash':String(this.hash)})
      this.httpClient.post<any>(`${this.server_address}/lok/${this.trains[this.selected].loc_id}/direction`, {
        direction: "Forwards"
      }, {headers: headers}).subscribe(() => {
        if (this.selected){
          this.trains[this.selected].direction = true
          this.trains[this.selected].speed = 0
          console.log(this.trains[this.selected].direction)
        }
      })
    }
    
  }

  onBackwards() {
    if (this.selected) {
      const headers = new HttpHeaders({'x-can-hash':String(this.hash)})
      this.httpClient.post<any>(`${this.server_address}/lok/${this.trains[this.selected].loc_id}/direction`, {
        direction: "Backwards"
      }, {headers: headers}).subscribe(() => {
        if (this.selected){
          this.trains[this.selected].direction = false
          this.trains[this.selected].speed = 0
          console.log(this.trains[this.selected].direction)
        }
      })
    }
  }

  onTrainClick(index: number) {
    if (this.selected) {
      this.trains[this.selected].background = "#dddddd"
    }
    
    this.selected = index
    this.trains[this.selected].background = "#aaaaaa"

    const headers = new HttpHeaders({'x-can-hash':String(this.hash)})
    this.httpClient.get<any>(`${this.server_address}/lok/${this.trains[index].loc_id}/speed`, {headers: headers}).subscribe(data => {
      console.log(data)
      this.trains[index].speed = Math.ceil(data.speed/10)
    })
    this.httpClient.get<any>(`${this.server_address}/lok/${this.trains[index].loc_id}/direction`, {headers: headers}).subscribe(data => {
      console.log(data)
      if (data.direction == "Forwards") {
        this.trains[index].direction = true
      }
      else if (data.direction == "Backwards") {
        this.trains[index].direction = false
      }
      console.log(this.trains[index].direction)
    })
  }

  onSpeedChange(value:number) {
    if (this.selected) {
      this.trains[this.selected].speed = value
      const headers = new HttpHeaders({'x-can-hash':String(this.hash)})
      this.httpClient.post<any>(`${this.server_address}/lok/${this.trains[this.selected].loc_id}/speed`, {
        "speed": value * 10
      }, {headers: headers}).subscribe()
    }
    
  }

  onClickStop() {
    // this.trains.forEach(train => {
    //   train.speed = 0
    //   const headers = new HttpHeaders({'x-can-hash':String(this.hash)})
    //   this.httpClient.post<any>(`${this.server_address}/lok/${this.trains[this.selected].loc_id}/speed`, {
    //     "speed": 0
    //   }, {headers: headers}).subscribe(() => console.log("stop"))
    // });
    if (this.systemNextState == "Stop") {
      this.systemStop()
    }
    else if (this.systemNextState == "Go") {
      this.systemGo()
    }
  }
}
