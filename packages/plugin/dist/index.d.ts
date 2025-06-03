import { DOMConversionMap, DOMExportOutput, DecoratorNode, EditorConfig, LexicalCommand, LexicalEditor, NodeKey, SerializedLexicalNode, Spread } from "lexical";
import * as React from "react";

//#region src/node.d.ts

declare class ImageNode extends DecoratorNode<React.JSX.Element> {
  __src: string;
  __alt: string;
  __width: "inherit" | number;
  __height: "inherit" | number;
  __maxWidth: number;
  constructor(src: string, alt: string, maxWidth: number, key?: NodeKey, width?: "inherit" | number, height?: "inherit" | number);
  static getType(): string;
  static clone(node: ImageNode): ImageNode;
  static importDOM(): DOMConversionMap | null;
  static importJSON(serializedNode: SerializedImageNode): ImageNode;
  exportDOM(): DOMExportOutput;
  exportJSON(): SerializedImageNode;
  setWidthAndHeight(width: "inherit" | number, height: "inherit" | number): void;
  createDOM(config: EditorConfig): HTMLElement;
  updateDOM(): false;
  getSrc(): string;
  setSrc(newSrc: string): void;
  getAlt(): string;
  decorate(): React.JSX.Element;
}
//#endregion
//#region src/types.d.ts
type PartialPick<T, F extends keyof T> = Omit<T, F> & Partial<Pick<T, F>>;
type ImageProps = {
  src: string;
  alt: string;
  key: NodeKey;
  width: "inherit" | number;
  height: "inherit" | number;
  maxWidth: number;
  resizable: boolean;
};
type ImageNodeParams = Omit<PartialPick<ImageProps, "key" | "width" | "height" | "maxWidth">, "resizable">;
type ImagePayload = Omit<PartialPick<ImageProps, "key" | "width" | "height" | "maxWidth">, "resizable"> & {
  caption?: LexicalEditor;
  showCaption?: boolean;
  captionsEnabled?: boolean;
};
type InsertImagePayload = Readonly<ImagePayload>;
type SerializedImageNode = Spread<PartialPick<Omit<ImageProps, "key" | "resizable">, "width" | "height" | "maxWidth"> & {
  maxWidth?: number;
}, SerializedLexicalNode>;
type SwitchImageData = {
  node: ImageNode;
  storageSrc: string;
};
//#endregion
//#region src/commands.d.ts
declare const INSERT_IMAGE_COMMAND: LexicalCommand<InsertImagePayload>;
declare const SWITCH_IMAGES_COMMAND: LexicalCommand<SwitchImageData[]>;
declare const RIGHT_CLICK_IMAGE_COMMAND: LexicalCommand<MouseEvent>;
//#endregion
//#region src/plugin.d.ts
declare const ImagePlugin: () => null;
//# sourceMappingURL=plugin.d.ts.map

//#endregion
export { INSERT_IMAGE_COMMAND, ImageNode, ImageNodeParams, ImagePayload, ImagePlugin, ImageProps, InsertImagePayload, RIGHT_CLICK_IMAGE_COMMAND, SWITCH_IMAGES_COMMAND, SerializedImageNode, SwitchImageData };
//# sourceMappingURL=index.d.ts.map