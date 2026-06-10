import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { displayName, bio } = body;

    if (!displayName) {
      return new NextResponse("Display name is required", { status: 400 });
    }

    const user = await db.user.update({
      where: { clerkId: userId },
      data: {
        displayName,
        bio: bio || null,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("[USER_UPDATE_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
