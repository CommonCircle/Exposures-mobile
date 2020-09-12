import {TemporaryExposureKey, ExposureConfiguration} from 'bridge/ExposureNotification';

export interface SubmissionKeySet {
  serverPublicKey: string;
  clientPrivateKey: string;
  clientPublicKey: string;
}

export interface BackendInterface {
  claimOneTimeCode(code: string): Promise<SubmissionKeySet>;
  reportDiagnosisKeys(submissionKeyPair: SubmissionKeySet, keys: TemporaryExposureKey[]): Promise<void>;
  retrieveDiagnosisKeys(period: number): Promise<string>;
  getExposureConfiguration(): Promise<ExposureConfiguration>;
}

// Key-server interface
export interface KeyBackendInterface {

}

// Verification-server interface
export interface VerificationBackendInterface {
  verify(code: string): Promise<>;
}
