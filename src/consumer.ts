import { PrismaClient } from "@prisma/client";
import amqp from "amqplib";

const prisma = new PrismaClient();

const consumeMessagesFromQueue = async () => {
  try {
    // Connect to RabbitMQ
    const connection = await amqp.connect("amqp://192.168.100.2");
    const channel = await connection.createChannel();

    // Declare the queue and prefetch 1 message at a time
    const queueName = "votes";
    await channel.assertQueue(queueName, { durable: true });
    channel.prefetch(1);

    // Consume messages from the queue
    channel.consume(queueName, async (message) => {
      const payload = JSON.parse(
        (message as amqp.ConsumeMessage).content.toString()
      );

      // Find the candidate and participant in the database
      const candidate = await prisma.candidate.findUnique({
        where: { id: payload.id },
      });
      const participant = await prisma.participant.findUnique({
        where: { qrId: payload.qrId },
      });

      // Check if the candidate and participant exist
      if (!candidate || !participant) {
        console.error("Candidate or participant not found!");
        channel.ack(message as amqp.ConsumeMessage);
        return;
      }

      // Check if the participant has already voted
      if (participant.alreadyChoosing) {
        console.error(
          "Participant has already voted!",
          participant.name,
          candidate.name
        );
        channel.ack(message as amqp.ConsumeMessage);
        return;
      }

      // Increment the candidate's counter and update the participant status
      await prisma.$transaction([
        prisma.candidate.update({
          where: { id: candidate.id },
          data: {
            counter: {
              increment: 1,
            },
          },
        }),
        prisma.participant.update({
          where: { qrId: participant.qrId },
          data: {
            alreadyChoosing: true,
            choosingAt: new Date(),
          },
        }),
      ]);

      console.log(
        `Vote counted for candidate ${candidate.name}!`,
        participant.name,
        candidate.name
      );
      channel.ack(message as amqp.ConsumeMessage);
    });
  } catch (error) {
    console.error(error);
  }
};

consumeMessagesFromQueue();
