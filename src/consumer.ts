import { PrismaClient } from "@prisma/client";
import { Sema } from "async-sema";
import amqp from "amqplib";

const sema = new Sema(1);

const prisma = new PrismaClient();

const consumeMessagesFromQueue = async () => {
  try {
    // Connect to RabbitMQ
    const connection = await amqp.connect("amqp://192.168.100.2");
    const channel = await connection.createChannel();

    const exchange = "vote";
    const queue = "vote_queue";
    const routingKey = "vote_rpc";

    await channel.assertExchange(exchange, "direct", { durable: false });
    await channel.assertQueue(queue, { durable: false });
    await channel.bindQueue(queue, exchange, routingKey);
    await channel.prefetch(1);

    console.log("[MQ] Waiting for queue");

    channel.consume(queue, async (msg) => {
      if (!msg) {
        console.log("Consumer has been cancelled or channel has been closed.");
        return;
      }

      const { id, qrId } = JSON.parse(msg.content.toString());

      console.log("[MQ] New message!", { id, qrId });

      const participant = await prisma.participant.findUnique({
        where: { qrId },
      });

      if (!participant) {
        channel.sendToQueue(
          msg.properties.replyTo,
          Buffer.from(JSON.stringify({ error: "Gak ada" })),
          { correlationId: msg.properties.correlationId }
        );

        channel.ack(msg);
        return;
      }

      if (participant.alreadyChoosing) {
        channel.sendToQueue(
          msg.properties.replyTo,
          Buffer.from(JSON.stringify({ error: "Kamu sudah memilih!" })),
          { correlationId: msg.properties.correlationId }
        );

        channel.ack(msg);
        return;
      }

      if (!participant.alreadyAttended) {
        channel.sendToQueue(
          msg.properties.replyTo,
          Buffer.from(JSON.stringify({ error: "Kamu belum absen!" })),
          { correlationId: msg.properties.correlationId }
        );

        channel.ack(msg);
        return;
      }

      try {
        const result = await prisma.$transaction([
          prisma.candidate.update({
            where: { id },
            data: {
              counter: {
                increment: 1,
              },
            },
          }),
          prisma.participant.update({
            where: { qrId },
            data: {
              alreadyChoosing: true,
              choosingAt: new Date(),
            },
          }),
        ]);

        console.log("[MQ] Upvote!", { id, qrId });

        channel.sendToQueue(
          msg.properties.replyTo,
          Buffer.from(JSON.stringify({ success: result })),
          { correlationId: msg.properties.correlationId }
        );

        channel.ack(msg);
      } catch (err) {
        console.error(err);

        channel.sendToQueue(
          msg.properties.replyTo,
          Buffer.from(JSON.stringify({ error: "Internal Server Error" })),
          { correlationId: msg.properties.correlationId }
        );

        channel.ack(msg);
      }
    });
  } catch (error) {
    console.error(error);
  }
};

consumeMessagesFromQueue();
