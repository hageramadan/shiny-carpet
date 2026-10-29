const assert = require("node:assert/strict");
const { test } = require("node:test");
const { prepareOrderImage } = require("../lib/order-image.ts");

test("keeps small images unchanged", async () => {
  const file = new File(["small"], "rug.png", { type: "image/png" });
  assert.equal(await prepareOrderImage(file, "unused"), file);
});

test("uploads the compressed file with bounded dimensions and matching JPEG metadata", async (t) => {
  const previousWindow = global.window,
    previousDocument = global.document;
  t.after(() => {
    global.window = previousWindow;
    global.document = previousDocument;
  });
  global.window = {
    Image: class {
      naturalWidth = 4000;
      naturalHeight = 3000;
      set src(value) {
        queueMicrotask(() => this.onload());
      }
    },
  };
  const canvas = {
    getContext: () => ({ fillRect() {}, drawImage() {} }),
    toBlob: (done, type, quality) =>
      done(new Blob([new Uint8Array(quality > 0.7 ? 600000 : 200000)], { type })),
  };
  global.document = { createElement: () => canvas };
  const original = new File([new Uint8Array(3 * 1024 * 1024)], "rug.png", {
    type: "image/png",
    lastModified: 123,
  });
  const prepared = await prepareOrderImage(original, "blob:test");
  assert.ok(prepared.size <= 500 * 1024);
  assert.equal(prepared.type, "image/jpeg");
  assert.equal(prepared.name, "rug.jpg");
  assert.equal(prepared.lastModified, 123);
  assert.equal(canvas.width, 1600);
  assert.equal(canvas.height, 1200);
  canvas.toBlob = (done) => done(null);
  await assert.rejects(prepareOrderImage(original, "blob:test"));
});
