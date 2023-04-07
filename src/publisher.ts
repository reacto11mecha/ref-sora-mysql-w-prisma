import { PrismaClient } from "@prisma/client";
import amqp, { Connection } from "amqplib";

const prisma = new PrismaClient();

const QUEUE_NAME = "vote_queue";

const vote = async (id: number, qrId: string, connection: Connection) => {
  const participant = await prisma.participant.findUnique({ where: { qrId } });

  if (!participant) return console.error("Gak ada");

  if (participant.alreadyChoosing) return console.error("Kamu sudah memilih!");

  if (!participant.alreadyAttended) return console.error("Kamu belum absen!");

  try {
    const channel = await connection.createChannel();

    const { queue } = await channel.assertQueue(QUEUE_NAME, { durable: false });

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
  const participantsData = [
    {
      name: "XI-BHS | ADELIA PUTRI N",
      qrId: "2UG9TXA0ZATBEKQ",
    },
    {
      name: "XI-BHS | AGNESA SHILFA MONALISA",
      qrId: "8QCWAUMYMIXUUUE",
    },
    {
      name: "XI-BHS | AJENG ANISHA DJUWITA",
      qrId: "DEBO6G5081DNB5B",
    },
    {
      name: "XI-BHS | AURELLIA DWI RAHMIATI",
      qrId: "ZCYD8C7FRV4025K",
    },
    {
      name: "XI-BHS | BINTANG SUKMA WIJAYA",
      qrId: "CGK90RGJJLBJ591",
    },
    {
      name: "XI-BHS | BUNGA RISTI ANJANI",
      qrId: "SZZM5D73KDG7JYM",
    },
    {
      name: "XI-BHS | DHEA FEBRI KHARISMA WATI",
      qrId: "IQ7OJDJ5GDJ6F2J",
    },
    {
      name: "XI-BHS | DHIA LARASATI PUTRIYAMA",
      qrId: "Z25W16ZISF8QY32",
    },
    {
      name: "XI-BHS | DINDA AFIFAH",
      qrId: "IUBP5XR4AQUNT9R",
    },
    {
      name: "XI-BHS | ELSA RIZKA FITRI RAMADANI",
      qrId: "064ZC5QES079YVA",
    },
    {
      name: "XI-BHS | EZRA KHAIRAN PERMANA",
      qrId: "47N5NBGLU4REP3V",
    },
    {
      name: "XI-BHS | FADIA RAHMA",
      qrId: "FW4SBQR8SCEHZL4",
    },
    {
      name: "XI-BHS | FATMAH NAILAH NURJIHAN",
      qrId: "85KJQCF5T76VZI1",
    },
    {
      name: "XI-BHS | HAFIZH TAQIYYUDDIN",
      qrId: "RUMWJJ3HWX97FOC",
    },
    {
      name: "XI-BHS | IKBAL MAULANA",
      qrId: "NDST5OAX3KVFOGR",
    },
    {
      name: "XI-BHS | KEIRA ALEA PASYA",
      qrId: "G5I3HJW3CAGX04K",
    },
    {
      name: "XI-BHS | KHAILA FALSYA DEWINDRI",
      qrId: "6W4IZNF85X1A5HB",
    },
    {
      name: "XI-BHS | MAULANA AZIZ",
      qrId: "UX1VPSPEXOQZY4Z",
    },
    {
      name: "XI-BHS | MUHAMMAD DAFFA BILVI RAIHAN",
      qrId: "23LDP3000KJARNF",
    },
    {
      name: "XI-BHS | MUHAMMAD RIFQI MUFLIH",
      qrId: "DJUSL2S0JRZD7JB",
    },
    {
      name: "XI-BHS | MUHAMMAD SYARIF FADHLURAHMAN",
      qrId: "GH7J871ZTDIXYRD",
    },
    {
      name: "XI-BHS | NESYA ALIYA PUTRI SUPRAPTO",
      qrId: "WNB9HKZ0XWS0N17",
    },
    {
      name: "XI-BHS | NURUL DWI HIDAYATI",
      qrId: "NMBS466DXZWAFMM",
    },
    {
      name: "XI-BHS | RAFFI ADHI WISESHA",
      qrId: "6KZRH3PXDRKBXH5",
    },
    {
      name: "XI-BHS | RAHMA AULIA",
      qrId: "OWHU8PV11WAPWQD",
    },
    {
      name: "XI-BHS | RISKI ANANDA AKBAR",
      qrId: "WPPUQCO4P11JWNZ",
    },
    {
      name: "XI-BHS | SILVIA NOVYANTI SITINJAK",
      qrId: "G1EWDDTSLB86PTJ",
    },
    {
      name: "XI-BHS | SITI NURAENI NUGROHO",
      qrId: "6LFGRGHAIP2VWVD",
    },
    {
      name: "XI-BHS | SYAFI'IL IBAD ZAM ZAMI",
      qrId: "X0PRNLMCNOS1GYL",
    },
    {
      name: "XI-BHS | SYALWA HANIFAH",
      qrId: "37PJ5WIFYHHQMJ2",
    },
    {
      name: "XI-BHS | TARA KIRANIA PUTRI",
      qrId: "VQQITLS9OQU0VDT",
    },
    {
      name: "XI-BHS | WAHYU ANASTASIA",
      qrId: "MGY3AASXOFR2V94",
    },
    {
      name: "XI-BHS | ZAHRA AQSHA AGUSTINA",
      qrId: "ESUO7WK3M11XYED",
    },
    {
      name: "XI-BHS | ZAHRA CAMILA BAREK LAGA",
      qrId: "W5DFZGE33ST3Q5P",
    },
  ];
  const candidatesData = [
    {
      name: "Entong",
      img: "6cadhw82d.png",
    },
    {
      name: "Tole",
      img: "aSDu381.png",
    },
    {
      name: "Ujang",
      img: "aldpJUD.png",
    },
  ];

  console.log("Jumlah Partisipan", await prisma.participant.count());
  console.log("Jumlah Kandidat", await prisma.candidate.count());

  if ((await prisma.participant.count()) === 0)
    console.log(
      "Berhasil membuat banyak participant",
      await prisma.participant.createMany({ data: participantsData })
    );

  if ((await prisma.candidate.count()) === 0)
    console.log(
      "Berhasil membuat kandidat",
      await prisma.candidate.createMany({ data: candidatesData })
    );

  const connection = await amqp.connect("amqp://192.168.100.2");

  await Promise.all([
    vote(1, "2UG9TXA0ZATBEKQ", connection),
    vote(1, "8QCWAUMYMIXUUUE", connection),
    vote(1, "DEBO6G5081DNB5B", connection),
    vote(1, "ZCYD8C7FRV4025K", connection),
    vote(1, "CGK90RGJJLBJ591", connection),
    vote(1, "SZZM5D73KDG7JYM", connection),
    vote(1, "IQ7OJDJ5GDJ6F2J", connection),
    vote(1, "Z25W16ZISF8QY32", connection),

    // Coba untuk yang lain, harusnya tidak bisa
    vote(2, "2UG9TXA0ZATBEKQ", connection),
    vote(2, "8QCWAUMYMIXUUUE", connection),
    vote(2, "DEBO6G5081DNB5B", connection),
    vote(2, "ZCYD8C7FRV4025K", connection),
    vote(2, "CGK90RGJJLBJ591", connection),
    vote(2, "SZZM5D73KDG7JYM", connection),
    vote(2, "IQ7OJDJ5GDJ6F2J", connection),
    vote(2, "Z25W16ZISF8QY32", connection),

    // Ini juga enggak
    vote(3, "2UG9TXA0ZATBEKQ", connection),
    vote(3, "8QCWAUMYMIXUUUE", connection),
    vote(3, "DEBO6G5081DNB5B", connection),
    vote(3, "ZCYD8C7FRV4025K", connection),
    vote(3, "CGK90RGJJLBJ591", connection),
    vote(3, "SZZM5D73KDG7JYM", connection),
    vote(3, "IQ7OJDJ5GDJ6F2J", connection),
    vote(3, "Z25W16ZISF8QY32", connection),
  ]);
}

run();
