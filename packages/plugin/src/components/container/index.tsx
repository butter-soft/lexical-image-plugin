import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLexicalEditable } from "@lexical/react/useLexicalEditable";
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";
import { mergeRegister } from "@lexical/utils";
import { RIGHT_CLICK_IMAGE_COMMAND } from "@plugin/commands";
import { ImageResizer } from "@plugin/components/resizer";
import { $isImageNode } from "@plugin/helper";
import {
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  $isRangeSelection,
  $setSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  DRAGSTART_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
  SELECTION_CHANGE_COMMAND,
  type BaseSelection,
  type LexicalEditor,
  type NodeKey,
} from "lexical";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { BrokenImage } from "./broken";
import { LazyImage } from "./lazy";

const ImageContainer = ({
  src,
  alt,
  nodeKey,
  width,
  height,
  maxWidth,
  resizable,
}: {
  src: string;
  alt: string;
  nodeKey: NodeKey;
  width: "inherit" | number;
  height: "inherit" | number;
  maxWidth: number;
  resizable: boolean;
}) => {
  const [editor] = useLexicalComposerContext();
  const [isSelected, setSelected, clearSelection] =
    useLexicalNodeSelection(nodeKey);
  const isEditable = useLexicalEditable();

  const imageRef = useRef<null | HTMLImageElement>(null);
  const activeEditorRef = useRef<LexicalEditor | null>(null);

  const [isLoadError, setIsLoadError] = useState<boolean>(false);
  const [isResizing, setIsResizing] = useState<boolean>(false);

  const [selection, setSelection] = useState<BaseSelection | null>(null);

  const $onEnter = useCallback(
    (event: KeyboardEvent) => {
      const latestSelection = $getSelection();

      if (
        isSelected &&
        $isNodeSelection(latestSelection) &&
        latestSelection.getNodes().length === 1
      ) {
        return true;
      }

      return false;
    },
    [isSelected],
  );

  const $onEscape = useCallback(
    (event: KeyboardEvent) => {
      if (isSelected) {
        $setSelection(null);
        editor.update(() => {
          setSelected(true);
          const parentRootElement = editor.getRootElement();
          if (parentRootElement !== null) {
            parentRootElement.focus();
          }
        });
        return true;
      }
      return false;
    },
    [editor, setSelected],
  );

  const onClick = useCallback(
    (payload: MouseEvent) => {
      const event = payload;

      if (isResizing) {
        return true;
      }
      if (event.target === imageRef.current) {
        if (event.shiftKey) {
          setSelected(!isSelected);
        } else {
          clearSelection();
          setSelected(true);
        }
        return true;
      }

      return false;
    },
    [isResizing, isSelected, setSelected, clearSelection],
  );

  const onRightClick = useCallback(
    (event: MouseEvent): void => {
      editor.getEditorState().read(() => {
        const latestSelection = $getSelection();
        const domElement = event.target as HTMLElement;
        if (
          domElement.tagName === "IMG" &&
          $isRangeSelection(latestSelection) &&
          latestSelection.getNodes().length === 1
        ) {
          editor.dispatchCommand(
            RIGHT_CLICK_IMAGE_COMMAND,
            event as MouseEvent,
          );
        }
      });
    },
    [editor],
  );

  useEffect(() => {
    const rootElement = editor.getRootElement();
    const unregister = mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        const updatedSelection = editorState.read(() => $getSelection());
        if ($isNodeSelection(updatedSelection)) {
          setSelection(updatedSelection);
        } else {
          setSelection(null);
        }
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        (_, activeEditor) => {
          activeEditorRef.current = activeEditor;
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand<MouseEvent>(
        CLICK_COMMAND,
        onClick,
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand<MouseEvent>(
        RIGHT_CLICK_IMAGE_COMMAND,
        onClick,
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        DRAGSTART_COMMAND,
        (event) => {
          if (event.target === imageRef.current) {
            // TODO This is just a temporary workaround for FF to behave like other browsers.
            // Ideally, this handles drag & drop too (and all browsers).
            event.preventDefault();
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(KEY_ENTER_COMMAND, $onEnter, COMMAND_PRIORITY_LOW),
      editor.registerCommand(
        KEY_ESCAPE_COMMAND,
        $onEscape,
        COMMAND_PRIORITY_LOW,
      ),
    );

    rootElement?.addEventListener("contextmenu", onRightClick);

    return () => {
      unregister();
      rootElement?.removeEventListener("contextmenu", onRightClick);
    };
  }, [
    clearSelection,
    editor,
    isResizing,
    isSelected,
    nodeKey,
    $onEnter,
    $onEscape,
    onClick,
    onRightClick,
    setSelected,
  ]);

  const onResizeEnd = (
    nextWidth: "inherit" | number,
    nextHeight: "inherit" | number,
  ) => {
    // Delay hiding the resize bars for click case
    setTimeout(() => {
      setIsResizing(false);
    }, 200);

    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isImageNode(node)) {
        node.setWidthAndHeight(nextWidth, nextHeight);
      }
    });
  };

  const onResizeStart = () => {
    setIsResizing(true);
  };

  const draggable = isSelected && $isNodeSelection(selection) && !isResizing;
  const isFocused = (isSelected || isResizing) && isEditable;

  return (
    <Suspense fallback={null}>
      <div draggable={draggable}>
        {isLoadError ? (
          <BrokenImage />
        ) : (
          <LazyImage
            src={src}
            alt={alt}
            imageRef={imageRef}
            width={width}
            height={height}
            maxWidth={maxWidth}
            onError={() => setIsLoadError(true)}
            isFocused={isFocused}
          />
        )}
        {resizable && $isNodeSelection(selection) && isFocused && (
          <ImageResizer
            editor={editor}
            imageRef={imageRef}
            maxWidth={maxWidth}
            onResizeStart={onResizeStart}
            onResizeEnd={onResizeEnd}
          />
        )}
      </div>
    </Suspense>
  );
};

export { ImageContainer };
