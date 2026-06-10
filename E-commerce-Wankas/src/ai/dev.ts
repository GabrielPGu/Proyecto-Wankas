import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-missing-ingredients.ts';
import '@/ai/flows/identify-food-items.ts';
import '@/ai/flows/suggest-recipes.ts';
import '@/ai/flows/generate-recipe-image.ts';
