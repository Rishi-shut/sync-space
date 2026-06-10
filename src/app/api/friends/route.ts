import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { FriendshipStatus } from "@/generated/client";

// GET: Fetch accepted friends, pending incoming requests, and pending outgoing requests
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

    // Find all friendships involving this user
    const friendships = await db.friendship.findMany({
      where: {
        OR: [
          { senderId: dbUser.id },
          { receiverId: dbUser.id },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            displayName: true,
            imageUrl: true,
            status: true,
            email: true,
          },
        },
        receiver: {
          select: {
            id: true,
            displayName: true,
            imageUrl: true,
            status: true,
            email: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    const friendsList: any[] = [];
    const incomingRequests: any[] = [];
    const outgoingRequests: any[] = [];

    friendships.forEach((f: any) => {
      if (f.status === FriendshipStatus.ACCEPTED) {
        // Friend is the other user
        const friend = f.senderId === dbUser.id ? f.receiver : f.sender;
        friendsList.push({
          friendshipId: f.id,
          friend,
        });
      } else if (f.status === FriendshipStatus.PENDING) {
        if (f.receiverId === dbUser.id) {
          incomingRequests.push({
            friendshipId: f.id,
            requester: f.sender,
          });
        } else {
          outgoingRequests.push({
            friendshipId: f.id,
            receiver: f.receiver,
          });
        }
      }
    });

    return NextResponse.json({
      friends: friendsList,
      incoming: incomingRequests,
      outgoing: outgoingRequests,
    });
  } catch (error) {
    console.error("[FRIENDS_GET_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// POST: Send a friend request by looking up user email
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
    const { email } = body;

    if (!email) {
      return new NextResponse("Email is required", { status: 400 });
    }

    const targetEmail = email.trim().toLowerCase();

    // Look up user by email
    const receiver = await db.user.findUnique({
      where: { email: targetEmail },
    });

    if (!receiver) {
      return new NextResponse("User not found", { status: 404 });
    }

    if (receiver.id === dbUser.id) {
      return new NextResponse("You cannot add yourself as a friend", { status: 400 });
    }

    // Check if an existing friendship record exists
    const existing = await db.friendship.findFirst({
      where: {
        OR: [
          { senderId: dbUser.id, receiverId: receiver.id },
          { senderId: receiver.id, receiverId: dbUser.id },
        ],
      },
    });

    if (existing) {
      if (existing.status === FriendshipStatus.ACCEPTED) {
        return new NextResponse("You are already friends with this user", { status: 400 });
      }

      if (existing.status === FriendshipStatus.PENDING) {
        if (existing.senderId === dbUser.id) {
          return new NextResponse("Friend request already sent", { status: 400 });
        } else {
          // If receiver is current user and sender is target, auto-accept it!
          const updated = await db.friendship.update({
            where: { id: existing.id },
            data: { status: FriendshipStatus.ACCEPTED },
            include: {
              sender: true,
              receiver: true,
            },
          });
          return NextResponse.json({
            success: true,
            friendship: updated,
            autoAccepted: true,
          });
        }
      }
    }

    // Create new friend request
    const newFriendship = await db.friendship.create({
      data: {
        senderId: dbUser.id,
        receiverId: receiver.id,
        status: FriendshipStatus.PENDING,
      },
    });

    return NextResponse.json(newFriendship);
  } catch (error) {
    console.error("[FRIENDS_POST_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// PATCH: Accept or reject/cancel/remove friend relationship
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
    const { friendshipId, action } = body;

    if (!friendshipId || !action) {
      return new NextResponse("Friendship ID and action required", { status: 400 });
    }

    const friendship = await db.friendship.findUnique({
      where: { id: friendshipId },
    });

    if (!friendship) {
      return new NextResponse("Friendship record not found", { status: 404 });
    }

    // Must be sender or receiver
    if (friendship.senderId !== dbUser.id && friendship.receiverId !== dbUser.id) {
      return new NextResponse("Unauthorized to modify this record", { status: 403 });
    }

    if (action === "ACCEPT") {
      if (friendship.receiverId !== dbUser.id) {
        return new NextResponse("Only the receiver can accept a friend request", { status: 403 });
      }

      const updated = await db.friendship.update({
        where: { id: friendshipId },
        data: { status: FriendshipStatus.ACCEPTED },
      });

      return NextResponse.json(updated);
    }

    if (action === "DECLINE" || action === "CANCEL" || action === "UNFRIEND") {
      // Delete connection to keep schema clean and allow sending requests again in future
      await db.friendship.delete({
        where: { id: friendshipId },
      });

      return NextResponse.json({ success: true });
    }

    return new NextResponse("Invalid action requested", { status: 400 });
  } catch (error) {
    console.error("[FRIENDS_PATCH_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
