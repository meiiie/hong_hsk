import { describe, expect, it } from "vitest";
import { getLessonListeningTracks } from "../../src/domain/hsk4/lesson-listening";

describe("lesson listening metadata", () => {
  it("points the audio player at Nhân Trí Việt's direct MP3 CDN instead of the CORS-blocked view page", () => {
    const [track] = getLessonListeningTracks(1);

    expect(track.audioUrl).toContain("https://ntvcdn.b-cdn.net/");
    expect(track.audioUrl).toMatch(/\.mp3$/);
    expect(track.audioUrl).not.toContain("/MobileResource/ViewRes");
    expect(track.audioUrl).not.toContain("/Common/DownRes");
    expect(track.resourceUrl).toContain("https://www.nhantriviet.com/MP3-HSK4-BH1");
    expect(track.seriesUrl).toBe("https://www.nhantriviet.com/MP3-HSK4-BH1");
    expect(getLessonListeningTracks(1)[2].resourceUrl).toBe(
      "https://www.nhantriviet.com/MP3-HSK4-BH1?audiogallery_startitem_ag1=3",
    );
  });

  it("has direct MP3 URLs for every textbook listening track", () => {
    for (let lesson = 1; lesson <= 20; lesson += 1) {
      const tracks = getLessonListeningTracks(lesson);

      expect(tracks).toHaveLength(5);
      expect(tracks.every((track) => track.audioUrl.includes("ntvcdn.b-cdn.net") && track.audioUrl.endsWith(".mp3"))).toBe(
        true,
      );
    }
  });
});
