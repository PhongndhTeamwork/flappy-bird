import { Module } from "@nestjs/common";

import { JwtProvider } from "@provider/jwt.provider";

@Module({
  imports: [JwtProvider],
  exports: [JwtProvider]
})
export class ProviderModule {
}
