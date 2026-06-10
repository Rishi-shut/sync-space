import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import MeetingRoomClient from "./meeting-room-client";

interface MeetingPageProps {
  params: Promise<{ code: string }>;
}

export default async function MeetingPage({ params }: MeetingPageProps) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const user = await db.user.findUnique({
    where: { clerkId: userId },
  });

  if (!user) {
    redirect("/onboarding");
  }

  const { code } = await params;

  // Retrieve meeting from PostgreSQL database
  const meeting = await db.meeting.findUnique({
    where: { code },
    include: {
      createdBy: {
        select: {
          displayName: true,
        },
      },
    },
  });

  if (!meeting) {
    notFound();
  }

  return (
    <MeetingRoomClient
      user={JSON.parse(JSON.stringify(user))}
      meeting={JSON.parse(JSON.stringify(meeting))}
    />
  );
}
