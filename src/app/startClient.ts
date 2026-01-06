import { createClientShell } from "./uiShell";

export const startClient = () => {
  const root = createClientShell();
  root.render();
};
