import {
  $wrapNodeInElement,
  isMimeType,
  mediaFileReader,
} from "@lexical/utils";
import { ACCEPTABLE_IMAGE_TYPES, TRANSPARENT_IMAGE } from "@plugin/constants";
import { $getImageNodeInSelection } from "@plugin/helper";
import { $createImageNode } from "@plugin/node";
import type { InsertImagePayload } from "@plugin/types";
import type { SwitchImageData } from "dist";
import {
  $createParagraphNode,
  $createRangeSelection,
  $insertNodes,
  $isRootOrShadowRoot,
  $setSelection,
  type LexicalEditor,
} from "lexical";
import { INSERT_IMAGE_COMMAND } from "./commands";
import { canDropImage, getDragImageData, getDragSelection } from "./utils";

const img = document.createElement("img");
img.src = TRANSPARENT_IMAGE;

export const $onInsert = (payload: InsertImagePayload) => {
  const imageNode = $createImageNode(payload);

  $insertNodes([imageNode]);

  if ($isRootOrShadowRoot(imageNode.getParentOrThrow())) {
    $wrapNodeInElement(imageNode, $createParagraphNode).selectEnd();
  }
  return true;
};

export const $onSwitch = (payload: SwitchImageData[]) => {
  payload.forEach(({ node, storageSrc }) => {
    node.setSrc(storageSrc);
  });

  return true;
};

export const $onDragStart = (event: DragEvent) => {
  const node = $getImageNodeInSelection();

  if (!node) {
    return false;
  }

  const dataTransfer = event.dataTransfer;

  if (!dataTransfer) {
    return false;
  }

  dataTransfer.setData("text/plain", "_");
  dataTransfer.setDragImage(img, 0, 0);
  dataTransfer.setData(
    "application/x-lexical-drag",
    JSON.stringify({
      data: {
        key: node.getKey(),
        src: node.__src,
        alt: node.__alt,
        width: node.__width,
        height: node.__height,
        maxWidth: node.__maxWidth,
      },
      type: "image",
    }),
  );

  return true;
};

export const $onDragOver = (event: DragEvent) => {
  const node = $getImageNodeInSelection();

  if (!node) {
    return false;
  }

  if (!canDropImage(event)) {
    event.preventDefault();
  }

  return true;
};

export const $onDrop = (editor: LexicalEditor) => (event: DragEvent) => {
  const node = $getImageNodeInSelection();

  if (!node) {
    return false;
  }

  const data = getDragImageData(event);

  if (!data) {
    return false;
  }

  event.preventDefault();

  if (canDropImage(event)) {
    const range = getDragSelection(event);
    node.remove();
    const rangeSelection = $createRangeSelection();

    if (range !== null && range !== undefined) {
      rangeSelection.applyDOMRange(range);
    }

    $setSelection(rangeSelection);
    editor.dispatchCommand(INSERT_IMAGE_COMMAND, data);
  }

  return true;
};

const processDragDropPaste =
  (editor: LexicalEditor) => async (files: File[]) => {
    const filesResult = await mediaFileReader(
      files,
      [ACCEPTABLE_IMAGE_TYPES].flatMap((x) => x),
    );

    for (const { file, result } of filesResult) {
      if (isMimeType(file, ACCEPTABLE_IMAGE_TYPES)) {
        editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
          alt: file.name,
          src: result,
        });
      }
    }
  };

export const $onDragDropPaste = (editor: LexicalEditor) => (files: File[]) => {
  processDragDropPaste(editor)(files);

  return true;
};
