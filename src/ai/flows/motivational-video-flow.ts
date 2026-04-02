'use server';
/**
 * @fileOverview تدفق لتوليد فيديوهات تحفيزية مخصصة باستخدام Veo 3.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const MotivationalVideoInputSchema = z.object({
  progressSummary: z.string().describe('ملخص لإنجازات المستخدم اليومية (مهام، عادات، لياقة).'),
});
export type MotivationalVideoInput = z.infer<typeof MotivationalVideoInputSchema>;

const MotivationalVideoOutputSchema = z.object({
  videoDataUri: z.string().describe('بيانات الفيديو المولد بتنسيق data URI.'),
  message: z.string().describe('رسالة تحفيزية مرافقة للفيديو.'),
});
export type MotivationalVideoOutput = z.infer<typeof MotivationalVideoOutputSchema>;

export async function generateMotivationalVideo(input: MotivationalVideoInput): Promise<MotivationalVideoOutput> {
  return motivationalVideoFlow(input);
}

const motivationalVideoFlow = ai.defineFlow(
  {
    name: 'motivationalVideoFlow',
    inputSchema: MotivationalVideoInputSchema,
    outputSchema: MotivationalVideoOutputSchema,
  },
  async (input) => {
    // 1. توليد وصف المشهد بناءً على الإنجازات
    const { text: sceneDescription } = await ai.generate({
      prompt: `بناءً على هذا الإنجاز: "${input.progressSummary}"، صف مشهداً سينمائياً تحفيزياً قصيراً (8 ثوانٍ) يصلح لتوليده كفيديو. المشهد يجب أن يكون ملهماً، مثل تسلق قمة جبل أو شروق شمس فوق غابة. اجعل الوصف باللغة الإنجليزية للموديل.`,
    });

    // 2. توليد الفيديو باستخدام Veo 3
    let { operation } = await ai.generate({
      model: googleAI.model('veo-3.0-generate-preview'),
      prompt: sceneDescription || 'A majestic sunrise over a calm ocean, cinematic lighting, 4k, highly detailed, motivational atmosphere.',
    });

    if (!operation) {
      throw new Error('فشل الموديل في بدء عملية التوليد.');
    }

    // الانتظار حتى اكتمال العملية (فيديو التوليد بطيء)
    while (!operation.done) {
      operation = await ai.checkOperation(operation);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    if (operation.error) {
      throw new Error('خطأ في توليد الفيديو: ' + operation.error.message);
    }

    const videoPart = operation.output?.message?.content.find((p) => !!p.media);
    if (!videoPart || !videoPart.media) {
      throw new Error('لم يتم العثور على الفيديو المولد.');
    }

    // جلب الفيديو وتحويله لـ base64
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(`${videoPart.media.url}&key=${process.env.GEMINI_API_KEY}`);
    const buffer = await response.arrayBuffer();
    const base64Video = Buffer.from(buffer).toString('base64');

    return {
      videoDataUri: `data:video/mp4;base64,${base64Video}`,
      message: `يا بطل، لقد حققت إنجازاً رائعاً اليوم! هذا الفيديو مخصص لك ليلهمك على الاستمرار. إنجازك: ${input.progressSummary}`,
    };
  }
);
