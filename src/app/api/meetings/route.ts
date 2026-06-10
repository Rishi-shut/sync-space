import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { MeetingStatus, MeetingType } from "@prisma/client";

// Generate a random human-friendly room code: "abc-defg-hij"
function generateRoomCode() {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  const part1 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  const part2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  const part3 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `${part1}-${part2}-${part3}`;
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const dbUser = await db.user.findUnique({
      where: { clerkId: userId },
    });

    if (!dbUser) {
      return new NextResponse("User not found in local DB", { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const { title = "Quick Meeting", type = "VIDEO" } = body;

    const code = generateRoomCode();

    const meeting = await db.meeting.create({
      data: {
        title,
        code,
        status: MeetingStatus.ACTIVE,
        type: type as MeetingType,
        createdById: dbUser.id,
        startedAt: new Date(),
      },
    });

    // Also add the creator as an active participant
    await db.meetingParticipant.create({
      data: {
        meetingId: meeting.id,
        userId: dbUser.id,
        role: "HOST",
      },
    });

    return NextResponse.json(meeting);
  } catch (error) {
    console.error("[MEETING_CREATE_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
