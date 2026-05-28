import { describe, expect, it } from "vitest";
import { getLessonListeningTracks } from "../../src/domain/hsk4/lesson-listening";

describe("lesson listening metadata", () => {
  it("points the audio player at a direct media endpoint instead of the CORS-blocked view page", () => {
    const [track] = getLessonListeningTracks(1);

    expect(track.audioUrl).toContain("/Common/DownRes?doi=");
    expect(track.audioUrl).toContain(track.resourceId);
    expect(track.audioUrl).not.toContain("/MobileResource/ViewRes");
  });
});
