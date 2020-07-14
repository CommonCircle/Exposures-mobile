import React, {useCallback} from 'react';
import {useNavigation} from '@react-navigation/native';
import {ScrollView, StyleSheet, TouchableOpacity, Text as NativeText} from 'react-native';
import {Box, Text} from 'components';
import {useI18n} from '@shopify/react-i18n';

export const Permissions = () => {
  const [i18n] = useI18n();
  const navigation = useNavigation();
  const onPrivacy = useCallback(() => navigation.navigate('Privacy'), [navigation]);

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <Box paddingHorizontal="xl">
        <Box paddingHorizontal="l" marginTop="m">
          <Text
            variant="bodyTitle"
            color="overlaySectionTitle"
            marginHorizontal="l"
            marginBottom="l"
            textAlign="center"
            accessibilityRole="header"
          >
            {i18n.translate('OnboardingPermissions.Title')}
          </Text>
        </Box>
        <Box marginBottom="l">
          <Text variant="bodyText" color="overlayBodyText" textAlign="center">
            {i18n.translate('OnboardingPermissions.Body')}
          </Text>
        </Box>
        <Box marginBottom="l">
          <Text variant="bodyText" color="overlayBodyText" textAlign="center">
            {i18n.translate('OnboardingPermissions.Body2')}
          </Text>
        </Box>
        <Box marginBottom="l">
          <Text variant="bodyText" color="overlayBodyText" textAlign="center">
            {i18n.translate('OnboardingPermissions.Body3')}
          </Text>
        </Box>

        <Box marginBottom="l">
          <TouchableOpacity onPress={onPrivacy} style={styles.privacy_button}>
            <NativeText style={styles.privacy_text}>
              {i18n.translate('Info.Privacy')}
            </NativeText>
          </TouchableOpacity>
        </Box>
      </Box>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  privacy_button: {
    alignItems: 'center',
  },
  privacy_text: {
    color: '#5B5B5B',
    textDecorationLine: "underline",
    textDecorationStyle: "solid",
    textDecorationColor: '#5B5B5B'
  }
});
