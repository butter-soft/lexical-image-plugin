import type { ImageProps } from "@plugin/types";
import { useEffect, useState, type CSSProperties, type RefObject } from "react";
import { BrokenImage } from "./broken";
import { useSuspenseImage } from "./hooks";

const isSVG = (src: string) => src.toLowerCase().endsWith(".svg");

const calculateStyles = (
  width: "inherit" | number,
  height: "inherit" | number,
  maxWidth: number,
  isSVGImage: boolean,
  isFocused: boolean,
  dimensions?: {
    width: number;
    height: number;
  },
): CSSProperties => {
  if (!isSVGImage) {
    return {
      height,
      maxWidth,
      width,
      boxShadow: isFocused ? "0 0 0 1px black" : undefined,
    };
  }

  const naturalWidth = dimensions?.width || 200;
  const naturalHeight = dimensions?.height || 200;

  let finalWidth = naturalWidth;
  let finalHeight = naturalHeight;

  if (finalWidth > maxWidth) {
    const scale = maxWidth / finalWidth;
    finalWidth = maxWidth;
    finalHeight = Math.round(finalHeight * scale);
  }

  const maxHeight = 500;
  if (finalHeight > maxHeight) {
    const scale = maxHeight / finalHeight;
    finalHeight = maxHeight;
    finalWidth = Math.round(finalWidth * scale);
  }

  return {
    height: finalHeight,
    maxWidth,
    width: finalWidth,
    boxShadow: isFocused ? "0 0 0 1px black" : undefined,
  };
};

export const LazyImage = ({
  src,
  alt,
  imageRef,
  onError,
  width,
  height,
  maxWidth,
  isFocused,
  className,
}: Omit<ImageProps, "key" | "resizable"> & {
  imageRef: RefObject<HTMLImageElement | null>;
  onError: () => void;
  isFocused: boolean;
  className?: undefined;
}) => {
  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
  }>();
  const isSVGImage = isSVG(src);

  useEffect(() => {
    if (imageRef.current && isSVGImage) {
      const { naturalWidth, naturalHeight } = imageRef.current;
      setDimensions({
        height: naturalHeight,
        width: naturalWidth,
      });
    }
  }, [imageRef, isSVGImage]);

  const hasError = useSuspenseImage(src);

  useEffect(() => {
    if (hasError) {
      onError();
    }
  }, [hasError, onError]);

  if (hasError) {
    return <BrokenImage />;
  }

  const style = calculateStyles(
    width,
    height,
    maxWidth,
    isSVGImage,
    isFocused,
    dimensions,
  );

  return (
    <img
      className={className}
      src={src}
      alt={alt}
      ref={imageRef}
      onError={onError}
      style={style}
      draggable="false"
      onLoad={(e) => {
        if (isSVGImage) {
          const { naturalWidth: width, naturalHeight: height } =
            e.currentTarget;
          setDimensions({ width, height });
        }
      }}
    />
  );
};
