import React, { useCallback } from 'react';
import { Linking, StyleSheet } from 'react-native';
import { useI18n } from '@shopify/react-i18n';
import { Text, Button, Box, LastCheckedDisplay } from 'components';
import { captureException } from 'shared/log';

import { BaseHomeView } from '../components/BaseHomeView';

export const ExposureView = () => {
  const [i18n] = useI18n();
  const onAction = useCallback(() => {
    Linking.openURL(i18n.translate('Home.GuidanceUrl')).catch(err => console.error('An error occurred', err));
  }, [i18n]);
  const onGuidanceAction = useCallback(() => {
    Linking.openURL(i18n.translate('Home.ExposureGuidanceUrl')).catch(err => console.error('An error occurred', err));
  }, [i18n]);
  return (
    <BaseHomeView>
      <Text textAlign="center" variant="bodyTitle" color="bodyText" marginBottom="l" accessibilityRole="header">
        {i18n.translate('Home.ExposureDetected')}
        {/* No exposure detected */}
      </Text>
      <Text variant="bodyText" color="bodyText" textAlign="center">
        {i18n.translate('Home.ExposureDetectedDetailed')}
      </Text>
      <Box alignSelf="stretch" marginTop="l">
        <Button text={i18n.translate('Home.ExposureGuidanceText')} color="bodyText" variant="bigHollow" externalLink onPress={onGuidanceAction} />
      </Box>
      <Box alignSelf="stretch" marginTop="l">
        <Button text={i18n.translate('Home.SeeGuidance')} color="bodyText" variant="bigHollow" externalLink onPress={onAction} />
      </Box>
      <LastCheckedDisplay />
    </BaseHomeView>
  );
};

const styles = StyleSheet.create({
  pilot_title: {
    fontWeight: 'bold',
    fontSize: 24,
  },
  underline: {
    textDecorationLine: "underline",
    textDecorationStyle: "solid",
    textDecorationColor: 'white'
  }
});
