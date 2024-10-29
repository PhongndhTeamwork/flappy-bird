import { Injectable, OnModuleInit } from "@nestjs/common";
import * as TelegramBot from "node-telegram-bot-api";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class TelegramService implements OnModuleInit {
  private bot: TelegramBot;

  constructor(private readonly configService: ConfigService) {
    const token = this.configService.getOrThrow("TELEGRAM_BOT_TOKEN");
    this.bot = new TelegramBot(token, { polling: true });
    this.setBotCommands();
  }

  async onModuleInit() {
    this.botMessage();
    await this.onRefund();
    await this.onStart();
    await this.onTransaction();
    await this.onAddMoney();

    this.waitPaymentUpdate();
  }


  setBotCommands() {
    this.bot.setMyCommands([
      { command: "start", description: "Start to play game" },
      { command: "recharge", description: "Start to put money into game" },
      { command: "refund", description: "Refund" },
      { command: "transaction", description: "See your transactions" }
    ]).then(() => {
      console.log("Set Bot Commands Successfully");
    });
  }


  botMessage() {
    this.bot.on("message", async () => {
    });
  }

  waitPaymentUpdate() {
    this.bot.on("pre_checkout_query", async (msg) => {
      console.log(msg);
      await this.bot.answerPreCheckoutQuery(msg.id, true);
    });

    this.bot.on("successful_payment", async (msg) => {
      // const message = msg
      const paymentInfo = msg.successful_payment;
      console.log(paymentInfo);

      await this.bot.sendMessage(msg.chat.id, "Payment Success. Wait a sec for refund");
      // const form = {
      //     user_id: message.from?.id,
      //     telegram_payment_charge_id: paymentInfo?.telegram_payment_charge_id
      // }

      // // @ts-ignore
      // const refund = await bot._request('refundStarPayment', { form });
      // console.log(refund);

      // bot.sendMessage(msg.chat.id, `your payment has been refunded`);
    });
  }

  async onStart() {
    this.bot.onText(/\/start(?: (.+))?/, async (msg) => {
      console.log(msg.from)
      await this.bot.sendMessage(msg.from.id, "Hello " + msg.from.first_name + " what would you like to know about me ?");
    });
  }

  async onTransaction() {
    this.bot.onText(/\/transaction(?: (.+))?/, async () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      const transaction = await this.bot._request("getStarTransactions", { form: { limit: 1, offset: 1 } });
      // offset	Integer	Optional	Number of transactions to skip in the response
      // limit	Integer	Optional	The maximum number of transactions to be retrieved. Values between 1-100 are accepted. Defaults to 100.
      console.log(transaction);
    });
  }

  async onAddMoney() {
    this.bot.onText(/\/recharge(?: (.+))?/, async (msg) => {
      await this.bot.sendInvoice(msg.from.id, "Payment Notice", "Buy Now", "{}", "", "XTR", [{
        label: "Option 1",
        amount: 1
      }]);
    });
  }

  async onRefund() {
    this.bot.onText(/\/refund(?: (.+))?/, async (msg, match) => {
      console.log(match[1]);

      const form = {
        user_id: msg.from.id,
        telegram_payment_charge_id: match[1]
      };

      try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        const refund = await this.bot._request("refundStarPayment", { form });
        console.log(refund);

        await this.bot.sendMessage(msg.chat.id, `Your payment has been refunded`);
      } catch (e) {
        await this.bot.sendMessage(msg.chat.id, `Your payment cannot be refunded`);
      }

    });
  }
}


// Implementing Payments
// You will find the necessary methods for building your payment implementation in the Payments Section of the Bot API Manual.
//
//   In short, you must:
//
//   Send an invoice via sendInvoice (currency: “XTR”)
// Await an Update with the field pre_checkout_query
// Approve or cancel the order via answerPreCheckoutQuery
// Await an Update with the field successful_payment
// Store the SuccessfulPayment’s telegram_payment_charge_id – it may be needed to issue a refund in the future
// Deliver the goods and services purchased by the user
// You may find that some API methods for Payments request a provider_token. This parameter is only needed for sales of physical goods and services – for digital ones, you can leave it empty.