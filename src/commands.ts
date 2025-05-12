import type { InsertImagePayload, SwitchImageData } from "@/types";
import type { LexicalCommand } from "lexical";
import { createCommand } from "lexical";

const INSERT_IMAGE_COMMAND: LexicalCommand<InsertImagePayload> = createCommand(
  "INSERT_IMAGE_COMMAND",
);

const SWITCH_IMAGES_COMMAND: LexicalCommand<SwitchImageData[]> = createCommand(
  "SWITCH_IMAGES_COMMAND",
);

const RIGHT_CLICK_IMAGE_COMMAND: LexicalCommand<MouseEvent> = createCommand(
  "RIGHT_CLICK_IMAGE_COMMAND",
);

export {
  INSERT_IMAGE_COMMAND,
  RIGHT_CLICK_IMAGE_COMMAND,
  SWITCH_IMAGES_COMMAND,
};
