import { INSERT_IMAGE_COMMAND, SWITCH_IMAGES_COMMAND } from "@/commands";
import { $createImageNode, ImageNode } from "@/node";
import type { InsertImagePayload, SwitchImageData } from "@/types";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $wrapNodeInElement, mergeRegister } from "@lexical/utils";
import {
  $createParagraphNode,
  $insertNodes,
  $isRootOrShadowRoot,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_EDITOR,
} from "lexical";
import { useEffect } from "react";

export const ImagePlugin = () => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([ImageNode])) {
      throw new Error("ImagePlugin: ImageNode is not registered on editor");
    }

    return mergeRegister(
      editor.registerCommand<InsertImagePayload>(
        INSERT_IMAGE_COMMAND,
        (payload) => {
          const imageNode = $createImageNode(payload);

          $insertNodes([imageNode]);

          if ($isRootOrShadowRoot(imageNode.getParentOrThrow())) {
            $wrapNodeInElement(imageNode, $createParagraphNode).selectEnd();
          }
          return true;
        },
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand<SwitchImageData[]>(
        SWITCH_IMAGES_COMMAND,
        (payload) => {
          payload.forEach(({ node, storageSrc }) => {
            node.setSrc(storageSrc);
          });

          return true;
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      // TODO: DragEvent
    );
  }, [editor]);

  return null;
};
