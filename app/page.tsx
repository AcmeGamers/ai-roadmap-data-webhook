"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useApp } from "@/context/app-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2, Send, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import Nav from "@/components/nav";
import type { SubmissionFormData } from "@/types";

const defaultFormData: SubmissionFormData = {
  pricingType: "AUD",
  slidesURL: "",
  docsURL: "",
  feasibilitySheetURL: "",
  enrichedInputSheetURL: "",
  webhookIds: [],
};

const FIELDS = [
  { key: "slidesURL", label: "Template Slides URL" },
  { key: "docsURL", label: "Template Docs URL" },
  { key: "feasibilitySheetURL", label: "Feasibility Sheet URL" },
  { key: "enrichedInputSheetURL", label: "Enriched Input Sheet URL" },
] as const;

export default function NewSubmissionPage() {
  const router = useRouter();
  const { webhooks, loadWebhooks, addSubmission } = useApp();
  const [authLoading, setAuthLoading] = useState(true);
  const [formData, setFormData] = useState<SubmissionFormData>(defaultFormData);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

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
      await loadWebhooks();
      setAuthLoading(false);
    };
    init();
  }, [router, loadWebhooks]);

  const toggleWebhook = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      webhookIds: prev.webhookIds.includes(id)
        ? prev.webhookIds.filter((w) => w !== id)
        : [...prev.webhookIds, id],
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const result = await addSubmission(formData);
    setSubmitting(false);
    if (!result) {
      toast.error("Failed to submit");
      return;
    }
    setSuccess(true);
  };

  if (authLoading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );

  return (
    <div className="flex h-screen bg-background">
      <Nav />

      {success ? (
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
            <h2 className="text-xl font-semibold">Submitted successfully</h2>
            <p className="text-slate-500 text-sm">
              Your data has been sent to the selected webhooks.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSuccess(false);
                setFormData(defaultFormData);
              }}
            >
              Submit another
            </Button>
          </div>
        </main>
      ) : (
        <main className="flex-1 flex overflow-hidden">
          {/* Left — fields */}
          <div className="flex-1 overflow-auto p-8 border-r border-slate-100">
            <h1 className="text-xl font-semibold mb-1">New Submission</h1>
            <p className="text-sm text-slate-500 mb-8">
              Fill in the template URLs and details
            </p>

            <div className="space-y-6">
              {/* Pricing type */}
              <div className="space-y-2">
                <Label>Pricing Type</Label>
                <div className="flex gap-2">
                  {(["AUD", "USD"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, pricingType: type }))
                      }
                      className={`px-5 py-2 rounded-md border text-sm font-medium transition-colors ${
                        formData.pricingType === type
                          ? "bg-slate-900 text-white border-slate-900"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* URL fields */}
              {FIELDS.map(({ key, label }) => (
                <div key={key} className="space-y-2">
                  <Label htmlFor={key}>{label}</Label>
                  <Input
                    id={key}
                    type="url"
                    placeholder="https://..."
                    value={formData[key]}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        [key]: e.target.value,
                      }))
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Right — send panel */}
          <div className="w-72 shrink-0 flex flex-col p-6 bg-slate-50">
            <h2 className="text-sm font-semibold text-slate-700 mb-1">
              Send to
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Select one or more webhooks
            </p>

            {webhooks.length === 0 ? (
              <p className="text-xs text-slate-500 flex-1">
                No webhooks yet.{" "}
                <Link
                  href="/settings"
                  className="underline underline-offset-2 text-slate-700 hover:text-slate-900"
                >
                  Add one in Settings.
                </Link>
              </p>
            ) : (
              <div className="flex-1 space-y-2 overflow-auto">
                {webhooks.map((webhook) => {
                  const selected = formData.webhookIds.includes(webhook.id);
                  return (
                    <button
                      key={webhook.id}
                      type="button"
                      onClick={() => toggleWebhook(webhook.id)}
                      className={`w-full text-left flex items-start gap-2.5 p-3 rounded-lg border transition-colors ${
                        selected
                          ? "bg-white border-slate-300 shadow-sm"
                          : "bg-transparent border-slate-200 hover:bg-white"
                      }`}
                    >
                      <div
                        className={`mt-0.5 h-4 w-4 rounded border shrink-0 flex items-center justify-center ${
                          selected
                            ? "bg-slate-900 border-slate-900"
                            : "border-slate-300"
                        }`}
                      >
                        {selected && (
                          <svg
                            className="h-2.5 w-2.5 text-white"
                            viewBox="0 0 12 12"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                          >
                            <polyline points="2,6 5,9 10,3" />
                          </svg>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 leading-tight">
                          {webhook.name}
                        </p>
                        <p className="text-xs text-slate-400 truncate mt-0.5">
                          {webhook.url}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="pt-4 mt-auto">
              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={submitting || formData.webhookIds.length === 0}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                {submitting
                  ? "Sending..."
                  : `Send${formData.webhookIds.length > 0 ? ` (${formData.webhookIds.length})` : ""}`}
              </Button>
              {formData.webhookIds.length === 0 && (
                <p className="text-xs text-slate-400 text-center mt-2">
                  Select a webhook to send
                </p>
              )}
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
