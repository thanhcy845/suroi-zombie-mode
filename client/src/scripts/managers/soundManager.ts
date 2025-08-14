import { Layer } from "@common/constants";
// import { equalLayer, isGroundLayer } from "@common/utils/layer";
import { Numeric } from "@common/utils/math";
import { Vec, type Vector } from "@common/utils/vector";
import { Game } from "../game";
// add a namespace to pixi sound imports because it has annoying generic names like "sound" and "filters" without a namespace
import * as PixiSound from "@pixi/sound";
import type { AudioSpritesheetImporter } from "../../../vite/plugins/audio-spritesheet-plugin";
import { GameConsole } from "../console/gameConsole";
import type { Tween } from "../utils/tween";

export interface SoundOptions {
    position?: Vector
    falloff: number
    layer: Layer | number
    maxRange: number
    loop: boolean
    speed?: number
    /**
     * If the sound volume and panning will be updated
     * when the camera position changes after it started playing
     */
    dynamic: boolean
    ambient: boolean
    onEnd?: () => void
}

PixiSound.sound.disableAutoPause = true;

export class GameSound {
    id: string;
    name: string;
    position?: Vector;
    falloff: number;
    maxRange: number;
    layer: Layer | number;
    speed: number;
    onEnd?: () => void;

    readonly dynamic: boolean;
    readonly ambient: boolean;

    get managerVolume(): number { return this.ambient ? SoundManager.ambienceVolume : SoundManager.sfxVolume; }

    // acts as multiplier
    volume = 1;
    layerMult = 1;

    layerVolumeTween?: Tween<GameSound>;

    instance?: PixiSound.IMediaInstance;
    readonly stereoFilter: PixiSound.filters.StereoFilter;

    ended = false;

    constructor(id: string, name: string, options: SoundOptions) {
        this.id = id;
        this.name = name;
        this.position = options.position;
        this.falloff = options.falloff;
        this.maxRange = options.maxRange;
        this.layer = options.layer;
        this.speed = options.speed ?? 1;
        this.dynamic = options.dynamic;
        this.ambient = options.ambient;
        this.onEnd = options.onEnd;
        this.stereoFilter = new PixiSound.filters.StereoFilter(0);

        if (!PixiSound.sound.exists(id)) {
            console.warn(`Unknown sound with name ${id}`);
            return;
        }

        const instanceOrPromise = PixiSound.sound.play(id, {
            loaded: (_err, _sound, instance) => {
                if (instance) this.init(instance);
            },
            filters: [this.stereoFilter],
            loop: options.loop,
            volume: this.managerVolume * this.volume,
            speed: this.speed
        });

        // PixiSound.sound.play returns a promise if the sound has not finished loading
        if (!(instanceOrPromise instanceof Promise)) {
            this.init(instanceOrPromise);
        }
    }

    init(instance: PixiSound.IMediaInstance): void {
        this.instance = instance;
        instance.on("end", () => {
            this.onEnd?.();
            this.ended = true;
        });
        instance.on("stop", () => {
            this.ended = true;
        });
        this.updateLayer(true);
        this.update();
    }

    update(): void {
        if (!this.instance) return;

        if (this.position) {
            const diff = Vec.sub(SoundManager.position, this.position);

            this.instance.volume = (
                1 - Numeric.clamp(Math.abs(Vec.len(diff) / this.maxRange), 0, 1)
            ) ** (1 + this.falloff * 2) * this.managerVolume * this.volume * this.layerMult;

            this.stereoFilter.pan = Numeric.clamp(-diff.x / this.maxRange, -1, 1);
        } else {
            this.instance.volume = this.managerVolume * this.volume * this.layerMult;
        }
    }

    updateLayer(initial = false): void {
        if (!this.instance) return;

        let layerMult = 1;
        const layerDelta = this.ambient // ambient sounds only decrease in volume underground
            ? this.layer - Game.layer
            : Math.abs(this.layer - Game.layer);
        if (layerDelta === 1) {
            layerMult = 0.5;
        } else if (layerDelta >= 2) {
            layerMult = 0.15;
        }

        if (initial) {
            this.layerMult = layerMult;
            return;
        }

        this.layerVolumeTween?.kill();
        this.layerVolumeTween = Game.addTween<GameSound>({
            target: this,
            to: { layerMult },
            duration: 500,
            onComplete: () => {
                this.layerVolumeTween = undefined;
            }
        });
    }

    setPaused(paused: boolean): void {
        if (this.instance) this.instance.paused = paused;
    }

    stop(): void {
        // trying to stop a sound that already ended or was stopped will stop a random sound
        // (maybe a bug? idk)
        if (this.ended) return;
        this.instance?.stop();
        this.ended = true;
    }
}

class SoundManagerClass {
    readonly updatableSounds = new Set<GameSound>();

    sfxVolume = 0;
    ambienceVolume = 0;

    position = Vec(0, 0);

    private _initialized = false;
    async init(): Promise<void> {
        if (this._initialized) {
            throw new Error("SoundManager has already been initialized");
        }
        this._initialized = true;

        this.sfxVolume = GameConsole.getBuiltInCVar("cv_sfx_volume");
        this.ambienceVolume = GameConsole.getBuiltInCVar("cv_ambience_volume");

        const { importSpritesheet } = await import("virtual:audio-spritesheet-importer") as AudioSpritesheetImporter;
        const { filename, spritesheet } = await importSpritesheet(Game.modeName);
        const audio = await (await fetch(filename)).arrayBuffer();
        let offset = 0;
        for (const [id, length] of Object.entries(spritesheet)) {
            this.addSound(id, { source: audio.slice(offset, offset + length) });
            offset += length;
        }

        const { noPreloadSounds } = await import("virtual:audio-spritesheet-no-preload") as { noPreloadSounds: string[] };
        for (const id of noPreloadSounds) {
            this.addSound(id, { url: `./audio/game/no-preload/${id}.mp3`, preload: false });
        }
    }

    addSound(id: string, opts: Partial<PixiSound.Options>): void {
        /**
         * For some reason, PIXI will call the `loaded` callback twice
         * when an error occurs…
         */
        let called = false;

        PixiSound.sound.add(id, {
            ...opts,
            loaded(error: Error | null) {
                // despite what the pixi typings say, logging `error` shows that it can be null
                if (error !== null && !called) {
                    called = true;
                    console.warn(`Failed to load sound '${id}'\nError object provided below`);
                    console.error(error);
                }
            }
        });
    }

    update(): void {
        for (const sound of this.updatableSounds) {
            if (sound.ended) {
                this.updatableSounds.delete(sound);
                continue;
            }
            sound.update();
        }
    }

    has(name: string): boolean {
        return PixiSound.sound.exists(name);
    }

    play(name: string, options?: Partial<SoundOptions>): GameSound {
        const sound = new GameSound(name, name, {
            falloff: 1,
            maxRange: 256,
            dynamic: false,
            ambient: false,
            layer: Game.layer,
            loop: false,
            ...options
        });

        if (sound.dynamic || sound.ambient) {
            this.updatableSounds.add(sound);
        }

        return sound;
    }

    stopAll(): void {
        PixiSound.sound.stopAll();
        this.updatableSounds.clear();
    }
}

export const SoundManager = new SoundManagerClass();
