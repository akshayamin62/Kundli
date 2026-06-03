import Image from "next/image";
import Link from "next/link";

interface AppLogoProps {
  /** Navigate on click; omit when parent handles navigation */
  href?: string;
  height?: number;
  className?: string;
  priority?: boolean;
}

export default function AppLogo({
  href = "/",
  height = 40,
  className = "",
  priority = false,
}: AppLogoProps) {
  const width = Math.round(height * 4.2);
  const image = (
    <Image
      src="/logo.png"
      alt="Astrogyan — A journey with your inner soul"
      width={width}
      height={height}
      className={`object-contain object-left ${className}`}
      style={{ height, width: "auto", maxWidth: width }}
      priority={priority}
    />
  );

  if (!href) {
    return <span className="inline-flex items-center shrink-0">{image}</span>;
  }

  return (
    <Link
      href={href}
      className="inline-flex items-center shrink-0 hover:opacity-90 transition-opacity"
      aria-label="Astrogyan home"
    >
      {image}
    </Link>
  );
}
