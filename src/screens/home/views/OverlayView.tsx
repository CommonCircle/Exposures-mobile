import React, {useCallback} from 'react';
import {Linking} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {Box, InfoBlock, BoxProps} from 'components';
import {useI18n, I18n} from '@shopify/react-i18n';
import {SystemStatus, useStartExposureNotificationService} from 'services/ExposureNotificationService';
import {InfoShareView} from './InfoShareView';
import {StatusHeaderView} from './StatusHeaderView';
import {captureMessage} from 'shared/log';
import {
  useExposureStatus,
  useExposureNotificationService,
} from 'services/ExposureNotificationService';
import {TouchableOpacity, Text, StyleSheet} from 'react-native';

const SystemStatusOff = ({i18n}: {i18n: I18n}) => {
  const startExposureNotificationService = useStartExposureNotificationService();

  const enableExposureNotifications = useCallback(() => {
    startExposureNotificationService();
  }, [startExposureNotificationService]);

  return (
    <InfoBlock
      icon="icon-exposure-notifications-off"
      title={i18n.translate('OverlayOpen.ExposureNotificationCardStatus')}
      titleBolded={i18n.translate('OverlayOpen.ExposureNotificationCardStatusOff')}
      text={i18n.translate('OverlayOpen.ExposureNotificationCardBody')}
      button={{text: i18n.translate('OverlayOpen.ExposureNotificationCardAction'), action: enableExposureNotifications, variant: "bigFlatRed"}}
      backgroundColor="errorBackground"
      color="errorText"
    />
  );
};

const BluetoothStatusOff = ({i18n}: {i18n: I18n}) => {
  const toSettings = useCallback(() => {
    Linking.openSettings();
  }, []);
  return (
    <InfoBlock
      icon="icon-bluetooth-off"
      title={i18n.translate('OverlayOpen.BluetoothCardStatus')}
      titleBolded={i18n.translate('OverlayOpen.BluetoothCardStatusOff')}
      text={i18n.translate('OverlayOpen.BluetoothCardBody')}
      button={{text: i18n.translate('OverlayOpen.BluetoothCardAction'), action: toSettings, variant: "bigFlatRed"}}
      backgroundColor="errorBackground"
      color="errorText"
    />
  );
};

const NotificationStatusOff = ({action, i18n}: {action: () => void; i18n: I18n}) => {
  return (
    <InfoBlock
      icon="icon-notifications"
      title={i18n.translate('OverlayOpen.NotificationCardStatus')}
      titleBolded={i18n.translate('OverlayOpen.NotificationCardStatusOff')}
      text={i18n.translate('OverlayOpen.NotificationCardBody')}
      button={{text: i18n.translate('OverlayOpen.NotificationCardAction'), action, variant: "bigFlatWhiteOverlay"}}
      backgroundColor="infoBlockNeutralBackground"
      color="overlayBodyText"
    />
  );
};

interface Props extends Pick<BoxProps, 'maxWidth'> {
  status: SystemStatus;
  notificationWarning: boolean;
  turnNotificationsOn: () => void;
}

export const OverlayView = ({status, notificationWarning, turnNotificationsOn, maxWidth}: Props) => {
  const [i18n] = useI18n();
  const navigation = useNavigation();
  const exposureNotificationService = useExposureNotificationService();
  const [exposureStatus, updateExposureStatus] = useExposureStatus();

  return (
    <Box maxWidth={maxWidth}>
      <Box marginBottom="l">
        <StatusHeaderView enabled={status === SystemStatus.Active} />
      </Box>
      {status !== SystemStatus.Active && (
        <Box marginBottom="m" marginHorizontal="m">
          <SystemStatusOff i18n={i18n} />
        </Box>
      )}
      {status !== SystemStatus.Active && (
        <Box marginBottom="m" marginHorizontal="m">
          <BluetoothStatusOff i18n={i18n} />
        </Box>
      )}
      {notificationWarning && (
        <Box marginBottom="m" marginHorizontal="m">
          <NotificationStatusOff action={turnNotificationsOn} i18n={i18n} />
        </Box>
      )}
      <Box marginBottom="m" marginHorizontal="m">
        <InfoBlock
          icon="icon-enter-code"
          title={i18n.translate('OverlayOpen.EnterCodeCardTitle')}
          text={i18n.translate('OverlayOpen.EnterCodeCardBody')}
          button={{
            text: i18n.translate('OverlayOpen.EnterCodeCardAction'),
            action: () => navigation.navigate('DataSharing'),
          }}
          backgroundColor="infoBlockBrightBackground"
          color="overlayBodyText"
          iconColor="mainBackground"
        />
      </Box>
      <Box marginBottom="l" marginHorizontal="m">
        <InfoShareView />
      </Box>
      <Box marginTop="l" marginHorizontal="m">
        <TouchableOpacity
          style={styles.reset_button}
          onPress={async () => {
            captureMessage('Forcing refresh...');
            exposureNotificationService.exposureStatusUpdatePromise = null;
            exposureNotificationService.exposureStatus.set({type: 'monitoring'});
            updateExposureStatus();
          }}>
          <Text style={styles.reset_text}>Reset</Text>
        </TouchableOpacity>
      </Box>
    </Box>
  );
};

const styles = StyleSheet.create({
  reset_button: {
    backgroundColor: '#E83A3A',
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },
  reset_text: {
    fontFamily: 'Nunito',
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
  }
});
