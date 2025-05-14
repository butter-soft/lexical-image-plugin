import type { ImageNode } from "@/node";
import type { LexicalNode } from "lexical";
import { $getSelection, $isNodeSelection } from "lexical";

export const $isImageNode = (
  node: LexicalNode | null | undefined,
): node is ImageNode => node?.getType() === "image";

export const $getImageNodeInSelection = (): ImageNode | null => {
  const selection = $getSelection();
  if (!$isNodeSelection(selection)) {
    return null;
  }
  const nodes = selection.getNodes();
  const node = nodes[0];
  return $isImageNode(node) ? node : null;
};
