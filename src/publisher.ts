import { PrismaClient } from "@prisma/client";
import amqp, { Connection } from "amqplib";

const prisma = new PrismaClient();

const QUEUE_NAME = "vote_queue";

const vote = async (id: number, qrId: string, connection: Connection) => {
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

    const { queue } = await channel.assertQueue(QUEUE_NAME, { durable: true });

    const payload = JSON.stringify({ id, qrId });

    const response = await channel.assertQueue("");
    const correlationId = response.queue;

    await channel.consume(correlationId, (msg) => {
      if (!msg) {
        console.log("Publisher has been cancelled or channel has been closed.");
        return;
      }

      if (msg.properties.correlationId === correlationId) {
        console.log(msg.content.toString());
        channel.ack(msg);
      }
    });

    channel.sendToQueue(queue, Buffer.from(payload), {
      correlationId,
      replyTo: correlationId,
    });
  } catch (e) {
    console.log(e);
  }
};

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

  // Harusnya cuman kepilih satu untuk kandidat nomor 2
  await Promise.all(skemaKecurangan.map((id) => vote(2, id, connection)));

  // 1
  console.log(
    await prisma.candidate.findUnique({
      where: { id: 2 },
      select: { counter: true },
    })
  );
}

run();
