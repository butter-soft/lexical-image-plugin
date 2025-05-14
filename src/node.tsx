import * as React from "react";

import { $applyNodeReplacement, DecoratorNode } from "lexical";

import type { ImagePayload, SerializedImageNode } from "@/types";
import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  NodeKey,
} from "lexical";

import { ImageContainer } from "@/components/container";

const $createImageNode = ({
  src,
  alt,
  width,
  height,
  maxWidth = 640,
  key,
}: ImagePayload): ImageNode =>
  $applyNodeReplacement(new ImageNode(src, alt, maxWidth, key, width, height));

const $convertImageElement = (domNode: Node): null | DOMConversionOutput => {
  const img = domNode as HTMLImageElement;

  if (img.src.startsWith("file:///")) {
    return null;
  }
  const { src, alt, width, height } = img;

  return { node: $createImageNode({ src, alt, width, height }) };
};

class ImageNode extends DecoratorNode<React.JSX.Element> {
  __src: string;
  __alt: string;
  __width: "inherit" | number;
  __height: "inherit" | number;
  __maxWidth: number;

  constructor(
    src: string,
    alt: string,
    maxWidth: number,
    key?: NodeKey,
    width?: "inherit" | number,
    height?: "inherit" | number,
  ) {
    super(key);
    this.__src = src;
    this.__alt = alt;
    this.__maxWidth = maxWidth;
    this.__width = width || "inherit";
    this.__height = height || "inherit";
  }

  static override getType(): string {
    return "image";
  }

  static override clone(node: ImageNode): ImageNode {
    return new ImageNode(
      node.__src,
      node.__alt,
      node.__maxWidth,
      node.__key,
      node.__width,
      node.__height,
    );
  }

  static override importDOM(): DOMConversionMap | null {
    return {
      img: (node: Node) => ({
        conversion: () => $convertImageElement(node),
        priority: 0,
      }),
    };
  }

  static override importJSON(serializedNode: SerializedImageNode) {
    const { height, width, maxWidth, src, alt } = serializedNode;
    const node = $createImageNode({
      src,
      alt,
      width,
      height,
      maxWidth,
    });

    return node.updateFromJSON(serializedNode);
  }

  override exportDOM(): DOMExportOutput {
    const element = document.createElement("img");
    element.setAttribute("src", this.__src);
    element.setAttribute("alt", this.__alt);
    element.setAttribute("width", this.__width.toString());
    element.setAttribute("height", this.__height.toString());
    return { element };
  }

  override exportJSON(): SerializedImageNode {
    return {
      src: this.getSrc(),
      alt: this.getAlt(),
      type: "image",
      width: this.__width === "inherit" ? 0 : this.__width,
      height: this.__height === "inherit" ? 0 : this.__height,
      maxWidth: this.__maxWidth,
      version: 1,
    };
  }

  setWidthAndHeight(
    width: "inherit" | number,
    height: "inherit" | number,
  ): void {
    const writable = this.getWritable();
    writable.__width = width;
    writable.__height = height;
  }

  override createDOM(config: EditorConfig): HTMLElement {
    const div = document.createElement("div");

    const theme = config.theme;
    const className = theme.image;

    if (className !== undefined) {
      div.className = className;

      return div;
    }

    // resizer boundary
    div.style.position = "relative";

    return div;
  }

  override updateDOM(): false {
    return false;
  }

  getSrc(): string {
    return this.__src;
  }

  setSrc(newSrc: string): void {
    const writable = this.getWritable();
    writable.__src = newSrc;
  }

  getAlt(): string {
    return this.__alt;
  }

  override decorate(): React.JSX.Element {
    return (
      <React.Suspense fallback={null}>
        <ImageContainer
          src={this.__src}
          alt={this.__alt}
          width={this.__width}
          height={this.__height}
          maxWidth={this.__maxWidth}
          nodeKey={this.getKey()}
          resizable={true}
        />
      </React.Suspense>
    );
  }
}

export { $createImageNode, ImageNode };
