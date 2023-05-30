interface AppSettings {
  startTime: Date | null;
  endTime: Date | null;
  canVote: boolean | null;
  canAttend: boolean | null;
}

type ExtractValues<T> = T extends any ? T[keyof T] : never;

const settings = new Map<keyof AppSettings, ExtractValues<AppSettings>>();

const getSettings = () => ({
  startTime: settings.get("startTime") ?? null,
  endTime: settings.get("endTime") ?? null,
  canVote: settings.get("canVote") ?? null,
  canAttend: settings.get("canAttend") ?? null,
});

const updateBuilder = (
  key: keyof AppSettings,
  value: ExtractValues<AppSettings>
) => settings.set(key, value);

const updateSettings = {
  startTime: (time: Date) => updateBuilder("startTime", time),
  endTime: (time: Date) => updateBuilder("endTime", time),
  canVote: (votable: boolean) => updateBuilder("canVote", votable),
  canAttend: (attendable: boolean) => updateBuilder("canAttend", attendable),
} as const;

updateSettings.canAttend(true);
updateSettings.canVote(true);

updateSettings.startTime(new Date());
updateSettings.endTime(new Date());

console.log(getSettings());
