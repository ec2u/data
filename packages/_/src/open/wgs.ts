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

/**
 * W3C WGS84 geographic points and OGC Well-Known Text point literals.
 *
 * Provides the {@link wgs} vocabulary namespace and the {@link WGSPoint} shape for storing and validating points on the
 * Earth surface, and reads points from the Well-Known Text literals published by geospatial sources such as GeoSPARQL
 * endpoints and Wikidata.
 *
 * **Shapes**
 *
 * Validate points on their own, or mix geographic coordinates into other resource shapes:
 *
 * ```typescript
 * import { required, resource } from "@metreeca/blue/resource";
 * import { text } from "@metreeca/blue/string";
 * import { WGSPoint } from "@metreeca/work/open/wgs.js";
 *
 * export function Place() {
 *   return resource(WGSPoint, { space: "https://example.org/" }, {
 *     label: required(text())
 *   });
 * }
 * ```
 *
 * **Well-Known Text**
 *
 * Read a point from a WKT `POINT` literal, optionally qualified by its GeoSPARQL reference system:
 *
 * ```typescript
 * import { WGSPoint } from "@metreeca/work/open/wgs.js";
 *
 * WGSPoint.from("Point(-8.4265 40.2074)");         // { longitude: -8.4265, latitude: 40.2074 }
 * WGSPoint.from("POINT Z (12.5 41.9 120)");        // { longitude: 12.5, latitude: 41.9, altitude: 120 }
 *
 * WGSPoint.from("<http://www.opengis.net/def/crs/EPSG/0/4326> POINT(41.9 12.5)");
 *                                                  // { longitude: 12.5, latitude: 41.9 } - latitude-first CRS
 *
 * WGSPoint.from("POINT EMPTY");                    // undefined
 * WGSPoint.from("POINT(181 0)");                   // undefined - outside WGS84 limits
 * ```
 *
 * @module
 *
 * @see {@link https://www.w3.org/2003/01/geo/ W3C Basic Geo (WGS84 lat/long) Vocabulary}
 * @see {@link https://www.ogc.org/standard/sfa/ OGC Simple Feature Access - Part 1: Common Architecture}
 * @see {@link https://docs.ogc.org/is/22-047r1/22-047r1.html GeoSPARQL 1.1}
 */

import { decimal } from "@metreeca/blue/number";
import { optional, required, resource } from "@metreeca/blue/resource";
import type { Instance } from "@metreeca/blue/value";
import type { Optional } from "@metreeca/core";
import { createNamespace } from "@metreeca/core/resource";


const WKTNumber = String.raw`[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?`;

const WKTPoint = new RegExp([
	String.raw`^\s*`,
	String.raw`(?:<([^<>\s]*)>\s*)?`, // reference system IRI
	String.raw`point\s*(zm|z|m)?\s*`, // keyword and dimension tag
	String.raw`\(\s*(${WKTNumber}(?:\s+${WKTNumber})*)\s*\)`, // coordinates
	String.raw`\s*$`
].join(""), "i");

const WKTAxes: ReadonlyMap<string, { // reference system IRI → horizontal coordinate positions

	readonly longitude: number
	readonly latitude: number

}> = new Map([
	["", { longitude: 0, latitude: 1 }],
	["http://www.opengis.net/def/crs/OGC/1.3/CRS84", { longitude: 0, latitude: 1 }],
	["http://www.opengis.net/def/crs/OGC/0/CRS84h", { longitude: 0, latitude: 1 }],
	["http://www.opengis.net/def/crs/EPSG/0/4326", { longitude: 1, latitude: 0 }]
]);

const WKTDimensions: ReadonlyMap<string, { // dimension tag → coordinate count and altitude position

	readonly size: number
	readonly altitude?: number

}> = new Map([
	["", { size: 2 }],
	["z", { size: 3, altitude: 2 }],
	["m", { size: 3 }],
	["zm", { size: 4, altitude: 2 }]
]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Maximum absolute latitude, in decimal degrees.
 */
export const LatitudeLimit = 90;

/**
 * Maximum absolute longitude, in decimal degrees.
 */
export const LongitudeLimit = 180;


/**
 * W3C WGS84 vocabulary namespace.
 *
 * A closed namespace of the W3C Basic Geo property IRIs points are stored with: `long`, `lat` and `alt`.
 *
 * @see {@link https://www.w3.org/2003/01/geo/ W3C Basic Geo (WGS84 lat/long) Vocabulary}
 */
export const wgs = createNamespace("http://www.w3.org/2003/01/geo/wgs84_pos#", [

	"long",
	"lat",
	"alt"

]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * WGS84 geographic point.
 *
 * Holds a longitude and a latitude in decimal degrees within the WGS84 limits, and an optional altitude in metres
 * above the reference ellipsoid.
 */
export type WGSPoint = Instance<typeof WGSPoint>;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates the shape of WGS84 geographic points.
 *
 * Reach for it to validate points or to mix geographic coordinates into other resource shapes, as done for features
 * located on a map.
 *
 * @returns A shape admitting longitudes within ±{@link LongitudeLimit} degrees, latitudes within ±{@link LatitudeLimit}
 *     degrees, and an optional altitude
 */
export function WGSPoint() {
	return resource({

		space: wgs

	}, {

		longitude: required(decimal({
			minInclusive: -LongitudeLimit,
			maxInclusive: LongitudeLimit
		}), {

			forward: wgs.long

		}),

		latitude: required(decimal({
			minInclusive: -LatitudeLimit,
			maxInclusive: LatitudeLimit
		}), {

			forward: wgs.lat

		}),

		altitude: optional(decimal(), {

			forward: wgs.alt

		})

	});
}

/**
 * WGS84 geographic point factories.
 */
export namespace WGSPoint {

	/**
	 * Creates a point from its Well-Known Text representation.
	 *
	 * Accepts the `POINT` geometry of the OGC Simple Features WKT grammar (ISO 19125-1), optionally preceded by the
	 * coordinate reference system IRI allowed by GeoSPARQL `geo:wktLiteral` values, as returned for instance by
	 * Wikidata coordinate properties. The keyword and dimension tags are case-insensitive and may be surrounded by any
	 * whitespace; coordinates may be signed and in exponent notation.
	 *
	 * Coordinates are read in the axis order of the reference system:
	 *
	 * - no IRI, or `http://www.opengis.net/def/crs/OGC/1.3/CRS84` — longitude, latitude
	 * - `http://www.opengis.net/def/crs/OGC/0/CRS84h` — longitude, latitude, ellipsoidal height
	 * - `http://www.opengis.net/def/crs/EPSG/0/4326` — latitude, longitude
	 *
	 * The `Z` coordinate of a `POINT Z` or `POINT ZM` geometry is returned as `altitude`; the `M` measure of a `POINT
	 * M` or `POINT ZM` geometry is discarded.
	 *
	 * @param point The Well-Known Text representation of the point
	 *
	 * @returns The point, or `undefined` if `point` is malformed, is not a `POINT` geometry, is `EMPTY`, states a
	 *     coordinate count other than the one its dimension tag requires, names an unsupported reference system, or
	 *     lies outside the WGS84 longitude and latitude limits
	 *
	 * @see {@link https://www.ogc.org/standard/sfa/ OGC Simple Feature Access - Part 1: Common Architecture}
	 * @see {@link https://docs.ogc.org/is/22-047r1/22-047r1.html#_rdfs_datatype_geowktliteral GeoSPARQL 1.1 § 8.5.1 - geo:wktLiteral}
	 */
	export function from(point: string): Optional<WGSPoint> {

		const [, system = "", tag = "", text = ""] = point.match(WKTPoint) ?? [];

		const axes = WKTAxes.get(system);
		const dimensions = WKTDimensions.get(tag.toLowerCase());
		const coordinates = text ? text.split(/\s+/).map(Number) : [];

		if ( axes === undefined || dimensions?.size !== coordinates.length ) {

			return undefined;

		} else {

			const longitude = coordinates[axes.longitude];
			const latitude = coordinates[axes.latitude];
			const altitude = dimensions.altitude === undefined ? undefined : coordinates[dimensions.altitude];

			return Math.abs(longitude) > LongitudeLimit || Math.abs(latitude) > LatitudeLimit ? undefined
				: altitude === undefined ? { longitude, latitude }
					: { longitude, latitude, altitude };

		}

	}

}
