import { asyncFilter, asyncToArray, asyncMap } from "iter-tools";
// use this package because iter-tools doesn't support BufferList returned
// by ipfs.get()
import concat from "it-concat";
import CID from "cids";

import * as Preserve from "@truffle/preserve";

interface IpfsClient {
  get(
    cid: CID | string
  ): AsyncIterable<{
    content: AsyncIterable<Buffer>;
  }>;
}

export interface FetchOptions {
  path: string | CID;
  ipfs: IpfsClient;
}

export interface FetchResult {
  files: string[];
}

export const fetch = async ({
  path,
  ipfs
}: FetchOptions): Promise<FetchResult> => {
  const files = await asyncToArray(
    asyncMap(async ({ content }) => (await concat(content)).toString())(
      asyncFilter(({ content }) => content)(ipfs.get(path))
    )
  );

  return { files };
};
