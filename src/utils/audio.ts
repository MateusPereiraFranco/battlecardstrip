// src/utils/audio.ts

class AudioPool {
  private pool: HTMLAudioElement[] = [];
  private index = 0;

  constructor(src: string, size: number = 3) {
    for (let i = 0; i < size; i++) {
      const audio = new Audio(src);
      audio.preload = "auto";
      audio.volume = 0.4;
      this.pool.push(audio);
    }
  }

  play() {
    if (this.pool.length === 0) return;
    const audio = this.pool[this.index];
    // Rebina o áudio pro zero e toca! (Sem clones, sem vazamento de memória)
    audio.currentTime = 0;
    audio.play().catch(() => {});
    // Roda o carrossel do Pool
    this.index = (this.index + 1) % this.pool.length;
  }
}

const pools: Record<string, AudioPool> = {};

// Cria um banco de áudios exatos na abertura do jogo
if (typeof window !== "undefined") {
  pools["draw"] = new AudioPool("/sounds/draw.ogg", 3);
  pools["summonMonster"] = new AudioPool("/sounds/summonMonster.mp3", 3);
  pools["summonSpell"] = new AudioPool("/sounds/summonSpell.mp3", 3);
  pools["laser"] = new AudioPool("/sounds/laser.ogg", 3);
  pools["explosion"] = new AudioPool("/sounds/explosion.ogg", 5);
  pools["downCard"] = new AudioPool("/sounds/downCard.ogg", 3);
  pools["shuffle"] = new AudioPool("/sounds/shuffle.ogg", 3);
}

export const playSFX = (
  soundName:
    | "draw"
    | "summonMonster"
    | "summonSpell"
    | "laser"
    | "explosion"
    | "downCard"
    | "shuffle",
) => {
  if (typeof window !== "undefined" && pools[soundName]) {
    pools[soundName].play();
  }
};
