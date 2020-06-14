import { asyncMap } from "iter-tools";
import CID from "cids";
const IpfsHttpClient: any = require("ipfs-http-client");

import * as Preserve from "@truffle/preserve";

export interface PreserveToIpfsOptions {
  target: Preserve.Target;
  ipfs: {
    address: string;
  };
}

export interface PreserveToIpfsResult {
  records: AsyncIterable<{
    cid: CID;
    path?: string;
  }>;
}

interface FileObject {
  path?: string;
  content: Preserve.Targets.Normalized.Content;
}

export const preserveToIpfs = async (
  options: PreserveToIpfsOptions
): Promise<PreserveToIpfsResult> => {
  const {
    target: rawTarget,
    ipfs: { address }
  } = options;

  // init client
  const ipfs: IpfsClient = IpfsHttpClient(address);

  // normalize target
  const { sources } = await Preserve.Targets.normalize(rawTarget);

  // map each target source to IPFS input
  const data = asyncMap(
    ({
      content,
      settings: { path } = {}
    }: Preserve.Targets.Normalized.Source): FileObject =>
      path !== undefined ? { content, path } : { content }
  )(sources);

  // add to IPFS
  return {
    records: ipfs.add(data)
  };
};

interface IpfsClient {
  add(files: AsyncIterable<FileObject>): PreserveToIpfsResult["records"];
}
