import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { COLORS } from '../utils/constants';

const screenWidth = Dimensions.get('window').width;

interface WasteDataPoint {
  month: string;
  total_items: number;
  total_cost: string;
}

interface Props {
  data: WasteDataPoint[];
  type?: 'line' | 'bar';
  showCost?: boolean;
  title?: string;
}

const chartConfig = {
  backgroundColor: COLORS.surface,
  backgroundGradientFrom: COLORS.surface,
  backgroundGradientTo: COLORS.surface,
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
  labelColor: () => COLORS.textSecondary,
  style: { borderRadius: 16 },
  propsForDots: { r: '5', strokeWidth: '2', stroke: COLORS.primaryDark },
};

export default function WasteChart({ data, type = 'line', showCost = false, title }: Props) {
  if (!data || data.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No data available yet</Text>
        <Text style={styles.emptySubText}>Start tracking your inventory to see waste trends</Text>
      </View>
    );
  }

  const labels = data.map(d => {
    const parts = d.month.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthIndex = parseInt(parts[1] ?? '1', 10) - 1;
    return monthNames[monthIndex] ?? d.month;
  });

  const values = showCost
    ? data.map(d => parseFloat(d.total_cost) || 0)
    : data.map(d => d.total_items);

  const chartData = {
    labels,
    datasets: [{ data: values.length > 0 ? values : [0] }],
  };

  const chartWidth = screenWidth - 32;

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      {type === 'line' ? (
        <LineChart
          data={chartData}
          width={chartWidth}
          height={200}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
          yAxisSuffix={showCost ? '$' : ''}
        />
      ) : (
        <BarChart
          data={chartData}
          width={chartWidth}
          height={200}
          chartConfig={chartConfig}
          style={styles.chart}
          yAxisSuffix={showCost ? '$' : ''}
          yAxisLabel=""
          showValuesOnTopOfBars
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 8 },
  title: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 8, paddingHorizontal: 4 },
  chart: { borderRadius: 12 },
  empty: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: 12,
    padding: 16,
  },
  emptyText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  emptySubText: { fontSize: 12, color: COLORS.textTertiary, textAlign: 'center', marginTop: 4 },
});
