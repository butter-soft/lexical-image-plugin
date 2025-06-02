export {};

declare global {
  interface DragEvent {
    rangeOffset?: number;
    rangeParent?: Node;
  }
}
