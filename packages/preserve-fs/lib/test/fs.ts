import fs from "fs-extra";
import path from "path";
import tmp from "tmp-promise";

import * as Preserve from "@truffle/preserve";
import { targetPath } from "../fs";

interface File {
  path: string;
  content: string;
}

interface Test {
  name: string;
  files: File[];
  targeted: string; // path to target (will be prefixed)
  expected: { [path: string]: string };
}

const tests: Test[] = [
  {
    name: "single-file",
    files: [
      {
        path: "./a",
        content: "a"
      }
    ],
    targeted: "a",
    expected: {
      a: "a"
    }
  },
  {
    name: "extra-files",
    files: [
      {
        path: "./a",
        content: "a"
      },
      {
        path: "./b",
        content: "b"
      },
      {
        path: "./c",
        content: "c"
      }
    ],
    targeted: "b",
    expected: {
      b: "b"
    }
  },
  {
    name: "single-directory",
    files: [
      {
        path: "./directory/1",
        content: "1"
      },
      {
        path: "./directory/2",
        content: "2"
      }
    ],
    targeted: "directory",
    expected: {
      "directory/1": "1",
      "directory/2": "2"
    }
  },
  {
    name: "sub-directory",
    files: [
      {
        path: "./a/a/a",
        content: "aaa"
      },
      {
        path: "./a/b/a",
        content: "aba"
      },
      {
        path: "./a/c",
        content: "ac"
      }
    ],
    targeted: "a/a",
    expected: {
      "a/a/a": "aaa"
    }
  }
];

const writeFile = async (fullPath: string, content: string): Promise<void> => {
  // ensure directory exists for file
  await fs.ensureDir(path.dirname(fullPath));

  await fs.promises.writeFile(fullPath, content);
};

describe("targetPath", () => {
  let workspace: tmp.DirectoryResult;

  beforeAll(async () => {
    workspace = await tmp.dir();
  });

  afterAll(async () => {
    await workspace.cleanup();
  });

  for (const { name, files, targeted, expected } of tests) {
    describe(`test: ${name}`, () => {
      beforeAll(async () => {
        for (const file of files) {
          const fullPath = path.join(workspace.path, name, file.path);

          await writeFile(fullPath, file.content);
        }
      });

      it("returns correct target", async () => {
        const fullPath = path.join(workspace.path, name, targeted);
        const target = await targetPath({
          path: fullPath,
          settings: {
            path: targeted
          }
        });

        const { sources } = await Preserve.Targets.thunk(target);
        const map: { [index: string]: string } = {};
        for (const {
          content,
          settings: { path }
        } of sources) {
          map[path] = content;
        }

        expect(map).toEqual(expected);
      });
    });
  }
});
