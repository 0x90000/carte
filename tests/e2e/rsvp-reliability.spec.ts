import { expect, test } from "@playwright/test";

type RsvpPayload = {
  invitationSlug: string;
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  status: "attending" | "declined" | "maybe";
  partySize: number;
};

test.describe("RSVP reliability", () => {
  test.skip(process.env.RSVP_RELIABILITY_TEST_MODE !== "1", "Set RSVP_RELIABILITY_TEST_MODE=1 to run RSVP reliability checks.");

  const slug = process.env.RSVP_RELIABILITY_SLUG?.trim();

  function payload(index: number, contact: { email?: string; phone?: string }): RsvpPayload {
    return {
      invitationSlug: slug as string,
      guestName: `Reliability Guest ${index}`,
      ...contact,
      status: "attending",
      partySize: 1,
    };
  }

  test("rejects duplicate normalized email and phone contacts", async ({ request }) => {
    if (!slug) {
      throw new Error("RSVP_RELIABILITY_SLUG must be set when running RSVP reliability checks");
    }
    const email = `duplicate-${Date.now()}@carte.test`;
    const firstEmail = await request.post("/api/rsvp", {
      headers: { "x-forwarded-for": "198.51.100.10" },
      data: payload(1, { email }),
    });
    expect(firstEmail.status()).toBe(201);

    const duplicateEmail = await request.post("/api/rsvp", {
      headers: { "x-forwarded-for": "198.51.100.10" },
      data: payload(2, { email: `  ${email.toUpperCase()} ` }),
    });
    expect(duplicateEmail.status()).toBe(409);
    expect((await duplicateEmail.json()).error.code).toBe("DUPLICATE_RSVP");

    const phone = "138-0013-8000";
    const firstPhone = await request.post("/api/rsvp", {
      headers: { "x-forwarded-for": "198.51.100.11" },
      data: payload(3, { phone }),
    });
    expect(firstPhone.status()).toBe(201);

    const duplicatePhone = await request.post("/api/rsvp", {
      headers: { "x-forwarded-for": "198.51.100.11" },
      data: payload(4, { phone: "+86 138 0013 8000" }),
    });
    expect(duplicatePhone.status()).toBe(409);
    expect((await duplicatePhone.json()).error.code).toBe("DUPLICATE_RSVP");
  });

  test("limits an IP to three RSVP attempts per minute", async ({ request }) => {
    if (!slug) {
      throw new Error("RSVP_RELIABILITY_SLUG must be set when running RSVP reliability checks");
    }
    const ip = "198.51.100.12";
    for (let index = 0; index < 3; index += 1) {
      const response = await request.post("/api/rsvp", {
        headers: { "x-forwarded-for": ip },
        data: payload(index + 10, { email: `limited-${Date.now()}-${index}@carte.test` }),
      });
      expect(response.status()).toBe(201);
      expect(response.headers()["ratelimit-limit"]).toBe("3");
    }

    const limited = await request.post("/api/rsvp", {
      headers: { "x-forwarded-for": ip },
      data: payload(14, { email: `limited-${Date.now()}-blocked@carte.test` }),
    });
    expect(limited.status()).toBe(429);
    expect(limited.headers()["retry-after"]).toBeTruthy();
    expect((await limited.json()).error.code).toBe("RATE_LIMITED");
  });
});
