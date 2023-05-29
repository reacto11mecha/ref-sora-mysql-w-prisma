import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const candidates = [
  { name: "Abiputra Dartono", img: "80-609259-119030-4.png" },
  { name: "Raihan Tampubolon", img: "12-954775-918820-0.png" },
  { name: "Pertiwi Dyah", img: "33-153510-083852-8.png" },
];

// Participants ref for query
const participants = [
  { name: "Jail Wardana", qrId: "13-417390-997660-1" },
  { name: "Asirwada Permadi", qrId: "82-747035-179724-2" },
  { name: "Kirana Putri", qrId: "34-777399-498756-2" },
  { name: "Abimanyu Himawan", qrId: "57-583621-192442-0" },
  { name: "Aswandi Praba", qrId: "06-221912-026634-2" },
  { name: "Novita Novita Salma", qrId: "37-925808-001220-3" },
  { name: "Leilani Halima", qrId: "21-985792-522326-5" },
  { name: "Ayu Ayu Anjani", qrId: "59-244297-722642-0" },
  { name: "Taufan Taufan Tampubolon", qrId: "45-814080-724016-4" },
  { name: "Nabila Nabila Maryati", qrId: "20-094665-265460-1" },
  { name: "Susanti Nadia", qrId: "60-440588-392329-5" },
  { name: "Gangsar Airlangga", qrId: "93-170716-670691-5" },
  { name: "Aris Permadi", qrId: "97-639277-850920-9" },
  { name: "Artanto Artanto Ardianto", qrId: "84-136082-207182-6" },
  { name: "Hari Abimanyu", qrId: "77-440649-152007-1" },
  { name: "Lanang Febian", qrId: "11-978127-110253-8" },
  { name: "Atmaja Darojat", qrId: "90-646683-255740-7" },
  { name: "Dinda Ramadhani", qrId: "64-477484-844046-9" },
  { name: "Naradi Fabian", qrId: "62-599584-619753-7" },
  { name: "Nuraini Olivia", qrId: "35-579951-690269-7" },
  { name: "Aswandi Muni", qrId: "66-902908-556125-7" },
  { name: "Intan Intan Padmasari", qrId: "70-986540-607847-7" },
  { name: "Timbul Purwadi", qrId: "66-897277-046654-1" },
  { name: "Vero Vero Pangestu", qrId: "51-977693-787476-5" },
  { name: "Gambira Firgantoro", qrId: "02-765562-142891-1" },
  { name: "Agustina Ghaliyati", qrId: "82-500437-197211-3" },
  { name: "Yudhistira Tri", qrId: "08-622360-638372-2" },
  { name: "Ilsa Mulyani", qrId: "90-247497-086919-0" },
  { name: "Kasusra Suryono", qrId: "56-463987-887169-1" },
  { name: "Hidayat Balidin", qrId: "55-449118-480913-6" },
];

async function main() {
  for (const candidate of candidates) {
    const upsertCandidate = await prisma.candidate.upsert({
      where: {
        name: candidate.name,
      },
      update: {},
      create: {
        name: candidate.name,
        img: candidate.img,
      },
    });

    console.log("UPSERT CANDIDATE", upsertCandidate);
  }

  for (const participant of participants) {
    const upsertParticipant = await prisma.participant.upsert({
      where: {
        qrId: participant.qrId,
      },
      update: {},
      create: {
        name: participant.name,
        qrId: participant.qrId,
      },
    });

    console.log("UPSERT PARTICIPANT", upsertParticipant);
  }
}

main();
