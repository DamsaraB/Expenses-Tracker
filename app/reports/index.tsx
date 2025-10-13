import React, { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Canvas, Circle, Group, Path, Skia, vec } from '@shopify/react-native-skia';
import * as Print from 'expo-print';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import {
  Alert,
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';

const screenWidth = Dimensions.get('window').width;

// Mock API client - replace with your actual implementation
const reportsApi = {
  monthlyExpenditure: async (year: number) => ({
    data: [
      { month_number: 1, month_name: 'January', transaction_count: 45, total_amount: 20000, avg_amount: 444.44, trend: 'Same' },
      { month_number: 2, month_name: 'February', transaction_count: 52, total_amount: 25000, avg_amount: 480.77, trend: 'Increase' },
      { month_number: 3, month_name: 'March', transaction_count: 48, total_amount: 22000, avg_amount: 458.33, trend: 'Decrease' },
      { month_number: 4, month_name: 'April', transaction_count: 55, total_amount: 28000, avg_amount: 509.09, trend: 'Increase' },
      { month_number: 5, month_name: 'May', transaction_count: 50, total_amount: 24000, avg_amount: 480.00, trend: 'Decrease' },
      { month_number: 6, month_name: 'June', transaction_count: 53, total_amount: 26000, avg_amount: 490.57, trend: 'Increase' },
    ]
  }),
  budgetAdherence: async (startDate: string, endDate: string) => ({
    data: [
      { budget_id: 1, category_name: 'Food', budget_amount: 15000, spent_amount: 13500, remaining_amount: 1500, utilization_percentage: 90, status: 'Alert' },
      { budget_id: 2, category_name: 'Transport', budget_amount: 8000, spent_amount: 9200, remaining_amount: -1200, utilization_percentage: 115, status: 'Over Budget' },
      { budget_id: 3, category_name: 'Shopping', budget_amount: 10000, spent_amount: 6500, remaining_amount: 3500, utilization_percentage: 65, status: 'On Track' },
      { budget_id: 4, category_name: 'Bills', budget_amount: 12000, spent_amount: 11800, remaining_amount: 200, utilization_percentage: 98.33, status: 'Alert' },
    ]
  }),
  categoryDistribution: async (startDate: string, endDate: string) => ({
    data: [
      { category_name: 'Food', color: '#FF6B6B', icon: 'restaurant', transaction_count: 45, total_amount: 13500, avg_amount: 300, percentage_of_total: 35 },
      { category_name: 'Transport', color: '#4ECDC4', icon: 'car', transaction_count: 32, total_amount: 9200, avg_amount: 287.50, percentage_of_total: 23.8 },
      { category_name: 'Shopping', color: '#45B7D1', icon: 'cart', transaction_count: 28, total_amount: 6500, avg_amount: 232.14, percentage_of_total: 16.8 },
      { category_name: 'Bills', color: '#FFA07A', icon: 'receipt', transaction_count: 15, total_amount: 11800, avg_amount: 786.67, percentage_of_total: 30.5 },
    ]
  }),
  savingsForecast: async (monthsAhead: number) => ({
    data: Array.from({ length: monthsAhead }, (_, i) => ({
      month_offset: i + 1,
      forecast_month: new Date(2025, i, 1).toISOString().slice(0, 7),
      projected_income: 50000,
      projected_expense: 38000,
      projected_monthly_savings: 12000,
      cumulative_savings: 15000 + (12000 * (i + 1)),
      trend: 'Positive'
    }))
  }),
};

const Colors = {
  light: {
    background: '#FFFFFF',
    cardBackground: '#F8F9FA',
    text: '#1A1A1A',
    icon: '#666666',
    tint: '#007AFF',
    border: '#E1E5E9',
  },
  dark: {
    background: '#1A1A1A',
    cardBackground: '#2A2A2A',
    text: '#FFFFFF',
    icon: '#999999',
    tint: '#0A84FF',
    border: '#3A3A3A',
  }
};

export default function ReportsScreen() {
  const router = useRouter();
  const [isDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState('overview');
  const [reportData, setReportData] = useState<any>({});
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    setLoading(true);
    try {
      const [monthly, budget, category, forecast] = await Promise.all([
        reportsApi.monthlyExpenditure(currentYear),
        reportsApi.budgetAdherence('2025-01-01', '2025-12-31'),
        reportsApi.categoryDistribution('2025-01-01', '2025-12-31'),
        reportsApi.savingsForecast(6),
      ]);

      setReportData({
        monthly: monthly.data,
        budget: budget.data,
        category: category.data,
        forecast: forecast.data,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async () => {
    try {
      const htmlContent = `
        <html>
          <head>
            <meta charset="utf-8">
            <title>Financial Report</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #007AFF; padding-bottom: 20px; }
              .section { margin-bottom: 25px; padding: 15px; background-color: #f8f9fa; border-radius: 8px; }
              .section h3 { color: #007AFF; margin-bottom: 15px; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e1e5e9; }
              th { background-color: #007AFF; color: white; }
              .status-over { color: #F44336; font-weight: bold; }
              .status-alert { color: #FF9800; font-weight: bold; }
              .status-track { color: #4CAF50; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Financial Report ${currentYear}</h1>
              <p>Generated on ${new Date().toLocaleDateString()}</p>
            </div>
            <div class="section">
              <h3>Monthly Expenditure Analysis</h3>
              <table>
                <tr><th>Month</th><th>Transactions</th><th>Total Amount</th><th>Trend</th></tr>
                ${reportData.monthly?.map((m: any) => `
                  <tr>
                    <td>${m.month_name}</td>
                    <td>${m.transaction_count}</td>
                    <td>Rs. ${m.total_amount.toFixed(2)}</td>
                    <td>${m.trend}</td>
                  </tr>
                `).join('') || ''}
              </table>
            </div>
            <div class="section">
              <h3>Budget Adherence</h3>
              <table>
                <tr><th>Category</th><th>Budget</th><th>Spent</th><th>Remaining</th><th>Status</th></tr>
                ${reportData.budget?.map((b: any) => `
                  <tr>
                    <td>${b.category_name}</td>
                    <td>Rs. ${b.budget_amount.toFixed(2)}</td>
                    <td>Rs. ${b.spent_amount.toFixed(2)}</td>
                    <td>Rs. ${b.remaining_amount.toFixed(2)}</td>
                    <td class="status-${b.status === 'Over Budget' ? 'over' : b.status === 'Alert' ? 'alert' : 'track'}">${b.status}</td>
                  </tr>
                `).join('') || ''}
              </table>
            </div>
          </body>
        </html>
      `;
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to generate PDF');
    }
  };

  const getLineChartPath = () => {
    const data = reportData.monthly || [];
    if (data.length === 0) return Skia.Path.Make();
    
    const w = screenWidth - 60;
    const h = 180;
    const amounts = data.map((d: any) => d.total_amount);
    const max = Math.max(...amounts);
    const min = Math.min(...amounts);
    const stepX = w / (data.length - 1);
    
    const path = Skia.Path.Make();
    data.forEach((item: any, i: number) => {
      const x = i * stepX;
      const y = h - ((item.total_amount - min) / (max - min)) * h;
      if (i === 0) path.moveTo(x, y);
      else path.lineTo(x, y);
    });
    return path;
  };

  const getPieAngles = () => {
    const data = reportData.category || [];
    const total = data.reduce((sum: number, c: any) => sum + c.percentage_of_total, 0);
    let angles: any[] = [];
    let start = 0;
    
    data.forEach((c: any) => {
      const sweep = (c.percentage_of_total / 100) * 2 * Math.PI;
      angles.push({ start, sweep, color: c.color, name: c.category_name, value: c.percentage_of_total });
      start += sweep;
    });
    return angles;
  };

  const reportTypes = [
    { id: 'overview', title: 'Overview', icon: 'analytics' },
    { id: 'monthly', title: 'Monthly Trends', icon: 'trending-up' },
    { id: 'budget', title: 'Budget', icon: 'wallet' },
    { id: 'category', title: 'Categories', icon: 'pie-chart' },
    { id: 'forecast', title: 'Forecast', icon: 'analytics' },
  ];

  const renderOverview = () => {
    const totalExpenses = reportData.monthly?.reduce((sum: number, m: any) => sum + m.total_amount, 0) || 0;
    const avgMonthly = totalExpenses / (reportData.monthly?.length || 1);
    const overBudgetCount = reportData.budget?.filter((b: any) => b.status === 'Over Budget').length || 0;

    return (
      <View>
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryCard, { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].cardBackground }]}>
            <Ionicons name="trending-down" size={24} color="#F44336" />
            <Text style={[styles.summaryValue, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
              Rs. {avgMonthly.toFixed(0)}
            </Text>
            <Text style={[styles.summaryLabel, { color: Colors[isDarkMode ? 'dark' : 'light'].icon }]}>Avg Monthly</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].cardBackground }]}>
            <Ionicons name="alert-circle" size={24} color="#FF9800" />
            <Text style={[styles.summaryValue, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
              {overBudgetCount}
            </Text>
            <Text style={[styles.summaryLabel, { color: Colors[isDarkMode ? 'dark' : 'light'].icon }]}>Over Budget</Text>
          </View>
        </View>

        <View style={[styles.chartContainer, { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].cardBackground }]}>
          <Text style={[styles.chartTitle, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
            Monthly Expenses Trend
          </Text>
          <Canvas style={{ width: screenWidth - 60, height: 180 }}>
            <Path path={getLineChartPath()} color="#007AFF" style="stroke" strokeWidth={3} />
          </Canvas>
        </View>
      </View>
    );
  };

  const renderMonthlyReport = () => (
    <View style={[styles.reportCard, { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].cardBackground }]}>
      <Text style={[styles.reportTitle, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
        Monthly Expenditure Analysis
      </Text>
      {reportData.monthly?.map((month: any, index: number) => (
        <View key={index} style={styles.reportRow}>
          <View style={styles.reportRowLeft}>
            <Text style={[styles.reportMonth, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
              {month.month_name}
            </Text>
            <Text style={[styles.reportSubtext, { color: Colors[isDarkMode ? 'dark' : 'light'].icon }]}>
              {month.transaction_count} transactions
            </Text>
          </View>
          <View style={styles.reportRowRight}>
            <Text style={[styles.reportAmount, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
              Rs. {month.total_amount.toFixed(2)}
            </Text>
            <View style={[styles.trendBadge, { 
              backgroundColor: month.trend === 'Increase' ? '#4CAF5020' : month.trend === 'Decrease' ? '#F4433620' : '#FF980020' 
            }]}>
              <Ionicons 
                name={month.trend === 'Increase' ? 'arrow-up' : month.trend === 'Decrease' ? 'arrow-down' : 'remove'} 
                size={12} 
                color={month.trend === 'Increase' ? '#4CAF50' : month.trend === 'Decrease' ? '#F44336' : '#FF9800'} 
              />
              <Text style={{ 
                color: month.trend === 'Increase' ? '#4CAF50' : month.trend === 'Decrease' ? '#F44336' : '#FF9800',
                fontSize: 11,
                marginLeft: 2
              }}>
                {month.trend}
              </Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  const renderBudgetReport = () => (
    <View style={[styles.reportCard, { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].cardBackground }]}>
      <Text style={[styles.reportTitle, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
        Budget Adherence Tracking
      </Text>
      {reportData.budget?.map((budget: any, index: number) => (
        <View key={index} style={styles.budgetItem}>
          <View style={styles.budgetHeader}>
            <Text style={[styles.budgetCategory, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
              {budget.category_name}
            </Text>
            <View style={[styles.statusBadge, { 
              backgroundColor: budget.status === 'Over Budget' ? '#F4433620' : 
                             budget.status === 'Alert' ? '#FF980020' : '#4CAF5020' 
            }]}>
              <Text style={{ 
                color: budget.status === 'Over Budget' ? '#F44336' : 
                       budget.status === 'Alert' ? '#FF9800' : '#4CAF50',
                fontSize: 11,
                fontWeight: '600'
              }}>
                {budget.status}
              </Text>
            </View>
          </View>
          <View style={styles.budgetProgress}>
            <View style={[styles.progressBar, { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].border }]}>
              <View style={[styles.progressFill, { 
                width: `${Math.min(budget.utilization_percentage, 100)}%`,
                backgroundColor: budget.utilization_percentage > 100 ? '#F44336' : 
                               budget.utilization_percentage > 80 ? '#FF9800' : '#4CAF50'
              }]} />
            </View>
          </View>
          <View style={styles.budgetDetails}>
            <Text style={[styles.budgetText, { color: Colors[isDarkMode ? 'dark' : 'light'].icon }]}>
              Spent: Rs. {budget.spent_amount.toFixed(2)}
            </Text>
            <Text style={[styles.budgetText, { color: Colors[isDarkMode ? 'dark' : 'light'].icon }]}>
              Budget: Rs. {budget.budget_amount.toFixed(2)}
            </Text>
          </View>
          <Text style={[styles.budgetPercentage, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
            {budget.utilization_percentage.toFixed(1)}% utilized
          </Text>
        </View>
      ))}
    </View>
  );

  const renderCategoryReport = () => {
    const pieAngles = getPieAngles();
    
    return (
      <View>
        <View style={[styles.chartContainer, { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].cardBackground }]}>
          <Text style={[styles.chartTitle, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
            Category Distribution
          </Text>
          <View style={styles.pieChartContainer}>
            <Canvas style={{ width: 200, height: 200 }}>
              <Group>
                {pieAngles.map((a: any, i: number) => {
                  const centerX = 100;
                  const centerY = 100;
                  const radius = 90;
                  
                  const path = Skia.Path.Make();
                  path.moveTo(centerX, centerY);
                  
                  const startX = centerX + radius * Math.cos(a.start - Math.PI / 2);
                  const startY = centerY + radius * Math.sin(a.start - Math.PI / 2);
                  path.lineTo(startX, startY);
                  
                  const endX = centerX + radius * Math.cos(a.start + a.sweep - Math.PI / 2);
                  const endY = centerY + radius * Math.sin(a.start + a.sweep - Math.PI / 2);
                  
                  const largeArc = a.sweep > Math.PI ? 1 : 0;
                  // rArcTo(rx, ry, xAxisRotateInDegrees, useSmallArc, isCCW, dx, dy)
                  path.rArcTo(
                    radius, // rx
                    radius, // ry
                    0,      // xAxisRotateInDegrees
                    largeArc === 0, // useSmallArc (true for small arc, false for large arc)
                    false,  // isCCW (false for clockwise)
                    endX - startX, // dx
                    endY - startY  // dy
                  );
                  
                  path.close();
                  
                  return <Path key={i} path={path} color={a.color} />;
                })}
              </Group>
            </Canvas>
          </View>
          <View style={styles.legendContainer}>
            {reportData.category?.map((cat: any, i: number) => (
              <View key={i} style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: cat.color }]} />
                <Text style={[styles.legendText, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
                  {cat.category_name} ({cat.percentage_of_total.toFixed(1)}%)
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.reportCard, { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].cardBackground }]}>
          {reportData.category?.map((cat: any, index: number) => (
            <View key={index} style={styles.categoryItem}>
              <View style={styles.categoryHeader}>
                <View style={[styles.categoryIcon, { backgroundColor: cat.color + '20' }]}>
                  <Ionicons name={cat.icon} size={20} color={cat.color} />
                </View>
                <View style={styles.categoryInfo}>
                  <Text style={[styles.categoryName, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
                    {cat.category_name}
                  </Text>
                  <Text style={[styles.categoryCount, { color: Colors[isDarkMode ? 'dark' : 'light'].icon }]}>
                    {cat.transaction_count} transactions
                  </Text>
                </View>
              </View>
              <Text style={[styles.categoryAmount, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
                Rs. {cat.total_amount.toFixed(2)}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderForecastReport = () => (
    <View style={[styles.reportCard, { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].cardBackground }]}>
      <Text style={[styles.reportTitle, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
        6-Month Savings Forecast
      </Text>
      {reportData.forecast?.map((forecast: any, index: number) => (
        <View key={index} style={styles.forecastItem}>
          <View style={styles.forecastHeader}>
            <Text style={[styles.forecastMonth, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
              {forecast.forecast_month}
            </Text>
            <View style={[styles.trendBadge, { 
              backgroundColor: forecast.trend === 'Positive' ? '#4CAF5020' : '#F4433620' 
            }]}>
              <Text style={{ 
                color: forecast.trend === 'Positive' ? '#4CAF50' : '#F44336',
                fontSize: 11,
                fontWeight: '600'
              }}>
                {forecast.trend}
              </Text>
            </View>
          </View>
          <View style={styles.forecastDetails}>
            <View style={styles.forecastRow}>
              <Text style={[styles.forecastLabel, { color: Colors[isDarkMode ? 'dark' : 'light'].icon }]}>
                Projected Income:
              </Text>
              <Text style={[styles.forecastValue, { color: '#4CAF50' }]}>
                +Rs. {forecast.projected_income.toFixed(2)}
              </Text>
            </View>
            <View style={styles.forecastRow}>
              <Text style={[styles.forecastLabel, { color: Colors[isDarkMode ? 'dark' : 'light'].icon }]}>
                Projected Expense:
              </Text>
              <Text style={[styles.forecastValue, { color: '#F44336' }]}>
                -Rs. {forecast.projected_expense.toFixed(2)}
              </Text>
            </View>
            <View style={styles.forecastRow}>
              <Text style={[styles.forecastLabel, { color: Colors[isDarkMode ? 'dark' : 'light'].text, fontWeight: '600' }]}>
                Monthly Savings:
              </Text>
              <Text style={[styles.forecastValue, { color: Colors[isDarkMode ? 'dark' : 'light'].text, fontWeight: '600' }]}>
                Rs. {forecast.projected_monthly_savings.toFixed(2)}
              </Text>
            </View>
          </View>
          <View style={[styles.cumulativeBox, { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].background }]}>
            <Text style={[styles.cumulativeLabel, { color: Colors[isDarkMode ? 'dark' : 'light'].icon }]}>
              Cumulative Savings
            </Text>
            <Text style={[styles.cumulativeValue, { color: '#4CAF50' }]}>
              Rs. {forecast.cumulative_savings.toFixed(2)}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderContent = () => {
    switch (selectedReport) {
      case 'monthly':
        return renderMonthlyReport();
      case 'budget':
        return renderBudgetReport();
      case 'category':
        return renderCategoryReport();
      case 'forecast':
        return renderForecastReport();
      default:
        return renderOverview();
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors[isDarkMode ? 'dark' : 'light'].tint} />
          <Text style={[styles.loadingText, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
            Loading reports...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors[isDarkMode ? 'dark' : 'light'].tint} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>Reports</Text>
        <TouchableOpacity onPress={generatePDF}>
          <Ionicons name="download-outline" size={24} color={Colors[isDarkMode ? 'dark' : 'light'].tint} />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer}>
        {reportTypes.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.tab,
              selectedReport === type.id && styles.tabActive,
              { backgroundColor: selectedReport === type.id ? Colors[isDarkMode ? 'dark' : 'light'].tint : Colors[isDarkMode ? 'dark' : 'light'].cardBackground }
            ]}
            onPress={() => setSelectedReport(type.id)}
          >
            <Ionicons 
              name={type.icon} 
              size={18} 
              color={selectedReport === type.id ? '#FFF' : Colors[isDarkMode ? 'dark' : 'light'].icon} 
            />
            <Text style={[
              styles.tabText,
              { color: selectedReport === type.id ? '#FFF' : Colors[isDarkMode ? 'dark' : 'light'].text }
            ]}>
              {type.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  tabsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    maxHeight: 60,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
  },
  tabActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  summaryCard: {
    width: '48%',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  summaryLabel: {
    fontSize: 12,
  },
  chartContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  reportCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E1E5E9',
  },
  forecastRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
reportTitle: {
  fontSize: 18,
  fontWeight: 'bold',
  marginBottom: 16,
},
reportRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingVertical: 12,
  borderBottomWidth: 1,
  borderColor: '#E1E5E9',
},
reportRowLeft: {
  flex: 1,
},
reportMonth: {
  fontSize: 16,
  fontWeight: '600',
},
reportSubtext: {
  fontSize: 12,
  marginTop: 2,
},
reportRowRight: {
  alignItems: 'flex-end',
},
reportAmount: {
  fontSize: 16,
  fontWeight: '600',
},
trendBadge: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 8,
  paddingVertical: 2,
  borderRadius: 10,
  marginTop: 4,
},
budgetItem: {
  marginBottom: 18,
  paddingBottom: 12,
  borderBottomWidth: 1,
  borderColor: '#E1E5E9',
},
budgetHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 6,
},
budgetCategory: {
  fontSize: 15,
  fontWeight: '600',
},
statusBadge: {
  paddingHorizontal: 8,
  paddingVertical: 2,
  borderRadius: 10,
},
budgetProgress: {
  marginVertical: 8,
},
progressBar: {
  height: 8,
  borderRadius: 4,
  overflow: 'hidden',
  backgroundColor: '#E1E5E9',
},
progressFill: {
  height: 8,
  borderRadius: 4,
},
budgetDetails: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginTop: 4,
},
budgetText: {
  fontSize: 13,
},
budgetPercentage: {
  fontSize: 13,
  fontWeight: '600',
  marginTop: 4,
},
pieChartContainer: {
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 12,
},
legendContainer: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  marginTop: 8,
},
legendItem: {
  flexDirection: 'row',
  alignItems: 'center',
  marginRight: 16,
  marginBottom: 4,
},
legendColor: {
  width: 12,
  height: 12,
  borderRadius: 6,
  marginRight: 6,
},
legendText: {
  fontSize: 12,
},
categoryItem: {
  marginBottom: 18,
  paddingBottom: 12,
  borderBottomWidth: 1,
  borderColor: '#E1E5E9',
},
categoryHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 6,
},
categoryIcon: {
  width: 32,
  height: 32,
  borderRadius: 16,
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: 10,
},
categoryInfo: {
  flex: 1,
},
categoryName: {
  fontSize: 15,
  fontWeight: '600',
},
categoryCount: {
  fontSize: 12,
  marginTop: 2,
},
categoryAmount: {
  fontSize: 16,
  fontWeight: '600',
  marginTop: 4,
},
forecastItem: {
  marginBottom: 18,
  paddingBottom: 12,
  borderBottomWidth: 1,
  borderColor: '#E1E5E9',
},
forecastHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 6,
},
forecastMonth: {
  fontSize: 15,
  fontWeight: '600',
},
forecastDetails: {
  marginTop: 6,
},
forecastLabel: {
  fontSize: 13,
},
forecastValue: {
  fontSize: 13,
  fontWeight: '600',
},
cumulativeBox: {
  marginTop: 8,
  padding: 10,
  borderRadius: 10,
  backgroundColor: '#F8F9FA',
  alignItems: 'center',
},
cumulativeLabel: {
  fontSize: 12,
  color: '#666',
},
cumulativeValue: {
  fontSize: 15,
  fontWeight: 'bold',
  color: '#4CAF50',
},
});