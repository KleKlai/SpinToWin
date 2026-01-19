import SpinWheel from "@/components/spin-wheel";
import { fetchWheelPrizes } from "@/lib/wheel-constants";
import Image from "next/image";

export default async function Home() {
  const prizes = await fetchWheelPrizes();

  return (
    <SpinWheel prizes={prizes}/>
  );
}
