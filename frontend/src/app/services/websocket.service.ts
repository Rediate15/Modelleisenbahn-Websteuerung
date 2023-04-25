import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {

  public webSocket: WebSocket
  public data: any

  constructor() { }

  public openWebSocket(url:string) {
    this.webSocket = new WebSocket(url);

    this.webSocket.onopen = (event) => {
      console.log('Open: ', event);
    };

    this.webSocket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.data = message
    };

    this.webSocket.onclose = (event) => {
      console.log('Close: ', event);
    };
  }

  public closeWebSocket() {
    this.webSocket.close();
  }

}
