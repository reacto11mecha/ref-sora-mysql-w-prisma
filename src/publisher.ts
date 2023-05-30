import { PrismaClient } from "@prisma/client";
import amqp, { Connection } from "amqplib";

const prisma = new PrismaClient();

const QUEUE_NAME = "vote_queue";

const vote = (id: number, qrId: string, connection: Connection) =>
  new Promise<void>(async (resolve, reject) => {
    // Prepare absen, biar ga perlu absen lagi

    const participant = await prisma.participant.findFirst({
      where: { qrId },
      select: { alreadyAttended: true },
    });

    if (!participant) {
      throw new Error("SEED DULU OI");
    }

    if (!participant.alreadyAttended)
      await prisma.participant.update({
        where: { qrId },
        data: { alreadyAttended: true, attendedAt: new Date() },
      });

    try {
      const channel = await connection.createChannel();

      const { queue } = await channel.assertQueue(QUEUE_NAME, {
        durable: true,
      });

      const payload = JSON.stringify({ id, qrId });

      const response = await channel.assertQueue("");
      const correlationId = response.queue;

      await channel.consume(correlationId, (msg) => {
        if (!msg) {
          console.log(
            "Publisher has been cancelled or channel has been closed."
          );
          return;
        }

        if (msg.properties.correlationId === correlationId) {
          console.log(msg.content.toString());
          channel.ack(msg);

          resolve();
        }
      });

      channel.sendToQueue(queue, Buffer.from(payload), {
        correlationId,
        replyTo: correlationId,
      });
    } catch (e) {
      console.error(e);
      reject(e);
    }
  });

async function run() {
  const connection = await amqp.connect("amqp://localhost");

  // Check /prisma/seed.ts
  const skemaKecurangan = [
    "13-417390-997660-1",
    "13-417390-997660-1",
    "13-417390-997660-1",
    "13-417390-997660-1",
    "13-417390-997660-1",
    "13-417390-997660-1",
    "13-417390-997660-1",
    "13-417390-997660-1",
    "13-417390-997660-1",
    "13-417390-997660-1",
  ];

  console.log("==== SKEMA KECURANGAN ====");
  // Harusnya cuman kepilih satu untuk kandidat nomor 2
  await Promise.all(skemaKecurangan.map((id) => vote(2, id, connection)));

  // 1
  console.log(
    "Jumlah counter kandidat nomor 2 harusnya ada 1",
    await prisma.candidate.findUnique({
      where: { id: 2 },
      select: { counter: true },
    })
  );

  console.log();

  const skemaNormal = [
    "82-747035-179724-2",
    "34-777399-498756-2",
    "57-583621-192442-0",
    "06-221912-026634-2",
    "37-925808-001220-3",
    "21-985792-522326-5",
    "59-244297-722642-0",
    "45-814080-724016-4",
  ];

  console.log("==== SKEMA NORMAL | Harusnya kepilih 8 ====");

  // Harusnya ada 8 kepilih
  await Promise.all(skemaNormal.map((id) => vote(1, id, connection)));

  console.log(
    "Jumlah counter kandidat nomor 1 harusnya ada 8",
    await prisma.candidate.findUnique({
      where: { id: 1 },
      select: { counter: true },
    })
  );
}

run();
