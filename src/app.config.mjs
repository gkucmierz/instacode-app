
export { default as PACKAGE_JSON } from '../package.json' assert { type: 'json' };

export const APP_URL = 'https://instacode.app';
export const MAX_DATA_SIZE = 1e6;
export const ERROR_MAX_DATA_SIZE = 'Error: Output exceeded maximum size allowed';
import WELCOME_CODE_RAW from './welcome-payload.js?raw';
export const WELCOME_CODE = WELCOME_CODE_RAW;

// storage unique keys:
export const STORAGE_KEY_CODE = 'code';
export const STORAGE_KEY_SETTINGS = 'settings';

export const SHARE_CODE_ROUTE_NAME = 'run';
