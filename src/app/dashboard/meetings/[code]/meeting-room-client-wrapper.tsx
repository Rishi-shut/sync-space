"use client";

import dynamic from "next/dynamic";
import type { MeetingRoomClientProps } from "./meeting-room-client";

const MeetingRoomClient = dynamic(() => import("./meeting-room-client"), {
  ssr: false,
});

export default function MeetingRoomClientWrapper(props: MeetingRoomClientProps) {
  return <MeetingRoomClient {...props} />;
}
