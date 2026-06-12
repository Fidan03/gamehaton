import CollectorFlow from "@/src/components/CollectorFlow";
import type { Recap } from "@/src/types/scene";
import sample from "@/public/sample/sample-recap.json";

export default function Home() {
  return <CollectorFlow sample={sample as unknown as Recap} />;
}
