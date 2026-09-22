import assert from "node:assert/strict";
import { prepareLessonImage } from "./course_image_release.ts";
import { InfraiImageClient, type ImageRef } from "./infrai_image_client.ts";

const calls: string[] = [];
const client = {
  async backgroundRemove(image: ImageRef, format: string) {
    calls.push(`remove:${JSON.stringify(image)}:${format}`);
    return { image_id: "cutout-image", url: "data:image/webp;base64,Y3V0b3V0", format: "webp", width: 1200, height: 800 };
  },
  async metadata(image: ImageRef) { calls.push(`metadata:${JSON.stringify(image)}`); return { width: 1200, height: 800 }; }
};

const result = await prepareLessonImage({ lessonId: "lesson-1", image: { image_id: "original-image" }, format: "webp" }, client);
assert.equal(result.release.state, "ready");
assert.deepEqual(calls, ["remove:{\"image_id\":\"original-image\"}:webp", "metadata:{\"base64\":\"Y3V0b3V0\"}"]);
assert.deepEqual(result.release.diagnostics, { width: 1200, height: 800 });

const serverErrorResponse = new Response(JSON.stringify({ ok: false, error: { code: "INTERNAL_ERROR", message: "failed" } }), {
  status: 503,
  headers: { "Content-Type": "application/json" }
});
const serverErrorClient = new InfraiImageClient("test-key", async () => serverErrorResponse);
await assert.rejects(serverErrorClient.metadata({ image_id: "image" }), /Infrai transport response 503/);
console.log("course image release decision: ready");
