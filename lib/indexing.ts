import { documents } from "./documents.ts";
import { splitter } from "./text-splitter.ts";
import { vectorStore } from "./vector-store.ts";

export const indexDocuments = async () => {
  const allSplits = await splitter.splitDocuments(documents);
  await vectorStore.addDocuments(allSplits);
};
