import type { ImageNode } from "@/node";
import type {
  LexicalEditor,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from "lexical";

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

type ImageNodeParams = Omit<
  PartialPick<ImageProps, "key" | "width" | "height" | "maxWidth">,
  "resizable"
>;

type ImagePayload = Omit<
  PartialPick<ImageProps, "key" | "width" | "height" | "maxWidth">,
  "resizable"
> & {
  caption?: LexicalEditor;
  showCaption?: boolean;
  captionsEnabled?: boolean;
};

type InsertImagePayload = Readonly<ImagePayload>;

type SerializedImageNode = Spread<
  PartialPick<
    Omit<ImageProps, "key" | "resizable">,
    "width" | "height" | "maxWidth"
  > & {
    maxWidth?: number;
  },
  SerializedLexicalNode
>;

type SwitchImageData = {
  node: ImageNode;
  storageSrc: string;
};

export type {
  ImageNodeParams,
  ImagePayload,
  ImageProps,
  InsertImagePayload,
  SerializedImageNode,
  SwitchImageData,
};
