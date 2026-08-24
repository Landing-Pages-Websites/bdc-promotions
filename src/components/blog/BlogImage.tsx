import Image from "next/image";
import type { ReactElement } from "react";
import { canOptimizeBlogImage } from "@/lib/blog-images";

interface BlogImageProps {
  src: string;
  alt: string;
  priority?: boolean;
}

export default function BlogImage({
  src,
  alt,
  priority = false,
}: BlogImageProps): ReactElement {
  return (
    <Image
      src={src}
      alt={alt}
      width={1600}
      height={900}
      sizes="(min-width: 768px) 42rem, 100vw"
      className="h-auto w-full rounded-lg object-cover"
      priority={priority}
      unoptimized={!canOptimizeBlogImage(src)}
    />
  );
}
