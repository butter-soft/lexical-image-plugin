export const blobTodataURL = async (blob: Blob) => {
  return new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") resolve(reader.result);
    };

    reader.readAsDataURL(blob);
  });
};
