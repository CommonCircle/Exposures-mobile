import React, {useCallback} from 'react';
import {Linking, StyleSheet} from 'react-native';
import {useI18n} from '@shopify/react-i18n';
import {Text, Button, Box, LastCheckedDisplay} from 'components';
import {captureException} from 'shared/log';

import {BaseHomeView} from '../components/BaseHomeView';

export const ExposureView = () => {
  const [i18n] = useI18n();
  const onAction = useCallback(() => {
    Linking.openURL(i18n.translate('Home.GuidanceUrl')).catch(error => captureException('OpenUrl', error));
  }, [i18n]);
  return (
    <BaseHomeView>
      <Text textAlign="center" variant="bodyTitle" color="bodyText" marginBottom="l" accessibilityRole="header" style={styles.pilot_title}>
        ***SIMULATION PILOT***
      </Text>
      <Text textAlign="center" variant="bodyTitle" color="bodyText" marginBottom="l" accessibilityRole="header" style={styles.pilot_title}>
        <Text style={styles.underline}>NOT</Text> real medical information
      </Text>
      <Text textAlign="center" variant="bodyTitle" color="bodyText" marginBottom="l" accessibilityRole="header">
        {i18n.translate('Home.ExposureDetected')}
        {/* No exposure detected */}
      </Text>
      <Text variant="bodyText" color="bodyText" textAlign="center">
        {i18n.translate('Home.ExposureDetectedDetailed')}
      </Text>
      <LastCheckedDisplay />
      <Box alignSelf="stretch" marginTop="s" marginBottom="s">
        <Button text={'Complete the survey'} variant="bigFlatWhite" externalLink onPress={
          () => {
            Linking.openURL("https://redcap.iths.org/surveys/?s=HAR3L8AF9A").catch(err => console.error('An error occurred', err));
          }
        } />
      </Box>
      <Text textAlign="center" variant="bodyTitle" color="bodyText" marginBottom="l" accessibilityRole="header" style={styles.pilot_title}>
        ***SIMULATION PILOT***
      </Text>
      <Text textAlign="center" variant="bodyTitle" color="bodyText" marginBottom="l" accessibilityRole="header" style={styles.pilot_title}>
        If questions about evaluation, please call: 206-616-0454
      </Text>
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
