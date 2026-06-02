export type PricingType = "AUD" | "USD";
export type SubmissionStatus = "in_progress" | "done" | "retry";

export interface Webhook {
  id: string;
  name: string;
  url: string;
  created_at: string;
}

export interface Submission {
  id: string;
  pricing_type: PricingType;
  slides_url: string;
  docs_url: string;
  feasibility_sheet_url: string;
  enriched_input_sheet_url: string;
  status: SubmissionStatus;
  received_slides_url: string | null;
  received_doc_url: string | null;
  webhook_ids: string[];
  created_at: string;
}

export interface SubmissionFormData {
  pricingType: PricingType;
  slidesURL: string;
  docsURL: string;
  feasibilitySheetURL: string;
  enrichedInputSheetURL: string;
  webhookIds: string[];
}
