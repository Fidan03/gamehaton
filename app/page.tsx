import RecapExperience from "@/src/components/RecapExperience";
import type { Recap } from "@/src/types/scene";
import sample from "@/public/sample/sample-recap.json";

export default function Home() {
  return <RecapExperience recap={sample as unknown as Recap} />;
}
