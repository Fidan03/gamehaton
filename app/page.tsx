import RecapPlayer from "@/src/components/RecapPlayer";
import type { Recap } from "@/src/types/scene";
import sample from "@/public/sample/sample-recap.json";

export default function Home() {
  return <RecapPlayer recap={sample as unknown as Recap} />;
}
