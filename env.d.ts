declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_VAPID_PUBLIC: string;
  }
}

declare const process: {
  env: {
    NEXT_PUBLIC_VAPID_PUBLIC: string;
  };
};
