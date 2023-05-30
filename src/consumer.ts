import { Participant, Prisma, PrismaClient } from "@prisma/client";
import amqp from "amqplib";

const prisma = new PrismaClient();

const consumeMessagesFromQueue = async () => {
  const connection = await amqp.connect("amqp://localhost");

  try {
    // Connect to RabbitMQ
    const channel = await connection.createChannel();

    const exchange = "vote";
    const queue = "vote_queue";
    const routingKey = "vote_rpc";

    await channel.assertExchange(exchange, "direct", { durable: true });
    await channel.assertQueue(queue, { durable: true });
    await channel.bindQueue(queue, exchange, routingKey);

    console.log("[MQ] Waiting for queue");

    channel.consume(queue, async (msg) => {
      if (!msg) {
        console.log("Consumer has been cancelled or channel has been closed.");
        return;
      }

      const { id, qrId } = JSON.parse(msg.content.toString());

      console.log("[MQ] New message!", { id });

      try {
        await prisma.$transaction(
          async (tx) => {
            const _participant = await tx.$queryRaw<Participant[]>(
              Prisma.sql`SELECT * FROM participant WHERE qrId = ${qrId} FOR UPDATE`
            );
            const participant = _participant[0];

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

            const _candidate = await tx.$queryRaw<Participant[]>(
              Prisma.sql`SELECT * FROM candidate WHERE id = ${id} FOR UPDATE`
            );
            const candidate = _candidate[0];

            if (!candidate) {
              channel.sendToQueue(
                msg.properties.replyTo,
                Buffer.from(
                  JSON.stringify({ error: "Kandidat yang dipilih tidak ada!" })
                ),
                { correlationId: msg.properties.correlationId }
              );

              channel.ack(msg);
              return;
            }

            await tx.candidate.update({
              where: { id },
              data: {
                counter: {
                  increment: 1,
                },
              },
            });

            await tx.participant.update({
              where: { qrId },
              data: {
                alreadyChoosing: true,
                choosingAt: new Date(),
              },
            });

            console.log("[MQ] Upvote!");

            channel.sendToQueue(
              msg.properties.replyTo,
              Buffer.from(JSON.stringify({ success: true })),
              { correlationId: msg.properties.correlationId }
            );

            channel.ack(msg);

            return;
          },
          {
            maxWait: 5000,
            timeout: 10000,
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          }
        );
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

    await connection.close();

    consumeMessagesFromQueue();
  }
};

consumeMessagesFromQueue();
