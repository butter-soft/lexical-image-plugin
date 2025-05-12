import {
  $applyNodeReplacement,
  $getSelection,
  $isNodeSelection,
} from "lexical";

import type {
  DOMConversionMap,
  DOMConversionOutput,
  LexicalNode,
} from "lexical";

import { ImageNode } from "@/node";
import type { ImagePayload, SerializedImageNode } from "@/types";

const $createImageNode = ({
  src,
  alt,
  width,
  height,
  maxWidth = 640,
  key,
}: ImagePayload): ImageNode =>
  $applyNodeReplacement(new ImageNode(src, alt, maxWidth, key, width, height));

const $convertImageElement = (domNode: Node): null | DOMConversionOutput => {
  const img = domNode as HTMLImageElement;

  if (img.src.startsWith("file:///")) {
    return null;
  }
  const { src, alt, width, height } = img;

  return { node: $createImageNode({ src, alt, width, height }) };
};

export const importDOM: () => DOMConversionMap | null = () => {
  return {
    img: (node: Node) => ({
      conversion: () => $convertImageElement(node),
      priority: 0,
    }),
  };
};

export const importJSON: (serializedNode: SerializedImageNode) => ImageNode = (
  serializedNode,
) => {
  const { height, width, maxWidth, src, alt } = serializedNode;
  const node = $createImageNode({
    src,
    alt,
    width,
    height,
    maxWidth,
  });

  return node;
};

export const $isImageNode = (
  node: LexicalNode | null | undefined,
): node is ImageNode => node instanceof ImageNode;

export const $getImageNodeInSelection = (): ImageNode | null => {
  const selection = $getSelection();
  if (!$isNodeSelection(selection)) {
    return null;
  }
  const nodes = selection.getNodes();
  const node = nodes[0];
  return $isImageNode(node) ? node : null;
};
