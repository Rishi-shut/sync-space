import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { MeetingStatus, MeetingType } from "@/generated/client";

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

export async function PATCH(req: Request) {
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
    const { code, status } = body;

    if (!code || !status) {
      return new NextResponse("Meeting code and status required", { status: 400 });
    }

    const meeting = await db.meeting.findUnique({
      where: { code },
    });

    if (!meeting) {
      return new NextResponse("Meeting not found", { status: 404 });
    }

    // Voluntarily leaving the meeting
    if (status === "LEFT") {
      await db.meetingParticipant.updateMany({
        where: {
          meetingId: meeting.id,
          userId: dbUser.id,
          leftAt: null,
        },
        data: {
          leftAt: new Date(),
        },
      });
      return NextResponse.json({ success: true });
    }

    // Only host can end the meeting
    if (meeting.createdById !== dbUser.id) {
      return new NextResponse("Forbidden: Only host can end meeting", { status: 403 });
    }

    const updatedMeeting = await db.meeting.update({
      where: { code },
      data: {
        status: status as MeetingStatus,
        endedAt: status === MeetingStatus.ENDED ? new Date() : null,
      },
    });

    if (status === MeetingStatus.ENDED) {
      await db.meetingParticipant.updateMany({
        where: {
          meetingId: meeting.id,
          leftAt: null,
        },
        data: {
          leftAt: new Date(),
        },
      });
    }

    return NextResponse.json(updatedMeeting);
  } catch (error) {
    console.error("[MEETING_PATCH_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) {
      return new NextResponse("Meeting code is required", { status: 400 });
    }

    const meeting = await db.meeting.findUnique({
      where: { code },
      include: {
        participants: {
          where: {
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
        },
      },
    });

    if (!meeting) {
      return new NextResponse("Meeting not found", { status: 404 });
    }

    return NextResponse.json(meeting);
  } catch (error) {
    console.error("[MEETING_GET_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(req: Request) {
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

    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) {
      return new NextResponse("Meeting code is required", { status: 400 });
    }

    const meeting = await db.meeting.findUnique({
      where: { code },
    });

    if (!meeting) {
      return new NextResponse("Meeting not found", { status: 404 });
    }

    // Only host can delete the meeting
    if (meeting.createdById !== dbUser.id) {
      return new NextResponse("Forbidden: Only host can delete meeting", { status: 403 });
    }

    await db.meeting.delete({
      where: { code },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[MEETING_DELETE_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
