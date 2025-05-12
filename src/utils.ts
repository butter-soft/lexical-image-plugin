import { CAN_USE_DOM } from "@lexical/utils";

const getDOMSelection = (targetWindow: Window | null): Selection | null =>
  CAN_USE_DOM ? (targetWindow || globalThis.window).getSelection() : null;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export { clamp, getDOMSelection };
