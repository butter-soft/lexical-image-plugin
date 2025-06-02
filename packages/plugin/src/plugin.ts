import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { DRAG_DROP_PASTE } from "@lexical/rich-text";
import { mergeRegister } from "@lexical/utils";
import { INSERT_IMAGE_COMMAND, SWITCH_IMAGES_COMMAND } from "@plugin/commands";
import { ImageNode } from "@plugin/node";
import type { InsertImagePayload, SwitchImageData } from "@plugin/types";
import {
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  DRAGOVER_COMMAND,
  DRAGSTART_COMMAND,
  DROP_COMMAND,
} from "lexical";
import { useEffect } from "react";
import {
  $onDragDropPaste,
  $onDragOver,
  $onDragStart,
  $onDrop,
  $onInsert,
  $onSwitch,
} from "./handler";

export const ImagePlugin = () => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([ImageNode])) {
      throw new Error("ImagePlugin: ImageNode is not registered on editor");
    }

    return mergeRegister(
      editor.registerCommand<InsertImagePayload>(
        INSERT_IMAGE_COMMAND,
        $onInsert,
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand<SwitchImageData[]>(
        SWITCH_IMAGES_COMMAND,
        $onSwitch,
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand<DragEvent>(
        DRAGSTART_COMMAND,
        $onDragStart,
        COMMAND_PRIORITY_HIGH,
      ),
      editor.registerCommand<DragEvent>(
        DRAGOVER_COMMAND,
        $onDragOver,
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand<DragEvent>(
        DROP_COMMAND,
        $onDrop(editor),
        COMMAND_PRIORITY_HIGH,
      ),
      editor.registerCommand<File[]>(
        DRAG_DROP_PASTE,
        $onDragDropPaste(editor),
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [editor]);

  return null;
};
