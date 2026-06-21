import { redirect, notFound } from "next/navigation";
import { db, getSessionUser } from "@/lib/db";
import MeetingRoomClient from "./meeting-room-client";

interface MeetingPageProps {
  params: Promise<{ code: string }>;
}

export default async function MeetingPage({ params }: MeetingPageProps) {
  const user = await getSessionUser();

  if (!user) {
    redirect("/sign-in");
  }

  if (!user.isOnboarded) {
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

  // Redirect to dashboard if meeting is ended
  if (meeting.status === "ENDED") {
    redirect("/dashboard/meetings?ended=true");
  }

  const isHost = meeting.createdById === user.id;

  // Upsert a participant record to mark this user as active in the meeting
  await db.meetingParticipant.upsert({
    where: {
      meetingId_userId: {
        meetingId: meeting.id,
        userId: user.id,
      },
    },
    update: {
      leftAt: null,
    },
    create: {
      meetingId: meeting.id,
      userId: user.id,
      role: isHost ? "HOST" : "PARTICIPANT",
      isApproved: isHost ? true : !meeting.requireApproval,
    },
  });

  // Fetch all active participants currently in this meeting
  const activeParticipants = await db.meetingParticipant.findMany({
    where: {
      meetingId: meeting.id,
      leftAt: null,
    },
    include: {
      user: {
        select: {
          id: true,
          displayName: true,
          imageUrl: true,
        },
      },
    },
  });

  const clientMeeting = {
    ...meeting,
    password: null, // Hide actual password
    hasPassword: !!meeting.password,
  };

  return (
    <MeetingRoomClient
      user={JSON.parse(JSON.stringify(user))}
      meeting={JSON.parse(JSON.stringify(clientMeeting))}
      initialParticipants={JSON.parse(JSON.stringify(activeParticipants.map(ap => ap.user)))}
    />
  );
}
