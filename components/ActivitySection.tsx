import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';
import { lightColors, darkColors } from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';

type TimeFrame = 'week' | 'month' | 'year';

interface SpendingData {
  aligned: number;
  opposed: number;
  neutral: number;
  totalAmount: number;
  alignedAmount: number;
  opposedAmount: number;
  neutralAmount: number;
  topAlignedCategories: { name: string; amount: number }[];
  topOpposedCategories: { name: string; amount: number }[];
}

// Mock data generator based on timeframe
const generateMockData = (timeframe: TimeFrame): SpendingData => {
  const baseMultiplier = timeframe === 'week' ? 1 : timeframe === 'month' ? 4.3 : 52;

  // Generate realistic percentages
  const aligned = 45 + Math.random() * 15; // 45-60%
  const opposed = 15 + Math.random() * 10; // 15-25%
  const neutral = 100 - aligned - opposed;

  const totalAmount = (250 + Math.random() * 150) * baseMultiplier;
  const alignedAmount = (totalAmount * aligned) / 100;
  const opposedAmount = (totalAmount * opposed) / 100;
  const neutralAmount = (totalAmount * neutral) / 100;

  return {
    aligned: Math.round(aligned * 10) / 10,
    opposed: Math.round(opposed * 10) / 10,
    neutral: Math.round(neutral * 10) / 10,
    totalAmount: Math.round(totalAmount * 100) / 100,
    alignedAmount: Math.round(alignedAmount * 100) / 100,
    opposedAmount: Math.round(opposedAmount * 100) / 100,
    neutralAmount: Math.round(neutralAmount * 100) / 100,
    topAlignedCategories: [
      { name: 'Sustainable Fashion', amount: Math.round(alignedAmount * 0.35 * 100) / 100 },
      { name: 'Local Produce', amount: Math.round(alignedAmount * 0.28 * 100) / 100 },
      { name: 'Eco-Friendly Products', amount: Math.round(alignedAmount * 0.22 * 100) / 100 },
      { name: 'Renewable Energy', amount: Math.round(alignedAmount * 0.15 * 100) / 100 },
    ],
    topOpposedCategories: [
      { name: 'Fast Fashion', amount: Math.round(opposedAmount * 0.45 * 100) / 100 },
      { name: 'Non-Sustainable Goods', amount: Math.round(opposedAmount * 0.35 * 100) / 100 },
      { name: 'Single-Use Products', amount: Math.round(opposedAmount * 0.20 * 100) / 100 },
    ],
  };
};

// Donut Chart Component
const DonutChart: React.FC<{
  aligned: number;
  opposed: number;
  neutral: number;
  colors: typeof lightColors;
}> = ({ aligned, opposed, neutral, colors }) => {
  const size = 200;
  const strokeWidth = 30;
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate angles for each segment
  const alignedAngle = (aligned / 100) * 360;
  const opposedAngle = (opposed / 100) * 360;
  const neutralAngle = (neutral / 100) * 360;

  // Create arc path
  const createArc = (startAngle: number, endAngle: number) => {
    const start = polarToCartesian(center, center, radius, endAngle);
    const end = polarToCartesian(center, center, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
  };

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  return (
    <View style={styles.chartContainer}>
      <Svg width={size} height={size}>
        {/* Aligned segment */}
        <Path
          d={createArc(0, alignedAngle)}
          stroke="#4CAF50"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
        />
        {/* Opposed segment */}
        <Path
          d={createArc(alignedAngle, alignedAngle + opposedAngle)}
          stroke="#F44336"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
        />
        {/* Neutral segment */}
        <Path
          d={createArc(alignedAngle + opposedAngle, 360)}
          stroke="#9E9E9E"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
        />
        {/* Center circle for donut effect */}
        <Circle cx={center} cy={center} r={radius - strokeWidth / 2} fill={colors.backgroundSecondary} />
        <SvgText
          x={center}
          y={center - 10}
          textAnchor="middle"
          fontSize="18"
          fontWeight="600"
          fill={colors.textSecondary}
        >
          Spending
        </SvgText>
        <SvgText
          x={center}
          y={center + 15}
          textAnchor="middle"
          fontSize="18"
          fontWeight="600"
          fill={colors.textSecondary}
        >
          Alignment
        </SvgText>
      </Svg>
    </View>
  );
};

export default function ActivitySection() {
  const [timeframe, setTimeframe] = useState<TimeFrame>('month');
  const { isDarkMode } = useUser();
  const colors = isDarkMode ? darkColors : lightColors;

  // Generate data based on timeframe
  const data = generateMockData(timeframe);

  const timeframes: { value: TimeFrame; label: string }[] = [
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' },
  ];

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Activity</Text>

      {/* Timeline Filter */}
      <View style={styles.timelineContainer}>
        {timeframes.map((tf) => (
          <TouchableOpacity
            key={tf.value}
            style={[
              styles.timelineButton,
              { backgroundColor: colors.backgroundSecondary },
              timeframe === tf.value && { backgroundColor: colors.primary },
            ]}
            onPress={() => setTimeframe(tf.value)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.timelineButtonText,
                { color: timeframe === tf.value ? colors.white : colors.textSecondary },
              ]}
            >
              {tf.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.activityCard, { backgroundColor: colors.backgroundSecondary }]}>
        {/* Donut Chart */}
        <DonutChart
          aligned={data.aligned}
          opposed={data.opposed}
          neutral={data.neutral}
          colors={colors}
        />

        {/* Legend */}
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
            <View style={styles.legendTextContainer}>
              <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>
                Aligned with Values
              </Text>
              <Text style={[styles.legendValue, { color: colors.text }]}>
                {data.aligned}%
              </Text>
              <Text style={[styles.legendAmount, { color: colors.textSecondary }]}>
                ${data.alignedAmount.toFixed(2)}
              </Text>
            </View>
          </View>

          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#F44336' }]} />
            <View style={styles.legendTextContainer}>
              <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>
                Opposed to Values
              </Text>
              <Text style={[styles.legendValue, { color: colors.text }]}>
                {data.opposed}%
              </Text>
              <Text style={[styles.legendAmount, { color: colors.textSecondary }]}>
                ${data.opposedAmount.toFixed(2)}
              </Text>
            </View>
          </View>

          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#9E9E9E' }]} />
            <View style={styles.legendTextContainer}>
              <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>
                Neutral
              </Text>
              <Text style={[styles.legendValue, { color: colors.text }]}>
                {data.neutral}%
              </Text>
              <Text style={[styles.legendAmount, { color: colors.textSecondary }]}>
                ${data.neutralAmount.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Total Spending */}
        <View style={[styles.totalContainer, { borderTopColor: 'rgba(0, 0, 0, 0.05)' }]}>
          <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>
            Total Spending
          </Text>
          <Text style={[styles.totalAmount, { color: colors.primary }]}>
            ${data.totalAmount.toFixed(2)}
          </Text>
        </View>

        {/* Top Categories */}
        <View style={styles.categoriesContainer}>
          <View style={styles.categoryColumn}>
            <Text style={[styles.categoryTitle, { color: colors.text }]}>
              Top Aligned Categories
            </Text>
            {data.topAlignedCategories.map((cat, idx) => (
              <View key={idx} style={styles.categoryItem}>
                <View style={[styles.categoryDot, { backgroundColor: '#4CAF50' }]} />
                <View style={styles.categoryTextContainer}>
                  <Text style={[styles.categoryName, { color: colors.text }]} numberOfLines={1}>
                    {cat.name}
                  </Text>
                  <Text style={[styles.categoryAmount, { color: colors.textSecondary }]}>
                    ${cat.amount.toFixed(2)}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.categoryColumn}>
            <Text style={[styles.categoryTitle, { color: colors.text }]}>
              Top Opposed Categories
            </Text>
            {data.topOpposedCategories.map((cat, idx) => (
              <View key={idx} style={styles.categoryItem}>
                <View style={[styles.categoryDot, { backgroundColor: '#F44336' }]} />
                <View style={styles.categoryTextContainer}>
                  <Text style={[styles.categoryName, { color: colors.text }]} numberOfLines={1}>
                    {cat.name}
                  </Text>
                  <Text style={[styles.categoryAmount, { color: colors.textSecondary }]}>
                    ${cat.amount.toFixed(2)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Info Text */}
        <View style={[styles.infoBox, { backgroundColor: colors.background }]}>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Your spending is analyzed based on the values you've selected. Connect your bank account
            to see real transaction data and get personalized insights.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginBottom: 16,
  },
  timelineContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  timelineButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  timelineButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  activityCard: {
    borderRadius: 16,
    padding: 20,
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  legendContainer: {
    gap: 16,
    marginBottom: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  legendTextContainer: {
    flex: 1,
  },
  legendLabel: {
    fontSize: 13,
    fontWeight: '500' as const,
    marginBottom: 4,
  },
  legendValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    marginBottom: 2,
  },
  legendAmount: {
    fontSize: 12,
  },
  totalContainer: {
    borderTopWidth: 1,
    paddingTop: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  totalAmount: {
    fontSize: 36,
    fontWeight: '700' as const,
  },
  categoriesContainer: {
    gap: 20,
    marginBottom: 20,
  },
  categoryColumn: {
    gap: 12,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  categoryTextContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '500' as const,
    flex: 1,
  },
  categoryAmount: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  infoBox: {
    padding: 16,
    borderRadius: 12,
  },
  infoText: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
});
