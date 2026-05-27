type AnimeModule = typeof import("animejs");

let animeModulePromise: Promise<AnimeModule> | undefined;

export async function runWithAnime(callback: (anime: AnimeModule) => void | Promise<void>): Promise<void> {
  const anime = await loadAnime();
  await callback(anime);
}

function loadAnime(): Promise<AnimeModule> {
  animeModulePromise ??= import("animejs");
  return animeModulePromise;
}

