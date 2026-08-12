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
    const { 
      title = "Quick Meeting", 
      type = "VIDEO", 
      password = null, 
      requireApproval = false,
      scheduledAt = null,
      conversationId = null,
      recipientId = null
    } = body;

    if (!Object.values(MeetingType).includes(type as MeetingType)) {
      return new NextResponse("Invalid meeting type", { status: 400 });
    }

    if (scheduledAt && Number.isNaN(new Date(scheduledAt).getTime())) {
      return new NextResponse("Invalid scheduled time", { status: 400 });
    }

    if (recipientId) {
      const recipient = await db.user.findUnique({ where: { id: recipientId }, select: { id: true } });
      if (!recipient) return new NextResponse("Call recipient not found", { status: 404 });
    }

    if (conversationId) {
      const membership = await db.conversationMember.findUnique({
        where: { conversationId_userId: { conversationId, userId: dbUser.id } },
      });
      if (!membership) return new NextResponse("Conversation not found", { status: 404 });

      if (recipientId) {
        const recipientMembership = await db.conversationMember.findUnique({
          where: { conversationId_userId: { conversationId, userId: recipientId } },
        });
        if (!recipientMembership) {
          return new NextResponse("Call recipient is not in this conversation", { status: 400 });
        }
      }
    }

    const code = generateRoomCode();

    const meeting = await db.meeting.create({
      data: {
        title,
        code,
        status: scheduledAt ? MeetingStatus.SCHEDULED : MeetingStatus.ACTIVE,
        type: type as MeetingType,
        createdById: dbUser.id,
        startedAt: scheduledAt ? null : new Date(),
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        password: password ? password : null,
        requireApproval: !!requireApproval,
        conversationId,
        recipientId,
      },
    });

    // Only add host as active participant if the meeting is starting immediately
    if (!scheduledAt) {
      await db.meetingParticipant.create({
        data: {
          meetingId: meeting.id,
          userId: dbUser.id,
          role: "HOST",
          isApproved: true,
        },
      });

      // For direct calling, pre-approve the recipient so they bypass waiting room / passwords
      if (recipientId) {
        await db.meetingParticipant.upsert({
          where: {
            meetingId_userId: {
              meetingId: meeting.id,
              userId: recipientId,
            },
          },
          update: {
            // Pre-authorize the recipient without claiming they already joined.
            leftAt: new Date(),
            isApproved: true,
          },
          create: {
            meetingId: meeting.id,
            userId: recipientId,
            role: "PARTICIPANT",
            isApproved: true,
            leftAt: new Date(),
          },
        });
      }
    }

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

    // Host approving participant
    if (status === "APPROVE_PARTICIPANT") {
      const { targetUserId } = body;
      if (!targetUserId) {
        return new NextResponse("targetUserId is required", { status: 400 });
      }
      if (meeting.createdById !== dbUser.id) {
        return new NextResponse("Forbidden: Only host can approve admission", { status: 403 });
      }
      await db.meetingParticipant.updateMany({
        where: {
          meetingId: meeting.id,
          userId: targetUserId,
          leftAt: null,
        },
        data: {
          isApproved: true,
        },
      });
      return NextResponse.json({ success: true });
    }

    // Host denying participant
    if (status === "DENY_PARTICIPANT") {
      const { targetUserId } = body;
      if (!targetUserId) {
        return new NextResponse("targetUserId is required", { status: 400 });
      }
      if (meeting.createdById !== dbUser.id) {
        return new NextResponse("Forbidden: Only host can deny admission", { status: 403 });
      }
      await db.meetingParticipant.updateMany({
        where: {
          meetingId: meeting.id,
          userId: targetUserId,
          leftAt: null,
        },
        data: {
          leftAt: new Date(),
          isApproved: false,
        },
      });
      return NextResponse.json({ success: true });
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

    // Joining or returning to the meeting
    if (status === "JOINED") {
      const suppliedPassword = typeof body.password === "string" ? body.password : "";
      const isHost = meeting.createdById === dbUser.id;
      const isInvitedRecipient = meeting.recipientId === dbUser.id;
      const isMuted = body.isMuted === true;
      const isCameraOff = body.isCameraOff === true;

      if (meeting.password && !isHost && !isInvitedRecipient && meeting.password !== suppliedPassword) {
        return new NextResponse("Invalid meeting password", { status: 403 });
      }

      const participant = await db.meetingParticipant.upsert({
        where: {
          meetingId_userId: {
            meetingId: meeting.id,
            userId: dbUser.id,
          },
        },
        update: {
          leftAt: null,
          isMuted,
          isCameraOff,
        },
        create: {
          meetingId: meeting.id,
          userId: dbUser.id,
          role: isHost ? "HOST" : "PARTICIPANT",
          isApproved: isHost || isInvitedRecipient || !meeting.requireApproval,
          isMuted,
          isCameraOff,
        },
      });

      if (isHost && meeting.status === MeetingStatus.SCHEDULED) {
        await db.meeting.update({
          where: { id: meeting.id },
          data: { status: MeetingStatus.ACTIVE, startedAt: new Date() },
        });
      }
      return NextResponse.json({ success: true, isApproved: participant.isApproved });
    }

    // Update participant flags (isScreenSharing, isMuted, etc.)
    if (status === "UPDATE_FLAGS") {
      const { isScreenSharing, isMuted, isCameraOff } = body;
      await db.meetingParticipant.updateMany({
        where: {
          meetingId: meeting.id,
          userId: dbUser.id,
          leftAt: null,
        },
        data: {
          ...(isScreenSharing !== undefined && { isScreenSharing }),
          ...(isMuted !== undefined && { isMuted }),
          ...(isCameraOff !== undefined && { isCameraOff }),
        },
      });
      return NextResponse.json({ success: true });
    }

    if (status === "DECLINE_CALL") {
      if (meeting.recipientId !== dbUser.id) {
        return new NextResponse("Only the call recipient can decline", { status: 403 });
      }
      await db.meeting.update({
        where: { id: meeting.id },
        data: { status: MeetingStatus.CANCELLED, endedAt: new Date() },
      });
      return NextResponse.json({ success: true });
    }

    // Only host can end the meeting
    if (meeting.createdById !== dbUser.id) {
      return new NextResponse("Forbidden: Only host can end meeting", { status: 403 });
    }

    if (status === MeetingStatus.ENDED) {
      await db.meeting.delete({
        where: { code },
      });
      return NextResponse.json({ success: true, deleted: true });
    }

    const updatedMeeting = await db.meeting.update({
      where: { code },
      data: {
        status: status as MeetingStatus,
        endedAt: null,
      },
    });

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

    const dbUser = await db.user.findUnique({
      where: { clerkId: userId },
    });

    if (!dbUser) {
      return new NextResponse("User not found in local DB", { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const passwordParam = searchParams.get("password");

    if (!code) {
      const activeCalls = await db.meeting.findMany({
        where: {
          status: "ACTIVE",
          createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) },
          // Only an explicitly addressed call should ring this user. A friend's
          // unrelated voice room is not an incoming call.
          recipientId: dbUser.id,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              displayName: true,
              imageUrl: true,
            },
          },
        },
      });

      return NextResponse.json(activeCalls);
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

    // Password check: if meeting is password-protected and user is not host
    if (meeting.password && meeting.createdById !== dbUser.id) {
      if (meeting.password !== passwordParam) {
        return new NextResponse("Password required or invalid", { status: 403 });
      }
    }

    // Find the caller's own participant record
    const myParticipant = await db.meetingParticipant.findFirst({
      where: {
        meetingId: meeting.id,
        userId: dbUser.id,
      },
    });

    const hasPassword = !!meeting.password;
    const clientMeeting = {
      ...meeting,
      password: null,
      hasPassword,
      myParticipant,
    };

    return NextResponse.json(clientMeeting);
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
