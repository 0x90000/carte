import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const enabled = process.env.RSVP_NOTIFICATION_TEST_MODE === "1";
const invitationId = process.env.RSVP_NOTIFICATION_INVITATION_ID?.trim();
const invitationSlug = process.env.RSVP_NOTIFICATION_SLUG?.trim();

test.describe.serial("hourly RSVP digest notifications", () => {
  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test("creates one digest for new RSVPs and skips empty hourly runs", async ({ request }) => {
    test.skip(!enabled || !invitationId || !invitationSlug, "Set the isolated RSVP notification fixture variables.");

    const pendingBefore = await prisma.rSVP.count({ where: { invitationId: invitationId!, notificationSentAt: null } });
    expect(pendingBefore).toBe(0);
    const notificationCountBefore = await prisma.rSVPNotification.count({ where: { invitationId: invitationId! } });
    const startedAt = new Date();
    const createdRsvpIds: string[] = [];
    const createdNotificationIds: string[] = [];

    try {
      for (const [index, ip] of ["198.51.100.31", "198.51.100.32"].entries()) {
        const response = await request.post("/api/rsvp", {
          headers: { "x-forwarded-for": ip },
          data: {
            invitationSlug: invitationSlug!,
            guestName: `Digest Guest ${index + 1}`,
            guestEmail: `digest-${Date.now()}-${index}@carte.test`,
            status: "attending",
            partySize: index + 1,
          },
        });
        expect(response.status()).toBe(201);
        const payload = (await response.json()) as { data?: { id?: string } };
        if (payload.data?.id) createdRsvpIds.push(payload.data.id);
      }

      await expect.poll(
        () => prisma.rSVPNotification.count({ where: { invitationId: invitationId!, createdAt: { gte: startedAt } } }),
        { timeout: 12_000, intervals: [500, 1_000, 2_000] },
      ).toBe(1);
      const digest = await prisma.rSVPNotification.findFirst({
        where: { invitationId: invitationId!, createdAt: { gte: startedAt } },
        include: { emailSend: true },
        orderBy: { createdAt: "desc" },
      });
      expect(digest).toBeTruthy();
      expect(digest?.rsvpCount).toBe(2);
      expect(digest?.rsvpIds.sort()).toEqual(createdRsvpIds.sort());
      expect(digest?.emailSend?.rsvpNotificationId).toBe(digest?.id);
      if (digest?.id) createdNotificationIds.push(digest.id);

      await new Promise((resolve) => setTimeout(resolve, 2_500));
      await expect(prisma.rSVPNotification.count({ where: { invitationId: invitationId! } })).resolves.toBe(notificationCountBefore + 1);

      const thirdResponse = await request.post("/api/rsvp", {
        headers: { "x-forwarded-for": "198.51.100.33" },
        data: {
          invitationSlug: invitationSlug!,
          guestName: "Digest Guest 3",
          guestEmail: `digest-${Date.now()}-third@carte.test`,
          status: "maybe",
          partySize: 1,
        },
      });
      expect(thirdResponse.status()).toBe(201);
      const thirdPayload = (await thirdResponse.json()) as { data?: { id?: string } };
      if (thirdPayload.data?.id) createdRsvpIds.push(thirdPayload.data.id);

      await expect.poll(
        () => prisma.rSVPNotification.count({ where: { invitationId: invitationId!, createdAt: { gte: startedAt } } }),
        { timeout: 12_000, intervals: [500, 1_000, 2_000] },
      ).toBe(2);
      const secondDigest = await prisma.rSVPNotification.findFirst({
        where: { invitationId: invitationId!, createdAt: { gte: startedAt }, id: { notIn: createdNotificationIds } },
        orderBy: { createdAt: "desc" },
      });
      expect(secondDigest?.rsvpCount).toBe(1);
      if (secondDigest?.id) createdNotificationIds.push(secondDigest.id);
    } finally {
      await prisma.emailSend.deleteMany({ where: { rsvpNotificationId: { in: createdNotificationIds } } });
      await prisma.rSVPNotification.deleteMany({ where: { id: { in: createdNotificationIds } } });
      await prisma.rSVP.deleteMany({ where: { id: { in: createdRsvpIds } } });
    }
  });
});
