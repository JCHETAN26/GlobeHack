import React, { useEffect, useState } from 'react';
import { useDashboardWebSocket } from '@/hooks/useDashboardWebSocket';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, TrendingDown, DollarSign, Zap } from 'lucide-react';

/**
 * Real-Time Expense Tracker
 * 
 * Displays live expense updates as drivers log them.
 * Shows category breakdown, totals, and cost efficiency alerts.
 */
export function RealtimeExpenseTracker() {
  const { connected, expenses, getDriverExpenses, getTripTotal } = useDashboardWebSocket();
  const [categoryTotals, setCategoryTotals] = useState({});
  const [highValueExpenses, setHighValueExpenses] = useState([]);

  // Recalculate totals when expenses change
  useEffect(() => {
    const totals = {};
    let highValue = [];

    for (const exp of expenses) {
      if (!totals[exp.category]) {
        totals[exp.category] = { count: 0, total: 0 };
      }
      totals[exp.category].count += 1;
      totals[exp.category].total += exp.amount;

      // Flag high-value expenses (> $50)
      if (exp.amount > 50) {
        highValue.push(exp);
      }
    }

    setCategoryTotals(totals);
    setHighValueExpenses(highValue);
  }, [expenses]);

  const categoryIcons = {
    fuel: '⛽',
    food: '🍔',
    toll: '🛣️',
    parking: '🅿️',
    repair: '🔧',
    lodging: '🏨',
    other: '📦',
  };

  const categoryColors = {
    fuel: 'bg-yellow-100 text-yellow-800',
    food: 'bg-orange-100 text-orange-800',
    toll: 'bg-blue-100 text-blue-800',
    parking: 'bg-purple-100 text-purple-800',
    repair: 'bg-red-100 text-red-800',
    lodging: 'bg-green-100 text-green-800',
    other: 'bg-gray-100 text-gray-800',
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>💰 Real-Time Expenses</CardTitle>
              <CardDescription>Live updates from driver app</CardDescription>
            </div>
            <div className="text-right">
              <div className={`inline-block px-3 py-1 rounded-full text-sm ${
                connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {connected ? '🟢 Connected' : '🔴 Disconnected'}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Total Expenses & Item Count */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Logged</p>
                <p className="text-3xl font-bold">${totalExpenses.toFixed(2)}</p>
              </div>
              <DollarSign className="h-10 w-10 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Items Logged</p>
                <p className="text-3xl font-bold">{expenses.length}</p>
              </div>
              <Zap className="h-10 w-10 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      {Object.keys(categoryTotals).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Breakdown by Category</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(categoryTotals).map(([cat, data]) => (
              <div key={cat} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{categoryIcons[cat]}</span>
                  <div>
                    <p className="font-medium capitalize">{cat}</p>
                    <p className="text-xs text-gray-500">{data.count} item(s)</p>
                  </div>
                </div>
                <p className="font-bold">${data.total.toFixed(2)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* High-Value Expenses Alert */}
      {highValueExpenses.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <CardTitle className="text-base">High-Value Expenses</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {highValueExpenses.map((exp) => (
              <div key={exp.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium">
                    {categoryIcons[exp.category]} {exp.category.toUpperCase()}
                  </p>
                  <p className="text-xs text-gray-600">
                    Driver {exp.driverId} • {new Date(exp.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                <Badge variant="secondary" className="text-lg">
                  ${exp.amount.toFixed(2)}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      {expenses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📋 Recent Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {[...expenses].reverse().slice(0, 10).map((exp) => (
                <div
                  key={exp.id}
                  className={`p-3 rounded-lg border flex items-center justify-between ${categoryColors[exp.category]}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{categoryIcons[exp.category]}</span>
                    <div>
                      <p className="font-medium text-sm capitalize">{exp.category}</p>
                      <p className="text-xs opacity-75">
                        {new Date(exp.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <p className="font-bold">${exp.amount.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {expenses.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="text-center text-gray-500">
              <p className="text-lg">No expenses logged yet</p>
              <p className="text-sm">Waiting for drivers to log expenses...</p>
              {!connected && (
                <p className="text-sm text-red-500 mt-2">⚠️ WebSocket disconnected</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
