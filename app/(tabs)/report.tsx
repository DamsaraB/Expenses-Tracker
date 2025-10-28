import { Ionicons } from '@expo/vector-icons';
import { Canvas, Group, Path, Skia } from '@shopify/react-native-skia';
import * as Print from 'expo-print';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Modal,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { reportsApi } from '../../services/api/api';
import type {
    BudgetAdherenceData,
    CategoryDistributionData,
    MonthlyExpenditureData,
    SavingsForecastData,
    SavingsProgressData
} from '../../services/api/types';
import PageHeader from '../components/PageHeader';

const screenWidth = Dimensions.get('window').width;

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

interface ReportData {
  monthly: MonthlyExpenditureData[];
  budget: BudgetAdherenceData[];
  category: CategoryDistributionData[];
  forecast: SavingsForecastData[];
  savings?: SavingsProgressData[];
}

export default function ReportsScreen() {
  const router = useRouter();
  const [isDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedReport, setSelectedReport] = useState('overview');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [reportData, setReportData] = useState<ReportData>({
    monthly: [],
    budget: [],
    category: [],
    forecast: [],
    savings: []
  });

  useEffect(() => {
    loadReportData();
  }, [selectedYear]);

  // Real-time updates: Reload data whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadReportData();
    }, [selectedYear])
  );

  const formatCurrency = (amount: number) => {
    return `Rs. ${Number(amount || 0).toLocaleString('en-LK', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;
  };

  const loadReportData = async () => {
    setLoading(true);
    try {
      const startOfYear = `${selectedYear}-01-01`;
      const endOfYear = `${selectedYear}-12-31`;

      const [monthlyRes, budgetRes, categoryRes, forecastRes, savingsRes] = await Promise.all([
        reportsApi.monthlyExpenditure(selectedYear),
        reportsApi.budgetAdherence(startOfYear, endOfYear),
        reportsApi.categoryDistribution(startOfYear, endOfYear),
        reportsApi.savingsForecast(6),
        reportsApi.savingsProgress()
      ]);

      setReportData({
        monthly: monthlyRes.data || [],
        budget: budgetRes.data || [],
        category: categoryRes.data || [],
        forecast: forecastRes.data || [],
        savings: savingsRes.data || []
      });
    } catch (error) {
      // Only show alert if it's not a refresh (user-initiated load)
      if (!refreshing) {
        // Don't show alert on auto-refresh failures
      }
      // Set empty data so UI doesn't break
      setReportData({
        monthly: [],
        budget: [],
        category: [],
        forecast: [],
        savings: []
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadReportData();
  };

  const generatePDF = async () => {
    try {
      const totalExpenses = reportData.monthly?.reduce((sum, m) => sum + m.total_amount, 0) || 0;
      const avgMonthly = reportData.monthly?.length > 0 ? totalExpenses / reportData.monthly.length : 0;
      
      const htmlContent = `
        <html>
          <head>
            <meta charset="utf-8">
            <title>Financial Report ${selectedYear}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #007AFF; padding-bottom: 20px; }
              .summary { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
              .summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 15px; }
              .summary-item { padding: 15px; background: white; border-radius: 8px; border: 1px solid #e1e5e9; }
              .summary-label { font-size: 12px; color: #666; margin-bottom: 5px; }
              .summary-value { font-size: 20px; font-weight: bold; color: #007AFF; }
              .section { margin-bottom: 25px; padding: 15px; background-color: #f8f9fa; border-radius: 8px; }
              .section h3 { color: #007AFF; margin-bottom: 15px; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; background: white; }
              th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e1e5e9; }
              th { background-color: #007AFF; color: white; font-weight: 600; }
              .status-over { color: #F44336; font-weight: bold; }
              .status-alert { color: #FF9800; font-weight: bold; }
              .status-track { color: #4CAF50; font-weight: bold; }
              .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e1e5e9; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>📊 Financial Report ${selectedYear}</h1>
              <p>Generated on ${new Date().toLocaleDateString('en-LK', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
            </div>
            
            <div class="summary">
              <h3>Executive Summary</h3>
              <div class="summary-grid">
                <div class="summary-item">
                  <div class="summary-label">Total Annual Expenses</div>
                  <div class="summary-value">${formatCurrency(totalExpenses)}</div>
                </div>
                <div class="summary-item">
                  <div class="summary-label">Average Monthly</div>
                  <div class="summary-value">${formatCurrency(avgMonthly)}</div>
                </div>
                <div class="summary-item">
                  <div class="summary-label">Total Categories</div>
                  <div class="summary-value">${reportData.category?.length || 0}</div>
                </div>
                <div class="summary-item">
                  <div class="summary-label">Savings Goals</div>
                  <div class="summary-value">${reportData.savings?.length || 0}</div>
                </div>
              </div>
            </div>
            
            <div class="section">
              <h3>📈 Monthly Expenditure Analysis</h3>
              <table>
                <tr><th>Month</th><th>Transactions</th><th>Total Amount</th><th>Average</th><th>Trend</th></tr>
                ${reportData.monthly.map((m) => `
                  <tr>
                    <td>${m.month_name}</td>
                    <td>${m.transaction_count}</td>
                    <td>${formatCurrency(m.total_amount)}</td>
                    <td>${formatCurrency(m.avg_amount)}</td>
                    <td>${m.trend}</td>
                  </tr>
                `).join('')}
              </table>
            </div>
            
            <div class="section">
              <h3>💰 Budget Adherence</h3>
              <table>
                <tr><th>Category</th><th>Budget</th><th>Spent</th><th>Remaining</th><th>Utilization</th><th>Status</th></tr>
                ${reportData.budget.map((b) => `
                  <tr>
                    <td>${b.category_name}</td>
                    <td>${formatCurrency(b.budget_amount)}</td>
                    <td>${formatCurrency(b.spent_amount)}</td>
                    <td>${formatCurrency(b.remaining_amount)}</td>
                    <td>${b.utilization_percentage.toFixed(1)}%</td>
                    <td class="status-${b.status === 'Over Budget' ? 'over' : b.status === 'Alert' ? 'alert' : 'track'}">${b.status}</td>
                  </tr>
                `).join('')}
              </table>
            </div>

            <div class="section">
              <h3>🏷️ Category Distribution</h3>
              <table>
                <tr><th>Category</th><th>Transactions</th><th>Total Amount</th><th>Percentage</th></tr>
                ${reportData.category.map((c) => `
                  <tr>
                    <td>${c.category_name}</td>
                    <td>${c.transaction_count}</td>
                    <td>${formatCurrency(c.total_amount)}</td>
                    <td>${c.percentage_of_total.toFixed(1)}%</td>
                  </tr>
                `).join('')}
              </table>
            </div>

            <div class="section">
              <h3>🎯 Savings Progress</h3>
              <table>
                <tr><th>Goal</th><th>Target</th><th>Current</th><th>Progress</th><th>Status</th></tr>
                ${(reportData.savings || []).map((s) => `
                  <tr>
                    <td>${s.title}</td>
                    <td>${formatCurrency(s.target_amount)}</td>
                    <td>${formatCurrency(s.current_amount)}</td>
                    <td>${s.progress_percentage.toFixed(1)}%</td>
                    <td>${s.is_achieved ? '✅ Achieved' : '🔄 In Progress'}</td>
                  </tr>
                `).join('')}
              </table>
            </div>

            <div class="footer">
              <p>Generated by Expenses Tracker App</p>
              <p>This report contains confidential financial information</p>
            </div>
          </body>
        </html>
      `;
      
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Financial Report ${selectedYear}`,
          UTI: 'com.adobe.pdf'
        });
      } else {
        Alert.alert('Success', 'Report saved successfully!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to generate PDF report');
    }
  };

  const getLineChartPath = () => {
    const data = reportData.monthly || [];
    if (data.length === 0) return Skia.Path.Make();
    
    const w = screenWidth - 60;
    const h = 180;
    const amounts = data.map((d) => d.total_amount);
    const max = Math.max(...amounts);
    const min = Math.min(...amounts);
    const range = max - min;
    
    if (range === 0) {
      const path = Skia.Path.Make();
      const y = h / 2;
      path.moveTo(0, y);
      path.lineTo(w, y);
      return path;
    }
    
    const stepX = w / Math.max(data.length - 1, 1);
    
    const path = Skia.Path.Make();
    data.forEach((item, i) => {
      const x = i * stepX;
      const y = h - ((item.total_amount - min) / range) * h;
      if (i === 0) path.moveTo(x, y);
      else path.lineTo(x, y);
    });
    return path;
  };

  const getPieAngles = () => {
    const data = reportData.category || [];
    if (data.length === 0) return [];
    
    let angles: Array<{start: number, sweep: number, color: string, name: string, value: number}> = [];
    let start = 0;
    
    data.forEach((c) => {
      const sweep = (c.percentage_of_total / 100) * 2 * Math.PI;
      angles.push({ 
        start, 
        sweep, 
        color: c.color, 
        name: c.category_name, 
        value: c.percentage_of_total 
      });
      start += sweep;
    });
    return angles;
  };

  const reportTypes = [
    { id: 'overview', title: 'Overview', icon: 'analytics' as const },
    { id: 'monthly', title: 'Monthly', icon: 'trending-up' as const },
    { id: 'budget', title: 'Budget', icon: 'wallet' as const },
    { id: 'category', title: 'Categories', icon: 'pie-chart' as const },
    { id: 'forecast', title: 'Forecast', icon: 'stats-chart' as const },
    { id: 'savings', title: 'Savings', icon: 'trophy' as const },
  ];

  const getAvailableYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear; i >= currentYear - 5; i--) {
      years.push(i);
    }
    return years;
  };

  const renderOverview = () => {
    const totalExpenses = reportData.monthly?.reduce((sum, m) => sum + m.total_amount, 0) || 0;
    const avgMonthly = reportData.monthly?.length > 0 ? totalExpenses / reportData.monthly.length : 0;
    const overBudgetCount = reportData.budget?.filter((b) => b.status === 'Over Budget').length || 0;
    const totalSavingsGoals = reportData.savings?.length || 0;
    const achievedGoals = reportData.savings?.filter((s) => s.is_achieved).length || 0;
    const topCategory = reportData.category?.[0];

    return (
      <View>
        {/* Key Metrics */}
        <View style={[styles.metricsCard, { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].cardBackground }]}>
          <Text style={[styles.metricsTitle, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
            📊 Key Metrics for {selectedYear}
          </Text>
          <View style={styles.summaryGrid}>
            <View style={[styles.summaryCard, { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].background }]}>
              <Ionicons name="cash-outline" size={24} color="#F44336" />
              <Text style={[styles.summaryValue, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
                {formatCurrency(totalExpenses)}
              </Text>
              <Text style={[styles.summaryLabel, { color: Colors[isDarkMode ? 'dark' : 'light'].icon }]}>Total Expenses</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].background }]}>
              <Ionicons name="trending-down" size={24} color="#007AFF" />
              <Text style={[styles.summaryValue, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
                {formatCurrency(avgMonthly)}
              </Text>
              <Text style={[styles.summaryLabel, { color: Colors[isDarkMode ? 'dark' : 'light'].icon }]}>Avg Monthly</Text>
            </View>
          </View>

          <View style={styles.summaryGrid}>
            <View style={[styles.summaryCard, { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].background }]}>
              <Ionicons name="alert-circle" size={24} color="#FF9800" />
              <Text style={[styles.summaryValue, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
                {overBudgetCount}
              </Text>
              <Text style={[styles.summaryLabel, { color: Colors[isDarkMode ? 'dark' : 'light'].icon }]}>Over Budget</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].background }]}>
              <Ionicons name="trophy" size={24} color="#4CAF50" />
              <Text style={[styles.summaryValue, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
                {achievedGoals}/{totalSavingsGoals}
              </Text>
              <Text style={[styles.summaryLabel, { color: Colors[isDarkMode ? 'dark' : 'light'].icon }]}>Goals Achieved</Text>
            </View>
          </View>

          {topCategory && (
            <View style={[styles.topCategoryCard, { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].background }]}>
              <Text style={[styles.topCategoryLabel, { color: Colors[isDarkMode ? 'dark' : 'light'].icon }]}>
                Top Spending Category
              </Text>
              <View style={styles.topCategoryContent}>
                <Text style={styles.topCategoryIcon}>{topCategory.icon}</Text>
                <View style={styles.topCategoryInfo}>
                  <Text style={[styles.topCategoryName, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
                    {topCategory.category_name}
                  </Text>
                  <Text style={[styles.topCategoryAmount, { color: '#F44336' }]}>
                    {formatCurrency(topCategory.total_amount)} ({topCategory.percentage_of_total.toFixed(1)}%)
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Trend Chart */}
        {reportData.monthly.length > 0 && (
          <View style={[styles.chartContainer, { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].cardBackground }]}>
            <Text style={[styles.chartTitle, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
              📈 Monthly Expenses Trend
            </Text>
            <Canvas style={{ width: screenWidth - 60, height: 180 }}>
              <Path path={getLineChartPath()} color="#007AFF" style="stroke" strokeWidth={3} />
            </Canvas>
            <View style={styles.chartLegend}>
              {reportData.monthly.slice(0, 3).map((month, i) => (
                <View key={i} style={styles.chartLegendItem}>
                  <Text style={[styles.chartLegendMonth, { color: Colors[isDarkMode ? 'dark' : 'light'].icon }]}>
                    {month.month_name}
                  </Text>
                  <Text style={[styles.chartLegendAmount, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
                    {formatCurrency(month.total_amount)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderMonthlyReport = () => (
    <View style={[styles.reportCard, { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].cardBackground }]}>
      <Text style={[styles.reportTitle, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
        📅 Monthly Expenditure Analysis
      </Text>
      {reportData.monthly.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={64} color={Colors[isDarkMode ? 'dark' : 'light'].icon} />
          <Text style={[styles.emptyText, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
            No monthly data available for {selectedYear}
          </Text>
        </View>
      ) : (
        reportData.monthly.map((month, index) => (
          <View key={index} style={styles.reportRow}>
            <View style={styles.reportRowLeft}>
              <Text style={[styles.reportMonth, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
                {month.month_name}
              </Text>
              <Text style={[styles.reportSubtext, { color: Colors[isDarkMode ? 'dark' : 'light'].icon }]}>
                {month.transaction_count} transactions • Avg: {formatCurrency(month.avg_amount)}
              </Text>
            </View>
            <View style={styles.reportRowRight}>
              <Text style={[styles.reportAmount, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
                {formatCurrency(month.total_amount)}
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
        ))
      )}
    </View>
  );

  const renderSavingsReport = () => (
    <View style={[styles.reportCard, { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].cardBackground }]}>
      <Text style={[styles.reportTitle, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
        🎯 Savings Goals Progress
      </Text>
      {!reportData.savings || reportData.savings.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="trophy-outline" size={64} color={Colors[isDarkMode ? 'dark' : 'light'].icon} />
          <Text style={[styles.emptyText, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
            No savings goals found
          </Text>
        </View>
      ) : (
        reportData.savings.map((goal, index) => (
          <View key={index} style={styles.budgetItem}>
            <View style={styles.budgetHeader}>
              <Text style={[styles.budgetCategory, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
                {goal.title}
              </Text>
              <View style={[styles.statusBadge, { 
                backgroundColor: goal.is_achieved ? '#4CAF5020' : goal.progress_percentage > 75 ? '#FF980020' : '#007AFF20'
              }]}>
                <Text style={{ 
                  color: goal.is_achieved ? '#4CAF50' : goal.progress_percentage > 75 ? '#FF9800' : '#007AFF',
                  fontSize: 11,
                  fontWeight: '600'
                }}>
                  {goal.is_achieved ? '✅ Achieved' : goal.progress_percentage > 75 ? 'Near Goal' : 'In Progress'}
                </Text>
              </View>
            </View>
            <View style={styles.budgetProgress}>
              <View style={[styles.progressBar, { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].border }]}>
                <View style={[styles.progressFill, { 
                  width: `${Math.min(goal.progress_percentage, 100)}%`,
                  backgroundColor: goal.is_achieved ? '#4CAF50' : goal.progress_percentage > 75 ? '#FF9800' : '#007AFF'
                }]} />
              </View>
            </View>
            <View style={styles.budgetDetails}>
              <Text style={[styles.budgetText, { color: Colors[isDarkMode ? 'dark' : 'light'].icon }]}>
                Current: {formatCurrency(goal.current_amount)}
              </Text>
              <Text style={[styles.budgetText, { color: Colors[isDarkMode ? 'dark' : 'light'].icon }]}>
                Target: {formatCurrency(goal.target_amount)}
              </Text>
            </View>
            <View style={styles.savingsDetails}>
              <Text style={[styles.budgetPercentage, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
                {goal.progress_percentage.toFixed(1)}% completed
              </Text>
              <Text style={[styles.savingsCategory, { color: Colors[isDarkMode ? 'dark' : 'light'].icon }]}>
                {goal.category} • Priority: {goal.priority}
              </Text>
              {goal.target_date && (
                <Text style={[styles.savingsDate, { color: Colors[isDarkMode ? 'dark' : 'light'].icon }]}>
                  Target Date: {new Date(goal.target_date).toLocaleDateString()}
                </Text>
              )}
            </View>
          </View>
        ))
      )}
    </View>
  );

  const renderBudgetReport = () => (
    <View style={[styles.reportCard, { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].cardBackground }]}>
      <Text style={[styles.reportTitle, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
        💰 Budget Adherence Tracking
      </Text>
      {reportData.budget.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="wallet-outline" size={64} color={Colors[isDarkMode ? 'dark' : 'light'].icon} />
          <Text style={[styles.emptyText, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
            No budget data available for {selectedYear}
          </Text>
        </View>
      ) : (
        reportData.budget.map((budget, index) => (
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
                Spent: {formatCurrency(budget.spent_amount)}
              </Text>
              <Text style={[styles.budgetText, { color: Colors[isDarkMode ? 'dark' : 'light'].icon }]}>
                Budget: {formatCurrency(budget.budget_amount)}
              </Text>
            </View>
            <Text style={[styles.budgetPercentage, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
              {budget.utilization_percentage.toFixed(1)}% utilized
            </Text>
          </View>
        ))
      )}
    </View>
  );

  const renderCategoryReport = () => {
    const pieAngles = getPieAngles();
    
    return (
      <View>
        {reportData.category.length > 0 && (
          <View style={[styles.chartContainer, { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].cardBackground }]}>
            <Text style={[styles.chartTitle, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
              🏷️ Category Distribution
            </Text>
            <View style={styles.pieChartContainer}>
              <Canvas style={{ width: 200, height: 200 }}>
                <Group>
                  {pieAngles.map((a, i) => {
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
                    path.rArcTo(
                      radius,
                      radius,
                      0,
                      largeArc === 0,
                      false,
                      endX - startX,
                      endY - startY
                    );
                    
                    path.close();
                    
                    return <Path key={i} path={path} color={a.color} />;
                  })}
                </Group>
              </Canvas>
            </View>
            <View style={styles.legendContainer}>
              {reportData.category.map((cat, i) => (
                <View key={i} style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: cat.color }]} />
                  <Text style={[styles.legendText, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
                    {cat.category_name} ({cat.percentage_of_total.toFixed(1)}%)
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={[styles.reportCard, { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].cardBackground }]}>
          <Text style={[styles.reportTitle, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
            Category Details
          </Text>
          {reportData.category.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="pricetags-outline" size={64} color={Colors[isDarkMode ? 'dark' : 'light'].icon} />
              <Text style={[styles.emptyText, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
                No category data available for {selectedYear}
              </Text>
            </View>
          ) : (
            reportData.category.map((cat, index) => (
              <View key={index} style={styles.categoryItem}>
                <View style={styles.categoryHeader}>
                  <View style={[styles.categoryIcon, { backgroundColor: cat.color + '20' }]}>
                    <Text style={{ fontSize: 20 }}>{cat.icon}</Text>
                  </View>
                  <View style={styles.categoryInfo}>
                    <Text style={[styles.categoryName, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
                      {cat.category_name}
                    </Text>
                    <Text style={[styles.categoryCount, { color: Colors[isDarkMode ? 'dark' : 'light'].icon }]}>
                      {cat.transaction_count} transactions • Avg: {formatCurrency(cat.avg_amount)}
                    </Text>
                  </View>
                </View>
                <View style={styles.categoryAmountContainer}>
                  <Text style={[styles.categoryAmount, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
                    {formatCurrency(cat.total_amount)}
                  </Text>
                  <Text style={[styles.categoryPercentage, { color: Colors[isDarkMode ? 'dark' : 'light'].icon }]}>
                    {cat.percentage_of_total.toFixed(1)}% of total
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </View>
    );
  };

  const renderForecastReport = () => (
    <View style={[styles.reportCard, { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].cardBackground }]}>
      <Text style={[styles.reportTitle, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
        🔮 6-Month Savings Forecast
      </Text>
      {reportData.forecast.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="stats-chart-outline" size={64} color={Colors[isDarkMode ? 'dark' : 'light'].icon} />
          <Text style={[styles.emptyText, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
            No forecast data available
          </Text>
        </View>
      ) : (
        reportData.forecast.map((forecast, index) => (
          <View key={index} style={styles.forecastItem}>
            <View style={styles.forecastHeader}>
              <Text style={[styles.forecastMonth, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
                {forecast.forecast_month}
              </Text>
              <View style={[styles.trendBadge, { 
                backgroundColor: forecast.trend === 'Positive' ? '#4CAF5020' : '#F4433620' 
              }]}>
                <Ionicons 
                  name={forecast.trend === 'Positive' ? 'trending-up' : 'trending-down'} 
                  size={12} 
                  color={forecast.trend === 'Positive' ? '#4CAF50' : '#F44336'} 
                />
                <Text style={{ 
                  color: forecast.trend === 'Positive' ? '#4CAF50' : '#F44336',
                  fontSize: 11,
                  fontWeight: '600',
                  marginLeft: 4
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
                  +{formatCurrency(forecast.projected_income)}
                </Text>
              </View>
              <View style={styles.forecastRow}>
                <Text style={[styles.forecastLabel, { color: Colors[isDarkMode ? 'dark' : 'light'].icon }]}>
                  Projected Expense:
                </Text>
                <Text style={[styles.forecastValue, { color: '#F44336' }]}>
                  -{formatCurrency(forecast.projected_expense)}
                </Text>
              </View>
              <View style={styles.forecastRow}>
                <Text style={[styles.forecastLabel, { color: Colors[isDarkMode ? 'dark' : 'light'].text, fontWeight: '600' }]}>
                  Monthly Savings:
                </Text>
                <Text style={[styles.forecastValue, { 
                  color: forecast.projected_monthly_savings >= 0 ? '#4CAF50' : '#F44336', 
                  fontWeight: '600' 
                }]}>
                  {formatCurrency(forecast.projected_monthly_savings)}
                </Text>
              </View>
            </View>
            <View style={[styles.cumulativeBox, { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].background }]}>
              <Text style={[styles.cumulativeLabel, { color: Colors[isDarkMode ? 'dark' : 'light'].icon }]}>
                Cumulative Savings
              </Text>
              <Text style={[styles.cumulativeValue, { 
                color: forecast.cumulative_savings >= 0 ? '#4CAF50' : '#F44336'
              }]}>
                {formatCurrency(forecast.cumulative_savings)}
              </Text>
            </View>
          </View>
        ))
      )}
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
      case 'savings':
        return renderSavingsReport();
      default:
        return renderOverview();
    }
  };

  if (loading && !refreshing) {
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
      <PageHeader
        title={`REPORTS ${selectedYear}`}
        leftIconName="bar-chart-outline"
        rightIconName="download-outline"
        onRightPress={generatePDF}
        onLeftPress={() => {}}
      />

      {/* Year Selector */}
      <View style={styles.yearSelectorContainer}>
        <TouchableOpacity 
          style={[styles.yearSelector, { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].cardBackground }]}
          onPress={() => setShowYearPicker(true)}
        >
          <Ionicons name="calendar-outline" size={20} color={Colors[isDarkMode ? 'dark' : 'light'].tint} />
          <Text style={[styles.yearSelectorText, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
            {selectedYear}
          </Text>
          <Ionicons name="chevron-down" size={20} color={Colors[isDarkMode ? 'dark' : 'light'].icon} />
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

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors[isDarkMode ? 'dark' : 'light'].tint]}
            tintColor={Colors[isDarkMode ? 'dark' : 'light'].tint}
          />
        }
      >
        {renderContent()}
      </ScrollView>

      {/* Year Picker Modal */}
      <Modal
        visible={showYearPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowYearPicker(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowYearPicker(false)}
        >
          <View style={[styles.yearPickerModal, { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].background }]}>
            <View style={styles.yearPickerHeader}>
              <Text style={[styles.yearPickerTitle, { color: Colors[isDarkMode ? 'dark' : 'light'].text }]}>
                Select Year
              </Text>
              <TouchableOpacity onPress={() => setShowYearPicker(false)}>
                <Ionicons name="close" size={24} color={Colors[isDarkMode ? 'dark' : 'light'].icon} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {getAvailableYears().map((year) => (
                <TouchableOpacity
                  key={year}
                  style={[
                    styles.yearOption,
                    selectedYear === year && { backgroundColor: Colors[isDarkMode ? 'dark' : 'light'].tint + '20' }
                  ]}
                  onPress={() => {
                    setSelectedYear(year);
                    setShowYearPicker(false);
                  }}
                >
                  <Text style={[
                    styles.yearOptionText,
                    { color: selectedYear === year ? Colors[isDarkMode ? 'dark' : 'light'].tint : Colors[isDarkMode ? 'dark' : 'light'].text }
                  ]}>
                    {year}
                  </Text>
                  {selectedYear === year && (
                    <Ionicons name="checkmark" size={24} color={Colors[isDarkMode ? 'dark' : 'light'].tint} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
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
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    padding: 4,
  },
  yearSelectorContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  yearSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  yearSelectorText: {
    fontSize: 16,
    fontWeight: '600',
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
  metricsCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E1E5E9',
  },
  metricsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E1E5E9',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  summaryLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  topCategoryCard: {
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E1E5E9',
  },
  topCategoryLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  topCategoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topCategoryIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  topCategoryInfo: {
    flex: 1,
  },
  topCategoryName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  topCategoryAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  chartContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E1E5E9',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  chartLegendItem: {
    alignItems: 'center',
  },
  chartLegendMonth: {
    fontSize: 12,
    marginBottom: 4,
  },
  chartLegendAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  reportCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E1E5E9',
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
    marginBottom: 4,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
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
    paddingVertical: 4,
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
    marginBottom: 8,
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
    marginBottom: 8,
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
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
  categoryAmountContainer: {
    alignItems: 'flex-end',
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  categoryPercentage: {
    fontSize: 12,
    marginTop: 2,
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
    marginBottom: 12,
  },
  forecastMonth: {
    fontSize: 15,
    fontWeight: '600',
  },
  forecastDetails: {
    marginTop: 6,
  },
  forecastRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
  },
  cumulativeLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  cumulativeValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 16,
  },
  savingsDetails: {
    marginTop: 8,
  },
  savingsCategory: {
    fontSize: 12,
    marginTop: 4,
  },
  savingsDate: {
    fontSize: 12,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  yearPickerModal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    maxHeight: '50%',
  },
  yearPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E5E9',
  },
  yearPickerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  yearOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 20,
    marginVertical: 4,
    borderRadius: 12,
  },
  yearOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
