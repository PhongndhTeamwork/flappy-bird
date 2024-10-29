import { Injectable } from "@nestjs/common";
import { PrismaService } from "@prisma/prisma.service";
import { Room } from "@prisma/client";
import { RoomStatus } from "@enum/room-status.enum";
import { HelperService } from "@service/helper/helper.service";


@Injectable()
export class ChatService {
  constructor(private readonly prismaService: PrismaService, private readonly helperService: HelperService) {
  }

  async createRoom(userId: number) {
    try {
      const code = this.helperService.generateRoomCode(20);
      const newRoom: Room = await this.prismaService.room.create({
        data: {
          code: code,
          hostId: userId
        }
      });
      if (newRoom) {
        return newRoom;
      }
      return "Cannot create room";
    } catch (error) {
      console.log(error);
      return "Something went wrong";
    }
  }

  async getRoomByCode(code: string) {
    try {
      return await this.prismaService.room.findMany({ where: { code: code } });
    } catch (error) {
      return "Something went wrong";
    }
  }

  async joinRoomByCode(code: string, userId: number) {
    try {
      // Find room by code
      const room: Room = await this.prismaService.room.findFirst({ where: { code: code } });
      if (!room) {
        return "This room not found";
      }
      if (room.status !== RoomStatus.Inviting) {
        return "This room is not available";
      }
      if (room.hostId === userId) {
        return "You are the host of this room, can not join again";
      }
      // Check user has been in room or not
      const joinedRoom = await this.prismaService.userRoom.findFirst({
        where: {
          userId: userId,
          roomId: room.id
        }
      });
      if (joinedRoom) {
        return "You have already been in this room";
      }
      // Join room
      const userRoom = await this.prismaService.userRoom.create({
        data: {
          userId: userId,
          roomId: room.id
        }
      });
      if (!userRoom) {
        return "Can't join this room";
      }
      return room;
    } catch (error) {
      return "Something went wrong";
    }

  }

  async getInvitingRoom() {
    try {
      const rooms = await this.prismaService.room.findMany({
        where: { status: RoomStatus.Inviting },
        include: { host: true }
      });
      return rooms.map((room) => {
        return {
          code: room.code,
          host: room.host.username || room.host.firstName
        };
      });
    } catch (error) {
      return "Something went wrong";
    }
  }

  //

  async removeUserFromInvitingRoom(userId: number, roomId: number): Promise<boolean> {
    // Check room is in inviting status or not
    const currentRoom = await this.prismaService.room.findFirst({where :{id :roomId, status : RoomStatus.Inviting}});
    if(!currentRoom) return false;
    // Delete user from room
    const userRoom = await this.prismaService.userRoom.findFirst({
      where: {
        userId: userId,
        roomId: roomId,
      }
    });
    if (!userRoom) return false;
    const result = await this.prismaService.userRoom.delete({
      where: {
        id: userRoom.roomId
      }
    });
    return !!result;
  }


}