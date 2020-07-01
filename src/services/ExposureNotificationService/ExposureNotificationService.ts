import ExposureNotification, {ExposureSummary, Status as SystemStatus} from 'bridge/ExposureNotification';
import PushNotification from 'bridge/PushNotification';
import {addDays, daysBetween, periodSinceEpoch} from 'shared/date-fns';
import {I18n} from '@shopify/react-i18n';
import {Observable, MapObservable} from 'shared/Observable';

import {BackendInterface, SubmissionKeySet} from '../BackendService';

const SUBMISSION_AUTH_KEYS = 'submissionAuthKeys';

const SECURE_OPTIONS = {
  sharedPreferencesName: 'covidShieldSharedPreferences',
  keychainService: 'covidShieldKeychain',
};

export const EXPOSURE_STATUS = 'exposureStatus';

const hoursPerPeriod = 24;

const EXPOSURE_NOTIFICATION_CYCLE = 14;

export {SystemStatus};

export type ExposureStatus =
  | {
      type: 'monitoring';
      lastChecked?: number;
    }
  | {
      type: 'exposed';
      summary: ExposureSummary;
      lastChecked?: number;
    }
  | {
      type: 'diagnosed';
      needsSubmission: boolean;
      submissionLastCompletedAt?: number;
      cycleStartsAt: number;
      cycleEndsAt: number;
      lastChecked?: number;
    };

export interface PersistencyProvider {
  setItem(key: string, value: string): Promise<void>;
  getItem(key: string): Promise<string | null>;
}

export interface SecurePersistencyProvider {
  setItem(key: string, value: string, options: SecureStorageOptions): Promise<null>;
  getItem(key: string, options: SecureStorageOptions): Promise<string | null>;
}

export interface SecureStorageOptions {
  keychainService?: string;
  sharedPreferencesName?: string;
}

export class ExposureNotificationService {
  systemStatus: Observable<SystemStatus>;
  exposureStatus: MapObservable<ExposureStatus>;

  private starting = false;

  private exposureNotification: typeof ExposureNotification;
  private backendInterface: BackendInterface;

  private i18n: I18n;
  private storage: PersistencyProvider;
  private secureStorage: SecurePersistencyProvider;

  private exposureStatusUpdatePromise: Promise<void> | null = null;

  constructor(
    backendInterface: BackendInterface,
    i18n: I18n,
    storage: PersistencyProvider,
    secureStorage: SecurePersistencyProvider,
    exposureNotification: typeof ExposureNotification,
  ) {
    this.i18n = i18n;
    this.exposureNotification = exposureNotification;
    this.systemStatus = new Observable<SystemStatus>(SystemStatus.Undefined);
    this.exposureStatus = new MapObservable<ExposureStatus>({type: 'monitoring'});
    this.backendInterface = backendInterface;
    this.storage = storage;
    this.secureStorage = secureStorage;
    this.exposureStatus.observe(status => {
      this.storage.setItem(EXPOSURE_STATUS, JSON.stringify(status));
    });
  }

  async init() {
    const exposureStatus = JSON.parse((await this.storage.getItem(EXPOSURE_STATUS)) || 'null');
    this.exposureStatus.append(exposureStatus || {});
  }

  async start(): Promise<void> {
    if (this.starting) {
      return;
    }
    this.starting = true;

    await this.init();

    try {
      await this.exposureNotification.start();
    } catch (_) {
      this.systemStatus.set(SystemStatus.Unknown);
      return;
    }

    await this.updateSystemStatus();
    await this.updateExposureStatus();

    this.starting = false;
  }

  async updateSystemStatus(): Promise<void> {
    const status = await this.exposureNotification.getStatus();
    this.systemStatus.set(status);
  }

  async updateExposureStatusInBackground() {
    const lastStatus = this.exposureStatus.get();
    await this.updateExposureStatus();
    const currentStatus = this.exposureStatus.get();
    if (lastStatus.type === 'monitoring' && currentStatus.type === 'exposed') {
      PushNotification.presentLocalNotification({
        alertTitle: this.i18n.translate('Notification.ExposedMessageTitle'),
        alertBody: this.i18n.translate('Notification.ExposedMessageBody'),
      });
    }
    if (currentStatus.type === 'diagnosed' && currentStatus.needsSubmission) {
      PushNotification.presentLocalNotification({
        alertTitle: this.i18n.translate('Notification.DailyUploadNotificationTitle'),
        alertBody: this.i18n.translate('Notification.DailyUploadNotificationBody'),
      });
    }
  }

  async updateExposureStatus(): Promise<void> {
    if (this.exposureStatusUpdatePromise) return this.exposureStatusUpdatePromise;
    const cleanUpPromise = <T>(input: T): T => {
      this.exposureStatusUpdatePromise = null;
      return input;
    };
    this.exposureStatusUpdatePromise = this.performExposureStatusUpdate().then(cleanUpPromise, cleanUpPromise);
    return this.exposureStatusUpdatePromise;
  }

  async startKeysSubmission(oneTimeCode: string): Promise<void> {
    const keys = await this.backendInterface.claimOneTimeCode(oneTimeCode);
    const serialized = JSON.stringify(keys);
    await this.secureStorage.setItem(SUBMISSION_AUTH_KEYS, serialized, SECURE_OPTIONS);
    const cycleStartAt = new Date();
    this.exposureStatus.append({
      type: 'diagnosed',
      needsSubmission: true,
      cycleStartsAt: cycleStartAt.getTime(),
      cycleEndsAt: addDays(cycleStartAt, EXPOSURE_NOTIFICATION_CYCLE).getTime(),
    });
  }

  async fetchAndSubmitKeys(): Promise<void> {
    const submissionKeysStr = await this.secureStorage.getItem(SUBMISSION_AUTH_KEYS, SECURE_OPTIONS);
    if (!submissionKeysStr) {
      throw new Error('No Upload keys found, did you forget to claim one-time code?');
    }
    const auth = JSON.parse(submissionKeysStr) as SubmissionKeySet;
    const diagnosisKeys = await this.exposureNotification.getTemporaryExposureKeyHistory();

    await this.backendInterface.reportDiagnosisKeys(auth, diagnosisKeys);
    await this.recordKeySubmission();
  }

  private async *keysSinceLastFetch(lastFetchDate?: Date): AsyncGenerator<string | null> {
    const runningDate = new Date();

    const lastCheckPeriod = periodSinceEpoch(
      lastFetchDate || addDays(runningDate, -EXPOSURE_NOTIFICATION_CYCLE),
      hoursPerPeriod,
    );
    let runningPeriod = periodSinceEpoch(runningDate, hoursPerPeriod);

    while (runningPeriod > lastCheckPeriod) {
      try {
        yield await this.backendInterface.retrieveDiagnosisKeys(runningPeriod);
      } catch (err) {
        console.log('>>> error while downloading key file:', err);
      }

      runningPeriod -= 1;
    }
  }

  private async recordKeySubmission() {
    const currentStatus = this.exposureStatus.get();
    if (currentStatus.type !== 'diagnosed') return;
    this.exposureStatus.append({needsSubmission: false, submissionLastCompletedAt: new Date().getTime()});
  }

  private async calculateNeedsSubmission(): Promise<boolean> {
    const exposureStatus = this.exposureStatus.get();
    if (exposureStatus.type !== 'diagnosed') return false;

    const lastSubmittedStr = exposureStatus.submissionLastCompletedAt;
    if (!lastSubmittedStr) return true;

    const submissionCycleEnds = addDays(new Date(exposureStatus.cycleStartsAt), EXPOSURE_NOTIFICATION_CYCLE);
    const lastSubmittedDay = new Date(lastSubmittedStr);
    const today = new Date();

    if (daysBetween(lastSubmittedDay, submissionCycleEnds) <= 0) {
      // we're done submitting keys
      return false;
    } else if (daysBetween(lastSubmittedDay, today) > 0) {
      return true;
    }
    return false;
  }

  private async performExposureStatusUpdate(): Promise<void> {
    const exposureConfiguration = await this.backendInterface.getExposureConfiguration();
    const lastCheckDate = await (async () => {
      const timestamp = this.exposureStatus.get().lastChecked;
      if (timestamp) {
        return new Date(timestamp);
      }
      return undefined;
    })();

    const finalize = async (status: Partial<ExposureStatus> = {}) => {
      const timestamp = new Date().getTime();
      this.exposureStatus.append({...status, lastChecked: timestamp});
    };

    const currentStatus = this.exposureStatus.get();
    if (currentStatus.type === 'diagnosed') {
      return finalize({needsSubmission: await this.calculateNeedsSubmission()});
    } else if (
      currentStatus.type === 'exposed' &&
      currentStatus.summary.daysSinceLastExposure >= EXPOSURE_NOTIFICATION_CYCLE
    ) {
      return finalize({type: 'monitoring'});
    }

    const keysFileUrls: string[] = [];
    const generator = this.keysSinceLastFetch(lastCheckDate);
    while (true) {
      const {value: keysFileUrl, done} = await generator.next();
      if (done) break;
      if (!keysFileUrl) continue;
      keysFileUrls.push(keysFileUrl);
    }

    try {
      const summary = await this.exposureNotification.detectExposure(exposureConfiguration, keysFileUrls);
      if (summary.matchedKeyCount > 0) {
        return finalize({type: 'exposed', summary});
      }
    } catch (error) {
      console.log('>>> detectExposure', error);
    }

    return finalize();
  }
}
