import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/db";
import FriendsClient from "./friends-client";

export default async function FriendsPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/sign-in");
  }

  if (!user.isOnboarded) {
    redirect("/onboarding");
  }

  return (
    <FriendsClient userId={user.id} />
  );
}
