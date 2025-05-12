import type { ImageProps } from "@/types";
import type { RefObject } from "react";
import { useSuspenseImage } from "./hooks";

export const LazyImage = (
  props: Omit<ImageProps, "key" | "resizable"> & {
    imageRef: RefObject<HTMLImageElement | null>;
    onError: () => void;
    className?: string;
  },
) => {
  const { src, width, height, maxWidth } = props;

  useSuspenseImage(src);

  return (
    <img
      {...props}
      src={src}
      style={{
        height,
        maxWidth,
        width,
      }}
      draggable="false"
    />
  );
};
