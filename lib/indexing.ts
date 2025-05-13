import { documents } from "./loaders.ts";
import { splitter } from "./splitters.ts";
import { vectorStore } from "./vector-stores.ts";

export const indexDocuments = async () => {
  const allSplits = await splitter.splitDocuments(documents);
  await vectorStore.addDocuments(allSplits);
};
