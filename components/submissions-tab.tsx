'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Submission, SubmissionFormData } from '@/types';

export default function SubmissionsTab() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<SubmissionFormData>({
    pricingType: 'AUD',
    slidesURL: '',
    docsURL: '',
    feasibilitySheetURL: '',
    enrichedInputSheetURL: '',
  });

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const res = await fetch('/api/submissions');
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data);
      }
    } catch (err) {
      console.error('Error fetching submissions:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const newSubmission = await res.json();
        setSubmissions([newSubmission, ...submissions]);
        setShowForm(false);
        setFormData({
          pricingType: 'AUD',
          slidesURL: '',
          docsURL: '',
          feasibilitySheetURL: '',
          enrichedInputSheetURL: '',
        });
      }
    } catch (err) {
      console.error('Error submitting:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Submissions</h2>
        <p className="text-slate-600">Add and manage your data submissions</p>
      </div>

      {!showForm ? (
        <Button onClick={() => setShowForm(true)} className="mb-6">
          New Submission
        </Button>
      ) : (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create New Submission</CardTitle>
            <CardDescription>
              Enter the URLs and details for your new submission
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Pricing Type
                </label>
                <Input
                  type="text"
                  name="pricingType"
                  value={formData.pricingType}
                  onChange={handleInputChange}
                  placeholder="AUD"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Slides URL
                </label>
                <Input
                  type="url"
                  name="slidesURL"
                  value={formData.slidesURL}
                  onChange={handleInputChange}
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Docs URL
                </label>
                <Input
                  type="url"
                  name="docsURL"
                  value={formData.docsURL}
                  onChange={handleInputChange}
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Feasibility Sheet URL
                </label>
                <Input
                  type="url"
                  name="feasibilitySheetURL"
                  value={formData.feasibilitySheetURL}
                  onChange={handleInputChange}
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Enriched Input Sheet URL
                </label>
                <Input
                  type="url"
                  name="enrichedInputSheetURL"
                  value={formData.enrichedInputSheetURL}
                  onChange={handleInputChange}
                  placeholder="https://..."
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? 'Submitting...' : 'Submit'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Recent Submissions</h3>
        {submissions.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-slate-600 text-center">
                No submissions yet. Create one to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          submissions.map((submission) => (
            <Card key={submission.id}>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {submission.pricing_type}
                      </p>
                      <p className="text-sm text-slate-600">
                        {new Date(submission.created_at).toLocaleString()}
                      </p>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      ID: {submission.id.slice(0, 8)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 text-sm">
                    {submission.slides_url && (
                      <div>
                        <p className="text-slate-600">Slides</p>
                        <a
                          href={submission.slides_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline break-all"
                        >
                          View
                        </a>
                      </div>
                    )}
                    {submission.docs_url && (
                      <div>
                        <p className="text-slate-600">Docs</p>
                        <a
                          href={submission.docs_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline break-all"
                        >
                          View
                        </a>
                      </div>
                    )}
                    {submission.feasibility_sheet_url && (
                      <div>
                        <p className="text-slate-600">Feasibility</p>
                        <a
                          href={submission.feasibility_sheet_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline break-all"
                        >
                          View
                        </a>
                      </div>
                    )}
                    {submission.enriched_input_sheet_url && (
                      <div>
                        <p className="text-slate-600">Enriched Input</p>
                        <a
                          href={submission.enriched_input_sheet_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline break-all"
                        >
                          View
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
