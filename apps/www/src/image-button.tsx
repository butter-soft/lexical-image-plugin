import { INSERT_IMAGE_COMMAND } from "@bvtter/lexical-image-plugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import type { ChangeEventHandler } from "react";
import { blobTodataURL } from "./util";

const ImageButton = () => {
  const [editor] = useLexicalComposerContext();

  const onAddImage: ChangeEventHandler<HTMLInputElement> = async (event) => {
    const file = event.currentTarget.files?.[0];

    if (file) {
      const src = await blobTodataURL(file);

      editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
        src,
        alt: "공지사항 본문 이미지",
        maxWidth: 1280,
      });
    }
  };

  return (
    <button>
      <label htmlFor="image">Click me to insert image</label>
      <input
        onChange={onAddImage}
        id="image"
        name="image"
        type="file"
        accept="image/png, image/jpeg, image/gif"
        style={{
          display: "none",
        }}
      />
    </button>
  );
};

export { ImageButton };
