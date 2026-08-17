/*
 * Copyright © 2026 Metreeca srl
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { GenerateContentResponse, GenerateContentResponseUsageMetadata } from "@google/genai";

/**
 * Pricing information for Gemini models in USD per million tokens
 * Based on https://ai.google.dev/gemini-api/docs/pricing
 */
const MODEL_PRICING={
	"gemini-2.5-flash": {
		input: 0.075,
		output: 0.30,
		thinking: 0.30
	},
	"gemini-2.5-flash-lite": {
		input: 0.10,
		output: 0.40,
		thinking: 0.40
	},
	"gemini-2.5-pro": {
		// For prompts <= 200k tokens
		input: 1.25,
		output: 10.00,
		thinking: 10.00,
		// For prompts > 200k tokens (not implemented in this simple version)
		inputLong: 2.50,
		outputLong: 15.00
	},
	"gemini-2.0-flash": {
		input: 0.15,
		output: 0.60,
		thinking: null // No thinking capability
	},
	"gemini-2.0-pro": {
		input: 0.15,
		output: 0.60,
		thinking: null // No thinking capability
	}
} as const;

type ModelName=keyof typeof MODEL_PRICING;

export interface CostBreakdown {
	inputCost: number;
	outputCost: number;
	thinkingCost: number;
	totalCost: number;
	model: string;
	usageMetadata: GenerateContentResponseUsageMetadata;
}

/**
 * Estimates the cost of a Gemini API response based on token usage
 */
export function estimateResponseCost(response: GenerateContentResponse): CostBreakdown | null {
	const usageMetadata=response.usageMetadata;
	const model=response.modelVersion;

	if ( !usageMetadata || !model ) {
		return null;
	}

	const modelKey=extractModelKey(model);
	const pricing=MODEL_PRICING[modelKey];

	if ( !pricing ) {
		console.warn(`Unknown model pricing for: ${model}`);
		return null;
	}

	const inputTokens=usageMetadata.promptTokenCount || 0;
	const outputTokens=usageMetadata.candidatesTokenCount || 0;
	const thinkingTokens=usageMetadata.thoughtsTokenCount || 0;

	const inputCost=(inputTokens * pricing.input) / 1_000_000;
	const outputCost=(outputTokens * pricing.output) / 1_000_000;
	const thinkingCost=pricing.thinking
		? (thinkingTokens * pricing.thinking) / 1_000_000
		: 0;

	return {
		inputCost,
		outputCost,
		thinkingCost,
		totalCost: inputCost + outputCost + thinkingCost,
		model,
		usageMetadata
	};
}

/**
 * Formats cost breakdown as a readable string
 */
export function formatCostBreakdown(breakdown: CostBreakdown): string {
	const { inputCost, outputCost, thinkingCost, totalCost, model, usageMetadata }=breakdown;

	const modelKey=extractModelKey(model);
	const pricing=MODEL_PRICING[modelKey];

	const inputTokens=usageMetadata.promptTokenCount || 0;
	const outputTokens=usageMetadata.candidatesTokenCount || 0;
	const thinkingTokens=usageMetadata.thoughtsTokenCount || 0;

	let result=`Cost breakdown for ${model}:\n`;
	result+=`  Input: ${inputTokens.toLocaleString()} tokens × $${pricing.input}/1M = ` +
		`$${inputCost.toFixed(6)}\n`;
	result+=`  Output: ${outputTokens.toLocaleString()} tokens × $${pricing.output}/1M = ` +
		`$${outputCost.toFixed(6)}\n`;

	if ( thinkingCost > 0 ) {
		result+=`  Thinking: ${thinkingTokens.toLocaleString()} tokens × $${pricing.thinking}/1M = ` +
			`$${thinkingCost.toFixed(6)}\n`;
	}

	result+=`  Total: $${totalCost.toFixed(6)} (~${(totalCost * 100).toFixed(2)} cents)`;

	return result;
}

/**
 * Extracts the model key from a full model version string
 */
function extractModelKey(modelVersion: string): ModelName {
	// Handle versioned model names like "gemini-2.5-flash-001" or "gemini-2.5-flash@latest"
	const parts=modelVersion.split(/[-@]/);
	const baseModel=parts[0] + "-" + parts[1] + "-" + parts[2];

	if ( baseModel in MODEL_PRICING ) {
		return baseModel as ModelName;
	}

	// Fallback: try to match partial names
	for (const key of Object.keys(MODEL_PRICING) as ModelName[]) {
		if ( modelVersion.includes(key) ) {
			return key;
		}
	}

	// Default fallback
	return "gemini-2.5-flash";
}
