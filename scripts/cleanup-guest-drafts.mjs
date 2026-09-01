import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

try {
  const result = await prisma.guestDraft.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  console.log(`[GuestDraftCleanup] cli: removed ${result.count} expired drafts`);
} finally {
  await prisma.$disconnect();
}
