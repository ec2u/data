/*
 * Copyright © 2020-2026 EC2U Alliance
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

import { describe, expect, it } from "vitest";
import { WGSPoint } from "./wgs.js";


describe("WGSPoint.from()", () => {

	describe("coordinates", () => {

		it("should read longitude before latitude", async () => {
			expect(WGSPoint.from("POINT(12.5 41.9)")).toEqual({ longitude: 12.5, latitude: 41.9 });
		});

		it("should read integer coordinates", async () => {
			expect(WGSPoint.from("POINT(12 41)")).toEqual({ longitude: 12, latitude: 41 });
		});

		it("should read signed coordinates", async () => {
			expect(WGSPoint.from("POINT(-8.4265 -40.2074)")).toEqual({ longitude: -8.4265, latitude: -40.2074 });
			expect(WGSPoint.from("POINT(+8.4265 +40.2074)")).toEqual({ longitude: 8.4265, latitude: 40.2074 });
		});

		it("should read coordinates in exponent notation", async () => {
			expect(WGSPoint.from("POINT(1.25e1 4.19E+1)")).toEqual({ longitude: 12.5, latitude: 41.9 });
		});

		it("should accept the WGS84 limits", async () => {
			expect(WGSPoint.from("POINT(-180 90)")).toEqual({ longitude: -180, latitude: 90 });
			expect(WGSPoint.from("POINT(180 -90)")).toEqual({ longitude: 180, latitude: -90 });
		});

	});

	describe("syntax", () => {

		it("should match the keyword case-insensitively", async () => {
			expect(WGSPoint.from("Point(12.5 41.9)")).toEqual({ longitude: 12.5, latitude: 41.9 });
			expect(WGSPoint.from("point(12.5 41.9)")).toEqual({ longitude: 12.5, latitude: 41.9 });
		});

		it("should accept any whitespace around tokens", async () => {
			expect(WGSPoint.from("  POINT ( 12.5   41.9 )  ")).toEqual({ longitude: 12.5, latitude: 41.9 });
			expect(WGSPoint.from("POINT(12.5\t41.9)")).toEqual({ longitude: 12.5, latitude: 41.9 });
			expect(WGSPoint.from("POINT\n(12.5\n41.9)")).toEqual({ longitude: 12.5, latitude: 41.9 });
		});

	});

	describe("dimensions", () => {

		it("should return the Z coordinate as altitude", async () => {
			expect(WGSPoint.from("POINT Z (12.5 41.9 120)"))
				.toEqual({ longitude: 12.5, latitude: 41.9, altitude: 120 });
		});

		it("should discard the M measure", async () => {
			expect(WGSPoint.from("POINT M (12.5 41.9 7)")).toEqual({ longitude: 12.5, latitude: 41.9 });
		});

		it("should return the Z coordinate and discard the M measure of ZM points", async () => {
			expect(WGSPoint.from("POINT ZM (12.5 41.9 120 7)"))
				.toEqual({ longitude: 12.5, latitude: 41.9, altitude: 120 });
		});

		it("should match dimension tags case-insensitively", async () => {
			expect(WGSPoint.from("point z (12.5 41.9 120)"))
				.toEqual({ longitude: 12.5, latitude: 41.9, altitude: 120 });
		});

		it("should reject coordinate counts not matching the dimension tag", async () => {
			expect(WGSPoint.from("POINT(12.5)")).toBeUndefined();
			expect(WGSPoint.from("POINT(12.5 41.9 120)")).toBeUndefined();
			expect(WGSPoint.from("POINT Z (12.5 41.9)")).toBeUndefined();
			expect(WGSPoint.from("POINT M (12.5 41.9 120 7)")).toBeUndefined();
			expect(WGSPoint.from("POINT ZM (12.5 41.9 120)")).toBeUndefined();
		});

	});

	describe("reference systems", () => {

		it("should read CRS84 points as longitude and latitude", async () => {
			expect(WGSPoint.from("<http://www.opengis.net/def/crs/OGC/1.3/CRS84> POINT(12.5 41.9)"))
				.toEqual({ longitude: 12.5, latitude: 41.9 });
		});

		it("should read CRS84h points as longitude, latitude and height", async () => {
			expect(WGSPoint.from("<http://www.opengis.net/def/crs/OGC/0/CRS84h> POINT Z (12.5 41.9 120)"))
				.toEqual({ longitude: 12.5, latitude: 41.9, altitude: 120 });
		});

		it("should read EPSG:4326 points as latitude and longitude", async () => {
			expect(WGSPoint.from("<http://www.opengis.net/def/crs/EPSG/0/4326> POINT(41.9 12.5)"))
				.toEqual({ longitude: 12.5, latitude: 41.9 });
		});

		it("should reject unsupported reference systems", async () => {
			expect(WGSPoint.from("<http://www.wikidata.org/entity/Q405> Point(12.5 41.9)")).toBeUndefined();
		});

	});

	describe("rejection", () => {

		it("should reject empty points", async () => {
			expect(WGSPoint.from("POINT EMPTY")).toBeUndefined();
			expect(WGSPoint.from("POINT Z EMPTY")).toBeUndefined();
		});

		it("should reject other geometries", async () => {
			expect(WGSPoint.from("LINESTRING(0 0, 1 1)")).toBeUndefined();
			expect(WGSPoint.from("MULTIPOINT((0 0))")).toBeUndefined();
		});

		it("should reject malformed text", async () => {
			expect(WGSPoint.from("")).toBeUndefined();
			expect(WGSPoint.from("POINT(12.5 41.9")).toBeUndefined();
			expect(WGSPoint.from("POINT(a b)")).toBeUndefined();
			expect(WGSPoint.from("POINT(12.5, 41.9)")).toBeUndefined();
			expect(WGSPoint.from("POINT(12.5 41.9) trailing")).toBeUndefined();
		});

		it("should reject coordinates outside the WGS84 limits", async () => {
			expect(WGSPoint.from("POINT(180.5 0)")).toBeUndefined();
			expect(WGSPoint.from("POINT(0 -90.5)")).toBeUndefined();
			expect(WGSPoint.from("<http://www.opengis.net/def/crs/EPSG/0/4326> POINT(91 12.5)")).toBeUndefined();
		});

	});

});
