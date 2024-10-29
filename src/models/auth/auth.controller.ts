import { Body, Controller, Post } from "@nestjs/common";
import { AuthService } from './auth.service';
import { ApiBody, ApiTags } from "@nestjs/swagger";

@ApiTags("Authentication")
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login-through-bot')
  // @ApiOperation({ summary: 'Login through bot' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        telegramData: { type: 'object' },
      },
      required: ['telegramData'],
    },
    description: 'Send telegram data',
  })
  async loginThroughBot(@Body() { telegramData }: any) {
    return await this.authService.loginThroughBot(telegramData);
  }
}
