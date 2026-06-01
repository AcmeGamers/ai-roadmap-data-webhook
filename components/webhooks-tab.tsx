'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { WebhookConfig } from '@/types';

const WEBHOOK_TYPES = ['data', 'status', 'error'] as const;

export default function WebhooksTab() {
  const [configs, setConfigs] = useState<WebhookConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    webhook_type: 'data',
    webhook_url: '',
    is_global: true,
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const res = await fetch('/api/webhook-configs');
      if (res.ok) {
        const data = await res.json();
        setConfigs(data);
      }
    } catch (err) {
      console.error('Error fetching webhook configs:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId
        ? '/api/webhook-configs'
        : '/api/webhook-configs';
      const body = editingId
        ? { id: editingId, ...formData }
        : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const result = await res.json();
        if (editingId) {
          setConfigs(configs.map((c) => (c.id === editingId ? result : c)));
          setEditingId(null);
        } else {
          setConfigs([result, ...configs]);
        }
        setFormData({
          webhook_type: 'data',
          webhook_url: '',
          is_global: true,
        });
      }
    } catch (err) {
      console.error('Error saving webhook config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;

    try {
      const res = await fetch(`/api/webhook-configs?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setConfigs(configs.filter((c) => c.id !== id));
      }
    } catch (err) {
      console.error('Error deleting webhook config:', err);
    }
  };

  const handleEdit = (config: WebhookConfig) => {
    setEditingId(config.id);
    setFormData({
      webhook_type: config.webhook_type,
      webhook_url: config.webhook_url,
      is_global: config.is_global,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({
      webhook_type: 'data',
      webhook_url: '',
      is_global: true,
    });
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Webhooks</h2>
        <p className="text-slate-600">
          Configure where to send data, status, and error notifications
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>
            {editingId ? 'Edit Webhook' : 'Add New Webhook'}
          </CardTitle>
          <CardDescription>
            Configure webhook endpoints for different event types
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Webhook Type
              </label>
              <select
                value={formData.webhook_type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    webhook_type: e.target.value as any,
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {WEBHOOK_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-600 mt-1">
                {formData.webhook_type === 'data' &&
                  'Sent when a new submission is created'}
                {formData.webhook_type === 'status' &&
                  'Sent to update the status of webhooks'}
                {formData.webhook_type === 'error' &&
                  'Sent when webhooks fail or are unreachable'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Webhook URL
              </label>
              <Input
                type="url"
                value={formData.webhook_url}
                onChange={(e) =>
                  setFormData({ ...formData, webhook_url: e.target.value })
                }
                placeholder="https://..."
                required
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="global"
                checked={formData.is_global}
                onChange={(e) =>
                  setFormData({ ...formData, is_global: e.target.checked })
                }
                className="w-4 h-4"
              />
              <label htmlFor="global" className="text-sm font-medium">
                Global Webhook (applies to all projects)
              </label>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading
                  ? 'Saving...'
                  : editingId
                    ? 'Update Webhook'
                    : 'Add Webhook'}
              </Button>
              {editingId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  className="flex-1"
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <div>
        <h3 className="text-xl font-semibold mb-4">Configured Webhooks</h3>
        {configs.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-slate-600 text-center">
                No webhooks configured yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {configs.map((config) => (
              <Card key={config.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-semibold px-2 py-1 rounded bg-slate-100">
                          {config.webhook_type.toUpperCase()}
                        </span>
                        {config.is_global && (
                          <span className="text-xs font-semibold px-2 py-1 rounded bg-blue-100 text-blue-700">
                            GLOBAL
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 break-all font-mono">
                        {config.webhook_url}
                      </p>
                      <p className="text-xs text-slate-500 mt-2">
                        Created{' '}
                        {new Date(config.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(config)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(config.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
