import { MailerModule } from "@nestjs-modules/mailer";
import { BullModule, InjectQueue } from "@nestjs/bull";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MiddlewareBuilder } from "@nestjs/core";
import { createBullBoard } from "bull-board";
import { BullAdapter } from "bull-board/bullAdapter";
import { Queue } from "bull";
import { CreateUserController } from "./create-user/create-user.controller";
import sendMailConsumer from "./jobs/sendmail-consumer";
import sendMailProducerService from "./jobs/sendMail-producer.service";

@Module({
  imports: [
    ConfigModule.forRoot(),
    BullModule.forRoot({
      redis: {
        host: "localhost",
        port: 6379,
      },
    }),
    MailerModule.forRoot({
      transport: {
        host: process.env.MAIL_HOST,
        port: Number(process.env.MAIL_PORT),
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
        },
      },
    }),
    BullModule.registerQueue({
      name: "sendMail-queue",
    }),
  ],
  controllers: [CreateUserController],
  providers: [sendMailProducerService, sendMailConsumer],
})
export class AppModule {
  constructor(@InjectQueue("sendMail-queue") private sendMailQueue: Queue) {}

  configure(consumer: MiddlewareBuilder) {
    const { router } = createBullBoard([new BullAdapter(this.sendMailQueue)]);
    consumer.apply(router).forRoutes("/admin/queues");
  }
}
