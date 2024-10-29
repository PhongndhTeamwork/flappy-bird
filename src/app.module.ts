import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ProviderModule } from "@provider/provider.module";
import { ServiceModule } from "@service/service.module";
import { ModelModule } from "@model/model.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ProviderModule,
    ServiceModule,
    ModelModule
  ],
  controllers: [],
  providers: []
})
export class AppModule {
}
