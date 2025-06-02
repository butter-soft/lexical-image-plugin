import { CAN_USE_DOM, isHTMLElement } from "@lexical/utils";
import type { InsertImagePayload } from "@plugin/types";
import { getDOMSelectionFromTarget } from "lexical";

export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const getDOMSelection = (
  targetWindow: Window | null,
): Selection | null =>
  CAN_USE_DOM ? (targetWindow || globalThis.window).getSelection() : null;

/**
 * `ContentEditable` must have `.editor-root` as `class`
 */
export function canDropImage(event: DragEvent): boolean {
  const target = event.target;
  return !!(
    isHTMLElement(target) &&
    !target.closest("code, div.image-node") &&
    isHTMLElement(target.parentElement) &&
    target.parentElement.closest("div.editor-root")
  );
}
export const getDragImageData = (
  event: DragEvent,
): InsertImagePayload | null => {
  const dragData = event.dataTransfer?.getData("application/x-lexical-drag");

  if (!dragData) {
    return null;
  }

  const { type, data } = JSON.parse(dragData);

  if (type !== "image") {
    return null;
  }

  return data;
};

export const getDragSelection = (
  event: DragEvent,
): Range | null | undefined => {
  const domSelection = getDOMSelectionFromTarget(event.target);

  if (document.caretPositionFromPoint) {
    const range = document.createRange();
    const caretPosition = document.caretPositionFromPoint(
      event.clientX,
      event.clientY,
    );

    if (!caretPosition) {
      throw Error(`Cannot get the selection when dragging`);
    }

    range.setStart(caretPosition.offsetNode, caretPosition.offset);
    range.setEnd(caretPosition.offsetNode, caretPosition.offset);

    return range;
  }

  // Safari / Webkit explicit
  if (document.caretRangeFromPoint) {
    return document.caretRangeFromPoint(event.clientX, event.clientY);
  }

  if (event.rangeParent && domSelection !== null) {
    domSelection.collapse(event.rangeParent, event.rangeOffset || 0);

    return domSelection.getRangeAt(0);
  }

  throw Error(`Cannot get the selection when dragging`);
};
