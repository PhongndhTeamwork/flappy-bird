import { Injectable } from "@nestjs/common";
import { PrismaService } from "@prisma/prisma.service";
import { ConfigService } from "@nestjs/config";
import * as crypto from "crypto";
import { Account } from "@prisma/client";
import { JwtService } from "@nestjs/jwt";


@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService
  ) {
  }

  async loginThroughBot(telegramData: any) {
    const botToken = this.configService.getOrThrow("TELEGRAM_BOT_TOKEN");
    console.log(telegramData);
    // const checkSign: boolean = this.verifySignature(
    //   telegramData,
    //   botToken
    // );
    // if (!checkSign) {
    //   throw new UnauthorizedException("Cannot get your telegram data");
    // }
    // const userTelegramData = JSON.parse(telegramData.user);
    // console.log(userTelegramData);
    // if (!userTelegramData?.id) {
    //   throw new InternalServerErrorException("Something went wrong, cannot get your telegram data");
    // }

    //* Check that user has already logged in before or not
    // let existUser: Account = await this.prisma.account.findFirst({ where: { telegramId: userTelegramData?.id } });
    let existUser: Account = await this.prisma.account.findFirst({ where: { telegramId: telegramData?.id } });

    //* User sign up
    // let newUser: Account;
    // if (!existUser) {
    //   existUser = await this.prisma.account.create({
    //     data: {
    //       telegramId: userTelegramData?.id,
    //       username: userTelegramData?.username || "",
    //       firstName: userTelegramData?.first_name || "",
    //       lastName: userTelegramData?.last_name || ""
    //     }
    //   });
    //   if (!existUser) {
    //     throw new InternalServerErrorException("Something went wrong, cannot signup account");
    //   }
    // }

    //* Token
    const token : string = await this.jwtService.signAsync({
      id: existUser.id,
      telegramId: existUser.telegramId,
      username: existUser.username,
    });

    return {
      token : token,
    }
  }

  private verifySignature(telegramInitData: any, botToken: string): boolean {
    const initData = new URLSearchParams(telegramInitData);

    initData.sort();

    const hash = initData.get("hash");
    initData.delete("hash");

    const dataToCheck = [...initData.entries()]
      .map(([key, value]) => key + "=" + value)
      .join("\n");
    // console.log(dataToCheck);

    const secretKey = crypto
      .createHmac("sha256", "WebAppData")
      .update(botToken)
      .digest();

    const _hash = crypto
      .createHmac("sha256", secretKey)
      .update(dataToCheck)
      .digest("hex");
    // console.log(hash, _hash);
    return hash === _hash;
  }
}
