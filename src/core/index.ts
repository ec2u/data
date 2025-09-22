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

/**
 * @module core
 *
 * Provides core utilities and common TypeScript helper functions.
 */


import { createHash } from "crypto";

/**
 * Represents any valid JSON value type.
 *
 * Includes primitive types (null, boolean, number, string) and composite types
 * (objects with string keys and arrays) that can contain other JSON values.
 */
export type JSON=null | boolean | number | string | { readonly [key: string]: JSON } | readonly JSON[];


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Checks if a value is not `undefined` or `null`.
 *
 * @param value the value to check
 * @return `true` if the value is neither `undefined` nor `null`
 */
export function isDefined<T>(value: undefined | null | T): value is T {
	return value !== undefined && value !== null;
}

/**
 * Checks if a value is an empty plain object or an empty array.
 *
 * @param value the value to check
 * @return `true` if the value is an empty array or an empty plain object
 */
export function isEmpty(value: unknown): value is Record<PropertyKey, never> | [] {
	return isArray(value) ? value.length === 0
		: isObject(value) ? Object.keys(value).length === 0
			: false;
}

/**
 * Checks if a value is a symbol.
 *
 * @param value the value to check
 * @return `true` if the value is a symbol
 */
export function isSymbol(value: unknown): value is Symbol {
	return typeof value === "symbol";
}

/**
 * Checks if a value is a function.
 *
 * @param value the value to check
 * @return `true` if the value is a function
 */
export function isFunction(value: unknown): value is Function {
	return typeof value === "function";
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Checks if a value is a boolean.
 */
export function isBoolean(value: unknown): value is boolean {
	return typeof value === "boolean";
}

/**
 * Checks if a value is a finite number.
 */
export function isNumber(value: unknown): value is number {
	return Number.isFinite(value);
}

/**
 * Checks if a value is a string.
 */
export function isString(value: unknown): value is string {
	return typeof value === "string";
}

/**
 * Checks if a value is a plain object.
 *
 * A plain object is one created by the Object constructor (or object literal syntax),
 * with Object.prototype as its direct prototype. This excludes built-in objects like
 * Date, RegExp, Array, Buffer, DOM elements, and objects created with custom constructors.
 *
 * This strict definition ensures safe operations like deep cloning, serialization,
 * and property enumeration that assume simple key-value structure without special
 * behavior or internal state.
 *
 * @see https://stackoverflow.com/a/52694022/739773
 */
export function isObject<K extends PropertyKey=PropertyKey, V=unknown>(value: unknown): value is Record<K, V> {
	if ( value === null || value === undefined || typeof value !== "object" ) {

		return false;

	} else {

		const proto=Object.getPrototypeOf(value);

		return proto === Object.prototype || proto === null;

	}
}

/**
 * Checks if a value is an array.
 */
export function isArray<T=unknown>(value: unknown, is?: (value: unknown) => value is T): value is T[] {
	return Array.isArray(value) && (is === undefined || value.every(is));
}


/**
 * Retrieves a value as a boolean if it is one, otherwise returns `undefined`.
 *
 * @param value the value to convert
 * @return the value if it is a boolean, `undefined` otherwise
 */
export function asBoolean(value: unknown): undefined | boolean {
	return isBoolean(value) ? value : undefined;
}

/**
 * Retrieves a value as a number if it is one, otherwise returns `undefined`.
 *
 * @param value the value to convert
 * @return the value if it is a finite number, `undefined` otherwise
 */
export function asNumber(value: unknown): undefined | number {
	return isNumber(value) ? value : undefined;
}

/**
 * Retrieves a value as a string if it is one, otherwise returns `undefined`.
 *
 * @param value the value to convert
 * @return the value if it is a string, `undefined` otherwise
 */
export function asString(value: unknown): undefined | string {
	return isString(value) ? value : undefined;
}

/**
 * Retrieves a value as a plain object if it is one, otherwise returns `undefined`.
 *
 * @param value the value to convert
 * @return the value if it is a plain object, `undefined` otherwise
 */
export function asObject<K extends PropertyKey=PropertyKey, V=unknown>(value: unknown): undefined | Record<K, V> {
	return isObject<K, V>(value) ? value : undefined;
}

/**
 * Retrieves a value as an array if it is one, otherwise returns `undefined`.
 *
 * @param value the value to convert
 * @param is optional type guard to validate array elements
 * @return the value if it is an array (with validated elements if `is` provided), `undefined` otherwise
 */
export function asArray<T=unknown>(value: unknown, is?: (value: unknown) => value is T): undefined | T[] {
	return isArray<T>(value, is) ? value : undefined;
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Computes the MD5 hash of a string.
 *
 * @param data the string to hash
 * @return the MD5 hash as a lowercase hexadecimal string
 */
export function hash(data: string) {
	return createHash("md5").update(data).digest("hex");
}


/**
 * Checks deep object equality.
 *
 * Object pairs are deeply equal if they contain:
 *
 * - two equal {@link Primitive primitive} values or two equal functions
 * - two {@link isObject plain objects} with deeply equal entry sets
 * - two {@link isArray arrays} with pairwise deeply equal items
 *
 * @param x the target object to be checked for equality
 * @param y the reference object to be checked for equality
 *
 * @return `true` if `x` and `y` are deeply equal; `false` otherwise
 *
 * @warning This function does not handle circular references and will cause
 * infinite recursion leading to a stack overflow if the inputs contain cycles.
 */
export function equals(x: unknown, y: unknown): boolean {

	function objectEquals(x: { [s: string | number | symbol]: unknown }, y: typeof x) {

		const xKeys=Object.keys(x);
		const yKeys=Object.keys(y);

		return xKeys.length !== yKeys.length ? false
			: xKeys.every(key => key in y && equals(x[key], y[key]));
	}

	function arrayEquals(x: unknown[], y: typeof x) {
		return x.length === y.length && x.every((value, index) => equals(value, y[index]));
	}

	return isObject(x) ? isObject(y) && objectEquals(x, y)
		: isArray(x) ? isArray(y) && arrayEquals(x, y)
			: Object.is(x, y);
}

/**
 * Creates an immutable deep clone.
 *
 * Only plain objects and arrays are recursively cloned. Other object types
 * (Date, RegExp, Buffer, etc.) are returned as-is to preserve their functionality.
 *
 * @param value the value to be cloned
 *
 * @return a deeply immutable clone of `value`
 *
 * @warning This function does not handle circular references and will cause
 * infinite recursion leading to a stack overflow if the input contains cycles.
 */
export function immutable<T>(value: T): Readonly<T> {

	if ( isArray(value) || isObject(value) ) {

		return Object.freeze(Reflect.ownKeys(value as object).reduce((object: any, key) => {

			object[key]=immutable((value as Record<PropertyKey, unknown>)[key]);

			return object;

		}, Array.isArray(value) ? [] : {})) as Readonly<T>;

	} else {

		return value;

	}
}


/**
 * Throws an error.
 *
 * @param error the error message or Error object to throw
 * @throws the provided error or a new Error with the provided message
 * @return never returns (always throws)
 */
export function error<V>(error: string | Error): V {
	throw isString(error) ? new Error(error) : error;
}
