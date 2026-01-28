import { getPassword, setPassword } from 'tauri-plugin-keyring-api';

const KEYRING_SERVICE = 'audixa-webdav';

export async function saveWebDavPassword(keyringKey: string, password: string) {
  await setPassword(KEYRING_SERVICE, keyringKey, password);
}

export async function readWebDavPassword(keyringKey: string) {
  return getPassword(KEYRING_SERVICE, keyringKey);
}
