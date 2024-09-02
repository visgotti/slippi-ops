import { getResultFromSlippi } from "@slippiops/node-utils";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { parentPort } = require('worker_threads');

parentPort.on("message", (filePath: string) => {
  const result = getResultFromSlippi(filePath);
  parentPort.postMessage(result);
});
