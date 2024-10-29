import { Module } from "@nestjs/common";
import { TelegramModule } from "@service/telegram/telegram.module";
import { GatewayModule } from "@service/gateways/gateway.module";
import { HelperModule } from './helper/helper.module';


@Module({
  imports: [TelegramModule, GatewayModule, HelperModule],
  exports: [TelegramModule, GatewayModule, HelperModule]
})
export class ServiceModule {
}