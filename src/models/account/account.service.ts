import {
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException
} from "@nestjs/common";
import { PrismaService } from "@prisma/prisma.service";
import { Item, UserItem } from "@prisma/client";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AccountService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService
  ) {

  }

  async buyItems(itemId: number,
                 userId: number
                 // telegramId : string
  ): Promise<HttpException | UserItem> {
    try {
      // const paymentResult:boolean = await this.paymentProcess(telegramId);
      // if(!paymentResult) return new ForbiddenException("Cannot pay start")
      const isExist: UserItem | null = await this.prisma.userItem.findFirst({
        where: {
          userId: userId,
          itemId: itemId
        }
      });
      if (isExist) {
        return new ConflictException("You have already possessed this item");
      }
      const result: UserItem | null = await this.prisma.userItem.create({
        data: {
          userId: userId,
          itemId: itemId
        }
      });
      if (!result) {
        return new InternalServerErrorException("Something went wrong, can not buy this item");
      }
      return result;
    } catch (e) {
      return new InternalServerErrorException("Something went wrong");
    }

  }

  async getOwnItems(userId: number): Promise<HttpException | Item[]> {
    try {
      const userItems = await this.prisma.userItem.findMany({
        where: {
          userId: userId
        },
        include: {
          item: true
        }
      });
      return userItems.map((ut) => ut.item);
    } catch (e) {
      return new InternalServerErrorException("Something went wrong");
    }

  }

  //  private async paymentProcess(telegramId: string) : Promise<boolean> {
  //   await this.bot.sendInvoice(telegramId, "Payment Notice", "Buy Now", "{}", "", "XTR", [{
  //     label: "Option 1",
  //     amount: 1
  //   }]);
  //
  //   this.bot.on('pre_checkout_query', (_preCheckoutQuery) => {
  //     // const { id, from, currency, total_amount, invoice_payload } = preCheckoutQuery;
  //     this.bot.answerPreCheckoutQuery(telegramId, true); // Accept the payment
  //   });
  //
  //   // Successful payment
  //   this.bot.on('successful_payment', (_msg) => {
  //     // const { chat, successful_payment } = msg;
  //     return true;
  //   });
  //   return false;
  // }

}
