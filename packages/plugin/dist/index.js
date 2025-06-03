import { $applyNodeReplacement, $createParagraphNode, $createRangeSelection, $getNodeByKey, $getSelection, $insertNodes, $isNodeSelection, $isRangeSelection, $isRootOrShadowRoot, $setSelection, CLICK_COMMAND, COMMAND_PRIORITY_CRITICAL, COMMAND_PRIORITY_EDITOR, COMMAND_PRIORITY_HIGH, COMMAND_PRIORITY_LOW, DRAGOVER_COMMAND, DRAGSTART_COMMAND, DROP_COMMAND, DecoratorNode, KEY_ENTER_COMMAND, KEY_ESCAPE_COMMAND, SELECTION_CHANGE_COMMAND, createCommand, getDOMSelectionFromTarget } from "lexical";
import * as React from "react";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLexicalEditable } from "@lexical/react/useLexicalEditable";
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";
import { $wrapNodeInElement, calculateZoomLevel, isHTMLElement, isMimeType, mediaFileReader, mergeRegister } from "@lexical/utils";
import { jsx, jsxs } from "react/jsx-runtime";
import { DRAG_DROP_PASTE } from "@lexical/rich-text";

//#region src/commands.ts
const INSERT_IMAGE_COMMAND = createCommand("INSERT_IMAGE_COMMAND");
const SWITCH_IMAGES_COMMAND = createCommand("SWITCH_IMAGES_COMMAND");
const RIGHT_CLICK_IMAGE_COMMAND = createCommand("RIGHT_CLICK_IMAGE_COMMAND");

//#endregion
//#region src/components/resizer/constants.ts
const Direction = {
	east: 1,
	north: 8,
	south: 2,
	west: 4
};

//#endregion
//#region src/utils.ts
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
/**
* `ContentEditable` must have `.editor-root` as `class`
*/
function canDropImage(event) {
	const target = event.target;
	return !!(isHTMLElement(target) && !target.closest("code, div.image-node") && isHTMLElement(target.parentElement) && target.parentElement.closest("div.editor-root"));
}
const getDragImageData = (event) => {
	const dragData = event.dataTransfer?.getData("application/x-lexical-drag");
	if (!dragData) return null;
	const { type, data } = JSON.parse(dragData);
	if (type !== "image") return null;
	return data;
};
const getDragSelection = (event) => {
	const domSelection = getDOMSelectionFromTarget(event.target);
	if (document.caretPositionFromPoint) {
		const range = document.createRange();
		const caretPosition = document.caretPositionFromPoint(event.clientX, event.clientY);
		if (!caretPosition) throw Error(`Cannot get the selection when dragging`);
		range.setStart(caretPosition.offsetNode, caretPosition.offset);
		range.setEnd(caretPosition.offsetNode, caretPosition.offset);
		return range;
	}
	if (document.caretRangeFromPoint) return document.caretRangeFromPoint(event.clientX, event.clientY);
	if (event.rangeParent && domSelection !== null) {
		domSelection.collapse(event.rangeParent, event.rangeOffset || 0);
		return domSelection.getRangeAt(0);
	}
	throw Error(`Cannot get the selection when dragging`);
};

//#endregion
//#region src/components/resizer/handler.ts
const setStartCursor = (editor, direction, userSelectRef) => {
	const editorRootElement = editor.getRootElement();
	const ew = direction === Direction.east || direction === Direction.west;
	const ns = direction === Direction.north || direction === Direction.south;
	const nwse = direction & Direction.north && direction & Direction.west || direction & Direction.south && direction & Direction.east;
	const cursorDir = ew ? "ew" : ns ? "ns" : nwse ? "nwse" : "nesw";
	if (editorRootElement !== null) editorRootElement.style.setProperty("cursor", `${cursorDir}-resize`, "important");
	if (document.body !== null) {
		document.body.style.setProperty("cursor", `${cursorDir}-resize`, "important");
		userSelectRef.current.value = document.body.style.getPropertyValue("-webkit-user-select");
		userSelectRef.current.priority = document.body.style.getPropertyPriority("-webkit-user-select");
		document.body.style.setProperty("-webkit-user-select", `none`, "important");
	}
};
const setEndCursor = (editor, userSelectRef) => {
	const editorRootElement = editor.getRootElement();
	if (editorRootElement !== null) editorRootElement.style.setProperty("cursor", "text");
	if (document.body !== null) {
		document.body.style.setProperty("cursor", "default");
		document.body.style.setProperty("-webkit-user-select", userSelectRef.current.value, userSelectRef.current.priority);
	}
};
const handlePointerMove = (editor, imageRef, controlWrapperRef, positioningRef, maxWidth) => (event) => {
	const editorRootElement = editor.getRootElement();
	const maxWidthContainer = maxWidth ? maxWidth : editorRootElement !== null ? editorRootElement.getBoundingClientRect().width - 20 : 100;
	const maxHeightContainer = editorRootElement !== null ? editorRootElement.getBoundingClientRect().height - 20 : 100;
	const minWidth = 100;
	const minHeight = 100;
	const image = imageRef.current;
	const positioning = positioningRef.current;
	const controlWrapper = controlWrapperRef.current;
	const isHorizontal = positioning.direction & (Direction.east | Direction.west);
	const isVertical = positioning.direction & (Direction.south | Direction.north);
	if (image !== null && controlWrapper !== null && positioning.isResizing) {
		const zoom = calculateZoomLevel(image);
		if (isHorizontal && isVertical) {
			let diff$1 = Math.floor(positioning.startX - event.clientX / zoom);
			diff$1 = positioning.direction & Direction.east ? -diff$1 : diff$1;
			const width$1 = clamp(positioning.startWidth + diff$1, minWidth, maxWidthContainer);
			const height = width$1 / positioning.ratio;
			image.style.width = `${width$1}px`;
			image.style.height = `${height}px`;
			positioning.currentWidth = width$1;
			positioning.currentHeight = height;
			controlWrapper.style.width = `${width$1}px`;
			controlWrapper.style.height = `${height}px`;
			return;
		}
		if (isVertical) {
			let diff$1 = Math.floor(positioning.startY - event.clientY / zoom);
			diff$1 = positioning.direction & Direction.south ? -diff$1 : diff$1;
			const height = clamp(positioning.startHeight + diff$1, minHeight, maxHeightContainer);
			image.style.height = `${height}px`;
			positioning.currentHeight = height;
			controlWrapper.style.height = `${height}px`;
			return;
		}
		let diff = Math.floor(positioning.startX - event.clientX / zoom);
		diff = positioning.direction & Direction.east ? -diff : diff;
		const width = clamp(positioning.startWidth + diff, minWidth, maxWidthContainer);
		image.style.width = `${width}px`;
		positioning.currentWidth = width;
		controlWrapper.style.width = `${width}px`;
	}
};
const handlePointerUp = (editor, imageRef, controlWrapperRef, positioningRef, userSelectRef, onResizeEnd, maxWidth) => () => {
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
		document.removeEventListener("pointermove", handlePointerMove(editor, imageRef, controlWrapperRef, positioningRef, maxWidth));
		document.removeEventListener("pointerup", handlePointerUp(editor, imageRef, controlWrapperRef, positioningRef, userSelectRef, onResizeEnd, maxWidth));
	}
};
const handlePointerDown = (params) => (event) => {
	const { editor, imageRef, controlWrapperRef, positioningRef, direction, userSelectRef, onResizeStart, onResizeEnd, maxWidth } = params;
	if (!editor.isEditable()) return;
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
		document.addEventListener("pointermove", handlePointerMove(editor, imageRef, controlWrapperRef, positioningRef, maxWidth));
		document.addEventListener("pointerup", handlePointerUp(editor, imageRef, controlWrapperRef, positioningRef, userSelectRef, onResizeEnd, maxWidth));
	}
};
const onPointerDown = (params) => (direction) => handlePointerDown({
	...params,
	direction
});

//#endregion
//#region src/components/resizer/index.tsx
const ImageResizer = ({ onResizeStart, onResizeEnd, imageRef, maxWidth, editor }) => {
	const controlWrapperRef = useRef(null);
	const userSelect = useRef({
		priority: "",
		value: "default"
	});
	const positioningRef = useRef({
		currentHeight: 0,
		currentWidth: 0,
		direction: 0,
		isResizing: false,
		ratio: 0,
		startHeight: 0,
		startWidth: 0,
		startX: 0,
		startY: 0
	});
	const handlePointerDown$1 = onPointerDown({
		editor,
		imageRef,
		controlWrapperRef,
		positioningRef,
		userSelectRef: userSelect,
		onResizeStart,
		onResizeEnd,
		maxWidth
	});
	return /* @__PURE__ */ jsxs("div", {
		style: {
			position: "absolute",
			top: 0,
			left: 0,
			width: imageRef.current?.clientWidth,
			height: imageRef.current?.clientHeight
		},
		ref: controlWrapperRef,
		children: [
			/* @__PURE__ */ jsx("div", {
				style: {
					position: "absolute",
					width: "0.5rem",
					height: "0.5rem",
					backgroundColor: "black",
					top: "-0.25rem",
					left: "50%",
					transform: "translateX(-50%)",
					cursor: "ns-resize"
				},
				onPointerDown: handlePointerDown$1(Direction.north)
			}),
			/* @__PURE__ */ jsx("div", {
				style: {
					position: "absolute",
					width: "0.5rem",
					height: "0.5rem",
					backgroundColor: "black",
					right: "-0.25rem",
					top: "-0.25rem",
					cursor: "nesw-resize"
				},
				onPointerDown: handlePointerDown$1(Direction.north | Direction.east)
			}),
			/* @__PURE__ */ jsx("div", {
				style: {
					position: "absolute",
					width: "0.5rem",
					height: "0.5rem",
					backgroundColor: "black",
					top: "50%",
					right: "-0.25rem",
					transform: "translateY(-50%)",
					cursor: "ew-resize"
				},
				onPointerDown: handlePointerDown$1(Direction.east)
			}),
			/* @__PURE__ */ jsx("div", {
				style: {
					position: "absolute",
					width: "0.5rem",
					height: "0.5rem",
					backgroundColor: "black",
					bottom: "-0.25rem",
					right: "-0.25rem",
					cursor: "nwse-resize"
				},
				onPointerDown: handlePointerDown$1(Direction.south | Direction.east)
			}),
			/* @__PURE__ */ jsx("div", {
				style: {
					position: "absolute",
					width: "0.5rem",
					height: "0.5rem",
					backgroundColor: "black",
					bottom: "-0.25rem",
					left: "50%",
					transform: "translateX(-50%)",
					cursor: "ns-resize"
				},
				onPointerDown: handlePointerDown$1(Direction.south)
			}),
			/* @__PURE__ */ jsx("div", {
				style: {
					position: "absolute",
					width: "0.5rem",
					height: "0.5rem",
					backgroundColor: "black",
					bottom: "-0.25rem",
					left: "-0.25rem",
					cursor: "nesw-resize"
				},
				onPointerDown: handlePointerDown$1(Direction.south | Direction.west)
			}),
			/* @__PURE__ */ jsx("div", {
				style: {
					position: "absolute",
					width: "0.5rem",
					height: "0.5rem",
					backgroundColor: "black",
					left: "-0.25rem",
					top: "50%",
					transform: "translateY(-50%)",
					cursor: "ew-resize"
				},
				onPointerDown: handlePointerDown$1(Direction.west)
			}),
			/* @__PURE__ */ jsx("div", {
				style: {
					position: "absolute",
					width: "0.5rem",
					height: "0.5rem",
					backgroundColor: "black",
					left: "-0.25rem",
					top: "-0.25rem",
					cursor: "nwse-resize"
				},
				onPointerDown: handlePointerDown$1(Direction.north | Direction.west)
			})
		]
	});
};

//#endregion
//#region src/helper.ts
const $isImageNode = (node) => node?.getType() === "image";
const $getImageNodeInSelection = () => {
	const selection = $getSelection();
	if (!$isNodeSelection(selection)) return null;
	const nodes = selection.getNodes();
	const node = nodes[0];
	return $isImageNode(node) ? node : null;
};

//#endregion
//#region src/constants.ts
const BROKEN_IMAGE = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWltYWdlLW9mZiI+PGxpbmUgeDE9IjIiIHgyPSIyMiIgeTE9IjIiIHkyPSIyMiIvPjxwYXRoIGQ9Ik0xMC40MSAxMC40MWEyIDIgMCAxIDEtMi44My0yLjgzIi8+PGxpbmUgeDE9IjEzLjUiIHgyPSI2IiB5MT0iMTMuNSIgeTI9IjIxIi8+PGxpbmUgeDE9IjE4IiB4Mj0iMjEiIHkxPSIxMiIgeTI9IjE1Ii8+PHBhdGggZD0iTTMuNTkgMy41OUExLjk5IDEuOTkgMCAwIDAgMyA1djE0YTIgMiAwIDAgMCAyIDJoMTRjLjU1IDAgMS4wNTItLjIyIDEuNDEtLjU5Ii8+PHBhdGggZD0iTTIxIDE1VjVhMiAyIDAgMCAwLTItMkg5Ii8+PC9zdmc+";
const TRANSPARENT_IMAGE = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
const ACCEPTABLE_IMAGE_TYPES = [
	"image/jpeg",
	"image/jpg",
	"image/png",
	"image/gif"
];

//#endregion
//#region src/components/container/broken.tsx
const BrokenImage = () => {
	return /* @__PURE__ */ jsx("img", {
		src: BROKEN_IMAGE,
		style: {
			height: 200,
			opacity: .2,
			width: 200
		},
		draggable: "false"
	});
};

//#endregion
//#region src/components/container/hooks.ts
const imageCache = new Map();
const useSuspenseImage = (src) => {
	let cached = imageCache.get(src);
	if (typeof cached === "boolean") return cached;
	if (!cached) {
		cached = new Promise((resolve) => {
			const img$1 = new Image();
			img$1.src = src;
			img$1.onload = () => resolve(false);
			img$1.onerror = () => resolve(true);
		}).then((hasError) => {
			imageCache.set(src, hasError);
			return hasError;
		});
		imageCache.set(src, cached);
		throw cached;
	}
	throw cached;
};

//#endregion
//#region src/components/container/lazy.tsx
const isSVG = (src) => src.toLowerCase().endsWith(".svg");
const calculateStyles = (width, height, maxWidth, isSVGImage, isFocused, dimensions) => {
	if (!isSVGImage) return {
		height,
		maxWidth,
		width,
		boxShadow: isFocused ? "0 0 0 1px black" : void 0
	};
	const naturalWidth = dimensions?.width || 200;
	const naturalHeight = dimensions?.height || 200;
	let finalWidth = naturalWidth;
	let finalHeight = naturalHeight;
	if (finalWidth > maxWidth) {
		const scale = maxWidth / finalWidth;
		finalWidth = maxWidth;
		finalHeight = Math.round(finalHeight * scale);
	}
	const maxHeight = 500;
	if (finalHeight > maxHeight) {
		const scale = maxHeight / finalHeight;
		finalHeight = maxHeight;
		finalWidth = Math.round(finalWidth * scale);
	}
	return {
		height: finalHeight,
		maxWidth,
		width: finalWidth,
		boxShadow: isFocused ? "0 0 0 1px black" : void 0
	};
};
const LazyImage = ({ src, alt, imageRef, onError, width, height, maxWidth, isFocused, className }) => {
	const [dimensions, setDimensions] = useState();
	const isSVGImage = isSVG(src);
	useEffect(() => {
		if (imageRef.current && isSVGImage) {
			const { naturalWidth, naturalHeight } = imageRef.current;
			setDimensions({
				height: naturalHeight,
				width: naturalWidth
			});
		}
	}, [imageRef, isSVGImage]);
	const hasError = useSuspenseImage(src);
	useEffect(() => {
		if (hasError) onError();
	}, [hasError, onError]);
	if (hasError) return /* @__PURE__ */ jsx(BrokenImage, {});
	const style = calculateStyles(width, height, maxWidth, isSVGImage, isFocused, dimensions);
	return /* @__PURE__ */ jsx("img", {
		className,
		src,
		alt,
		ref: imageRef,
		onError,
		style,
		draggable: "false",
		onLoad: (e) => {
			if (isSVGImage) {
				const { naturalWidth: width$1, naturalHeight: height$1 } = e.currentTarget;
				setDimensions({
					width: width$1,
					height: height$1
				});
			}
		}
	});
};

//#endregion
//#region src/components/container/index.tsx
const ImageContainer = ({ src, alt, nodeKey, width, height, maxWidth, resizable }) => {
	const [editor] = useLexicalComposerContext();
	const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);
	const isEditable = useLexicalEditable();
	const imageRef = useRef(null);
	const activeEditorRef = useRef(null);
	const [isLoadError, setIsLoadError] = useState(false);
	const [isResizing, setIsResizing] = useState(false);
	const [selection, setSelection] = useState(null);
	const $onEnter = useCallback((_event) => {
		const latestSelection = $getSelection();
		if (isSelected && $isNodeSelection(latestSelection) && latestSelection.getNodes().length === 1) return true;
		return false;
	}, [isSelected]);
	const $onEscape = useCallback((_event) => {
		if (isSelected) {
			$setSelection(null);
			editor.update(() => {
				setSelected(true);
				const parentRootElement = editor.getRootElement();
				if (parentRootElement !== null) parentRootElement.focus();
			});
			return true;
		}
		return false;
	}, [editor, setSelected]);
	const onClick = useCallback((payload) => {
		const event = payload;
		if (isResizing) return true;
		if (event.target === imageRef.current) {
			if (event.shiftKey) setSelected(!isSelected);
			else {
				clearSelection();
				setSelected(true);
			}
			return true;
		}
		return false;
	}, [
		isResizing,
		isSelected,
		setSelected,
		clearSelection
	]);
	const onRightClick = useCallback((event) => {
		editor.getEditorState().read(() => {
			const latestSelection = $getSelection();
			const domElement = event.target;
			if (domElement.tagName === "IMG" && $isRangeSelection(latestSelection) && latestSelection.getNodes().length === 1) editor.dispatchCommand(RIGHT_CLICK_IMAGE_COMMAND, event);
		});
	}, [editor]);
	useEffect(() => {
		const rootElement = editor.getRootElement();
		const unregister = mergeRegister(editor.registerUpdateListener(({ editorState }) => {
			const updatedSelection = editorState.read(() => $getSelection());
			if ($isNodeSelection(updatedSelection)) setSelection(updatedSelection);
			else setSelection(null);
		}), editor.registerCommand(SELECTION_CHANGE_COMMAND, (_, activeEditor) => {
			activeEditorRef.current = activeEditor;
			return false;
		}, COMMAND_PRIORITY_LOW), editor.registerCommand(CLICK_COMMAND, onClick, COMMAND_PRIORITY_LOW), editor.registerCommand(RIGHT_CLICK_IMAGE_COMMAND, onClick, COMMAND_PRIORITY_LOW), editor.registerCommand(DRAGSTART_COMMAND, (event) => {
			if (event.target === imageRef.current) {
				event.preventDefault();
				return true;
			}
			return false;
		}, COMMAND_PRIORITY_LOW), editor.registerCommand(KEY_ENTER_COMMAND, $onEnter, COMMAND_PRIORITY_LOW), editor.registerCommand(KEY_ESCAPE_COMMAND, $onEscape, COMMAND_PRIORITY_LOW));
		rootElement?.addEventListener("contextmenu", onRightClick);
		return () => {
			unregister();
			rootElement?.removeEventListener("contextmenu", onRightClick);
		};
	}, [
		clearSelection,
		editor,
		isResizing,
		isSelected,
		nodeKey,
		$onEnter,
		$onEscape,
		onClick,
		onRightClick,
		setSelected
	]);
	const onResizeEnd = (nextWidth, nextHeight) => {
		setTimeout(() => {
			setIsResizing(false);
		}, 200);
		editor.update(() => {
			const node = $getNodeByKey(nodeKey);
			if ($isImageNode(node)) node.setWidthAndHeight(nextWidth, nextHeight);
		});
	};
	const onResizeStart = () => {
		setIsResizing(true);
	};
	const draggable = isSelected && $isNodeSelection(selection) && !isResizing;
	const isFocused = (isSelected || isResizing) && isEditable;
	return /* @__PURE__ */ jsx(Suspense, {
		fallback: null,
		children: /* @__PURE__ */ jsxs("div", {
			draggable,
			children: [isLoadError ? /* @__PURE__ */ jsx(BrokenImage, {}) : /* @__PURE__ */ jsx(LazyImage, {
				src,
				alt,
				imageRef,
				width,
				height,
				maxWidth,
				onError: () => setIsLoadError(true),
				isFocused
			}), resizable && $isNodeSelection(selection) && isFocused && /* @__PURE__ */ jsx(ImageResizer, {
				editor,
				imageRef,
				maxWidth,
				onResizeStart,
				onResizeEnd
			})]
		})
	});
};

//#endregion
//#region src/node.tsx
const $createImageNode = ({ src, alt, width, height, maxWidth = 640, key }) => $applyNodeReplacement(new ImageNode(src, alt, maxWidth, key, width, height));
const $convertImageElement = (domNode) => {
	const img$1 = domNode;
	if (img$1.src.startsWith("file:///")) return null;
	const { src, alt, width, height } = img$1;
	return { node: $createImageNode({
		src,
		alt,
		width,
		height
	}) };
};
var ImageNode = class ImageNode extends DecoratorNode {
	__src;
	__alt;
	__width;
	__height;
	__maxWidth;
	constructor(src, alt, maxWidth, key, width, height) {
		super(key);
		this.__src = src;
		this.__alt = alt;
		this.__maxWidth = maxWidth;
		this.__width = width || "inherit";
		this.__height = height || "inherit";
	}
	static getType() {
		return "image";
	}
	static clone(node) {
		return new ImageNode(node.__src, node.__alt, node.__maxWidth, node.__key, node.__width, node.__height);
	}
	static importDOM() {
		return { img: (node) => ({
			conversion: () => $convertImageElement(node),
			priority: 0
		}) };
	}
	static importJSON(serializedNode) {
		const { height, width, maxWidth, src, alt } = serializedNode;
		const node = $createImageNode({
			src,
			alt,
			width,
			height,
			maxWidth
		});
		return node.updateFromJSON(serializedNode);
	}
	exportDOM() {
		const element = document.createElement("img");
		element.setAttribute("src", this.__src);
		element.setAttribute("alt", this.__alt);
		element.setAttribute("width", this.__width.toString());
		element.setAttribute("height", this.__height.toString());
		return { element };
	}
	exportJSON() {
		return {
			src: this.getSrc(),
			alt: this.getAlt(),
			type: "image",
			width: this.__width === "inherit" ? 0 : this.__width,
			height: this.__height === "inherit" ? 0 : this.__height,
			maxWidth: this.__maxWidth,
			version: 1
		};
	}
	setWidthAndHeight(width, height) {
		const writable = this.getWritable();
		writable.__width = width;
		writable.__height = height;
	}
	createDOM(config) {
		const div = document.createElement("div");
		const theme = config.theme;
		const className = theme.image;
		if (className !== void 0) {
			div.className = `image-node ${className}`;
			return div;
		}
		div.style.position = "relative";
		div.className = "image-node";
		return div;
	}
	updateDOM() {
		return false;
	}
	getSrc() {
		return this.__src;
	}
	setSrc(newSrc) {
		const writable = this.getWritable();
		writable.__src = newSrc;
	}
	getAlt() {
		return this.__alt;
	}
	decorate() {
		return /* @__PURE__ */ jsx(React.Suspense, {
			fallback: null,
			children: /* @__PURE__ */ jsx(ImageContainer, {
				src: this.__src,
				alt: this.__alt,
				width: this.__width,
				height: this.__height,
				maxWidth: this.__maxWidth,
				nodeKey: this.getKey(),
				resizable: true
			})
		});
	}
};

//#endregion
//#region src/handler.ts
const img = document.createElement("img");
img.src = TRANSPARENT_IMAGE;
const $onInsert = (payload) => {
	const imageNode = $createImageNode(payload);
	$insertNodes([imageNode]);
	if ($isRootOrShadowRoot(imageNode.getParentOrThrow())) $wrapNodeInElement(imageNode, $createParagraphNode).selectEnd();
	return true;
};
const $onSwitch = (payload) => {
	payload.forEach(({ node, storageSrc }) => {
		node.setSrc(storageSrc);
	});
	return true;
};
const $onDragStart = (event) => {
	const node = $getImageNodeInSelection();
	if (!node) return false;
	const dataTransfer = event.dataTransfer;
	if (!dataTransfer) return false;
	dataTransfer.setData("text/plain", "_");
	dataTransfer.setDragImage(img, 0, 0);
	dataTransfer.setData("application/x-lexical-drag", JSON.stringify({
		data: {
			key: node.getKey(),
			src: node.__src,
			alt: node.__alt,
			width: node.__width,
			height: node.__height,
			maxWidth: node.__maxWidth
		},
		type: "image"
	}));
	return true;
};
const $onDragOver = (event) => {
	const node = $getImageNodeInSelection();
	if (!node) return false;
	if (!canDropImage(event)) event.preventDefault();
	return true;
};
const $onDrop = (editor) => (event) => {
	const node = $getImageNodeInSelection();
	if (!node) return false;
	const data = getDragImageData(event);
	if (!data) return false;
	event.preventDefault();
	if (canDropImage(event)) {
		const range = getDragSelection(event);
		node.remove();
		const rangeSelection = $createRangeSelection();
		if (range !== null && range !== void 0) rangeSelection.applyDOMRange(range);
		$setSelection(rangeSelection);
		editor.dispatchCommand(INSERT_IMAGE_COMMAND, data);
	}
	return true;
};
const processDragDropPaste = (editor) => async (files) => {
	const filesResult = await mediaFileReader(files, [ACCEPTABLE_IMAGE_TYPES].flatMap((x) => x));
	for (const { file, result } of filesResult) if (isMimeType(file, ACCEPTABLE_IMAGE_TYPES)) editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
		alt: file.name,
		src: result
	});
};
const $onDragDropPaste = (editor) => (files) => {
	processDragDropPaste(editor)(files);
	return true;
};

//#endregion
//#region src/plugin.ts
const ImagePlugin = () => {
	const [editor] = useLexicalComposerContext();
	useEffect(() => {
		if (!editor.hasNodes([ImageNode])) throw new Error("ImagePlugin: ImageNode is not registered on editor");
		return mergeRegister(editor.registerCommand(INSERT_IMAGE_COMMAND, $onInsert, COMMAND_PRIORITY_EDITOR), editor.registerCommand(SWITCH_IMAGES_COMMAND, $onSwitch, COMMAND_PRIORITY_CRITICAL), editor.registerCommand(DRAGSTART_COMMAND, $onDragStart, COMMAND_PRIORITY_HIGH), editor.registerCommand(DRAGOVER_COMMAND, $onDragOver, COMMAND_PRIORITY_LOW), editor.registerCommand(DROP_COMMAND, $onDrop(editor), COMMAND_PRIORITY_HIGH), editor.registerCommand(DRAG_DROP_PASTE, $onDragDropPaste(editor), COMMAND_PRIORITY_LOW));
	}, [editor]);
	return null;
};

//#endregion
export { INSERT_IMAGE_COMMAND, ImageNode, ImagePlugin, RIGHT_CLICK_IMAGE_COMMAND, SWITCH_IMAGES_COMMAND };
//# sourceMappingURL=index.js.map