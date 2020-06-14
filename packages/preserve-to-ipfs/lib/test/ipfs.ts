import { asyncToArray } from "iter-tools";
const IpfsdCtl: any = require("ipfsd-ctl");
const IpfsHttpClient: any = require("ipfs-http-client");

import * as Preserve from "@truffle/preserve";
import { preserveToIpfs } from "../ipfs";

import { fetch } from "../../test/fetch";

const IPFS_BIN = "./node_modules/.bin/jsipfs";

interface IpfsNode {
  apiAddr: {
    toString(): string;
  };
  stop(): Promise<void>;
}

interface Test {
  name: string;
  target: Preserve.Target;
  expected?: {
    additionalIpfsRecords: string[];
  };
}

const tests: Test[] = [
  {
    name: "single-source",
    target: {
      sources: [
        {
          content: "a"
        }
      ]
    }
  },
  {
    name: "two-sources",
    target: {
      sources: [
        {
          content: "a"
        },
        {
          content: "b"
        }
      ]
    }
  },
  {
    name: "single-directory",
    target: {
      sources: [
        {
          content: "a",
          settings: {
            path: "directory/a"
          }
        },
        {
          content: "b",
          settings: {
            path: "directory/b"
          }
        }
      ]
    },
    expected: {
      additionalIpfsRecords: ["directory"]
    }
  },
  {
    // foo/
    //  a/
    //   1
    //   2
    //  b/
    //   3
    //   4
    // bar/
    //  5
    name: "nested-directories",
    target: {
      sources: [
        {
          content: "foo-a-1",
          settings: {
            path: "foo/a/1"
          }
        },
        {
          content: "foo-a-2",
          settings: {
            path: "foo/a/2"
          }
        },
        {
          content: "foo-b-3",
          settings: {
            path: "foo/b/3"
          }
        },
        {
          content: "foo-b-4",
          settings: {
            path: "foo/b/4"
          }
        },
        {
          content: "bar-5",
          settings: {
            path: "bar/5"
          }
        }
      ]
    }
  }
];

describe("preserveToIpfs", () => {
  let node: IpfsNode;
  let address: string;

  beforeAll(async () => {
    node = await IpfsdCtl.createController({
      type: "js",
      ipfsBin: IPFS_BIN,
      test: true,
      disposable: true,
      ipfsHttpModule: IpfsHttpClient
    });

    address = node.apiAddr.toString();
  });

  afterAll(async () => {
    await node.stop();
  });

  it.skip("connects and saves to IPFS via separate client", async () => {
    const ipfs: any = IpfsHttpClient(address);

    const content = "hi";

    const results = [];
    for await (const result of ipfs.add(content)) {
      results.push(result);
    }

    expect(results).toHaveLength(1);
    const { cid } = results[0];

    const { files } = await fetch({ path: cid, ipfs });
    expect(files).toHaveLength(1);

    const file = files[0];
    expect(file).toEqual(content);
  });

  for (const {
    name,
    target: rawTarget,
    expected: { additionalIpfsRecords = [] } = {}
  } of tests) {
    // separate describe block for each test case
    describe(`test: ${name}`, () => {
      let ipfs: any; // client
      let target: Preserve.Targets.Thunked.Target;

      beforeAll(async () => {
        // let's just make this easy
        target = await Preserve.Targets.thunk(rawTarget);
        ipfs = IpfsHttpClient(address);
      });

      it("saves correctly to IPFS", async () => {
        // dunno about "jar" metaphor ("can"?)
        const jar = await preserveToIpfs({
          target,
          ipfs: {
            address
          }
        });

        // convert to array
        const records = await asyncToArray(jar.records);

        expect(records).toHaveLength(
          target.sources.length + additionalIpfsRecords.length
        );

        // keep track of all expected contents
        const expectedContents = new Set<string>(
          target.sources.map(({ content }) => content)
        );

        // fetch each record from IPFS, excluding directory records
        for (const { cid, path } of records) {
          // exclude directories
          if (additionalIpfsRecords.indexOf(path) !== -1) {
            continue;
          }

          const { files } = await fetch({ path: cid, ipfs });
          expect(files).toHaveLength(1);

          const file = files[0];

          expect(expectedContents).toContain(file);

          expectedContents.delete(file);
        }

        // should've found everything
        expect([...expectedContents]).toHaveLength(0);
      });
    });
  }
});
