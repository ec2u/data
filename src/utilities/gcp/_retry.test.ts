/*
 * Copyright © 2025 Metreeca srl
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

import { ApiError } from "@google/genai";
import { describe, expect, it } from "vitest";
import { extractRetryDelay, isRateLimitError } from "./_retry.js";

describe("retry utilities", () => {

	describe("isRateLimitError", () => {

		it("should return true for 429 ApiError", () => {
			const error = new ApiError({ message: "rate limit", status: 429 });
			expect(isRateLimitError(error)).toBe(true);
		});

		it("should return false for non-429 ApiError", () => {
			const error = new ApiError({ message: "server error", status: 500 });
			expect(isRateLimitError(error)).toBe(false);
		});

		it("should return false for non-ApiError", () => {
			const error = new Error("generic error");
			expect(isRateLimitError(error)).toBe(false);
		});

	});

	describe("extractRetryDelay", () => {

		it("should extract delay from direct details property", () => {
			const error = Object.assign(new ApiError({ message: "rate limit", status: 429 }), {
				details: [
					{ "@type": "type.googleapis.com/google.rpc.RetryInfo", retryDelay: "15s" }
				]
			});

			expect(extractRetryDelay(error)).toBe(15000);
		});

		it("should extract delay from nested error.details", () => {
			const error = Object.assign(new ApiError({ message: "rate limit", status: 429 }), {
				error: {
					details: [
						{ "@type": "type.googleapis.com/google.rpc.RetryInfo", retryDelay: "15.533104168s" }
					]
				}
			});

			expect(extractRetryDelay(error)).toBe(15534); // parseFloat(15.533) * 1000 = 15533, ceil = 15534
		});

		it("should extract delay from JSON message with nested error.details", () => {
			const errorData = {
				error: {
					code: 429,
					message: "Rate limit exceeded",
					details: [
						{ "@type": "type.googleapis.com/google.rpc.Help", links: [] },
						{ "@type": "type.googleapis.com/google.rpc.RetryInfo", retryDelay: "15s" }
					]
				}
			};

			const error = new ApiError({ message: JSON.stringify(errorData), status: 429 });

			expect(extractRetryDelay(error)).toBe(15000);
		});

		it("should handle decimal seconds", () => {
			const error = Object.assign(new ApiError({ message: "rate limit", status: 429 }), {
				details: [
					{ "@type": "type.googleapis.com/google.rpc.RetryInfo", retryDelay: "46.745947355s" }
				]
			});

			expect(extractRetryDelay(error)).toBe(46746); // parseFloat(46.745) * 1000 = 46745, ceil = 46746
		});

		it("should return undefined when no RetryInfo present", () => {
			const error = Object.assign(new ApiError({ message: "rate limit", status: 429 }), {
				details: [
					{ "@type": "type.googleapis.com/google.rpc.Help", links: [] }
				]
			});

			expect(extractRetryDelay(error)).toBeUndefined();
		});

		it("should return undefined for non-ApiError", () => {
			const error = new Error("generic error");
			expect(extractRetryDelay(error)).toBeUndefined();
		});

		it("should return undefined when details not found", () => {
			const error = new ApiError({ message: "rate limit", status: 429 });
			expect(extractRetryDelay(error)).toBeUndefined();
		});

	});

});
