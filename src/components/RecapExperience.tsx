"use client";

import { useCallback } from "react";
import RecapPlayer from "@/src/components/RecapPlayer";
import { addVoiceover } from "@/src/lib/voiceover";
import type { Recap } from "@/src/types/scene";

// Wires the player to the voiceover step: on first play, every scene's
// narration is sent to /api/voice and the recap plays with audio.
export default function RecapExperience({ recap }: { recap: Recap }) {
  const prepare = useCallback(() => addVoiceover(recap), [recap]);
  return <RecapPlayer recap={recap} prepare={prepare} />;
}
