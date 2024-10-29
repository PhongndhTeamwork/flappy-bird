import { Injectable } from '@nestjs/common';

@Injectable()
export class HelperService {
  generateRoomCode(length : number) : string {
    const characters =
      '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    const randomPosition = Math.floor(Math.random() * (length - 8) + 4);
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      if (i === randomPosition) {
        result += '_';
        continue;
      }
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }
}
