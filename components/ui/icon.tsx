import Image from "next/image";
const assets = {
  radar: ["63a09.svg", 20],
  brand: ["301b1.svg", 20],
  bookmark: ["0ab2b.svg", 20],
  briefcase: ["ef1b8.svg", 20],
  check: ["9dd8d.svg", 16],
  score: ["fa3a8.svg", 14],
  bell: ["75fd1.svg", 20],
  search: ["6fb11.svg", 20],
  chevron: ["9bd40.svg", 18],
  pin: ["7da28.svg", 18],
  filter: ["16055.svg", 18],
  globe: ["fcd55.svg", 16],
  arrow: ["2f7ba.svg", 20],
  back: ["acd25.svg", 20],
  phoneRadar: ["c4704.svg", 23],
  phoneBookmark: ["51433.svg", 23],
  phoneBriefcase: ["092ca.svg", 23],
} as const;
export type IconName = keyof typeof assets;
export function Icon({ name }: { name: IconName }) {
  const [file, size] = assets[name];
  return (
    <Image
      src={`/figma/${file}`}
      width={size}
      height={size}
      alt=""
      unoptimized
      aria-hidden
    />
  );
}
export function RadarArt() {
  return (
    <Image
      className="radar-art"
      src="/figma/536d8.svg"
      width={116}
      height={116}
      alt=""
      unoptimized
      aria-hidden
    />
  );
}
export function EmptyArt() {
  return (
    <Image
      src="/figma/b1468.svg"
      width={166}
      height={142}
      alt=""
      unoptimized
      aria-hidden
    />
  );
}
