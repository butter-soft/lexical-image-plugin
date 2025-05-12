import * as React from "react";

import { DecoratorNode } from "lexical";

import type { SerializedImageNode } from "@/types";
import type { DOMExportOutput, EditorConfig, NodeKey } from "lexical";

import { ImageContainer } from "@/components/container";
import { importDOM, importJSON } from "@/helper";

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

  static override importDOM = importDOM;
  static override importJSON = importJSON;

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
      alt: this.getAltText(),
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
    const span = document.createElement("span");
    const theme = config.theme;
    const className = theme.image;
    if (className !== undefined) {
      span.className = className;
    }
    return span;
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

  getAltText(): string {
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
          key={this.getKey()}
          resizable={true}
        />
      </React.Suspense>
    );
  }
}

export { ImageNode };
