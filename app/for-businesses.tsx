/**
 * Business Explainer Page
 *
 * Marketing page explaining Upright Money for local businesses
 * Optimized for both mobile and desktop browsers
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const isDesktop = width >= 768;

export default function ForBusinesses() {
  const handleSignUp = () => {
    router.push('/(auth)/sign-up');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={[styles.hero, isDesktop && styles.heroDesktop]}>
          <View style={[styles.heroContent, isDesktop && styles.heroContentDesktop]}>
            <Image
              source={require('@/assets/images/upright100s.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={[styles.heroTitle, isDesktop && styles.heroTitleDesktop]}>
              Connect with customers who share your values
            </Text>
            <Text style={[styles.heroSubtitle, isDesktop && styles.heroSubtitleDesktop]}>
              Turn your business values into your competitive advantage. Attract passionate customers, build lasting loyalty, and grow your community—all with zero upfront cost.
            </Text>
            <TouchableOpacity
              style={[styles.ctaButton, isDesktop && styles.ctaButtonDesktop]}
              onPress={handleSignUp}
            >
              <Text style={styles.ctaButtonText}>Get Started Free</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* How It Works Section */}
        <View style={[styles.section, isDesktop && styles.sectionDesktop]}>
          <Text style={[styles.sectionTitle, isDesktop && styles.sectionTitleDesktop]}>
            How It Works
          </Text>
          <View style={[styles.stepsContainer, isDesktop && styles.stepsContainerDesktop]}>
            <View style={[styles.step, isDesktop && styles.stepDesktop]}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={[styles.stepTitle, isDesktop && styles.stepTitleDesktop]}>
                Create Your Free Profile
              </Text>
              <Text style={[styles.stepDescription, isDesktop && styles.stepDescriptionDesktop]}>
                Sign up in minutes. Share what your business stands for—the causes, values, and communities you support.
              </Text>
            </View>

            <View style={[styles.step, isDesktop && styles.stepDesktop]}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={[styles.stepTitle, isDesktop && styles.stepTitleDesktop]}>
                Set Your Discount
              </Text>
              <Text style={[styles.stepDescription, isDesktop && styles.stepDescriptionDesktop]}>
                Choose a discount percentage for customers who share your values. You only pay a small 2.5% fee on completed transactions.
              </Text>
            </View>

            <View style={[styles.step, isDesktop && styles.stepDesktop]}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={[styles.stepTitle, isDesktop && styles.stepTitleDesktop]}>
                Get Discovered
              </Text>
              <Text style={[styles.stepDescription, isDesktop && styles.stepDescriptionDesktop]}>
                Customers searching for businesses that align with their values will find you—many for the first time.
              </Text>
            </View>

            <View style={[styles.step, isDesktop && styles.stepDesktop]}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>4</Text>
              </View>
              <Text style={[styles.stepTitle, isDesktop && styles.stepTitleDesktop]}>
                Build Loyalty
              </Text>
              <Text style={[styles.stepDescription, isDesktop && styles.stepDescriptionDesktop]}>
                Scan customer QR codes at checkout to apply discounts instantly. Watch as shared values turn first-time visitors into regulars.
              </Text>
            </View>
          </View>
        </View>

        {/* Benefits Section */}
        <View style={[styles.section, styles.benefitsSection, isDesktop && styles.sectionDesktop]}>
          <Text style={[styles.sectionTitle, isDesktop && styles.sectionTitleDesktop]}>
            Why Local Businesses Love Upright
          </Text>
          <View style={[styles.benefitsGrid, isDesktop && styles.benefitsGridDesktop]}>
            <View style={[styles.benefit, isDesktop && styles.benefitDesktop]}>
              <Text style={styles.benefitIcon}>🎯</Text>
              <Text style={[styles.benefitTitle, isDesktop && styles.benefitTitleDesktop]}>
                Attract New Customers
              </Text>
              <Text style={[styles.benefitDescription, isDesktop && styles.benefitDescriptionDesktop]}>
                Get discovered by customers actively searching for businesses that share their values—customers who didn't know you existed.
              </Text>
            </View>

            <View style={[styles.benefit, isDesktop && styles.benefitDesktop]}>
              <Text style={styles.benefitIcon}>💡</Text>
              <Text style={[styles.benefitTitle, isDesktop && styles.benefitTitleDesktop]}>
                Meaningful Insights
              </Text>
              <Text style={[styles.benefitDescription, isDesktop && styles.benefitDescriptionDesktop]}>
                Learn what your customers care about. See which values drive traffic and build deeper connections.
              </Text>
            </View>

            <View style={[styles.benefit, isDesktop && styles.benefitDesktop]}>
              <Text style={styles.benefitIcon}>🤝</Text>
              <Text style={[styles.benefitTitle, isDesktop && styles.benefitTitleDesktop]}>
                Authentic Connections
              </Text>
              <Text style={[styles.benefitDescription, isDesktop && styles.benefitDescriptionDesktop]}>
                Move beyond transactions. Build a community of customers who support your business because of what you stand for.
              </Text>
            </View>

            <View style={[styles.benefit, isDesktop && styles.benefitDesktop]}>
              <Text style={styles.benefitIcon}>📈</Text>
              <Text style={[styles.benefitTitle, isDesktop && styles.benefitTitleDesktop]}>
                Increase Traffic
              </Text>
              <Text style={[styles.benefitDescription, isDesktop && styles.benefitDescriptionDesktop]}>
                Turn values into visits. Customers will choose you over competitors when they know you share their beliefs.
              </Text>
            </View>

            <View style={[styles.benefit, isDesktop && styles.benefitDesktop]}>
              <Text style={styles.benefitIcon}>💰</Text>
              <Text style={[styles.benefitTitle, isDesktop && styles.benefitTitleDesktop]}>
                Zero Risk
              </Text>
              <Text style={[styles.benefitDescription, isDesktop && styles.benefitDescriptionDesktop]}>
                No monthly fees, no setup costs. Only pay a tiny 2.5% fee when you complete a transaction. That's it.
              </Text>
            </View>

            <View style={[styles.benefit, isDesktop && styles.benefitDesktop]}>
              <Text style={styles.benefitIcon}>⚡</Text>
              <Text style={[styles.benefitTitle, isDesktop && styles.benefitTitleDesktop]}>
                Instant Setup
              </Text>
              <Text style={[styles.benefitDescription, isDesktop && styles.benefitDescriptionDesktop]}>
                Create your profile, add your values, and start welcoming customers—all in under 10 minutes.
              </Text>
            </View>
          </View>
        </View>

        {/* Pricing Section */}
        <View style={[styles.section, isDesktop && styles.sectionDesktop]}>
          <Text style={[styles.sectionTitle, isDesktop && styles.sectionTitleDesktop]}>
            Simple, Transparent Pricing
          </Text>
          <View style={[styles.pricingCard, isDesktop && styles.pricingCardDesktop]}>
            <Text style={[styles.pricingAmount, isDesktop && styles.pricingAmountDesktop]}>
              2.5%
            </Text>
            <Text style={[styles.pricingDescription, isDesktop && styles.pricingDescriptionDesktop]}>
              That's all we charge—a small fee on completed transactions only
            </Text>
            <View style={styles.pricingFeatures}>
              <Text style={styles.pricingFeature}>✓ No monthly subscription</Text>
              <Text style={styles.pricingFeature}>✓ No setup fees</Text>
              <Text style={styles.pricingFeature}>✓ No hidden costs</Text>
              <Text style={styles.pricingFeature}>✓ Cancel anytime</Text>
            </View>
            <View style={styles.pricingExample}>
              <Text style={styles.pricingExampleTitle}>Example:</Text>
              <Text style={styles.pricingExampleText}>
                Customer spends $100 → You pay just $2.50
              </Text>
              <Text style={styles.pricingExampleSubtext}>
                (You keep the difference between your discount and our fee)
              </Text>
            </View>
          </View>
        </View>

        {/* CTA Section */}
        <View style={[styles.ctaSection, isDesktop && styles.ctaSectionDesktop]}>
          <Text style={[styles.ctaTitle, isDesktop && styles.ctaTitleDesktop]}>
            Ready to grow your community?
          </Text>
          <Text style={[styles.ctaSubtitle, isDesktop && styles.ctaSubtitleDesktop]}>
            Join local businesses who are turning their values into their strongest asset.
          </Text>
          <TouchableOpacity
            style={[styles.ctaButton, styles.ctaButtonLarge, isDesktop && styles.ctaButtonDesktop]}
            onPress={handleSignUp}
          >
            <Text style={styles.ctaButtonText}>Start For Free Today</Text>
          </TouchableOpacity>
          <Text style={styles.ctaDisclaimer}>
            No credit card required • Set up in minutes
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Questions? Contact us at support@upright.money
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },

  // Hero Section
  hero: {
    backgroundColor: '#1a1a2e',
    paddingVertical: 60,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  heroDesktop: {
    paddingVertical: 100,
    paddingHorizontal: 60,
  },
  heroContent: {
    maxWidth: 600,
    alignItems: 'center',
  },
  heroContentDesktop: {
    maxWidth: 900,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 30,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 40,
  },
  heroTitleDesktop: {
    fontSize: 56,
    lineHeight: 68,
    marginBottom: 30,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#E0E0E0',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  heroSubtitleDesktop: {
    fontSize: 20,
    lineHeight: 32,
    marginBottom: 40,
  },

  // Buttons
  ctaButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  ctaButtonDesktop: {
    paddingVertical: 20,
    paddingHorizontal: 48,
  },
  ctaButtonLarge: {
    minWidth: 250,
    alignItems: 'center',
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },

  // Sections
  section: {
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  sectionDesktop: {
    paddingVertical: 80,
    paddingHorizontal: 60,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a2e',
    textAlign: 'center',
    marginBottom: 40,
  },
  sectionTitleDesktop: {
    fontSize: 42,
    marginBottom: 60,
  },

  // How It Works
  stepsContainer: {
    gap: 32,
  },
  stepsContainerDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 40,
    maxWidth: 1200,
    alignSelf: 'center',
  },
  step: {
    alignItems: 'center',
  },
  stepDesktop: {
    width: '45%',
    minWidth: 300,
  },
  stepNumber: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepNumberText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepTitleDesktop: {
    fontSize: 24,
  },
  stepDescription: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
  },
  stepDescriptionDesktop: {
    fontSize: 16,
    lineHeight: 26,
  },

  // Benefits
  benefitsSection: {
    backgroundColor: '#F5F5F5',
  },
  benefitsGrid: {
    gap: 24,
  },
  benefitsGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 32,
    maxWidth: 1200,
    alignSelf: 'center',
  },
  benefit: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  benefitDesktop: {
    width: '30%',
    minWidth: 280,
  },
  benefitIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  benefitTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 8,
    textAlign: 'center',
  },
  benefitTitleDesktop: {
    fontSize: 20,
  },
  benefitDescription: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
  },
  benefitDescriptionDesktop: {
    fontSize: 15,
    lineHeight: 24,
  },

  // Pricing
  pricingCard: {
    backgroundColor: '#F5F5F5',
    padding: 40,
    borderRadius: 20,
    maxWidth: 500,
    alignSelf: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#4CAF50',
  },
  pricingCardDesktop: {
    padding: 60,
    maxWidth: 600,
  },
  pricingAmount: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  pricingAmountDesktop: {
    fontSize: 96,
  },
  pricingDescription: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 32,
  },
  pricingDescriptionDesktop: {
    fontSize: 18,
  },
  pricingFeatures: {
    gap: 12,
    marginBottom: 32,
    width: '100%',
  },
  pricingFeature: {
    fontSize: 16,
    color: '#1a1a2e',
    fontWeight: '600',
  },
  pricingExample: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    width: '100%',
  },
  pricingExampleTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 8,
  },
  pricingExampleText: {
    fontSize: 16,
    color: '#1a1a2e',
    marginBottom: 4,
  },
  pricingExampleSubtext: {
    fontSize: 12,
    color: '#666666',
    fontStyle: 'italic',
  },

  // CTA Section
  ctaSection: {
    paddingVertical: 60,
    paddingHorizontal: 20,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
  },
  ctaSectionDesktop: {
    paddingVertical: 100,
    paddingHorizontal: 60,
  },
  ctaTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  ctaTitleDesktop: {
    fontSize: 42,
    marginBottom: 24,
  },
  ctaSubtitle: {
    fontSize: 16,
    color: '#E0E0E0',
    textAlign: 'center',
    marginBottom: 32,
    maxWidth: 600,
  },
  ctaSubtitleDesktop: {
    fontSize: 20,
    marginBottom: 40,
  },
  ctaDisclaimer: {
    fontSize: 14,
    color: '#B0B0B0',
    marginTop: 16,
    textAlign: 'center',
  },

  // Footer
  footer: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
});
