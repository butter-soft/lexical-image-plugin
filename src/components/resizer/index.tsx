import { useRef } from "react";

import type { LexicalEditor } from "lexical";
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
  imageRef: { current: null | HTMLElement };
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
    <div ref={controlWrapperRef}>
      <div
        className="controller north"
        onPointerDown={handlePointerDown(Direction.north)}
      />
      <div
        className="controller northeast"
        onPointerDown={handlePointerDown(Direction.north | Direction.east)}
      />
      <div
        className="controller east"
        onPointerDown={handlePointerDown(Direction.east)}
      />
      <div
        className="controller southeast"
        onPointerDown={handlePointerDown(Direction.south | Direction.east)}
      />
      <div
        className="controller south"
        onPointerDown={handlePointerDown(Direction.south)}
      />
      <div
        className="controller southwest"
        onPointerDown={handlePointerDown(Direction.south | Direction.west)}
      />
      <div
        className="controller west"
        onPointerDown={handlePointerDown(Direction.west)}
      />
      <div
        className="controller northwest"
        onPointerDown={handlePointerDown(Direction.north | Direction.west)}
      />
    </div>
  );
};

export { ImageResizer };
