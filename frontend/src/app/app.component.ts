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
  public selected: number = 0;
  public server_address = "http://192.168.1.6:8042";
  public hash: number | undefined;

  constructor(private httpClient: HttpClient) {

    this.httpClient.get<number>(`${this.server_address}/general/hash`).subscribe(hash => {
      this.hash = hash;
      console.log(this.hash)
      this.getAllTrains()
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

  onTrainClick(index: number) {
    this.trains[this.selected].background = "#dddddd"
    this.selected = index
    this.trains[this.selected].background = "#aaaaaa"

    const headers = new HttpHeaders({'x-can-hash':String(this.hash)})
    this.httpClient.get<any>(`${this.server_address}/lok/${this.trains[index].loc_id}/speed`, {headers: headers}).subscribe(data => {
      console.log(data)
      this.trains[index].speed = Math.ceil(data.speed/10)
    })
  }

  onSpeedChange(value:number) {
    this.trains[this.selected].speed = value
    const headers = new HttpHeaders({'x-can-hash':String(this.hash)})
    this.httpClient.post<any>(`${this.server_address}/lok/${this.trains[this.selected].loc_id}/speed`, {
      "speed": value * 10
    }, {headers: headers}).subscribe()
  }

  onClickStop() {
    this.trains.forEach(train => {
      train.speed = 0
      const headers = new HttpHeaders({'x-can-hash':String(this.hash)})
      this.httpClient.post<any>(`${this.server_address}/lok/${this.trains[this.selected].loc_id}/speed`, {
        "speed": 0
      }, {headers: headers}).subscribe(() => console.log("stop"))
    });
  }
}
