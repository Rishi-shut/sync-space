import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
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

    // Get all users except the current one
    const users = await db.user.findMany({
      where: {
        id: {
          not: dbUser.id,
        },
      },
      select: {
        id: true,
        displayName: true,
        imageUrl: true,
        status: true,
        email: true,
      },
      orderBy: {
        displayName: "asc",
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("[USERS_GET_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
