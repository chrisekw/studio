'use server';

import {nextHandler} from '@genkit-ai/next';
import '@/ai/dev'; // This imports and registers your defined flows

export const {GET, POST} = nextHandler();
