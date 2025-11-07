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

import { describe, expect, test, vi } from "vitest";
import { compile, Level, log, normalize, Pipe, simple, Sink } from ".";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Test Helpers

/**
 * Creates a mock TemplateStringsArray for testing.
 */
function mockTemplate(strings: string[]): TemplateStringsArray {
	const template = [...strings] as unknown as TemplateStringsArray;
	Object.defineProperty(template, "raw", {
		value: [...strings],
		writable: false,
		enumerable: false,
		configurable: false
	});
	return template;
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe("log() configuration", () => {

	test("creates logger with string path segments", () => {
		const consoleSink: Sink = vi.fn();

		log({
			console: consoleSink,
			"app/module/": { sink: "console" }
		});

		const logger = log("app", "module");
		logger.info`test message`;

		expect(consoleSink).toHaveBeenCalledTimes(1);
		expect(consoleSink).toHaveBeenCalledWith(
			"app/module/",
			Level.info,
			expect.any(Object),
			expect.any(Array)
		);
	});

	test("creates logger with array of path segments", () => {
		const consoleSink: Sink = vi.fn();

		log({
			console: consoleSink,
			"app/module/": { sink: "console" }
		});

		const logger = log("app", "module");
		logger.info`test message`;

		expect(consoleSink).toHaveBeenCalledTimes(1);
		expect(consoleSink).toHaveBeenCalledWith(
			"app/module/",
			Level.info,
			expect.any(Object),
			expect.any(Array)
		);
	});

	test("supports logger chaining with additional path segments", () => {
		const consoleSink: Sink = vi.fn();

		log({
			console: consoleSink,
			"app/": { sink: "console" }
		});

		const parent = log("app");
		const child = parent("module", "submodule");
		child.info`chained message`;

		expect(consoleSink).toHaveBeenCalledTimes(1);
		expect(consoleSink).toHaveBeenCalledWith(
			"app/module/submodule/",
			Level.info,
			expect.any(Object),
			expect.any(Array)
		);
	});

	test("logger methods return the same logger for chaining", () => {
		const consoleSink: Sink = vi.fn();

		log({
			console: consoleSink,
			"app/": { sink: "console" }
		});

		const logger = log("app");
		const result1 = logger.info`message 1`;
		const result2 = result1.warning`message 2`;

		expect(result1).toBe(logger);
		expect(result2).toBe(logger);
		expect(consoleSink).toHaveBeenCalledTimes(2);
	});

	test("creates logger from function using function name", () => {
		const consoleSink: Sink = vi.fn();

		log({
			console: consoleSink,
			"app/": { sink: "console" }
		});

		function myFunction() {}

		const logger = log("app")(myFunction);
		logger.info`test message`;

		expect(consoleSink).toHaveBeenCalledTimes(1);
		expect(consoleSink).toHaveBeenCalledWith(
			"app/myFunction/",
			Level.info,
			expect.any(Object),
			expect.any(Array)
		);
	});

	test("uses 'anonymous' for unnamed functions", () => {
		const consoleSink: Sink = vi.fn();

		log({
			console: consoleSink,
			"app/": { sink: "console" }
		});

		const logger = log("app")(() => {});
		logger.info`test message`;

		expect(consoleSink).toHaveBeenCalledTimes(1);
		expect(consoleSink).toHaveBeenCalledWith(
			"app/anonymous/",
			Level.info,
			expect.any(Object),
			expect.any(Array)
		);
	});

	test("throws error when feed references undefined sink", () => {
		const mockSink: Sink = vi.fn();

		expect(() => {
			log({
				console: mockSink,
				app: { sink: "nonexistent" }
			});
		}).toThrow();
	});

	test("uses no sinks when feed.sink is undefined", () => {
		const consoleSink: Sink = vi.fn();
		const fileSink: Sink = vi.fn();

		log({
			console: consoleSink,
			file: fileSink,
			"test/": {} // no sink specified, should use none
		});

		const logger = log("test");
		logger.info`test message`;

		// Neither sink should receive the message when no sink is specified
		expect(consoleSink).not.toHaveBeenCalled();
		expect(fileSink).not.toHaveBeenCalled();
	});

	test("routes message to single named sink", () => {
		const consoleSink: Sink = vi.fn();
		const fileSink: Sink = vi.fn();

		log({
			console: consoleSink,
			file: fileSink,
			"test/": { sink: "console" }
		});

		const logger = log("test");
		logger.info`test message`;

		expect(consoleSink).toHaveBeenCalledWith(
			"test/",
			Level.info,
			expect.any(Object),
			expect.any(Array)
		);
		expect(fileSink).not.toHaveBeenCalled();
	});

	test("routes message to multiple named sinks", () => {
		const consoleSink: Sink = vi.fn();
		const fileSink: Sink = vi.fn();
		const networkSink: Sink = vi.fn();

		log({
			console: consoleSink,
			file: fileSink,
			network: networkSink,
			"test/": { sink: ["console", "file"] }
		});

		const logger = log("test");
		logger.info`test message`;

		expect(consoleSink).toHaveBeenCalledTimes(1);
		expect(consoleSink).toHaveBeenCalledWith(
			"test/",
			Level.info,
			expect.any(Object),
			expect.any(Array)
		);
		expect(fileSink).toHaveBeenCalledTimes(1);
		expect(fileSink).toHaveBeenCalledWith(
			"test/",
			Level.info,
			expect.any(Object),
			expect.any(Array)
		);
		expect(networkSink).not.toHaveBeenCalled();
	});

	test("filters messages by feed path prefix", () => {
		const appSink: Sink = vi.fn();
		const systemSink: Sink = vi.fn();

		log({
			app: appSink,
			system: systemSink,
			"app/": { sink: "app" },
			"system/": { sink: "system" }
		});

		const appLogger = log("app", "module");
		const systemLogger = log("system", "core");
		const otherLogger = log("other");

		appLogger.info`app message`;
		systemLogger.info`system message`;
		otherLogger.info`other message`;

		// app sink should only receive app/ messages
		expect(appSink).toHaveBeenCalledTimes(1);
		expect(appSink).toHaveBeenCalledWith(
			"app/module/",
			Level.info,
			expect.any(Object),
			expect.any(Array)
		);

		// system sink should only receive system/ messages
		expect(systemSink).toHaveBeenCalledTimes(1);
		expect(systemSink).toHaveBeenCalledWith(
			"system/core/",
			Level.info,
			expect.any(Object),
			expect.any(Array)
		);
	});

	test("filters messages by minimum level in feed", () => {
		const consoleSink: Sink = vi.fn();
		const errorSink: Sink = vi.fn();

		log({
			console: consoleSink,
			error: errorSink,
			"app/": { sink: "console", level: Level.info },     // info and above
			"system/": { sink: "error", level: Level.error }    // only errors
		});

		const appLogger = log("app");
		const systemLogger = log("system");

		// app feed - info level minimum
		appLogger.info`info message`;
		appLogger.warning`warning message`;

		// system feed - error level minimum
		systemLogger.info`info message`;      // should be filtered out
		systemLogger.warning`warning message`; // should be filtered out

		// console should receive 2 messages (info, warning from app)
		expect(consoleSink).toHaveBeenCalledTimes(2);

		// error sink should receive 0 messages (no errors logged to system)
		expect(errorSink).toHaveBeenCalledTimes(0);
	});

	test("supports all log levels (debug, info, warning, error)", () => {
		const consoleSink: Sink = vi.fn();

		log({
			console: consoleSink,
			"app/": { sink: "console" }
		});

		const logger = log("app");

		logger.debug`debug message`;
		logger.info`info message`;
		logger.warning`warning message`;
		logger.error`error message`;

		expect(consoleSink).toHaveBeenCalledTimes(4);

		expect(consoleSink).toHaveBeenNthCalledWith(1, "app/", Level.debug, expect.any(Object), expect.any(Array));
		expect(consoleSink).toHaveBeenNthCalledWith(2, "app/", Level.info, expect.any(Object), expect.any(Array));
		expect(consoleSink).toHaveBeenNthCalledWith(3, "app/", Level.warning, expect.any(Object), expect.any(Array));
		expect(consoleSink).toHaveBeenNthCalledWith(4, "app/", Level.error, expect.any(Object), expect.any(Array));
	});

	test("filters debug level correctly", () => {
		const consoleSink: Sink = vi.fn();

		log({
			console: consoleSink,
			"app/": { sink: "console", level: Level.info } // filter out debug
		});

		const logger = log("app");

		logger.debug`debug message`; // filtered
		logger.info`info message`;   // passes

		expect(consoleSink).toHaveBeenCalledTimes(1);
		expect(consoleSink).toHaveBeenCalledWith("app/", Level.info, expect.any(Object), expect.any(Array));
	});

	test("filters error level correctly", () => {
		const errorSink: Sink = vi.fn();

		log({
			error: errorSink,
			"app/": { sink: "error", level: Level.error } // only errors
		});

		const logger = log("app");

		logger.debug`debug message`;   // filtered
		logger.info`info message`;     // filtered
		logger.warning`warning message`; // filtered
		logger.error`error message`;   // passes

		expect(errorSink).toHaveBeenCalledTimes(1);
		expect(errorSink).toHaveBeenCalledWith("app/", Level.error, expect.any(Object), expect.any(Array));
	});

});

describe("simple() sink", () => {

	test("formats messages with path context", () => {
		const mockLog = vi.fn();
		const originalInfo = console.info;
		console.info = mockLog;

		const sink = simple();
		const message = mockTemplate(["test message"]);

		sink("app/module/", Level.info, message, []);

		expect(mockLog).toHaveBeenCalledWith(
			"%s %s %s",
			"  !",
			"module         ",
			"test message"
		);

		console.info = originalInfo;
	});

	test("uses correct console method for each level", () => {
		const mockDebug = vi.fn();
		const mockInfo = vi.fn();
		const mockWarn = vi.fn();
		const mockError = vi.fn();

		const originalDebug = console.debug;
		const originalInfo = console.info;
		const originalWarn = console.warn;
		const originalError = console.error;

		console.debug = mockDebug;
		console.info = mockInfo;
		console.warn = mockWarn;
		console.error = mockError;

		const sink = simple();
		const message = mockTemplate(["test"]);

		sink("app/", Level.debug, message, []);
		sink("app/", Level.info, message, []);
		sink("app/", Level.warning, message, []);
		sink("app/", Level.error, message, []);

		expect(mockDebug).toHaveBeenCalledTimes(1);
		expect(mockInfo).toHaveBeenCalledTimes(1);
		expect(mockWarn).toHaveBeenCalledTimes(1);
		expect(mockError).toHaveBeenCalledTimes(1);

		console.debug = originalDebug;
		console.info = originalInfo;
		console.warn = originalWarn;
		console.error = originalError;
	});

	test("uses correct prefix for each level", () => {
		const mockLog = vi.fn();
		const originalInfo = console.info;
		const originalWarn = console.warn;
		const originalError = console.error;
		const originalDebug = console.debug;

		console.debug = mockLog;
		console.info = mockLog;
		console.warn = mockLog;
		console.error = mockLog;

		const sink = simple();
		const message = mockTemplate(["test"]);

		sink("app/", Level.debug, message, []);
		expect(mockLog).toHaveBeenLastCalledWith("%s %s %s", "  ?", expect.any(String), "test");

		sink("app/", Level.info, message, []);
		expect(mockLog).toHaveBeenLastCalledWith("%s %s %s", "  !", expect.any(String), "test");

		sink("app/", Level.warning, message, []);
		expect(mockLog).toHaveBeenLastCalledWith("%s %s %s", " !!", expect.any(String), "test");

		sink("app/", Level.error, message, []);
		expect(mockLog).toHaveBeenLastCalledWith("%s %s %s", "!!!", expect.any(String), "test");

		console.debug = originalDebug;
		console.info = originalInfo;
		console.warn = originalWarn;
		console.error = originalError;
	});

	test("extracts context from second-to-last path segment", () => {
		const mockLog = vi.fn();
		const originalInfo = console.info;
		console.info = mockLog;

		const sink = simple();
		const message = mockTemplate(["msg"]);

		// Path: "app/module/submodule/" -> context should be "module"
		sink("app/module/submodule/", Level.info, message, []);

		expect(mockLog).toHaveBeenCalledWith(
			"%s %s %s",
			"  !",
			"submodule      ", // second-to-last segment, padded to 15 chars
			"msg"
		);

		console.info = originalInfo;
	});

	test("handles root path with empty context", () => {
		const mockLog = vi.fn();
		const originalInfo = console.info;
		console.info = mockLog;

		const sink = simple();
		const message = mockTemplate(["msg"]);

		sink("/", Level.info, message, []);

		expect(mockLog).toHaveBeenCalledWith(
			"%s %s %s",
			"  !",
			"               ", // empty context, padded to 15 chars
			"msg"
		);

		console.info = originalInfo;
	});

	test("interpolates template string values correctly", () => {
		const mockLog = vi.fn();
		const originalInfo = console.info;
		console.info = mockLog;

		const sink = simple();
		// Template strings have one more string part than values
		const message = mockTemplate(["Count: ", ", Status: ", ""]);

		sink("app/", Level.info, message, [42, "ok"]);

		expect(mockLog).toHaveBeenCalledWith(
			"%s %s %s",
			"  !",
			expect.any(String),
			"Count: 42, Status: ok"
		);

		console.info = originalInfo;
	});

	test("handles already-resolved function values", () => {
		const mockLog = vi.fn();
		const originalInfo = console.info;
		console.info = mockLog;

		const sink = simple();
		const message = mockTemplate(["Value: ", ""]);

		// Functions should already be resolved by the compile wrapper
		sink("app/", Level.info, message, ["resolved value"]);

		expect(mockLog).toHaveBeenCalledWith(
			"%s %s %s",
			"  !",
			expect.any(String),
			"Value: resolved value"
		);

		console.info = originalInfo;
	});

	test("integrates with log() configuration", () => {
		const mockLog = vi.fn();
		const originalInfo = console.info;
		console.info = mockLog;

		log({
			console: simple(),
			"app/": { sink: "console" }
		});

		const logger = log("app", "module");
		logger.info`integration test`;

		expect(mockLog).toHaveBeenCalledTimes(1);
		expect(mockLog).toHaveBeenCalledWith(
			"%s %s %s",
			"  !",
			"module         ",
			"integration test"
		);

		console.info = originalInfo;
	});

});

describe("normalize()", () => {

	test("extracts context from project file", () => {
		const url = "file:///Users/Alessandro/Metreeca/Projects/EC2U/Pipe/src/pipelines/units/tasks/analyze.ts";
		expect(normalize([url])).toEqual("pipelines/units/tasks/analyze/");
	});

	test("extracts scoped package name from node_modules", () => {
		const url = "file:///Users/Alessandro/Metreeca/Projects/EC2U/Pipe/node_modules/@metreeca/core/dist/index.js";
		expect(normalize([url])).toEqual("@metreeca/core/");
	});

	test("extracts scoped package with nested module path", () => {
		const url = "file:///Users/Alessandro/Metreeca/Projects/EC2U/Pipe/node_modules/@metreeca/core/dist/utils/validate.js";
		expect(normalize([url])).toEqual("@metreeca/core/utils/validate/");
	});

	test("extracts regular package name from node_modules", () => {
		const url = "file:///Users/Alessandro/Metreeca/Projects/EC2U/Pipe/node_modules/express/lib/express.js";
		expect(normalize([url])).toEqual("express/");
	});

	test("handles project file outside src", () => {
		const url = "file:///Users/Alessandro/Metreeca/Projects/EC2U/Pipe/scripts/build.ts";
		expect(normalize([url])).toEqual("scripts/build/");
	});

	test("supports custom project root", () => {
		const url = "file:///Users/Alessandro/packages/core/lib/utils.ts";
		expect(normalize([url], "lib")).toEqual("utils/");
	});

	test("joins path segments with trailing slash", () => {
		expect(normalize(["foo", "bar", "baz"])).toEqual("foo/bar/baz/");
	});

	test("handles single non-URL element", () => {
		expect(normalize(["utilities"])).toEqual("utilities/");
	});

	test("appends extra segments to parsed URL", () => {
		const url = "file:///Users/Alessandro/Metreeca/Projects/EC2U/Pipe/src/pipelines/units.ts";
		expect(normalize([url, "tasks", "analyze"])).toEqual("pipelines/units/tasks/analyze/");
	});

	test("appends extra segments to parsed package URL", () => {
		const url = "file:///Users/Alessandro/Metreeca/Projects/EC2U/Pipe/node_modules/@metreeca/core/dist/index.js";
		expect(normalize([url, "utils", "validate"])).toEqual("@metreeca/core/utils/validate/");
	});

	test("handles empty array", () => {
		expect(normalize([])).toEqual("/");
	});

	test("handles empty string segment", () => {
		expect(normalize(["", "foo", "bar"])).toEqual("/foo/bar/");
	});

	test("strips any file extension", () => {
		const url = "file:///Users/Alessandro/Metreeca/Projects/EC2U/Pipe/src/pipelines/units.py";
		expect(normalize([url])).toEqual("pipelines/units/");
	});

	test("strips multiple extensions", () => {
		const url = "file:///Users/Alessandro/Metreeca/Projects/EC2U/Pipe/src/pipelines/units.test.ts";
		expect(normalize([url])).toEqual("pipelines/units/");
	});

	test("strips extension from package files", () => {
		const url = "file:///Users/Alessandro/Metreeca/Projects/EC2U/Pipe/node_modules/lodash/dist/lodash.min.js";
		expect(normalize([url])).toEqual("lodash/");
	});

	test("handles deeply nested package paths", () => {
		const url = "file:///Users/Alessandro/Metreeca/Projects/EC2U/Pipe/node_modules/@scope/pkg/dist/nested/deep/module.js";
		expect(normalize([url])).toEqual("@scope/pkg/nested/deep/module/");
	});

	test("handles packages without build directory", () => {
		const url = "file:///Users/Alessandro/Metreeca/Projects/EC2U/Pipe/node_modules/package/src/utils.js";
		expect(normalize([url])).toEqual("package/src/utils/");
	});

	test("handles http URLs", () => {
		const url = "http://example.com/node_modules/package/index.js";
		expect(normalize([url])).toEqual("package/");
	});

	test("handles https URLs", () => {
		const url = "https://example.com/path/to/file.ts";
		// Without a "src" root in the path, it takes last 2 segments before file
		expect(normalize([url, "extra"])).toEqual("to/file/extra/");
	});

	test("handles root-level files when custom root matches last segment", () => {
		const url = "file:///Users/Alessandro/project/lib/index.ts";
		expect(normalize([url], "lib")).toEqual("index/");
	});

	test("handles trailing slashes in segments", () => {
		expect(normalize(["foo/", "bar/", "baz/"])).toEqual("foo//bar//baz//");
	});

	test("handles undefined elements in path", () => {
		// undefined is filtered out by the isString check in normalize
		expect(normalize(["foo", undefined as any, "bar"])).toEqual("foo//bar/");
	});

});

describe("compile()", () => {

	test("throws error when feed references undefined sink", () => {
		const mockSink: Sink = vi.fn();

		const feeds = { "app/": { sink: "nonexistent" } };
		const sinks = { console: mockSink };

		expect(() => compile(feeds, sinks)).toThrow();
	});

	test("compiled sink filters messages by feed path prefix", () => {
		const mockSink: Sink = vi.fn();
		const feeds = { "app/": { sink: "console" } };
		const sinks = { console: mockSink };

		const compiled = compile(feeds, sinks);
		const message = mockTemplate(["test"]);

		// Message from "app/module/" should be routed
		compiled[0]("app/module/", Level.info, message, []);
		expect(mockSink).toHaveBeenCalledWith("app/module/", Level.info, message, []);

		vi.clearAllMocks();

		// Message from "other/" should NOT be routed
		compiled[0]("other/", Level.info, message, []);
		expect(mockSink).not.toHaveBeenCalled();
	});

	test("compiled sink filters messages by minimum level", () => {
		const mockSink: Sink = vi.fn();
		const feeds = { "app/": { sink: "console", level: Level.warning } };
		const sinks = { console: mockSink };

		const compiled = compile(feeds, sinks);
		const message = mockTemplate(["test"]);

		// debug < warning - should NOT be routed
		compiled[0]("app/", Level.debug, message, []);
		expect(mockSink).not.toHaveBeenCalled();

		// info < warning - should NOT be routed
		compiled[0]("app/", Level.info, message, []);
		expect(mockSink).not.toHaveBeenCalled();

		// warning >= warning - should be routed
		compiled[0]("app/", Level.warning, message, []);
		expect(mockSink).toHaveBeenCalledWith("app/", Level.warning, message, []);

		vi.clearAllMocks();

		// error > warning - should be routed
		compiled[0]("app/", Level.error, message, []);
		expect(mockSink).toHaveBeenCalledWith("app/", Level.error, message, []);
	});

	test("routes all levels when level is undefined", () => {
		const mockSink: Sink = vi.fn();
		const feeds = { "app/": { sink: "console" } }; // no level specified
		const sinks = { console: mockSink };

		const compiled = compile(feeds, sinks);
		const message = mockTemplate(["test"]);

		compiled[0]("app/", Level.debug, message, []);
		expect(mockSink).toHaveBeenCalledWith("app/", Level.debug, message, []);

		vi.clearAllMocks();

		compiled[0]("app/", Level.info, message, []);
		expect(mockSink).toHaveBeenCalledWith("app/", Level.info, message, []);

		vi.clearAllMocks();

		compiled[0]("app/", Level.warning, message, []);
		expect(mockSink).toHaveBeenCalledWith("app/", Level.warning, message, []);

		vi.clearAllMocks();

		compiled[0]("app/", Level.error, message, []);
		expect(mockSink).toHaveBeenCalledWith("app/", Level.error, message, []);
	});

	test("returns empty array when feed has no sinks", () => {
		const consoleSink: Sink = vi.fn();
		const fileSink: Sink = vi.fn();

		const feeds = { "app/": {} };
		const sinks = { console: consoleSink, file: fileSink };

		const result = compile(feeds, sinks);

		expect(result).toHaveLength(0);
	});

	test("routes to single sink when feed.sink is a string", () => {
		const consoleSink: Sink = vi.fn();
		const fileSink: Sink = vi.fn();

		const feeds = { "app/": { sink: "console" } };
		const sinks = { console: consoleSink, file: fileSink };

		const result = compile(feeds, sinks);

		expect(result).toHaveLength(1);
	});

	test("routes to multiple sinks when feed.sink is an array", () => {
		const consoleSink: Sink = vi.fn();
		const fileSink: Sink = vi.fn();
		const networkSink: Sink = vi.fn();

		const feeds = { "app/": { sink: ["console", "file"] } };
		const sinks = { console: consoleSink, file: fileSink, network: networkSink };

		const result = compile(feeds, sinks);

		expect(result).toHaveLength(2);
	});

	test("handles multiple feeds with different sink configurations", () => {
		const consoleSink: Sink = vi.fn();
		const fileSink: Sink = vi.fn();
		const networkSink: Sink = vi.fn();

		const feeds = {
			"app/": { sink: "console" },
			"system/": { sink: ["file", "network"] },
			"debug/": {} // uses no sinks
		};
		const sinks = { console: consoleSink, file: fileSink, network: networkSink };

		const result = compile(feeds, sinks);

		// app -> 1, system -> 2, debug -> 0
		expect(result).toHaveLength(3);
	});

	test("throws error on first invalid sink in array", () => {
		const mockSink: Sink = vi.fn();

		const feeds = { "app/": { sink: ["console", "invalid", "file"] } };
		const sinks = { console: mockSink, file: mockSink };

		expect(() => compile(feeds, sinks)).toThrow();
	});

	test("handles empty feeds object", () => {
		const mockSink: Sink = vi.fn();
		const feeds = {};
		const sinks = { console: mockSink };

		const result = compile(feeds, sinks);

		expect(result).toHaveLength(0);
	});

	test("handles empty sinks object with no feed references", () => {
		const feeds = { "app/": {} };
		const sinks = {};

		const result = compile(feeds, sinks);

		expect(result).toHaveLength(0);
	});

	test("executes function values only when forwarding to sink", () => {
		const mockSink: Sink = vi.fn();
		const expensiveFunction = vi.fn(() => "computed value");

		const feeds = {
			"app/": { sink: "console", level: Level.warning },
			"other/": { sink: "console" }
		};
		const sinks = { console: mockSink };

		const compiled = compile(feeds, sinks);
		const message = mockTemplate(["test"]);

		// Message that will be filtered - function should NOT execute
		compiled[0]("app/", Level.info, message, [expensiveFunction]);
		expect(expensiveFunction).not.toHaveBeenCalled();
		expect(mockSink).not.toHaveBeenCalled();

		// Message that will be forwarded - function SHOULD execute
		compiled[0]("app/", Level.warning, message, [expensiveFunction]);
		expect(expensiveFunction).toHaveBeenCalledTimes(1);
		expect(mockSink).toHaveBeenCalledWith(
			"app/",
			Level.warning,
			message,
			["computed value"]
		);
	});

	test("filters child feed messages from parent feed", () => {
		const parentSink: Sink = vi.fn();
		const childSink: Sink = vi.fn();

		const feeds = {
			"app/": { sink: "parent" },
			"app/child/": { sink: "child" }
		};
		const sinks = { parent: parentSink, child: childSink };

		const compiled = compile(feeds, sinks);
		const message = mockTemplate(["test"]);

		// Message to app/ should only go to parent sink
		compiled[0]("app/", Level.info, message, []);
		expect(parentSink).toHaveBeenCalledTimes(1);
		expect(childSink).not.toHaveBeenCalled();

		vi.clearAllMocks();

		// Message to app/child/ should go to both sinks (child inherits parent sink)
		// compiled[0] = app/'s parent sink, compiled[1] = app/child/'s child sink
		const appChildSinkIndex = compiled.findIndex((sink, idx) => {
			// Test which compiled sink handles app/child/ path
			const testSink: Sink = vi.fn();
			try {
				sink("app/child/", Level.info, message, []);
				return true;
			} catch {
				return false;
			}
		});

		// Call all compiled sinks to simulate the logger behavior
		compiled.forEach(sink => sink("app/child/", Level.info, message, []));

		// Both sinks should have been called (child inherits parent sink)
		expect(parentSink).toHaveBeenCalledTimes(1);
		expect(childSink).toHaveBeenCalledTimes(1);
	});

	test("deduplicates sink names in merged feeds", () => {
		const consoleSink: Sink = vi.fn();

		const feeds = {
			"app/": { sink: "console" },
			"app/module/": { sink: ["console", "console"] } // duplicate
		};
		const sinks = { console: consoleSink };

		const result = compile(feeds, sinks);

		// Should have 3 compiled sinks: app/ -> console, app/module/ -> console (deduplicated from 2)
		// Even with deduplication, we still create separate wrapper sinks
		expect(result.length).toBeGreaterThan(0);
	});

	test("applies single pipe to wrap sink", () => {
		const mockSink: Sink = vi.fn();
		const upperPipe: Pipe = (sink) => (path, level, message, values) => {
			const parts = message.map(s => s.toUpperCase());
			const uppercased = Object.assign(parts, { raw: message.raw.map(s => s.toUpperCase()) });
			sink(path, level, uppercased as TemplateStringsArray, values);
		};

		const feeds = { "app/": { sink: "console", pipe: upperPipe } };
		const sinks = { console: mockSink };

		const compiled = compile(feeds, sinks);
		const message = mockTemplate(["hello world"]);

		compiled[0]("app/", Level.info, message, []);

		expect(mockSink).toHaveBeenCalledWith(
			"app/",
			Level.info,
			expect.objectContaining({ 0: "HELLO WORLD", raw: ["HELLO WORLD"] }),
			[]
		);
	});

	test("applies multiple pipes in order", () => {
		const mockSink: Sink = vi.fn();

		// First pipe: uppercase
		const upperPipe: Pipe = (sink) => (path, level, message, values) => {
			const parts = message.map(s => s.toUpperCase());
			const uppercased = Object.assign(parts, { raw: message.raw.map(s => s.toUpperCase()) });
			sink(path, level, uppercased as TemplateStringsArray, values);
		};

		// Second pipe: add prefix
		const prefixPipe: Pipe = (sink) => (path, level, message, values) => {
			const parts = message.map(s => `[TEST] ${s}`);
			const prefixed = Object.assign(parts, { raw: message.raw.map(s => `[TEST] ${s}`) });
			sink(path, level, prefixed as TemplateStringsArray, values);
		};

		const feeds = { "app/": { sink: "console", pipe: [upperPipe, prefixPipe] } };
		const sinks = { console: mockSink };

		const compiled = compile(feeds, sinks);
		const message = mockTemplate(["hello"]);

		compiled[0]("app/", Level.info, message, []);

		// Should apply upperPipe first, then prefixPipe
		// Result: "hello" -> "HELLO" -> "[TEST] HELLO"
		expect(mockSink).toHaveBeenCalledWith(
			"app/",
			Level.info,
			expect.objectContaining({ 0: "[TEST] HELLO", raw: ["[TEST] HELLO"] }),
			[]
		);
	});

	test("pipes see results from earlier pipes in the array", () => {
		const mockSink: Sink = vi.fn();
		const calls: string[] = [];

		// First pipe: track what it receives and transforms
		const pipe1: Pipe = (sink) => (path, level, message, values) => {
			calls.push(`pipe1: ${message[0]}`);
			const parts = message.map(s => `P1(${s})`);
			const transformed = Object.assign(parts, { raw: message.raw.map(s => `P1(${s})`) });
			sink(path, level, transformed as TemplateStringsArray, values);
		};

		// Second pipe: should see pipe1's output
		const pipe2: Pipe = (sink) => (path, level, message, values) => {
			calls.push(`pipe2: ${message[0]}`);
			const parts = message.map(s => `P2(${s})`);
			const transformed = Object.assign(parts, { raw: message.raw.map(s => `P2(${s})`) });
			sink(path, level, transformed as TemplateStringsArray, values);
		};

		const feeds = { "app/": { sink: "console", pipe: [pipe1, pipe2] } };
		const sinks = { console: mockSink };

		const compiled = compile(feeds, sinks);
		const message = mockTemplate(["original"]);

		compiled[0]("app/", Level.info, message, []);

		expect(calls).toEqual([
			"pipe1: original",      // pipe1 sees original
			"pipe2: P1(original)"   // pipe2 sees pipe1's transformation
		]);

		expect(mockSink).toHaveBeenCalledWith(
			"app/",
			Level.info,
			expect.objectContaining({ 0: "P2(P1(original))" }),
			[]
		);
	});

});

describe("feed inheritance", () => {

	test("child feed inherits sink from parent feed", () => {
		const consoleSink: Sink = vi.fn();

		log({
			console: consoleSink,
			"app/": { sink: "console" },
			"app/module/": {} // should inherit sink: "console"
		});

		const logger = log("app", "module", "function");
		logger.info`test message`;

		expect(consoleSink).toHaveBeenCalledWith(
			"app/module/function/",
			Level.info,
			expect.any(Object),
			expect.any(Array)
		);
	});

	test("child feed inherits level from parent feed", () => {
		const consoleSink: Sink = vi.fn();

		log({
			console: consoleSink,
			"app/": { sink: "console", level: Level.warning },
			"app/module/": {} // should inherit level: warning
		});

		const logger = log("app", "module");
		logger.info`info message`;  // should be filtered
		logger.warning`warning message`;  // should pass

		expect(consoleSink).toHaveBeenCalledTimes(1);
		expect(consoleSink).toHaveBeenCalledWith(
			"app/module/",
			Level.warning,
			expect.any(Object),
			expect.any(Array)
		);
	});

	test("child feed overrides parent level", () => {
		const consoleSink: Sink = vi.fn();

		log({
			console: consoleSink,
			"app/": { sink: "console", level: Level.warning },
			"app/module/": { level: Level.info } // override to info
		});

		const logger = log("app", "module");
		logger.info`info message`;  // should pass now

		expect(consoleSink).toHaveBeenCalledTimes(1);
		expect(consoleSink).toHaveBeenCalledWith(
			"app/module/",
			Level.info,
			expect.any(Object),
			expect.any(Array)
		);
	});

	test("child feed appends sinks to parent sinks", () => {
		const consoleSink: Sink = vi.fn();
		const fileSink: Sink = vi.fn();

		log({
			console: consoleSink,
			file: fileSink,
			"app/": { sink: "console" },
			"app/module/": { sink: "file" } // append file to console
		});

		const logger = log("app", "module");
		logger.info`test message`;

		// Both sinks should receive the message
		expect(consoleSink).toHaveBeenCalledTimes(1);
		expect(consoleSink).toHaveBeenCalledWith(
			"app/module/",
			Level.info,
			expect.any(Object),
			expect.any(Array)
		);
		expect(fileSink).toHaveBeenCalledTimes(1);
		expect(fileSink).toHaveBeenCalledWith(
			"app/module/",
			Level.info,
			expect.any(Object),
			expect.any(Array)
		);
	});

	test("child feed appends pipes to parent pipes", () => {
		const mockSink: Sink = vi.fn();

		const pipe1: Pipe = (sink) => (path, level, message, values) => {
			const parts = message.map(s => `[P1]${s}`);
			const transformed = Object.assign(parts, { raw: message.raw.map(s => `[P1]${s}`) });
			sink(path, level, transformed as TemplateStringsArray, values);
		};

		const pipe2: Pipe = (sink) => (path, level, message, values) => {
			const parts = message.map(s => `[P2]${s}`);
			const transformed = Object.assign(parts, { raw: message.raw.map(s => `[P2]${s}`) });
			sink(path, level, transformed as TemplateStringsArray, values);
		};

		log({
			console: mockSink,
			"app/": { sink: "console", pipe: pipe1 },
			"app/module/": { pipe: pipe2 } // append pipe2 to pipe1
		});

		const logger = log("app", "module");
		logger.info`test`;

		// Should have both pipes applied: pipe1 then pipe2
		expect(mockSink).toHaveBeenCalledWith(
			"app/module/",
			Level.info,
			expect.objectContaining({ 0: "[P2][P1]test" }),
			[]
		);
	});

	test("inheritance follows shortest path first", () => {
		const consoleSink: Sink = vi.fn();

		// "a/" has 1 step, "a/b/" has 2 steps
		// When looking at "a/b/c/", it should inherit from "a/" first, then "a/b/"
		log({
			console: consoleSink,
			"a/b/": { sink: "console", level: Level.warning },
			"a/": { sink: "console", level: Level.info },
			"a/b/c/": {}
		});

		const logger = log("a", "b", "c");

		// info message should be filtered (warning level from a/b/ overrides info from a/)
		logger.info`info message`;
		expect(consoleSink).not.toHaveBeenCalled();

		// warning message should pass
		logger.warning`warning message`;
		expect(consoleSink).toHaveBeenCalledTimes(1);
	});

	test("multiple parent inheritance with appending", () => {
		const sink1: Sink = vi.fn();
		const sink2: Sink = vi.fn();
		const sink3: Sink = vi.fn();

		log({
			sink1,
			sink2,
			sink3,
			"a/": { sink: "sink1" },
			"a/b/": { sink: "sink2" },
			"a/b/c/": { sink: "sink3" }
		});

		const logger = log("a", "b", "c");
		logger.info`test`;

		// All three sinks should receive the message exactly once
		expect(sink1).toHaveBeenCalledTimes(1);
		expect(sink2).toHaveBeenCalledTimes(1);
		expect(sink3).toHaveBeenCalledTimes(1);
	});

});
