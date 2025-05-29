import { calculateZoomLevel } from "@lexical/utils";
import { clamp } from "@plugin/utils";
import type { LexicalEditor } from "lexical";
import type { RefObject } from "react";
import { Direction } from "./constants";
import type { Positioning, UserSelect } from "./types";

const setStartCursor = (
  editor: LexicalEditor,
  direction: number,
  userSelectRef: RefObject<UserSelect>,
) => {
  const editorRootElement = editor.getRootElement();

  const ew = direction === Direction.east || direction === Direction.west;
  const ns = direction === Direction.north || direction === Direction.south;
  const nwse =
    (direction & Direction.north && direction & Direction.west) ||
    (direction & Direction.south && direction & Direction.east);

  const cursorDir = ew ? "ew" : ns ? "ns" : nwse ? "nwse" : "nesw";

  if (editorRootElement !== null) {
    editorRootElement.style.setProperty(
      "cursor",
      `${cursorDir}-resize`,
      "important",
    );
  }
  if (document.body !== null) {
    document.body.style.setProperty(
      "cursor",
      `${cursorDir}-resize`,
      "important",
    );
    userSelectRef.current.value = document.body.style.getPropertyValue(
      "-webkit-user-select",
    );
    userSelectRef.current.priority = document.body.style.getPropertyPriority(
      "-webkit-user-select",
    );
    document.body.style.setProperty("-webkit-user-select", `none`, "important");
  }
};

const setEndCursor = (
  editor: LexicalEditor,
  userSelectRef: RefObject<UserSelect>,
) => {
  const editorRootElement = editor.getRootElement();

  if (editorRootElement !== null) {
    editorRootElement.style.setProperty("cursor", "text");
  }
  if (document.body !== null) {
    document.body.style.setProperty("cursor", "default");
    document.body.style.setProperty(
      "-webkit-user-select",
      userSelectRef.current.value,
      userSelectRef.current.priority,
    );
  }
};

const handlePointerMove =
  (
    editor: LexicalEditor,
    imageRef: RefObject<HTMLElement | null>,
    controlWrapperRef: RefObject<HTMLDivElement | null>,
    positioningRef: RefObject<Positioning>,
    maxWidth?: number,
  ) =>
  (event: PointerEvent) => {
    const editorRootElement = editor.getRootElement();

    // Find max width, accounting for editor padding.
    const maxWidthContainer = maxWidth
      ? maxWidth
      : editorRootElement !== null
        ? editorRootElement.getBoundingClientRect().width - 20
        : 100;
    const maxHeightContainer =
      editorRootElement !== null
        ? editorRootElement.getBoundingClientRect().height - 20
        : 100;

    const minWidth = 100;
    const minHeight = 100;

    const image = imageRef.current;
    const positioning = positioningRef.current;
    const controlWrapper = controlWrapperRef.current;

    const isHorizontal =
      positioning.direction & (Direction.east | Direction.west);
    const isVertical =
      positioning.direction & (Direction.south | Direction.north);

    if (image !== null && controlWrapper !== null && positioning.isResizing) {
      const zoom = calculateZoomLevel(image);

      // Corner cursor
      if (isHorizontal && isVertical) {
        let diff = Math.floor(positioning.startX - event.clientX / zoom);
        diff = positioning.direction & Direction.east ? -diff : diff;

        const width = clamp(
          positioning.startWidth + diff,
          minWidth,
          maxWidthContainer,
        );

        const height = width / positioning.ratio;
        image.style.width = `${width}px`;
        image.style.height = `${height}px`;
        positioning.currentWidth = width;
        positioning.currentHeight = height;
        controlWrapper.style.width = `${width}px`;
        controlWrapper.style.height = `${height}px`;

        return;
      }

      if (isVertical) {
        let diff = Math.floor(positioning.startY - event.clientY / zoom);
        diff = positioning.direction & Direction.south ? -diff : diff;

        const height = clamp(
          positioning.startHeight + diff,
          minHeight,
          maxHeightContainer,
        );

        image.style.height = `${height}px`;
        positioning.currentHeight = height;
        controlWrapper.style.height = `${height}px`;

        return;
      }

      let diff = Math.floor(positioning.startX - event.clientX / zoom);
      diff = positioning.direction & Direction.east ? -diff : diff;

      const width = clamp(
        positioning.startWidth + diff,
        minWidth,
        maxWidthContainer,
      );

      image.style.width = `${width}px`;
      positioning.currentWidth = width;
      controlWrapper.style.width = `${width}px`;
    }
  };

const handlePointerUp =
  (
    editor: LexicalEditor,
    imageRef: RefObject<HTMLElement | null>,
    controlWrapperRef: RefObject<HTMLDivElement | null>,
    positioningRef: RefObject<Positioning>,
    userSelectRef: RefObject<UserSelect>,
    onResizeEnd: (
      width: "inherit" | number,
      height: "inherit" | number,
    ) => void,
    maxWidth?: number,
  ) =>
  () => {
    const image = imageRef.current;
    const positioning = positioningRef.current;
    const controlWrapper = controlWrapperRef.current;
    if (image !== null && controlWrapper !== null && positioning.isResizing) {
      const width = positioning.currentWidth;
      const height = positioning.currentHeight;
      positioning.startWidth = 0;
      positioning.startHeight = 0;
      positioning.ratio = 0;
      positioning.startX = 0;
      positioning.startY = 0;
      positioning.currentWidth = 0;
      positioning.currentHeight = 0;
      positioning.isResizing = false;

      controlWrapper.classList.remove("image-control-wrapper--resizing");

      setEndCursor(editor, userSelectRef);
      onResizeEnd(width, height);

      document.removeEventListener(
        "pointermove",
        handlePointerMove(
          editor,
          imageRef,
          controlWrapperRef,
          positioningRef,
          maxWidth,
        ),
      );
      document.removeEventListener(
        "pointerup",
        handlePointerUp(
          editor,
          imageRef,
          controlWrapperRef,
          positioningRef,
          userSelectRef,
          onResizeEnd,
          maxWidth,
        ),
      );
    }
  };

type PointerDownHandlerParams = {
  editor: LexicalEditor;
  direction: number;
  imageRef: RefObject<HTMLElement | null>;
  controlWrapperRef: RefObject<HTMLDivElement | null>;
  positioningRef: RefObject<Positioning>;
  userSelectRef: RefObject<UserSelect>;
  onResizeStart: () => void;
  onResizeEnd: (width: "inherit" | number, height: "inherit" | number) => void;
  maxWidth?: number;
};

const handlePointerDown =
  (params: PointerDownHandlerParams) =>
  (event: React.PointerEvent<HTMLDivElement>) => {
    const {
      editor,
      imageRef,
      controlWrapperRef,
      positioningRef,
      direction,
      userSelectRef,
      onResizeStart,
      onResizeEnd,
      maxWidth,
    } = params;

    if (!editor.isEditable()) {
      return;
    }

    const image = imageRef.current;
    const controlWrapper = controlWrapperRef.current;

    if (image !== null && controlWrapper !== null) {
      event.preventDefault();
      const { width, height } = image.getBoundingClientRect();
      const zoom = calculateZoomLevel(image);
      const positioning = positioningRef.current;
      positioning.startWidth = width;
      positioning.startHeight = height;
      positioning.ratio = width / height;
      positioning.currentWidth = width;
      positioning.currentHeight = height;
      positioning.startX = event.clientX / zoom;
      positioning.startY = event.clientY / zoom;
      positioning.isResizing = true;
      positioning.direction = direction;

      setStartCursor(editor, direction, userSelectRef);
      onResizeStart();

      controlWrapper.classList.add("image-control-wrapper--resizing");
      image.style.height = `${height}px`;
      image.style.width = `${width}px`;

      document.addEventListener(
        "pointermove",
        handlePointerMove(
          editor,
          imageRef,
          controlWrapperRef,
          positioningRef,
          maxWidth,
        ),
      );
      document.addEventListener(
        "pointerup",
        handlePointerUp(
          editor,
          imageRef,
          controlWrapperRef,
          positioningRef,
          userSelectRef,
          onResizeEnd,
          maxWidth,
        ),
      );
    }
  };

export const onPointerDown =
  (params: Omit<PointerDownHandlerParams, "direction">) =>
  (direction: number) =>
    handlePointerDown({ ...params, direction });
