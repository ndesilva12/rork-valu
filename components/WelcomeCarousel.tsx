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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
      onRequestClose={onComplete}
    >
      <View style={[styles.container, { backgroundColor: 'rgba(0, 0, 0, 0.85)' }]}>
        <View style={[styles.carouselContainer, { backgroundColor: colors.background }]}>
          {/* Skip Button */}
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            activeOpacity={0.7}
          >
            <Text style={[styles.skipButtonText, { color: colors.textSecondary }]}>Skip</Text>
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
                <View key={index} style={[styles.slide, { width: SCREEN_WIDTH - 80 }]}>
                  <View style={[styles.iconContainer, { backgroundColor: `${slide.color}15` }]}>
                    <Icon size={64} color={slide.color} strokeWidth={2} />
                  </View>
                  <Text style={[styles.title, { color: colors.text }]}>{slide.title}</Text>
                  <Text style={[styles.description, { color: colors.textSecondary }]}>
                    {slide.description}
                  </Text>
                </View>
              );
            })}
          </ScrollView>

          {/* Pagination Dots */}
          <View style={styles.paginationContainer}>
            {slides.map((_, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => goToSlide(index)}
                activeOpacity={0.7}
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
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  carouselContainer: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 24,
    padding: 32,
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
    top: 24,
    right: 24,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  scrollView: {
    marginTop: 32,
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    minHeight: 400,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 36,
  },
  description: {
    fontSize: 17,
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 16,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 32,
    marginBottom: 24,
    height: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    transition: 'all 0.3s ease',
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
