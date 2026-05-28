import type { BookCode } from "../types";

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

const AUDIO_FILE_PATHS_BY_LESSON: Record<number, readonly string[]> = {
  1: [
    "/File/Res3/a5261fe9-3441-4713-b965-b4c9e2846ee4.mp3",
    "/File/Res3/0e106976-02e0-4ab0-a5e7-ff81698626cd.mp3",
    "/File/Res3/44b9de60-1c45-4ffd-88ad-0b3434b157e6.mp3",
    "/File/Res3/9a7fc902-8f0c-4b5f-a2e4-2c3b6bf15cde.mp3",
    "/File/Res3/d7f96af1-f396-4f4d-be38-4b75c510250d.mp3",
  ],
  2: [
    "/File/Res3/f65cc0f4-5dd3-4a54-8227-fdedee3448dd.mp3",
    "/File/Res3/8aeb9919-e113-45a5-9060-ee8dab8fdf90.mp3",
    "/File/Res3/7d422309-5989-4a6a-b851-8f3022274575.mp3",
    "/File/Res3/04dcae20-368c-45e2-adf7-aff97b05168d.mp3",
    "/File/Res3/64981243-1bbf-44e2-9c61-81fca13fe6d6.mp3",
  ],
  3: [
    "/File/Res3/a580a32e-adc4-410e-83be-c61a29635430.mp3",
    "/File/Res3/87a1af4f-fb29-4566-a4a9-cab969439165.mp3",
    "/File/Res3/10b19bf2-260a-4b31-bcce-4e66cbabb3d3.mp3",
    "/File/Res3/344a9059-93f1-4784-b237-95027e181fb9.mp3",
    "/File/Res3/301fad23-b69d-4381-944e-0b2159212cfb.mp3",
  ],
  4: [
    "/File/Res3/d0e07562-7e8a-46c1-a224-87b16050ee08.mp3",
    "/File/Res3/7900a6ce-d715-46be-af13-7d632f58d67e.mp3",
    "/File/Res3/070575c5-8c99-4546-a8b2-6399eb5e9b13.mp3",
    "/File/Res3/509488ca-db9f-405c-8a2e-d86998d9cb30.mp3",
    "/File/Res3/a2d0a763-f4b0-498f-8ece-0d97b1ef180a.mp3",
  ],
  5: [
    "/File/Res3/db317d8e-1af9-4f86-a081-edbe1b69e03d.mp3",
    "/File/Res3/8044d317-342f-4406-a400-8a26b8fd05d6.mp3",
    "/File/Res3/5eb963d3-6fe6-443a-9e2e-6b349ce2e529.mp3",
    "/File/Res3/5fc33918-ca3b-45e8-9d92-be7508d713d2.mp3",
    "/File/Res3/f400e8ac-0ec3-4efb-a256-1cc93cdf6db0.mp3",
  ],
  6: [
    "/File/Res3/a5320b13-dba6-4570-a141-34912f417aa6.mp3",
    "/File/Res3/4054661b-0b94-430f-921e-85452f95e8fa.mp3",
    "/File/Res3/2868f39e-db2f-41a0-aaa0-24ac4f298c9d.mp3",
    "/File/Res3/6a7aa643-266b-46fc-a72e-8dd453ca0db9.mp3",
    "/File/Res3/fd795905-bcef-4ee6-92c2-0f3c05f280aa.mp3",
  ],
  7: [
    "/File/Res3/5f85320c-36d8-49e7-b37a-75cfced896cd.mp3",
    "/File/Res3/208b8002-89c6-4361-a39e-c49178fa919c.mp3",
    "/File/Res3/48de8779-6869-4ad8-8eb4-2e40ebc81430.mp3",
    "/File/Res3/ca4564e2-5b4c-40a8-b77c-bb6d8a957aa5.mp3",
    "/File/Res3/44cb6be5-4a8c-4ea1-a383-0f0b3ea65b72.mp3",
  ],
  8: [
    "/File/Res3/1d51c792-3183-485d-9b86-7e9e06b6f1af.mp3",
    "/File/Res3/70727371-e591-4b9f-af8d-2de83a1262f9.mp3",
    "/File/Res3/1d2cba22-e606-4996-9688-3f1ac7d3cc59.mp3",
    "/File/Res3/65d6849a-e595-42e6-9f8d-2366434e8972.mp3",
    "/File/Res3/52b3859a-f7ad-4b37-b7fd-f1674b515bb9.mp3",
  ],
  9: [
    "/File/Res3/0c2aad23-e4a4-4aaa-bb0a-88e165d51666.mp3",
    "/File/Res3/ef90a208-3142-44f3-9d67-2095b5935800.mp3",
    "/File/Res3/8e364883-8b68-4820-bb04-8169ea9328c7.mp3",
    "/File/Res3/8dfbceb8-5e8e-4219-b252-cb3a4bef3499.mp3",
    "/File/Res3/128503aa-aee0-4dc2-95c2-ba25cc4b0b13.mp3",
  ],
  10: [
    "/File/Res3/7a01fc6e-2557-40b0-9e7d-b45abca01fda.mp3",
    "/File/Res3/6cb29928-28cd-4887-b425-3b7722bc8df5.mp3",
    "/File/Res3/9097ed8c-33b7-4300-b933-34fb87ed6aa5.mp3",
    "/File/Res3/5f33cbe0-fc2a-468d-b72e-67bde16b3c4e.mp3",
    "/File/Res3/d5cee365-beaa-4c98-87b8-72948454b08b.mp3",
  ],
  11: [
    "/File/Res3/dbb4bf7b-fda6-44b1-a2df-a972f4bed6a5.mp3",
    "/File/Res3/0f525aaa-99c8-4a6c-99ca-d4cffbee537a.mp3",
    "/File/Res3/299c7681-8e7b-4f87-8026-135e7b070e4f.mp3",
    "/File/Res3/96c2e259-e954-44b9-8d9f-7076ec60c53a.mp3",
    "/File/Res3/e2566bef-8d9b-4621-b1eb-db41511cbda6.mp3",
  ],
  12: [
    "/File/Res3/29aa0776-020c-40e8-8d70-dadb9728d3da.mp3",
    "/File/Res3/4db5b90a-b7fc-4493-9d5b-4e133c3dd452.mp3",
    "/File/Res3/e3582069-b7a8-4e1a-81d6-a4e3f21abdea.mp3",
    "/File/Res3/53b8e7ae-d88b-4d1d-9d16-65c36cdfbe3b.mp3",
    "/File/Res3/82f3377d-dcfc-4fd6-87cf-94671b41f235.mp3",
  ],
  13: [
    "/File/Res3/51873849-0f9f-4049-87a7-13c81fc5fbdd.mp3",
    "/File/Res3/e5b17eb3-a90d-4249-be54-aea7257837ee.mp3",
    "/File/Res3/af98b201-2954-4142-83aa-883e29348f42.mp3",
    "/File/Res3/f56297df-e79e-475b-a5c7-22915c50e1e7.mp3",
    "/File/Res3/1e538871-6ac8-45e3-8d91-9aedd64f17c1.mp3",
  ],
  14: [
    "/File/Res3/45b5c14c-7f84-4c6a-b11f-e4186ec44c41.mp3",
    "/File/Res3/0e5bfa2b-c8cb-4701-8acf-67b87d56c2d4.mp3",
    "/File/Res3/f2c89efd-2a56-4353-8cec-76b898074c16.mp3",
    "/File/Res3/3a986f0d-ea88-4e2f-b6db-8244f0b83fc8.mp3",
    "/File/Res3/62f53b2d-cd20-49a3-9128-47e94ab43e87.mp3",
  ],
  15: [
    "/File/Res3/a0361141-de8b-4e66-a37c-119caa37845e.mp3",
    "/File/Res3/f526c24d-9a89-4269-821f-8be5fe5261ff.mp3",
    "/File/Res3/cd5d2b01-e946-47f5-9ca8-353354216f8c.mp3",
    "/File/Res3/3622c4da-1f4b-4f93-a45d-133185fde90b.mp3",
    "/File/Res3/36828741-6160-4220-a29c-c77d6b60935e.mp3",
  ],
  16: [
    "/File/Res3/32f3720d-026d-4edf-be40-a7e870ec1604.mp3",
    "/File/Res3/7aba069b-1bf9-4ae2-84e4-7ab6ed2b423a.mp3",
    "/File/Res3/b07889a6-f9bd-41cb-ad3f-5258d4c5c28c.mp3",
    "/File/Res3/78a14800-ac52-44cb-81a8-7a6d7f00d16b.mp3",
    "/File/Res3/fbabbe73-e3b2-46b3-a637-9a9242fd06c7.mp3",
  ],
  17: [
    "/File/Res3/c9fc717b-41b4-4720-9263-be0c55ec9fb3.mp3",
    "/File/Res3/34e586db-3f8e-405a-b534-fbb1b7a443d5.mp3",
    "/File/Res3/8ad0c7e6-4967-40f7-b34f-94b242124427.mp3",
    "/File/Res3/466c2f8b-ebcd-4fd2-b7fb-c352f41f7167.mp3",
    "/File/Res3/220ad156-c3ff-4db2-8309-af2b200b0961.mp3",
  ],
  18: [
    "/File/Res3/a7be92ac-7163-46a1-a65f-0b7cfd6f1769.mp3",
    "/File/Res3/e9639f8f-a0f5-490a-a144-dca4c7e69fb1.mp3",
    "/File/Res3/38ea559c-3b1c-4b76-9f2c-4e2dde3d7285.mp3",
    "/File/Res3/a072750b-c553-4048-a86b-e4501aec5ba0.mp3",
    "/File/Res3/bae73ee9-c285-4c5b-89d4-22b0b3b3cbde.mp3",
  ],
  19: [
    "/File/Res3/7523a7c1-008b-4f9a-9cc6-851b0a3f9186.mp3",
    "/File/Res3/485c0e3b-2d10-4b75-918a-99f2eb52a095.mp3",
    "/File/Res3/4a4f58f9-79b8-4c5e-ab0a-5cc4f6860148.mp3",
    "/File/Res3/50b6acb3-836c-40bf-bbb5-65b558230160.mp3",
    "/File/Res3/7af0753e-0bcb-43fd-bb12-2c9e9fe65d9a.mp3",
  ],
  20: [
    "/File/Res3/01c8eeca-fa49-4c59-b95e-b64c920053fd.mp3",
    "/File/Res3/dc1b5533-0ff4-40e8-8609-15ca1a857e30.mp3",
    "/File/Res3/6c497513-63e0-4ec1-b474-1503d49c0527.mp3",
    "/File/Res3/633b65a8-c00a-4629-a3f1-f74b14e61061.mp3",
    "/File/Res3/dbbb6c16-9cbb-4e73-bc46-b51d2201e149.mp3",
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
  audioUrl: string;
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

function buildTrack(lesson: number, track: number, resourceId: string): LessonListeningTrack {
  const book: BookCode = lesson <= 10 ? "4A" : "4B";
  const label = `${String(lesson).padStart(2, "0")}-${track}`;
  const audioFilePath = AUDIO_FILE_PATHS_BY_LESSON[lesson]?.[track - 1];
  if (!audioFilePath) {
    throw new Error(`Missing BLCUP audio path for lesson ${lesson}-${track}`);
  }
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
    audioUrl: new URL(audioFilePath, BLCUP_ORIGIN).href,
    seriesUrl: book === "4A" ? BLCUP_4A_SERIES_URL : BLCUP_4B_SERIES_URL,
  };
}
