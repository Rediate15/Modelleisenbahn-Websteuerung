export class WebsocketService {

  public webSocket: WebSocket
  public data: any
  private onEvent: (message:any) => void

  constructor(onEvent:(message:any) => void) {
    this.onEvent = onEvent
  }

  public openWebSocket(url:string) {
    this.webSocket = new WebSocket(url);

    this.webSocket.onopen = (event) => {
      console.log('Open: ', event);
    };

    this.webSocket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.data = message
      this.onEvent(message)
    };

    this.webSocket.onclose = (event) => {
      console.log('Close: ', event);
    };
  }

  public closeWebSocket() {
    this.webSocket.close();
  }

}
