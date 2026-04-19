import React, { useEffect, useState } from 'react';
import { useDashboardWebSocket } from '@/hooks/useDashboardWebSocket';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  MapPin,
  Clock,
  CheckCircle,
} from 'lucide-react';

/**
 * Trip Report Display
 * 
 * Auto-generates and displays comprehensive trip reports when drivers complete trips.
 * Shows cost intelligence, expense breakdown, HOS compliance, and AI insights.
 */
export function TripReportDisplay() {
  const { connected, tripReports } = useDashboardWebSocket();
  const [selectedReport, setSelectedReport] = useState(null);

  // Auto-select latest report
  useEffect(() => {
    if (tripReports.length > 0 && !selectedReport) {
      setSelectedReport(tripReports[tripReports.length - 1]);
    }
  }, [tripReports, selectedReport]);

  if (tripReports.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">
            <p className="text-lg">No trip reports yet</p>
            <p className="text-sm">Waiting for drivers to complete trips...</p>
            {!connected && (
              <p className="text-sm text-red-500 mt-2">⚠️ WebSocket disconnected</p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const report = selectedReport || tripReports[tripReports.length - 1];

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>📊 Trip Reports</CardTitle>
              <CardDescription>Auto-generated from completed trips</CardDescription>
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

      {/* Report Tabs */}
      {tripReports.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {tripReports.map((r, idx) => (
            <button
              key={r.id}
              onClick={() => setSelectedReport(r)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition ${
                selectedReport?.id === r.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Report {tripReports.length - idx}
            </button>
          ))}
        </div>
      )}

      {report && (
        <>
          {/* Trip Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{report.lane}</CardTitle>
                  <CardDescription>Trip ID: {report.tripId}</CardDescription>
                </div>
                <Badge variant="outline" className="text-lg">
                  {report.date}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Driver Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Driver</p>
                  <p className="font-bold">{report.driverName}</p>
                  <p className="text-xs text-gray-600">{report.driverId}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Load ID</p>
                  <p className="font-bold">{report.loadId}</p>
                </div>
              </div>

              {/* Timeline */}
              <div className="border-l-4 border-blue-500 pl-4 space-y-2">
                <div>
                  <p className="text-xs text-gray-500">Assigned</p>
                  <p className="text-sm font-medium">
                    {new Date(report.timeline.assigned).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Pickup</p>
                  <p className="text-sm font-medium">
                    {new Date(report.timeline.pickup).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Delivery</p>
                  <p className="text-sm font-medium">
                    {new Date(report.timeline.delivery).toLocaleString()}
                  </p>
                </div>
                <div className="pt-2">
                  <p className="text-xs text-gray-500">Duration</p>
                  <p className="text-sm font-bold text-blue-600">
                    {report.timeline.totalDuration}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Distance & Route */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Distance & Route
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-xs text-gray-500">Total Miles</p>
                <p className="text-2xl font-bold">{report.distance.totalMiles}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Loaded Miles</p>
                <p className="text-2xl font-bold text-green-600">
                  {report.distance.loadedMiles}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Deadhead</p>
                <p className="text-2xl font-bold text-orange-600">
                  {report.distance.deadheadPercentage}%
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Cost Intelligence */}
          <Card
            className={`border-2 ${
              report.costIntelligence.margin > 75
                ? 'border-green-500 bg-green-50'
                : report.costIntelligence.margin > 50
                ? 'border-yellow-500 bg-yellow-50'
                : 'border-red-500 bg-red-50'
            }`}
          >
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Cost Intelligence 💡
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Financial Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Revenue</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${report.costIntelligence.revenue}
                  </p>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Total Expenses</p>
                  <p className="text-2xl font-bold text-red-600">
                    ${report.expenses.total}
                  </p>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Profit</p>
                  <p
                    className={`text-2xl font-bold ${
                      report.costIntelligence.profit > 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    ${report.costIntelligence.profit}
                  </p>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Margin</p>
                  <p
                    className={`text-2xl font-bold ${
                      report.costIntelligence.margin > 50
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {report.costIntelligence.margin}%
                  </p>
                </div>
              </div>

              {/* CPM Analysis */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Cost Per Mile</span>
                  <p className="font-bold">${report.costIntelligence.totalCostPerMile}/mi</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Fleet Average CPM</span>
                  <p className="font-bold">${report.costIntelligence.fleetAverageCPM}/mi</p>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Variance</span>
                  <Badge
                    variant={
                      report.costIntelligence.costPerMileVsFleet.startsWith('-')
                        ? 'outline'
                        : 'secondary'
                    }
                  >
                    {report.costIntelligence.costPerMileVsFleet}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Expenses by Category */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">💰 Expense Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(report.expenses.byCategory).map(([cat, data]) => {
                if (data.count === 0) return null;
                const categoryEmojis = {
                  fuel: '⛽',
                  food: '🍔',
                  toll: '🛣️',
                  parking: '🅿️',
                  repair: '🔧',
                  lodging: '🏨',
                  other: '📦',
                };
                return (
                  <div key={cat} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{categoryEmojis[cat]}</span>
                      <div>
                        <p className="font-medium capitalize text-sm">{cat}</p>
                        <p className="text-xs text-gray-500">{data.count} item(s)</p>
                      </div>
                    </div>
                    <p className="font-bold">${data.total.toFixed(2)}</p>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* HOS Compliance */}
          <Card
            className={`border-2 ${
              report.hosCompliance.compliant
                ? 'border-green-500 bg-green-50'
                : 'border-red-500 bg-red-50'
            }`}
          >
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-5 w-5" />
                HOS Compliance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Daily Hours</p>
                  <p className="text-lg font-bold">
                    {report.hosCompliance.hoursDriven} / {report.hosCompliance.maxAllowed}h
                  </p>
                  <p
                    className={`text-xs font-bold ${
                      report.hosCompliance.compliant
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {report.hosCompliance.compliant ? '✅ Compliant' : '❌ Violation'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Weekly Hours</p>
                  <p className="text-lg font-bold">
                    {report.hosCompliance.weeklyUsed} / {report.hosCompliance.weeklyMax}h
                  </p>
                  <p
                    className={`text-xs font-bold ${
                      report.hosCompliance.weeklyCompliant
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {report.hosCompliance.weeklyCompliant ? '✅ Compliant' : '❌ Violation'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Summary */}
          {report.aiSummary && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  AI Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{report.aiSummary}</p>
              </CardContent>
            </Card>
          )}

          {/* Generated At */}
          <div className="text-center text-xs text-gray-500">
            Report generated: {new Date(report.generatedAt).toLocaleString()}
          </div>
        </>
      )}
    </div>
  );
}
