export interface SubmissionFormData {
  pricingType: string;
  slidesURL: string;
  docsURL: string;
  feasibilitySheetURL: string;
  enrichedInputSheetURL: string;
}

export interface WebhookConfig {
  id: string;
  user_id: string;
  project_id: string | null;
  webhook_type: 'data' | 'status' | 'error';
  webhook_url: string;
  is_global: boolean;
  created_at: string;
  updated_at: string;
}

export interface Submission {
  id: string;
  user_id: string;
  project_id: string | null;
  pricing_type: string;
  slides_url: string | null;
  docs_url: string | null;
  feasibility_sheet_url: string | null;
  enriched_input_sheet_url: string | null;
  created_at: string;
}

export interface WebhookLog {
  id: string;
  submission_id: string;
  webhook_type: 'data' | 'status' | 'error';
  webhook_url: string;
  status: 'pending' | 'success' | 'failed' | 'retrying';
  attempt_number: number;
  response_status: number | null;
  response_body: string | null;
  error_message: string | null;
  next_retry_at: string | null;
  created_at: string;
  updated_at: string;
}
