import { Module } from "@nestjs/common";
import { TelegramService } from "@service/telegram/telegram.service";


@Module({
  imports : [],
  controllers : [],
  providers : [TelegramService]
})
export class TelegramModule{}