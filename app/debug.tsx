import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { db } from '../services/database';

type TableData = {
  name: string;
  data: any[];
  count: number;
};

export default function DebugScreen() {
  const [tableData, setTableData] = useState<TableData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedTable, setExpandedTable] = useState<string | null>(null);

  const tables = [
    'users',
    'expense_categories',
    'expenses',
    'budgets',
    'savings_goals',
    'savings_transactions',
    'income'
  ];

  useEffect(() => {
    loadAllTableData();
  }, []);

  const loadAllTableData = async () => {
    try {
      setLoading(true);
      const allData: TableData[] = [];

      for (const tableName of tables) {
        try {
          // Get table data
          const data = db.getAllSync(`SELECT * FROM ${tableName}`) as any[];
          
          // Get row count
          const countResult = db.getFirstSync(`SELECT COUNT(*) as count FROM ${tableName}`) as any;
          const count = countResult?.count || 0;

          allData.push({
            name: tableName,
            data: data || [],
            count
          });
        } catch (error) {
          allData.push({
            name: tableName,
            data: [],
            count: 0
          });
        }
      }

      setTableData(allData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load database data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllTableData();
    setRefreshing(false);
  };

  const toggleTable = (tableName: string) => {
    setExpandedTable(expandedTable === tableName ? null : tableName);
  };

  const clearTable = async (tableName: string) => {
    Alert.alert(
      'Clear Table',
      `Are you sure you want to delete all data from ${tableName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              db.runSync(`DELETE FROM ${tableName}`);
              Alert.alert('Success', `All data from ${tableName} has been cleared`);
              await loadAllTableData();
            } catch (error) {
              Alert.alert('Error', `Failed to clear ${tableName}`);
            }
          }
        }
      ]
    );
  };

  const exportTableData = (table: TableData) => {
    const jsonData = JSON.stringify(table.data, null, 2);
    
    Alert.alert('Exported', `${table.name} data has been logged to console`);
  };

  const renderTableRow = (item: any, index: number) => {
    return (
      <View key={index} style={styles.tableRow}>
        <Text style={styles.rowIndex}>{index + 1}</Text>
        <View style={styles.rowData}>
          {Object.entries(item).map(([key, value]) => (
            <View key={key} style={styles.fieldRow}>
              <Text style={styles.fieldKey}>{key}:</Text>
              <Text style={styles.fieldValue}>
                {value === null ? 'NULL' : String(value)}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderTable = (table: TableData) => {
    const isExpanded = expandedTable === table.name;

    return (
      <View key={table.name} style={styles.tableContainer}>
        <TouchableOpacity
          style={styles.tableHeader}
          onPress={() => toggleTable(table.name)}
        >
          <View style={styles.tableHeaderLeft}>
            <Text style={styles.tableName}>{table.name.toUpperCase()}</Text>
            <Text style={styles.tableCount}>({table.count} rows)</Text>
          </View>
          <View style={styles.tableHeaderRight}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => exportTableData(table)}
            >
              <Ionicons name="download" size={16} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { marginLeft: 8 }]}
              onPress={() => clearTable(table.name)}
            >
              <Ionicons name="trash" size={16} color="#FF3B30" />
            </TouchableOpacity>
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={20}
              color="#666"
              style={{ marginLeft: 8 }}
            />
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.tableContent}>
            {table.data.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View>
                  {table.data.map((item, index) => renderTableRow(item, index))}
                </View>
              </ScrollView>
            ) : (
              <View style={styles.emptyTable}>
                <Text style={styles.emptyText}>No data in this table</Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  const getTotalRecords = () => {
    return tableData.reduce((sum, table) => sum + table.count, 0);
  };

  const runCustomQuery = () => {
    Alert.prompt(
      'Custom SQL Query',
      'Enter a SELECT query to run:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Execute',
          onPress: (query?: string) => {
            if (!query) return;
            try {
              const result = db.getAllSync(query);
              Alert.alert('Success', `Query executed. Check console for results. Found ${result.length} rows.`);
            } catch (error) {
              Alert.alert('Error', `Query failed: ${error}`);
            }
          }
        }
      ],
      'plain-text',
      'SELECT * FROM users LIMIT 5'
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading database data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Database Debug</Text>
        <TouchableOpacity style={styles.queryButton} onPress={runCustomQuery}>
          <Ionicons name="code" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryText}>
          {tableData.length} Tables • {getTotalRecords()} Total Records
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {tableData.map(renderTable)}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  queryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 8,
  },
  summary: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  summaryText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  tableContainer: {
    backgroundColor: '#fff',
    marginVertical: 4,
    marginHorizontal: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  tableHeaderLeft: {
    flex: 1,
  },
  tableName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  tableCount: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  tableHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 4,
  },
  tableContent: {
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
    maxHeight: 400,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    padding: 12,
  },
  rowIndex: {
    width: 30,
    fontSize: 12,
    color: '#999',
    fontWeight: 'bold',
  },
  rowData: {
    flex: 1,
    marginLeft: 8,
  },
  fieldRow: {
    flexDirection: 'row',
    marginBottom: 4,
    minWidth: 300,
  },
  fieldKey: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    width: 120,
  },
  fieldValue: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  emptyTable: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});