import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer
} from "@nestjs/websockets";
import * as WebSocket from "ws";
import { v1 as uuidv1 } from "uuid";
import { PlayerStatus } from "@enum/player-status.enum";
import { WebSocketEvent } from "@enum/websocket-event.enum";

@WebSocketGateway(8080,{cors : {origin : "*"}})
export class FlappyGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: WebSocket.Server;

  private users: Map<string, PlayerData> = new Map();
  private rooms: Array<string> = [];
  private gameState: GameState = "waiting";

  handleConnection(client: WebSocket) {
    const id = uuidv1();
    const player = new PlayerData(id, 0, 0);
    // console.log('Client connected:', client);
    player.ws = client;
    player.key = PlayerStatus.CONNECTED;
    this.users.set(id, player);

    client.send(JSON.stringify({
      event: WebSocketEvent.Connected,
      id: player.id,
      // x: player.x,
      // y: player.y,
      type: "ME"
    }));

    console.log("____________________");
    console.log("| client++: " + player.id + " connected");
    console.log("| size : " + Object.keys(player).length);
    console.log("____________________");

    this.server.clients.forEach(function each(c) {
      if (c !== client && c.readyState === WebSocket.OPEN) {
        //   client.send(data);
        // console.log(client);
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const [userId, user] of this.users.entries()) {
      if (user.ws !== client) {
        console.log(`Rival: ${player.id} vs ${user.id}`);
        user.ws.send(
          JSON.stringify({
            event: WebSocketEvent.Connected,
            id: player.id,
            // x: player.x,
            // y: player.y,
            key: player.key,
            type: "RIVAL"
          })
        );
        client.send(
          JSON.stringify({
            event: WebSocketEvent.Connected,
            id: user.id,
            // x: user.x,
            // y: user.y,
            key: user.key,
            type: "RIVAL"
          })
        );
      }
    }

    client.on("error", (error) => {
      console.log(error);
    });
  }

  handleDisconnect(client: WebSocket) {
    let disconnectedUser: PlayerData | null = null;

    // Find the disconnected user
    for (const [id, user] of this.users.entries()) {
      if (user.ws === client) {
        disconnectedUser = user;
        this.users.delete(id); // Remove the user from the Map
        break;
      }
    }



    if (disconnectedUser) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for (const [id, user] of this.users.entries()) {
        user.ws.send(
          JSON.stringify({
            id: disconnectedUser.id,
            event: "disconnect"
          })
        );
      }
      this.rooms = this.rooms.filter((player) => player !== disconnectedUser.id);
      if(this.rooms.length <= 1) {
        this.gameState = "waiting"
      }
    }
    console.log(`Clients remaining: ${this.users.size}`);
  }

  @SubscribeMessage(WebSocketEvent.StartGame)
  handleStartGame(@ConnectedSocket() client: WebSocket, @MessageBody() data: any) {
    this.gameState = "playing";
    client.send(JSON.stringify({
      event: WebSocketEvent.StartGame
    }));
    this.broadcast(data.id, { event: WebSocketEvent.StartGame });
  }

  @SubscribeMessage(WebSocketEvent.Play)
  handlePlayGame(@ConnectedSocket() _client: WebSocket, @MessageBody() data: any) {
    this.broadcast(data.id, {
      event: WebSocketEvent.Play,
      id: data?.id,
      x: data?.x,
      y: data?.y,
      angle: data?.angle,
    });
  }

  @SubscribeMessage(WebSocketEvent.Fire)
  handleFire(@ConnectedSocket() _client: WebSocket, @MessageBody() data: any) {
    // client.send(JSON.stringify({
    //   event: WebSocketEvent.Fire,
    //   id: data?.id,
    //   angle: data?.angle
    // }))
    this.broadcast(data.id, {
      event: WebSocketEvent.Fire,
      id: data?.id,
      angle: data?.angle
    });
  }

  @SubscribeMessage(WebSocketEvent.ReduceHP)
  handleReduceHP(@ConnectedSocket() client: WebSocket, @MessageBody() data: any) {
    client.send(JSON.stringify({
      event: WebSocketEvent.ReduceHP,
      id: data?.id,
      HP: data?.HP
    }))
    this.broadcast(data.id, {
      event: WebSocketEvent.ReduceHP,
      id: data?.id,
      HP: data?.HP
    });
  }

  @SubscribeMessage(WebSocketEvent.JoinRoom)
  handleJoinRoom(@ConnectedSocket() client: WebSocket, @MessageBody() data: any) {
    if (this.gameState == "playing") {
      client.send(JSON.stringify({
        event: WebSocketEvent.JoinRoom,
        gameState : this.gameState,
        message: "Can not join room"
      }));
      return;
    }
    this.rooms.push(data.id);

    client.send(JSON.stringify({
      event: WebSocketEvent.JoinRoom,
      id: data.id,
      gameState: this.gameState
    }));
    for (const user of this.users.values()) {

      if (user.ws !== client && this.rooms.find(r => r === user.id)) {
        client.send(
          JSON.stringify({
            event: WebSocketEvent.JoinRoom,
            id: user.id
          })
        );
      }
    }


    this.broadcast(data.id, {
      event: WebSocketEvent.JoinRoom,
      id: data.id
    });
  }

  @SubscribeMessage(WebSocketEvent.LeaveRoom)
  handleLeaveRoom(@ConnectedSocket() _client: WebSocket, @MessageBody() data: any) {
    this.rooms = this.rooms.filter((player) => player !== data.id);

    this.broadcast(data.id, {
      event: WebSocketEvent.LeaveRoom,
      message: data.id + " leave room"
    });
  }

  // @SubscribeMessage("events")
  // handleMessage( client: any, data: any): void {
  //   console.log(data);
  //   const playerData =data;
  //   console.log(playerData);
  //   if (playerData.event === "startGame") {
  //     this.broadcast({ event: "startGame" });
  //   } else if (playerData.event === "play") {
  //     this.broadcast({
  //       event: "play",
  //       id: playerData.id,
  //       x: playerData.x,
  //       y: playerData.y
  //     });
  //   } else if (playerData.event && playerData.event == "fire") {
  //     this.broadcast({
  //       event: "fire",
  //       id: playerData.id,
  //       angle: playerData.angle
  //     });
  //   } else if (playerData.event && playerData.event == "reduceHP") {
  //     this.broadcast({
  //       event: "reduceHP",
  //       id: playerData.id,
  //       HP: playerData.HP
  //     });
  //   } else {
  //     if (playerData.type === PlayerStatus.READY) {
  //       console.log(`Received message from client: => ${data}`);
  //     }
  //     const pack = [];
  //     if (playerData.type === PlayerStatus.PLAYING) {
  //       console.log("sent: ", playerData);
  //       for (const user of this.users.values()) {
  //         user.key = PlayerStatus.PLAYING;
  //         pack.push(playerData);
  //       }
  //       for (const user of this.users.values()) {
  //         user.ws.send(JSON.stringify(
  //           pack
  //         ));
  //       }
  //     }
  //   }
  // }

  private broadcast(id: string, message: any): void {
    console.log(this.rooms);
    for (const user of this.users.values()) {
      if (user.id !== id && this.rooms.find((r) => r === user.id)) {
        console.log(user.id);
        user.ws.send(JSON.stringify(message));
      }
    }
  }
}

class PlayerData {
  constructor(public id: string, public x: number, public y: number) {
    this.status = 0;
    this.key = "";
    this.isInRoom = false;
  }

  public status: number;
  public key: string;
  public ws: WebSocket;
  public isInRoom: boolean;
}

type GameState = "waiting" | "playing";
