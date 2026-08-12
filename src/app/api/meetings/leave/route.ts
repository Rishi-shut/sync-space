import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

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

    const contentType = req.headers.get("content-type") ?? "";
    const body = contentType.includes("application/json")
      ? await req.json().catch(() => ({}))
      : JSON.parse(await req.text().catch(() => "{}"));
    const { code } = body;

    if (!code) {
      return new NextResponse("Meeting code is required", { status: 400 });
    }

    const meeting = await db.meeting.findUnique({
      where: { code },
    });

    if (!meeting) {
      return new NextResponse("Meeting not found", { status: 404 });
    }

    // Set leftAt to mark user as inactive
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
  } catch (error) {
    console.error("[MEETING_LEAVE_POST_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
