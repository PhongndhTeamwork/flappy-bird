import { Module } from "@nestjs/common";
import { PrismaService } from "@prisma/prisma.service";
import { ChatService } from "@service/gateways/chat.service";
import { HelperService } from "@service/helper/helper.service";
import { FlappyGateway } from "@service/gateways/flappy.gateway";

@Module({
  imports: [],
  providers: [FlappyGateway, PrismaService, ChatService, HelperService]
})
export class GatewayModule {
}