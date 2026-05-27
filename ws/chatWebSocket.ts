import {EventHandlerWs, StatusHandlerWs} from "@/model/ws.types";
import {WsClientEvent, WsEvent} from "@/model/chat.types";

const BASE_URL_WS = process.env.EXPO_PUBLIC_CHAT_WS_APP ?? "";

const PING_INTERVAL_MS = 25_000;
const INITIAL_RECONNECT_DELAY_MS = 1_000;
const MAX_RECONNECT_DELAY_MS = 30_000;

class ChatWebSocket {
  private ws: WebSocket | null = null;
  private token: string = "";
  private shouldReconnect: boolean = false;

  private reconnectDelay:number = INITIAL_RECONNECT_DELAY_MS;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTime: ReturnType<typeof setInterval> | null = null;

  private eventHandlers:EventHandlerWs[] = [];
  private connectedStatusWs:StatusHandlerWs[] = [];
  private disconnectHandlers:StatusHandlerWs[] = [];


  // Metodos del socket
  connect(token:string):void{
    this.token = token;
    this.shouldReconnect = true;
    this.reconnectDelay = INITIAL_RECONNECT_DELAY_MS;
    this._closeExistingSocket();
    this._openConnection();

  }

  private _closeExistingSocket(): void {
    if (this.ws) {
      const old = this.ws;
      this.ws = null;

      old.onopen = null;
      old.onmessage = null;
      old.onerror = null;
      old.onclose = null;
      try { old.close(1000, "Replaced by new connection"); } catch {}
    }
    this._clearTimers();
  }

  disconnect():void{
    this.shouldReconnect = false;
    this._closeExistingSocket();
  }

  private _openConnection():void{
    if(!BASE_URL_WS){
      console.warn("Connection to WS is empty");
      return;
    }
    const url = `${BASE_URL_WS}/ws/${this.token}`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.reconnectDelay = INITIAL_RECONNECT_DELAY_MS;
      this._startPing();
      this.connectedStatusWs.forEach(x=>x())
    }

    this.ws.onmessage = (event:MessageEvent) => {
      try{
        const data = JSON.parse(event.data) as WsEvent;
        this.eventHandlers.forEach(eventHandler =>eventHandler(data));
      }catch(e){
        console.error("Error al recibir un mensaje ",e);
      }
    }


    this.ws.onclose = ()=>{
      this._stopPing();
      this.disconnectHandlers.forEach(x=>x())
      if(this.shouldReconnect){
        this._scheduleReconnect();
      }
    }

    this.ws.onerror = ()=>{
      this.ws?.close();
    }
  }

  // Ping, mantener la coneccion viva

  private _startPing():void{
    this.pingTime = setInterval(()=>{
      this._send({type: "ping"});
    },PING_INTERVAL_MS);
  }

  private _stopPing():void{
    if(this.pingTime!=null){
      clearInterval(this.pingTime);
      this.pingTime = null;
    }
  }

  private _scheduleReconnect (){
    this.reconnectTimer = setTimeout(()=>{
      this._openConnection();
      this.reconnectDelay = Math.min(
          this.reconnectDelay*2,
          MAX_RECONNECT_DELAY_MS
      )
    }, this.reconnectDelay)
  }

  private _clearTimers():void{
    if(this.reconnectTimer!=null){
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this._stopPing();
  }


  //Envio de mensajes


  sendGroupMessage(content:string){
    this._send({type:"group_message", content});
  }

  sendDM(toUserId:string, content:string ):void{
    this._send({type:"dm", to:toUserId, content});
  }

  private _send(event:WsClientEvent):void{
    if(this.ws?.readyState === WebSocket.OPEN){
      this.ws?.send(JSON.stringify(event));
    }
  }

  onEvent(handler:EventHandlerWs){
    this.eventHandlers.push(handler);
    return ()=>{
      this.eventHandlers = this.eventHandlers.filter(item=>item!==handler);
    }
  }

  onConnect(handler:StatusHandlerWs){
    this.connectedStatusWs.push(handler);
    return ()=>{
      this.connectedStatusWs  = this.connectedStatusWs.filter(item=>item!==handler);
    }
  }

  onDisconnect(handle:StatusHandlerWs){
    this.disconnectHandlers.push(handle);
    return ()=>{
      this.disconnectHandlers = this.disconnectHandlers.filter(item=>item!==handle);
    }
  }
}

export const chatWebSocket = new ChatWebSocket();
