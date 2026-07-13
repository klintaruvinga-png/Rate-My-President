interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare interface ShareNavigator extends Navigator {
  share?: (data: {
    title?: string;
    text?: string;
    url?: string;
  }) => Promise<void>;
}
