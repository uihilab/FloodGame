// AI Tutor Background Web Worker
import { env, pipeline } from 'https://esm.sh/@huggingface/transformers@3.0.0';

env.allowLocalModels = false;

let generator = null;
const modelName = 'onnx-community/Qwen2.5-0.5B-Instruct';

self.addEventListener('message', async (event) => {
    const { type, prompt } = event.data;

    if (type === 'init') {
        try {
            generator = await pipeline('text-generation', modelName, {
                dtype: 'q4',
                progress_callback: (data) => {
                    self.postMessage({ type: 'progress', data });
                }
            });
            self.postMessage({ type: 'ready' });
        } catch (error) {
            console.error("Worker model load error:", error);
            self.postMessage({ type: 'error', error: error.message });
        }
    } else if (type === 'generate') {
        if (!generator) {
            self.postMessage({ type: 'error', error: 'Model not initialized' });
            return;
        }

        try {
            const output = await generator(prompt, {
                max_new_tokens: 120,
                temperature: 0.2,
                do_sample: false,
                stop: ['<|im_end|>', '<|im_start|>']
            });

            let responseText = output[0].generated_text;

            // Normalize special tokens and whitespaces to ensure a match
            const cleanPrompt = prompt.replace(/<\|im_start\|>|<\|im_end\|>/g, '').replace(/\s+/g, ' ').trim();
            const cleanResponse = responseText.replace(/<\|im_start\|>|<\|im_end\|>/g, '').replace(/\s+/g, ' ').trim();

            if (cleanResponse.startsWith(cleanPrompt)) {
                responseText = cleanResponse.substring(cleanPrompt.length).trim();
            } else {
                const marker = "assistant";
                const index = responseText.indexOf(marker);
                if (index !== -1) {
                    responseText = responseText.substring(index + marker.length).trim();
                }
            }

            // Clean up special tokens
            responseText = responseText.replace(/<\|im_start\|>|<\|im_end\|>/g, '').trim();

            // Truncate to the last complete sentence
            const lastPunctuation = Math.max(
                responseText.lastIndexOf('.'),
                responseText.lastIndexOf('!'),
                responseText.lastIndexOf('?')
            );
            if (lastPunctuation !== -1) {
                responseText = responseText.substring(0, lastPunctuation + 1);
            }

            self.postMessage({ type: 'result', text: responseText });
        } catch (error) {
            console.error("Worker generation error:", error);
            self.postMessage({ type: 'error', error: error.message });
        }
    }
});
