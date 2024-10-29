import { Logger } from "@nestjs/common";
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { JwtService } from "@nestjs/jwt";
import { ChatService } from "@service/gateways/chat.service";
import { JwtUser } from "@type/jwt-user.type";
import { SocketEvent } from "@enum/socket-event.enum";

@WebSocketGateway({
  cors: {
    origin: "*"
  }
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly jwtService: JwtService, private readonly chatService: ChatService) {
  }

  private readonly logger = new Logger(ChatGateway.name);
  private clients: Map<string, { socket: Socket; user: JwtUser, room?: number }> = new Map();
  private rooms: Map<number, Set<string>> = new Map();


  @WebSocketServer() server: Server;

  afterInit() {
    this.logger.log("Initialized");
  }

  async handleConnection(client: Socket, ..._args: any[]) {
    try {
      console.log("Someone try to connect to chat")
      const token = client.handshake.headers?.authorization?.split(" ")[1];
      console.log(token);
      if (!token) {
        client.disconnect();
        return client.emit(SocketEvent.Connected, "Unauthorized");
      }
      const user = await this.jwtService.verify(token);
      if (!token || !user) {
        client.disconnect();
        return client.emit(SocketEvent.Connected, "Unauthorized");
      }
      this.clients.set(client.id, { socket: client, user });
      // this.logger.log(`Client id: ${client.id} connected`);
      return client.emit(SocketEvent.Connected, "Connected");
    } catch (error) {
      console.log(error?.message);
      if(client && client.connected) client.disconnect();
      return client.emit(SocketEvent.Connected, "Something went wrong, can not connect");
    }
  }

  async handleDisconnect(client: Socket) {
    const clientData = this.clients.get(client.id);
    // Remove user from clients
    this.clients.delete(client.id);
    // Remove user from rooms
    const result: 0 | null | Set<string> = await this.findAndRemoveUserFromRoom(client.id, clientData.user.id);
    if (result) {
      // Send message to other players in room
      this.broadcastToRoom(SocketEvent.LeaveRoom, result, client.id, {
        message: `${clientData.user.username} leaved`
      });
    }
    clientData.socket.emit(SocketEvent.Disconnected, "You are disconnected");
    // this.logger.log(`Client id:${client.id} disconnected`);
  }

  // @SubscribeMessage('message')
  // handleMessages(@MessageBody() message: { text: string }, @ConnectedSocket() client: Socket): void {
  //   this.logger.log(`Message received from client id: ${client.id}`);
  //   this.logger.log(`Received message: ${message.text}`);
  //   this.server.emit('message', "CUC");
  // }

  @SubscribeMessage("create-room")
  async handleCreateRoom(@MessageBody() _message: { text: string }, @ConnectedSocket() client: Socket) {
    const clientData = this.clients.get(client.id);
    if (!clientData) {
      return {
        event: SocketEvent.CreateRoom,
        data: "Cannot create room"
      };
    }
    const roomResult = await this.chatService.createRoom(clientData.user.id);
    // Create room successfully
    if (typeof roomResult !== "string") {
      // Update room of client
      this.rooms.set(roomResult.id, new Set([client.id]));
      const clientData = this.clients.get(client.id);
      if (clientData) clientData.room = roomResult.id;
      else return {
        event: SocketEvent.CreateRoom,
        data: "Can not join this room on socket"
      };
      clientData.room = roomResult.id;

      this.server.emit(SocketEvent.CreateRoom, `Room ${roomResult.code} created`);
      return {
        event: SocketEvent.CreateRoom,
        data: "Create room successfully"
      };
    }
    return {
      event: SocketEvent.CreateRoom,
      data: roomResult
    };
  }

  @SubscribeMessage("join-room")
  async handleJoinRoom(@MessageBody() message: { code: string }, @ConnectedSocket() client: Socket) {
    const clientData = this.clients.get(client.id);
    if (!clientData) {
      return {
        event: SocketEvent.JoinRoom,
        data: "Check your authorization"
      };
    }
    const joinRoomResult = await this.chatService.joinRoomByCode(message.code, clientData.user.id);

    // Join room successfully
    if (typeof joinRoomResult !== "string") {
      // Update rooms
      const room = this.rooms.get(joinRoomResult.id);
      if (room) room.add(client.id);
      else return {
        event: SocketEvent.JoinRoom,
        data: "Can not join this room on socket"
      };
      const clientData = this.clients.get(client.id);
      if (clientData) clientData.room = joinRoomResult.id;
      else return {
        event: SocketEvent.JoinRoom,
        data: "Can not join this room on socket"
      };
      return {
        event: SocketEvent.JoinRoom,
        data: "Join room successfully"
      };
    }
    return {
      event: SocketEvent.JoinRoom,
      data: joinRoomResult
    };
  }

  @SubscribeMessage("get-rooms")
  async getRooms(@MessageBody() _message: { text: string }, @ConnectedSocket() _client: Socket) {
    const rooms = await this.chatService.getInvitingRoom();
    return {
      event: SocketEvent.AvailableRooms,
      data: JSON.stringify(rooms)
    };
  }

  @SubscribeMessage("send-coordinate")
  async sendCoordinate(@MessageBody() message: { x: number; y: number }, @ConnectedSocket() client: Socket) {
    const clientData = this.clients.get(client.id);
    if (!clientData || !clientData.room) {
      return {
        event: SocketEvent.ShareCoordinates,
        data: "You are not in a room"
      };
    }
    const roomId = clientData.room;
    const roomClients = this.rooms.get(roomId);

    //Send coordinates
    this.broadcastToRoom(SocketEvent.ShareCoordinates, roomClients, client.id, {
      x: message.x,
      y: message.y,
      username: clientData.user.username
    });
    // if (roomClients) {
    //   roomClients.forEach(clientId => {
    //     if (clientId !== client.id) {
    //       const otherClient = this.clients.get(clientId);
    //       if (otherClient) {
    //         otherClient.socket.emit("sendCoordinate", {
    //           x: message.x,
    //           y: message.y,
    //           userId: clientData.user.username,
    //         });
    //       }
    //     }
    //   });
    // }
  }

  private broadcastToRoom(event: string, roomClients: Set<string>, currentClient: string, data: any) {
    roomClients.forEach(clientId => {
      if (clientId !== currentClient) {
        const otherClient = this.clients.get(clientId);
        if (otherClient) {
          otherClient.socket.emit(event, data);
        }
      }
    });
  }

  private async findAndRemoveUserFromRoom(user: string, userId: number): Promise<0 | null | Set<string>> {
    for (const [roomId, users] of this.rooms.entries()) {
      if (users.has(user)) {
        users.delete(user);
        // Remove user from rooms in database
        await this.chatService.removeUserFromInvitingRoom(userId, roomId);
        // Delete room if there is no player
        if (users.size === 0) {
          this.rooms.delete(roomId);
          return 0;
        }
        return users;
      }
    }
    return null;
  }
}