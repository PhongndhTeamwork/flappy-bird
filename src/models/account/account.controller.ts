import { Body, Controller, Get, HttpException, Param, Post, Req, UseGuards } from "@nestjs/common";
import { AccountService } from "./account.service";
import { ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AuthGuard } from "@guard/auth.guard";
import { Item, UserItem } from "@prisma/client";

@ApiTags("Account")
@Controller("account")
export class AccountController {
  constructor(private readonly accountService: AccountService) {
  }

  @Post("/buy-item/:itemId")
  @UseGuards(AuthGuard)
  async buyItems(@Param("itemId") itemId: number, @Body() {price : number} ,@Req() req: Request) {
    const user = req.user;
    const result : HttpException | UserItem = await this.accountService.buyItems(itemId, user.id);
    if(result instanceof HttpException) {
      throw result;
    }
    return result;
  }

  @Get("/get-items")
  @UseGuards(AuthGuard)
  async getItems(@Req() req: Request){
    const user = req.user;
    const result : HttpException | Item[] = await this.accountService.getOwnItems(user.id);
    if(result instanceof HttpException) {
      throw result;
    }
    return result;
  }
}
