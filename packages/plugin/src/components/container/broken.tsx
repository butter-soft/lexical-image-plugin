import { BROKEN_IMAGE } from "@plugin/constants";

export const BrokenImage = () => {
  return (
    <img
      src={BROKEN_IMAGE}
      style={{
        height: 200,
        opacity: 0.2,
        width: 200,
      }}
      draggable="false"
    />
  );
};
