import { describe, expect, it } from "vitest";
import { getLessonListeningTracks } from "../../src/domain/hsk4/lesson-listening";

describe("lesson listening metadata", () => {
  it("points the audio player at a direct MP3 file instead of the CORS-blocked view page", () => {
    const [track] = getLessonListeningTracks(1);

    expect(track.audioUrl).toContain("/File/Res3/");
    expect(track.audioUrl).toMatch(/\.mp3$/);
    expect(track.audioUrl).not.toContain("/MobileResource/ViewRes");
    expect(track.audioUrl).not.toContain("/Common/DownRes");
  });

  it("has direct MP3 URLs for every textbook listening track", () => {
    for (let lesson = 1; lesson <= 20; lesson += 1) {
      const tracks = getLessonListeningTracks(lesson);

      expect(tracks).toHaveLength(5);
      expect(tracks.every((track) => track.audioUrl.includes("/File/Res3/") && track.audioUrl.endsWith(".mp3"))).toBe(
        true,
      );
    }
  });
});
