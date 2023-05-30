import { EventEmitter } from "events";

interface AppSettings {
  startTime: Date | null;
  endTime: Date | null;
  canVote: boolean | null;
  canAttend: boolean | null;
}

type ExtractValues<T> = T extends any ? T[keyof T] : never;

class SettingsManager extends EventEmitter {
  private settingsMap: Map<keyof AppSettings, ExtractValues<AppSettings>>;

  constructor() {
    super();
    this.settingsMap = new Map<keyof AppSettings, ExtractValues<AppSettings>>();
  }

  get settings() {
    type DateOrUndef = Date | undefined;
    type BoolOrUndef = boolean | undefined;

    const startTime = this.settingsMap.get("startTime") as DateOrUndef;
    const endTime = this.settingsMap.get("endTime") as DateOrUndef;

    const canVote = this.settingsMap.get("canVote") as BoolOrUndef;
    const canAttend = this.settingsMap.get("canAttend") as BoolOrUndef;

    return {
      startTime: startTime ?? null,
      endTime: endTime ?? null,
      canVote: canVote ?? null,
      canAttend: canAttend ?? null,
    };
  }

  private updateBuilder(
    key: keyof AppSettings,
    value: ExtractValues<AppSettings>
  ): void {
    this.settingsMap.set(key, value);
    this.emit("settingsUpdated", this.settings);
  }

  updateSettings = {
    startTime: (time: Date) => this.updateBuilder("startTime", time),
    endTime: (time: Date) => this.updateBuilder("endTime", time),
    canVote: (votable: boolean) => this.updateBuilder("canVote", votable),
    canAttend: (attendable: boolean) =>
      this.updateBuilder("canAttend", attendable),
  };
}

const appSettingsManager = new SettingsManager();

appSettingsManager.on("settingsUpdated", (settings: AppSettings) => {
  console.log("Updated settings:", settings);
});

appSettingsManager.updateSettings.canAttend(true);
appSettingsManager.updateSettings.canVote(true);
appSettingsManager.updateSettings.startTime(new Date());
appSettingsManager.updateSettings.endTime(new Date());
