import { Module } from "@nestjs/common";
import { AuthModule } from "@model/auth/auth.module";
import { AccountModule } from "@model/account/account.module";


@Module({
  imports : [AuthModule, AccountModule],
  exports : [AuthModule, AccountModule]
})
export class ModelModule {}