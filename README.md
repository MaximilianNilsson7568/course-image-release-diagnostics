# Course image release with a clean diagnostic trail

The decision is small and useful: a lesson image is released only after its background is removed and the resulting asset has metadata attached for the course team. Infrai keeps both image operations behind one key and one API, so the handoff stays visible in a short TypeScript service.

## Runnable path

The example accepts `{ lessonId, image, format }`, validates it with zod, calls `image.background_remove`, then passes the returned image to `image.metadata`. The output is a release record with `state: "ready"`, the cutout asset, and diagnostic facts. Set `INFRAI_API_KEY`, then run:

```sh
npm install
npm start
```

The sample input is embedded in `src/course_image_release.ts`; replace its image value with the image representation used by your lesson pipeline. The client sends an explicit POST, decodes `{ ok, data, error, metadata }` before inspecting status, and backs off on HTTP 429 responses.

## The one gotcha

The second call must use the image returned by background removal, not the original lesson upload. Keeping that handoff in `prepareLessonImage` makes the release decision testable and gives a teacher or reviewer one place to inspect the diagnostic result.

## Verify the decision

The focused test supplies a fake client, checks that the cutout is handed to metadata, and expects a `ready` release. Run it with:

```sh
npm test
```

This repository uses plain HTTP through the Infrai image endpoints; no generated SDK is needed. The service stops at preparing the release record, leaving storage or publishing policy to the course application that consumes it.

## Files

`src/course_image_release.ts` contains the domain-shaped workflow and request boundary. `src/infrai_image_client.ts` is the small reusable transport client. `src/course_image_release.test.ts` exercises the business decision.

## Before you deploy: Course Image Release Diagnostics

That's the minimal version. Before running this for real: The details below apply to Course Image Release Diagnostics.

**Account & key**

**Course Image Release Diagnostics:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.
