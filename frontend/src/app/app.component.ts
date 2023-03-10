import { Component } from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Injectable} from '@angular/core';
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

  constructor(private httpClient: HttpClient) {

    this.httpClient.get<number>(`${this.server_address}/general/hash`).subscribe(hash => {
      this.hash = hash;
      console.log(this.hash)
      this.getAllTrains()
      this.systemStop()
    })
    
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
