'use server';
/**
 * @fileOverview تدفق ذكاء اصطناعي لتحليل بيانات المستخدم وتقديم نصائح مخصصة.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AIAssistantInputSchema = z.object({
  tasksSummary: z.string().describe('ملخص المهام الحالية وحالتها.'),
  habitsSummary: z.string().describe('ملخص الالتزام بالعادات.'),
  fitnessSummary: z.string().describe('ملخص النشاط البدني الأخير.'),
  userMessage: z.string().optional().describe('رسالة المستخدم الاختيارية.'),
});

export type AIAssistantInput = z.infer<typeof AIAssistantInputSchema>;

const AIAssistantOutputSchema = z.object({
  response: z.string().describe('رد المساعد الذكي بناءً على البيانات.'),
  insights: z.array(z.string()).describe('نقاط تحليلية محددة.'),
});

export async function getAIInsight(input: AIAssistantInput) {
  return aiAssistantFlow(input);
}

const aiAssistantFlow = ai.defineFlow(
  {
    name: 'aiAssistantFlow',
    inputSchema: AIAssistantInputSchema,
    outputSchema: AIAssistantOutputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      prompt: `أنت مساعد شخصي ذكي في تطبيق "حياتي". مهمتك هي تحليل بيانات المستخدم وتقديم نصائح تحفيزية باللهجة العربية الودودة.

بيانات المستخدم الحالية:
- المهام: {{{tasksSummary}}}
- العادات: {{{habitsSummary}}}
- اللياقة: {{{fitnessSummary}}}

رسالة المستخدم (إن وجدت): {{{userMessage}}}

المطلوب:
1. قدم رداً مخصصاً يحلل نقاط القوة والضعف في يومه.
2. إذا كان هناك تقصير (مثل مهام غير مكتملة أو توقف عن التمرين)، نبهه بلطف.
3. اجعل الرد قصيراً وملهماً.`,
      input: input,
      output: { schema: AIAssistantOutputSchema }
    });
    return output!;
  }
);
