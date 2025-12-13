import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';

interface PaywallScreenProps {
  onRestore?: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Theme colors matching web app
const COLORS = {
  background: '#0F172A',
  backgroundSecondary: '#1E293B',
  primary: '#3B82F6',
  primaryHover: '#2563EB',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  border: '#334155',
  card: 'rgba(30, 41, 59, 0.8)',
  cardSolid: '#1E293B',
  success: '#10B981',
  error: '#EF4444',
};

const FEATURES = [
  {
    icon: '🎯',
    title: 'Unlimited Practice',
    description: 'Practice as much as you want, anytime',
  },
  {
    icon: '🎙️',
    title: 'AI-Powered Feedback',
    description: 'Real-time pronunciation & fluency analysis',
  },
  {
    icon: '📰',
    title: 'Daily Tech News',
    description: 'Fresh AI & tech content updated daily',
  },
  {
    icon: '📊',
    title: 'Progress Tracking',
    description: 'Track your improvement over time',
  },
  {
    icon: '🔊',
    title: 'Text-to-Speech',
    description: 'Listen to native pronunciation',
  },
];

export default function PaywallScreen({ onRestore }: PaywallScreenProps) {
  const { accessStatus, refreshAccessStatus, signOut } = useAuth();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const handlePurchase = async () => {
    setIsPurchasing(true);
    try {
      // TODO: Implement actual IAP purchase
      Alert.alert(
        'Coming Soon',
        'In-app purchases will be available in the next update.'
      );
    } catch (error) {
      Alert.alert('Error', 'Purchase failed. Please try again.');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      await refreshAccessStatus();

      if (accessStatus?.has_access) {
        Alert.alert('Success', 'Your purchase has been restored!');
        onRestore?.();
      } else {
        Alert.alert('No Purchase Found', 'No previous purchase was found for this account.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.background, COLORS.backgroundSecondary, COLORS.background]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Text style={styles.headerIcon}>🎙️</Text>
          </View>
          <Text style={styles.title}>Upgrade to Pro</Text>
          <Text style={styles.subtitle}>
            Your free trial has ended. Unlock unlimited access to continue your speaking journey.
          </Text>
        </View>

        {/* Features Card - Semi-transparent */}
        <View style={styles.featuresCard}>
          <Text style={styles.featuresTitle}>Everything you need</Text>

          {FEATURES.map((feature, index) => (
            <View key={index} style={styles.feature}>
              <View style={styles.featureIconContainer}>
                <Text style={styles.featureIcon}>{feature.icon}</Text>
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureName}>{feature.title}</Text>
                <Text style={styles.featureDesc}>{feature.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Pricing Card */}
        <View style={styles.pricingCard}>
          <View style={styles.pricingBadge}>
            <Text style={styles.pricingBadgeText}>BEST VALUE</Text>
          </View>
          <Text style={styles.pricingTitle}>Lifetime Access</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>$4.99</Text>
            <Text style={styles.pricePeriod}>one-time</Text>
          </View>
          <Text style={styles.priceNote}>No subscription. No recurring fees. Forever.</Text>
        </View>

        {/* Purchase Button */}
        <TouchableOpacity
          style={styles.purchaseButton}
          onPress={handlePurchase}
          disabled={isPurchasing || isRestoring}
          activeOpacity={0.8}
        >
          {isPurchasing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.purchaseButtonText}>
              Unlock ProSpeaker - $4.99
            </Text>
          )}
        </TouchableOpacity>

        {/* Restore Purchases */}
        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestore}
          disabled={isPurchasing || isRestoring}
        >
          {isRestoring ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <Text style={styles.restoreButtonText}>
              Restore Purchase
            </Text>
          )}
        </TouchableOpacity>

        {/* Footer Links */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={() => {}}>
            <Text style={styles.footerLink}>Terms of Service</Text>
          </TouchableOpacity>
          <Text style={styles.footerDivider}>•</Text>
          <TouchableOpacity onPress={() => {}}>
            <Text style={styles.footerLink}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>

        {/* Sign Out Option */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={() => {
            Alert.alert(
              'Sign Out',
              'Are you sure you want to sign out?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign Out', style: 'destructive', onPress: signOut },
              ]
            );
          }}
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: SCREEN_HEIGHT * 0.08,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    marginBottom: 16,
  },
  headerIcon: {
    fontSize: 36,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  featuresCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureIcon: {
    fontSize: 20,
  },
  featureText: {
    flex: 1,
  },
  featureName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  pricingCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    marginBottom: 20,
  },
  pricingBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  pricingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  pricingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  price: {
    fontSize: 48,
    fontWeight: '700',
    color: COLORS.text,
  },
  pricePeriod: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  priceNote: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 8,
  },
  purchaseButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  purchaseButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
  },
  restoreButton: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  restoreButtonText: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  footerLink: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  footerDivider: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginHorizontal: 12,
  },
  signOutButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  signOutText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
});
