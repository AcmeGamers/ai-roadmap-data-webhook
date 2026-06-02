"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useApp } from "@/context/app-context";
import Nav from "@/components/nav";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  RefreshCw,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
} from "lucide-react";
import type { Submission, SubmissionStatus } from "@/types";

type Filter = "all" | SubmissionStatus;

function StatusBadge({ status }: { status: SubmissionStatus }) {
  if (status === "in_progress")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-yellow-700 bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded-full">
        <Clock size={10} /> In Progress
      </span>
    );
  if (status === "done")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
        <CheckCircle2 size={10} /> Done
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
      <AlertCircle size={10} /> Retry
    </span>
  );
}

function UrlItem({ href, label }: { href: string | null; label: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wide text-slate-400">
        {label}
      </span>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
        >
          View <ExternalLink size={9} />
        </a>
      ) : (
        <span className="text-xs text-slate-300">—</span>
      )}
    </div>
  );
}

function SubmissionCard({
  submission,
  onRetry,
  onCopy,
  isAdmin,
}: {
  submission: Submission;
  onRetry: (s: Submission) => void;
  onCopy: (s: Submission) => void;
  isAdmin: boolean;
}) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4 space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <code className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
            {submission.id.slice(0, 8)}
          </code>
          <StatusBadge status={submission.status} />
          <div className="ml-auto flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-slate-500 hover:text-slate-800"
              onClick={() => onCopy(submission)}
            >
              <Copy size={11} className="mr-1.5" /> Use as template
            </Button>
            <span className="text-xs text-slate-400">
              {new Date(submission.created_at).toLocaleString()}
            </span>
          </div>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-wide text-slate-400 mb-2">
            Sent
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase tracking-wide text-slate-400">
                Currency
              </span>
              <Badge variant="outline" className="w-fit text-xs">
                {submission.pricing_type}
              </Badge>
            </div>
            <UrlItem href={submission.slides_url} label="Slides" />
            <UrlItem href={submission.docs_url} label="Docs" />
            <UrlItem
              href={submission.feasibility_sheet_url}
              label="Feasibility"
            />
          </div>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-wide text-slate-400 mb-2">
            Received
          </p>
          {submission.status === "done" ? (
            <p className="text-xs text-slate-400 italic">Success</p>
          ) : (
            submission.status === "in_progress" && (
              <p className="text-xs text-slate-400 italic">
                Waiting for n8n response...
              </p>
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
}

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
  { value: "retry", label: "Retry" },
];

export default function HistoryPage() {
  const router = useRouter();
  const {
    submissions,
    loadSubmissions,
    refreshSubmissions,
    addSubmission,
    setTemplate,
  } = useApp();
  const [authLoading, setAuthLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }
      setIsAdmin(user.user_metadata?.role === "admin");
      await loadSubmissions();
      setAuthLoading(false);
    };
    init();
  }, [router, loadSubmissions]);

  const handleCopy = (submission: Submission) => {
    setTemplate({
      pricingType: submission.pricing_type,
      slidesURL: submission.slides_url ?? "",
      docsURL: submission.docs_url ?? "",
      feasibilitySheetURL: submission.feasibility_sheet_url ?? "",
      enrichedInputSheetURL: submission.enriched_input_sheet_url ?? "",
      webhookIds: submission.webhook_ids ?? [],
    });
    router.push("/");
  };

  const handleRetry = async (submission: Submission) => {
    await addSubmission({
      pricingType: submission.pricing_type,
      slidesURL: submission.slides_url,
      docsURL: submission.docs_url,
      feasibilitySheetURL: submission.feasibility_sheet_url,
      enrichedInputSheetURL: submission.enriched_input_sheet_url,
      webhookIds: submission.webhook_ids,
    });
  };

  const visible =
    filter === "all"
      ? submissions
      : submissions.filter((s) => s.status === filter);
  const countOf = (s: SubmissionStatus) =>
    submissions.filter((x) => x.status === s).length;

  if (authLoading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin h-7 w-7 text-slate-400" />
      </div>
    );

  return (
    <div className="flex h-screen bg-background">
      <Nav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center mb-6">
            <h1 className="text-2xl font-bold">History</h1>
            <Button
              size="sm"
              variant="outline"
              onClick={refreshSubmissions}
              className="ml-auto"
            >
              <RefreshCw size={13} className="mr-1.5" /> Refresh
            </Button>
          </div>

          <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-lg w-fit">
            {FILTERS.map(({ value, label }) => {
              const count =
                value === "all"
                  ? submissions.length
                  : countOf(value as SubmissionStatus);
              return (
                <button
                  key={value}
                  onClick={() => setFilter(value)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    filter === value
                      ? "bg-white shadow-sm text-slate-900"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {label}
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full ${
                      filter === value
                        ? "bg-slate-100 text-slate-600"
                        : "bg-slate-200 text-slate-400"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {visible.length === 0 ? (
            <p className="text-sm text-slate-400 italic">
              No submissions found.
            </p>
          ) : (
            <div className="space-y-3">
              {visible.map((s) => (
                <SubmissionCard
                  key={s.id}
                  submission={s}
                  onRetry={handleRetry}
                  onCopy={handleCopy}
                  isAdmin={isAdmin}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
