import type { LexicalEditor } from "lexical";
import { useRef, type RefObject } from "react";

import { Direction } from "./constants";
import { onPointerDown } from "./handler";
import type { Positioning } from "./types";

const ImageResizer = ({
  onResizeStart,
  onResizeEnd,
  imageRef,
  maxWidth,
  editor,
}: {
  editor: LexicalEditor;
  imageRef: RefObject<HTMLElement | null>;
  maxWidth?: number;
  onResizeEnd: (width: "inherit" | number, height: "inherit" | number) => void;
  onResizeStart: () => void;
}) => {
  const controlWrapperRef = useRef<HTMLDivElement>(null);
  const userSelect = useRef({
    priority: "",
    value: "default",
  });
  const positioningRef = useRef<Positioning>({
    currentHeight: 0,
    currentWidth: 0,
    direction: 0,
    isResizing: false,
    ratio: 0,
    startHeight: 0,
    startWidth: 0,
    startX: 0,
    startY: 0,
  });

  const handlePointerDown = onPointerDown({
    editor,
    imageRef,
    controlWrapperRef,
    positioningRef,
    userSelectRef: userSelect,
    onResizeStart,
    onResizeEnd,
    maxWidth,
  });

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: imageRef.current?.clientWidth,
        height: imageRef.current?.clientHeight,
      }}
      ref={controlWrapperRef}
    >
      <div
        style={{
          position: "absolute",
          width: "0.5rem",
          height: "0.5rem",
          backgroundColor: "black",
          top: "-0.25rem",
          left: "50%",
          transform: "translateX(-50%)",
          cursor: "ns-resize",
        }}
        onPointerDown={handlePointerDown(Direction.north)}
      />
      <div
        style={{
          position: "absolute",
          width: "0.5rem",
          height: "0.5rem",
          backgroundColor: "black",
          right: "-0.25rem",
          top: "-0.25rem",
          cursor: "nesw-resize",
        }}
        onPointerDown={handlePointerDown(Direction.north | Direction.east)}
      />
      <div
        style={{
          position: "absolute",
          width: "0.5rem",
          height: "0.5rem",
          backgroundColor: "black",
          top: "50%",
          right: "-0.25rem",
          transform: "translateY(-50%)",
          cursor: "ew-resize",
        }}
        onPointerDown={handlePointerDown(Direction.east)}
      />
      <div
        style={{
          position: "absolute",
          width: "0.5rem",
          height: "0.5rem",
          backgroundColor: "black",
          bottom: "-0.25rem",
          right: "-0.25rem",
          cursor: "nwse-resize",
        }}
        onPointerDown={handlePointerDown(Direction.south | Direction.east)}
      />
      <div
        style={{
          position: "absolute",
          width: "0.5rem",
          height: "0.5rem",
          backgroundColor: "black",
          bottom: "-0.25rem",
          left: "50%",
          transform: "translateX(-50%)",
          cursor: "ns-resize",
        }}
        onPointerDown={handlePointerDown(Direction.south)}
      />
      <div
        style={{
          position: "absolute",
          width: "0.5rem",
          height: "0.5rem",
          backgroundColor: "black",
          bottom: "-0.25rem",
          left: "-0.25rem",
          cursor: "nesw-resize",
        }}
        onPointerDown={handlePointerDown(Direction.south | Direction.west)}
      />
      <div
        style={{
          position: "absolute",
          width: "0.5rem",
          height: "0.5rem",
          backgroundColor: "black",
          left: "-0.25rem",
          top: "50%",
          transform: "translateY(-50%)",
          cursor: "ew-resize",
        }}
        onPointerDown={handlePointerDown(Direction.west)}
      />
      <div
        style={{
          position: "absolute",
          width: "0.5rem",
          height: "0.5rem",
          backgroundColor: "black",
          left: "-0.25rem",
          top: "-0.25rem",
          cursor: "nwse-resize",
        }}
        onPointerDown={handlePointerDown(Direction.north | Direction.west)}
      />
    </div>
  );
};

export { ImageResizer };
