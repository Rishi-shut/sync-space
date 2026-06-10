import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { UserStatus } from "@prisma/client";

export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { status } = body;

    if (!status || !Object.values(UserStatus).includes(status)) {
      return new NextResponse("Invalid status value", { status: 400 });
    }

    const user = await db.user.update({
      where: { clerkId: userId },
      data: {
        status: status as UserStatus,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("[USER_STATUS_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
