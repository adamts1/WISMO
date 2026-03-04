import { z } from 'zod';

export const WismoClassificationSchema = z.object({
  is_wismo: z.boolean(),
  order_name: z.string().nullable(),
  zip_code: z.string().nullable(),
  has_ambiguity: z.boolean(),
  auto_reply: z.string().nullable(),
});

export type WismoClassification = z.infer<typeof WismoClassificationSchema>;

export const OpenSessionDecisionSchema = z.object({
  needHumanSupport: z.boolean(),
  emailResponse: z.string(),
});

export type OpenSessionDecision = z.infer<typeof OpenSessionDecisionSchema>;

export interface OpenSessionInput {
  cleanContent: string;
  subject_to_ai: string | null;
  order_number: string;
  attempts: number;
  status: string;
}
