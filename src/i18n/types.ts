export type Dictionary = {
  readonly [section: string]: {
    readonly [key: string]: string;
  };
};

export type TranslationKey = string;
