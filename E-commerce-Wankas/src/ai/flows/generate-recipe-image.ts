'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateRecipeImageInputSchema = z.object({
  recipeName: z.string().describe('El nombre de la receta para la cual generar una imagen.'),
});
export type GenerateRecipeImageInput = z.infer<typeof GenerateRecipeImageInputSchema>;

const GenerateRecipeImageOutputSchema = z.object({
  imageDataUri: z.string().describe('La imagen generada como un data URI.'),
});
export type GenerateRecipeImageOutput = z.infer<typeof GenerateRecipeImageOutputSchema>;

export async function generateRecipeImage(input: GenerateRecipeImageInput): Promise<GenerateRecipeImageOutput> {
  return generateRecipeImageFlow(input);
}

const generateRecipeImageFlow = ai.defineFlow(
  {
    name: 'generateRecipeImageFlow',
    inputSchema: GenerateRecipeImageInputSchema,
    outputSchema: GenerateRecipeImageOutputSchema,
  },
  async (input) => {
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.5-flash-image-preview',
      prompt: `Genera una imagen fotorrealista de alta calidad de un plato de "${input.recipeName}". La imagen debe ser apetitosa, bien iluminada y visualmente atractiva, adecuada para un blog de cocina.`,
      config: {
        responseModalities: ['IMAGE'],
        safetySettings: [
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH',        threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_HARASSMENT',         threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT',  threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        ],
      },
    });

    if (!media || !media.url) {
      throw new Error('No se pudo generar la imagen de la receta o la URL de la imagen está vacía.');
    }

    return { imageDataUri: media.url };
  }
);
