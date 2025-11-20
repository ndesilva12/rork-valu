import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Platform,
} from 'react-native';
import { DollarSign, Heart, Sparkles, Gift } from 'lucide-react-native';
import { lightColors, darkColors } from '@/constants/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CAROUSEL_WIDTH = Math.min(SCREEN_WIDTH - 40, 500);

interface WelcomeCarouselProps {
  visible: boolean;
  onComplete: () => void;
  isDarkMode: boolean;
}

const slides = [
  {
    icon: DollarSign,
    title: 'Vote With Your Money',
    description: 'We give you the best ways to vote with your money based on your values.',
    color: '#10B981', // green
  },
  {
    icon: Heart,
    title: 'Build Your Library',
    description: 'Build your list of endorsements of brands and local businesses you support.',
    color: '#EF4444', // red
  },
  {
    icon: Sparkles,
    title: 'Discover & Connect',
    description: 'Use the Value Machine or find your friends in order to discover new brands or gift ideas.',
    color: '#8B5CF6', // purple
  },
  {
    icon: Gift,
    title: 'Earn Rewards',
    description: 'Collect discounts at businesses in exchange for your endorsement, following or simply being on our app!',
    color: '#F59E0B', // orange
  },
];

export default function WelcomeCarousel({ visible, onComplete, isDarkMode }: WelcomeCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const colors = isDarkMode ? darkColors : lightColors;

  const handleScroll = (event: any) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / CAROUSEL_WIDTH);
    setCurrentSlide(slideIndex);
  };

  const goToSlide = (index: number) => {
    scrollViewRef.current?.scrollTo({ x: index * CAROUSEL_WIDTH, animated: true });
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

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onComplete}
    >
      <View style={styles.overlay}>
        <View style={[styles.carouselCard, { backgroundColor: colors.background }]}>
          {/* Skip Button */}
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            activeOpacity={0.7}
          >
            <Text style={[styles.skipText, { color: colors.textSecondary }]}>Skip</Text>
          </TouchableOpacity>

          {/* Slides Container */}
          <View style={styles.slidesContainer}>
            <ScrollView
              ref={scrollViewRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
            >
              {slides.map((slide, index) => {
                const Icon = slide.icon;
                return (
                  <View key={index} style={[styles.slide, { width: CAROUSEL_WIDTH }]}>
                    <View style={[styles.iconCircle, { backgroundColor: `${slide.color}20` }]}>
                      <Icon size={64} color={slide.color} strokeWidth={2} />
                    </View>
                    <Text style={[styles.slideTitle, { color: colors.text }]}>
                      {slide.title}
                    </Text>
                    <Text style={[styles.slideDescription, { color: colors.textSecondary }]}>
                      {slide.description}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>

          {/* Pagination Dots */}
          <View style={styles.pagination}>
            {slides.map((_, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => goToSlide(index)}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <View
                  style={[
                    styles.dot,
                    {
                      backgroundColor: currentSlide === index ? colors.primary : colors.neutral,
                      width: currentSlide === index ? 24 : 8,
                    },
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Next/Get Started Button */}
          <TouchableOpacity
            style={[styles.nextButton, { backgroundColor: colors.primary }]}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text style={[styles.nextButtonText, { color: colors.white }]}>
              {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  carouselCard: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 24,
    padding: 24,
    paddingTop: 32,
    paddingBottom: 32,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
      },
    }),
  },
  skipButton: {
    position: 'absolute' as const,
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 8,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  slidesContainer: {
    height: 420,
    marginTop: 16,
    marginBottom: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
  },
  slide: {
    height: 420,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 36,
  },
  slideDescription: {
    fontSize: 17,
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 20,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
    height: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  nextButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
  },
  nextButtonText: {
    fontSize: 17,
    fontWeight: '600' as const,
  },
});
