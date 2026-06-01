'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WebhookLog } from '@/types';

export default function LogsTab() {
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchLogs();
    // Refresh logs every 10 seconds
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/webhook-logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error('Error fetching webhook logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs =
    filter === 'all' ? logs : logs.filter((log) => log.status === filter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      case 'retrying':
        return 'bg-yellow-100 text-yellow-700';
      case 'pending':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'data':
        return 'bg-purple-100 text-purple-700';
      case 'status':
        return 'bg-cyan-100 text-cyan-700';
      case 'error':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Webhook Delivery Logs</h2>
        <p className="text-slate-600">Track webhook delivery status and history</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filter Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            {['all', 'success', 'failed', 'pending', 'retrying'].map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                    filter === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {status === 'all' ? 'All Logs' : status.toUpperCase()}
                </button>
              )
            )}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-slate-600 text-center">Loading logs...</p>
          </CardContent>
        </Card>
      ) : filteredLogs.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-slate-600 text-center">
              {filter === 'all'
                ? 'No webhook logs yet.'
                : `No ${filter} webhooks found.`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredLogs.map((log) => (
            <Card key={log.id}>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded ${getTypeColor(
                            log.webhook_type
                          )}`}
                        >
                          {log.webhook_type.toUpperCase()}
                        </span>
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded ${getStatusColor(
                            log.status
                          )}`}
                        >
                          {log.status.toUpperCase()}
                        </span>
                        <span className="text-xs text-slate-600">
                          Attempt {log.attempt_number}
                        </span>
                      </div>
                      <p className="text-sm font-mono text-slate-700 break-all mb-2">
                        {log.webhook_url}
                      </p>
                      {log.response_status && (
                        <p className="text-sm text-slate-600">
                          Response Code: {log.response_status}
                        </p>
                      )}
                      {log.error_message && (
                        <p className="text-sm text-red-600 mt-2">
                          Error: {log.error_message}
                        </p>
                      )}
                      {log.next_retry_at && (
                        <p className="text-sm text-slate-600 mt-2">
                          Next Retry:{' '}
                          {new Date(log.next_retry_at).toLocaleString()}
                        </p>
                      )}
                      <p className="text-xs text-slate-500 mt-3">
                        {new Date(log.created_at).toLocaleString()}
                      </p>
                    </div>
                    <button
                      className="text-slate-400 hover:text-slate-600"
                      title="Copy webhook URL"
                      onClick={() => {
                        navigator.clipboard.writeText(log.webhook_url);
                      }}
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </button>
                  </div>
                  {log.response_body && (
                    <div className="bg-slate-50 p-3 rounded text-xs font-mono overflow-x-auto max-h-40 overflow-y-auto">
                      <p className="text-slate-600 mb-1">Response:</p>
                      <code className="text-slate-900">
                        {log.response_body}
                      </code>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
