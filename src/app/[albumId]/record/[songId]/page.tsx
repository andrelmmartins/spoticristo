"use client";

import RecordingPage from "@/components/RecordingPage";
import { useParams } from "next/navigation";

export default function EditRecordingPage() {
  const { songId } = useParams<{ songId: string }>();
  return <RecordingPage songId={songId} />;
}
