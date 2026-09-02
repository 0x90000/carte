"use client";

import dynamic from "next/dynamic";

const RSVPForm = dynamic(
  () => import("@/components/invitation/rsvp-form").then((module) => module.RSVPForm),
  { ssr: false },
);

export function RSVPSection({ invitationSlug }: { invitationSlug: string }) {
  return (
    <div className="mx-auto max-w-[750px] px-2 pb-8">
      <RSVPForm invitationSlug={invitationSlug} />
    </div>
  );
}
