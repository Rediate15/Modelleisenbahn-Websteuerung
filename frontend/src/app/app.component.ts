import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  public trains: Array<any>;
  public selected: number = 0;

  constructor() {
    this.trains = [
      {name:"Zug 1", speed: 0, background: "#aaaaaa"},
      {name:"Zug 2", speed: 50, background: "#dddddd"},
      {name:"Zug 3", speed: 100, background: "#dddddd"}]
  }

  formatLabel(value: number): string {
    return `${value}`;
  }

  onTrainClick(index: number) {
    this.trains[this.selected].background = "#dddddd"
    this.selected = index
    this.trains[this.selected].background = "#aaaaaa"
  }

  onSpeedChange(value:number) {
    this.trains[this.selected].speed = value
  }

  onClickStop() {
    this.trains.forEach(train => {
      train.speed = 0
    });
  }
}
