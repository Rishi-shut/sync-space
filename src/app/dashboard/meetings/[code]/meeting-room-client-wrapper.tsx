"use client";

import dynamic from "next/dynamic";

const MeetingRoomClient = dynamic(() => import("./meeting-room-client"), {
  ssr: false,
});

export default function MeetingRoomClientWrapper(props: any) {
  return <MeetingRoomClient {...props} />;
}
