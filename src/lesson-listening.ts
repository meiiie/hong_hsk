import type { BookCode } from "./types";

export const HSK4_LEVEL_SOURCE_URL =
  "https://www.hskstandardcourse.com/hsk-standard-course-level-4/";

const BLCUP_ORIGIN = "https://www.blcup.com";
const BLCUP_4A_SERIES_URL =
  "https://www.blcup.com/MobileResSeries?rid=009861d5-008b-495d-ae7a-23482ec05ad7";
const BLCUP_4B_SERIES_URL =
  "https://www.blcup.com/MobileResSeries?rid=3ddee33f-4951-4075-8698-18b1ef0190e0";

const RESOURCE_IDS_BY_LESSON: Record<number, readonly string[]> = {
  1: [
    "e07d4504-c85c-45ff-8062-61f455583d68",
    "2fae9f92-65d4-4069-bbbb-7eead1470db7",
    "bc8f65af-e8b7-4f83-a8d1-060a869da2d7",
    "ac6e0dcc-ab3a-4a57-8110-bb04e6ecaf89",
    "e19d9931-3de6-43a8-b15d-02c1784c64d5",
  ],
  2: [
    "9fcad20c-91b4-427b-baff-fd13b8bfc50f",
    "bb9ac599-8a03-419c-b912-790bcb7a610f",
    "bcd30d11-0f5f-4fe8-8e8d-a1b5690e86b3",
    "ae254192-f7a7-4ea5-8433-211543547483",
    "844eec15-c97a-4499-b6dc-254bfb618b54",
  ],
  3: [
    "b8b74dfd-ce94-4ab6-9233-28c93b8d8b86",
    "3270d981-873f-480d-8ee1-2ec10f83b402",
    "4c66b48f-a14e-40ea-8431-3c635ba38f30",
    "fc34caaa-0b4b-4a39-afdf-faa67561b1df",
    "3cc29db0-36b1-4b12-b478-9be4b062aacc",
  ],
  4: [
    "867cda7c-6b4c-4644-a4a8-a36bd4159a00",
    "e264a502-9220-4711-be35-3458622fe3b9",
    "93750ce1-9623-49ba-9b0a-a6037c7621ef",
    "f316408d-720f-4034-859d-d12f4aee0186",
    "d94d1a56-27b0-4683-9703-5469fd0f46b5",
  ],
  5: [
    "9b32bfcd-718a-465b-a544-6ad60397814c",
    "6aff7ef3-14e1-405b-8da3-bfa4fade12b3",
    "c820d4f4-190f-4472-92e9-b9e72e64d7ca",
    "2e8e7c10-62d5-4313-b773-939e124d4f3c",
    "01951140-47a4-41f0-aba0-6903b34d9b38",
  ],
  6: [
    "c68f8698-fcb7-484d-8794-2250b33e44df",
    "8b128e6e-d619-4712-8bbd-2d069e648472",
    "c6b29cb7-0b9d-4854-9b5f-0690fefd029d",
    "4d319605-4d67-451e-9926-8740b0123257",
    "6516febe-3c83-49dd-9a4e-63cf70779da2",
  ],
  7: [
    "e2286f5f-4508-451c-ab12-3ba16b62ead3",
    "2efc1cc7-f60e-447e-83ee-478af5cede62",
    "9e15b412-9dd9-4913-b7b1-fa3cd67468ff",
    "5aaa0e6f-124f-44d5-9b9d-88f958f2d011",
    "95ecc5b3-6a0f-475f-81b3-ca3a8fe44f44",
  ],
  8: [
    "390727ca-7193-4161-b7fa-33426476d258",
    "1eba4715-d528-4127-87b4-dad831c3e553",
    "7ed46bed-3a98-470f-9bb5-46c7552b682d",
    "c0227289-e898-4b24-b926-18caf927722b",
    "77aaccbb-9f29-47d9-8ed4-ffd82ac44778",
  ],
  9: [
    "f7b4bfa0-93f0-47d5-8dd9-4f1690380125",
    "350893e7-20ba-4ecd-9dbe-ce6306968953",
    "b2226791-d555-48a6-9072-0b3b5a7fb103",
    "106c422e-22df-4a4c-9a03-683b208ac396",
    "c500d6bf-fb06-4616-a64c-2e11d3db52a6",
  ],
  10: [
    "f3c46dcc-66a7-4628-8cea-a4ca0490261c",
    "b5292230-5d74-47ec-8c5f-7b5416b2944b",
    "c4a21afe-5ca0-4377-a864-1fad2378892c",
    "a5a07a92-fd89-42ba-a75f-41a0dd4a0567",
    "9888a7e8-1c74-478f-8b15-329dca929e91",
  ],
  11: [
    "0955726d-3c47-4b59-b297-002d7feb5e77",
    "1dae47c1-74f4-4b8c-9903-79e74c808299",
    "23dd7d11-64b8-4ded-9085-686249a29ba4",
    "cc23431f-4ce6-40e9-b571-8338ba3fb643",
    "f82eaefc-ca97-42ff-bf45-74ee60169143",
  ],
  12: [
    "c3ddf9f5-2a09-432b-b67c-234e3ab1ecf1",
    "7a0fb117-6bc8-4485-91c5-b660ed242816",
    "bf6ed3bc-a853-47ec-8d36-7e8d162bf514",
    "fa492d23-3f0c-45aa-9f02-3c340f3018cf",
    "71444d41-5801-474f-b60a-992fd2c746d7",
  ],
  13: [
    "a936d258-8d51-4f84-954e-038e2d9a7e01",
    "64d3f0a2-6774-45db-b8f4-e6eb79aa1876",
    "3ee3641b-7a30-406d-a5b8-7c7154f0aba2",
    "07a65f21-922e-419b-ac92-ce36d5bcc8c7",
    "1df46481-3786-4383-bb17-9d1f5dab2ab5",
  ],
  14: [
    "723eba30-0b69-40b1-b3db-7b49dae4100b",
    "50381c37-dd95-476d-b207-9114d4ced69c",
    "68ba002c-1434-4bb2-b244-132f138124f8",
    "ff3fedc8-ba0a-44d5-b541-a173b873bb79",
    "8ad74acb-6ec3-4d67-9792-6704bf4ce09c",
  ],
  15: [
    "4e4d8a10-cac7-4cd1-89c8-b845874ad9ca",
    "e80707f8-e645-4b05-b475-9047a51d0e0c",
    "261799d1-f466-4fee-aa17-93f71b735d45",
    "7cdc3b0b-a13a-42c6-b83a-9d7825bf177f",
    "a47cd766-2be0-448e-9fcc-2343efc99534",
  ],
  16: [
    "4ec1e575-6852-4959-b022-178b15373f47",
    "a0eec5bc-0d46-4212-b413-d0678dea8c68",
    "279e197b-6976-4a33-b84f-9c6ef85d698b",
    "ede0ca11-4046-47ca-bb5a-97000c657ed3",
    "3b7aa42b-d4ca-47e6-995b-83e76ffd4354",
  ],
  17: [
    "c661dd04-2752-4835-93e9-6eae24364168",
    "b56b4070-3783-44f7-b553-7ec2e7fb97ee",
    "f5d01352-79b1-4822-9671-f1586ecc71af",
    "154d8b07-1086-4cd4-9711-eb2e487f88c9",
    "4c505fbb-292b-4279-9f0f-42634baa0e50",
  ],
  18: [
    "3e8e0c22-e24d-4f6a-bf30-1d588dadcdc3",
    "054c905b-764f-4b24-83f5-1a11743e70c6",
    "170f6056-4c04-47df-bec0-49f5094bf7ab",
    "1ebcbcda-5965-4c10-b055-504ad34497f3",
    "261cfb04-c888-432b-836c-7da882deab43",
  ],
  19: [
    "136c9a6e-5039-4b43-ad5a-44df9fd46b5d",
    "7496e7cb-d5c3-4c01-9798-ecb525742b8e",
    "9077c18d-10f9-4f1b-a31c-1540c48db3ad",
    "a5b8cc11-3bf0-4801-885e-974d289dd56f",
    "1ce805f4-3b60-4b3d-adbd-63cd9fe570f0",
  ],
  20: [
    "010ba224-cea0-4019-8e05-92cf6b373eb1",
    "54b16a7d-d920-447c-90c5-77304a333cc2",
    "a1f58cf9-b42d-4f17-9247-fdae0b939bea",
    "41884fbd-684a-45fb-a357-fe8ba34d57c2",
    "1fd57357-c7bc-489c-b7e1-7bbd055b466b",
  ],
};

export interface LessonListeningTrack {
  id: string;
  book: BookCode;
  lesson: number;
  track: number;
  label: string;
  title: string;
  sourceTitle: string;
  resourceId: string;
  resourceUrl: string;
  viewUrl: string;
  seriesUrl: string;
}

export function getLessonListeningTracks(lesson: number): LessonListeningTrack[] {
  return (RESOURCE_IDS_BY_LESSON[lesson] ?? []).map((resourceId, index) =>
    buildTrack(lesson, index + 1, resourceId),
  );
}

export function findLessonListeningTrack(id: string): LessonListeningTrack | undefined {
  const match = id.match(/^hsk4-(\d+)-(\d+)$/);
  if (!match) {
    return undefined;
  }

  const lesson = Number(match[1]);
  const track = Number(match[2]);
  const resourceId = RESOURCE_IDS_BY_LESSON[lesson]?.[track - 1];
  return resourceId ? buildTrack(lesson, track, resourceId) : undefined;
}

export function extractBlcupAudioUrl(html: string): string | undefined {
  const audioSource = html.match(/<audio\s+src="([^"]+)"/i)?.[1];
  if (!audioSource) {
    return undefined;
  }

  try {
    return new URL(audioSource, BLCUP_ORIGIN).href;
  } catch {
    return undefined;
  }
}

function buildTrack(lesson: number, track: number, resourceId: string): LessonListeningTrack {
  const book: BookCode = lesson <= 10 ? "4A" : "4B";
  const label = `${String(lesson).padStart(2, "0")}-${track}`;
  const sourceTitle =
    book === "4A"
      ? `HSK标准教程4上 ${label}`
      : `HSK标准教程4（下）课本音频 ${label}`;

  return {
    id: `hsk4-${lesson}-${track}`,
    book,
    lesson,
    track,
    label,
    title: `Đoạn ${track}`,
    sourceTitle,
    resourceId,
    resourceUrl: `${BLCUP_ORIGIN}/MobileResource?rid=${resourceId}`,
    viewUrl: `${BLCUP_ORIGIN}/MobileResource/ViewRes?rid=${resourceId}`,
    seriesUrl: book === "4A" ? BLCUP_4A_SERIES_URL : BLCUP_4B_SERIES_URL,
  };
}
