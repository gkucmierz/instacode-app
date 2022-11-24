
export const APP_URL = 'https://instacode.app';
export const MAX_DATA_SIZE = 1e5;
export const ERROR_MAX_DATA_SIZE = 'Error: Output exceeded maximum size allowed';
export const WELCOME_CODE = `
'Hello World!';

new Array(10).fill(0).map((_, i) => '#'.repeat(i+1));

2n ** 42n;

for (let i = 0; i < 42; ++i) {
  console.log(i);
}

`;

// storage unique keys:
export const STORAGE_KEY_CODE = 'code';
export const STORAGE_KEY_SETTINGS = 'settings';

export const SHARE_CODE_ROUTE_NAME = 'run';
