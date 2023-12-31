import { assertExists } from "https://deno.land/std@0.201.0/assert/mod.ts";

const FILES = ["README.md"];

for (const file of FILES) {
  Deno.test(file, async (t) => {
    for await (const { subject, codeBlock } of findCodeBlocks(file)) {
      await t.step(subject, async (t) => {
        await t.step("should importable", async () => {
          const mod = await evalCode(codeBlock);
          assertExists(mod);
        });
      });
    }
  });
}

for (const file of FILES) {
  for await (const { codeBlock } of findCodeBlocks(file)) {
    try {
      await evalCode(codeBlock);
    } catch {
      // Do nothing.
    }
  }
}

async function* findCodeBlocks(file: string) {
  const decoder = new TextDecoder("utf-8");
  const markdown = decoder.decode(await Deno.readFile(file));
  const codeReg = /^```(?:typescript|ts)\n(.*?)```/dgms;
  let lastIndex = 0;
  for (const { 1: codeBlock, indices } of markdown.matchAll(codeReg)) {
    const [start, end] = indices![0];
    const { 1: subject } =
      ("\n" + markdown.slice(lastIndex, start)).match(/.*\n#+ ([^\n]+)/s) ??
        { 1: "UNKNOWN" };
    lastIndex = end;
    yield { subject, codeBlock };
  }
}

function evalCode(code: string): Promise<unknown> {
  return import(`data:application/typescript,${encodeURIComponent(code)}`);
}
