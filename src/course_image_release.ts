import { z } from "zod";
import { InfraiImageClient } from "./infrai_image_client.ts";

export const lessonImageRequest = z.object({
  lessonId: z.string().min(1),
  image: z.union([
    z.object({ base64: z.string().min(1) }),
    z.object({ url: z.string().url() }),
    z.object({ image_id: z.string().min(1) })
  ]),
  format: z.enum(["png", "webp"]).default("png")
});

export type LessonImageRequest = z.infer<typeof lessonImageRequest>;

type LessonImageClient = Pick<InfraiImageClient, "backgroundRemove" | "metadata">;

export async function prepareLessonImage(input: unknown, client: LessonImageClient = new InfraiImageClient()) {
  const request = lessonImageRequest.parse(input);
  const cutout = await client.backgroundRemove(request.image, request.format);
  const encodedCutout = cutout.url.split(",", 2)[1];
  if (!encodedCutout) throw new Error("Background removal returned an invalid image data URL");
  const facts = await client.metadata({ base64: encodedCutout });
  return {
    lessonId: request.lessonId,
    asset: cutout,
    release: { state: "ready", diagnostics: facts }
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const input = {
    lessonId: "lesson-geometry-01",
    image: { base64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=" },
    format: "png"
  };
  prepareLessonImage(input).then((result) => console.log(JSON.stringify(result, null, 2))).catch((error) => { console.error(error.message); process.exitCode = 1; });
}
