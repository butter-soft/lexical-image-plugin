import { defineConfig } from "tsdown/config";

export default defineConfig({
  entry: ["./src"],
  dts: true,
  format: ["esm", "cjs"],
});
