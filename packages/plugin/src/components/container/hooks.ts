const imageCache = new Map<string, Promise<boolean> | boolean>();

export const useSuspenseImage = (src: string) => {
  let cached = imageCache.get(src);

  if (typeof cached === "boolean") {
    return cached;
  }

  if (!cached) {
    cached = new Promise<boolean>((resolve) => {
      const img = new Image();
      img.src = src;
      img.onload = () => resolve(false);
      img.onerror = () => resolve(true);
    }).then((hasError) => {
      imageCache.set(src, hasError);
      return hasError;
    });

    imageCache.set(src, cached);
    throw cached;
  }

  throw cached;
};
