import { Buffer } from 'buffer';

import { NativeModules } from 'react-native';

const CommonCircleBridgeBare = NativeModules.CommonCircle as {
  downloadDiagnosisKeysFile(url: string): Promise<string>;
  getRandomBytes(size: number): Promise<string>;
};

export interface CommonCircleBridge {
  downloadDiagnosisKeysFile(url: string): Promise<string>;
  getRandomBytes(size: number): Promise<Buffer>;
}

export const downloadDiagnosisKeysFile = CommonCircleBridgeBare.downloadDiagnosisKeysFile;

export const getRandomBytes = async (size: number) => {
  const base64encoded = await CommonCircleBridgeBare.getRandomBytes(size);
  return Buffer.from(base64encoded, 'base64');
};
