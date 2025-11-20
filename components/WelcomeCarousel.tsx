/**
 * WelcomeCarousel Component
 * Shows a 3-slide intro to the app for first-time users
 */
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  ScrollView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
} from 'react-native';
import { TrendingUp, List, Percent, X } from 'lucide-react-native';
import { lightColors, darkColors } from '@/constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface WelcomeCarouselProps {
  visible: boolean;
  onComplete: () => void;
  isDarkMode?: boolean;
}

interface Slide {
  icon: any;
  title: string;
  description: string;
  color: string;
}

const slides: Slide[] = [
  {
    icon: TrendingUp,
    title: 'Vote With Your Money',
    description: 'We give you the best ways to vote with your money based on your values.',
    color: '#10B981', // green
  },
  {
    icon: List,
    title: 'Build Your Endorsements',
    description: 'Build your list of endorsements of brands and local businesses you support.',
    color: '#3B82F6', // blue
  },
  {
    icon: Percent,
    title: 'Collect Discounts',
    description: 'Collect discounts at businesses in exchange for your endorsement, following or simply being on our app!',
    color: '#8B5CF6', // purple
  },
];

export default function WelcomeCarousel({ visible, onComplete, isDarkMode = false }: WelcomeCarouselProps) {
  const colors = isDarkMode ? darkColors : lightColors;
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentSlide(slideIndex);
  };

  const goToSlide = (index: number) => {
    scrollViewRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
    setCurrentSlide(index);
  };

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      goToSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleSkip}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Skip button */}
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          activeOpacity={0.7}
        >
          <X size={24} color={colors.textSecondary} strokeWidth={2} />
        </TouchableOpacity>

        {/* Slides */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.scrollView}
        >
          {slides.map((slide, index) => {
            const Icon = slide.icon;
            return (
              <View key={index} style={[styles.slide, { width: SCREEN_WIDTH }]}>
                <View style={styles.slideContent}>
                  {/* Icon */}
                  <View style={[styles.iconContainer, { backgroundColor: slide.color + '20' }]}>
                    <Icon size={64} color={slide.color} strokeWidth={1.5} />
                  </View>

                  {/* Title */}
                  <Text style={[styles.title, { color: colors.text }]}>
                    {slide.title}
                  </Text>

                  {/* Description */}
                  <Text style={[styles.description, { color: colors.textSecondary }]}>
                    {slide.description}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Bottom section with dots and button */}
        <View style={styles.bottomSection}>
          {/* Pagination dots */}
          <View style={styles.pagination}>
            {slides.map((_, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dot,
                  {
                    backgroundColor: currentSlide === index ? colors.primary : colors.border,
                    width: currentSlide === index ? 24 : 8,
                  },
                ]}
                onPress={() => goToSlide(index)}
                activeOpacity={0.7}
              />
            ))}
          </View>

          {/* Next/Get Started button */}
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text style={[styles.buttonText, { color: colors.white }]}>
              {currentSlide === slides.length - 1 ? "Let's Go!" : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  slideContent: {
    alignItems: 'center',
    maxWidth: 400,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 36,
  },
  description: {
    fontSize: 17,
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 10,
  },
  bottomSection: {
    paddingHorizontal: 40,
    paddingBottom: Platform.OS === 'ios' ? 50 : 40,
    alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 32,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    transition: 'all 0.3s',
  },
  button: {
    width: '100%',
    maxWidth: 320,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
  },
});
