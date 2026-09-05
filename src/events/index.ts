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

import { ec2u } from "@/index.js";
import type { Tag } from "@metreeca/core/language";
import type { IRI } from "@metreeca/core/resource";
import type { Markdown, Text } from "@metreeca/core/strings";


export const events = `${ec2u}/events`;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export interface Event {

	readonly id: IRI;

	readonly generated?: boolean;
	readonly university: IRI;

	readonly url: readonly IRI[];

	readonly name: Text;
	readonly description?: Markdown;
	readonly disambiguatingDescription?: Text;

	readonly startDate: string;
	readonly endDate?: string;

	readonly inLanguage?: Tag;
	readonly isAccessibleForFree?: boolean;
	readonly eventStatus?: EventStatus;
	readonly eventAttendanceMode?: EventAttendanceMode;

	readonly image?: Image;
	readonly location?: Location;

	readonly publisher?: IRI;

	readonly about?: readonly IRI[];
	readonly audience?: readonly IRI[];

}


export type EventStatus =
	| "EventCancelled"
	| "EventMovedOnline"
	| "EventPostponed"
	| "EventRescheduled"
	| "EventScheduled";

export type EventAttendanceMode =
	| "OfflineEventAttendanceMode"
	| "OnlineEventAttendanceMode"
	| "MixedEventAttendanceMode";


export interface Image {

	readonly url: IRI;

	readonly caption?: Text;
	readonly author?: Text;
	readonly copyrightNotice?: Text;

}

export type Location =
	| Text
	| Place
	| PostalAddress
	| VirtualLocation;

export interface Place {

	readonly name?: Text;
	readonly address?: PostalAddress;

	readonly latitude: number;
	readonly longitude: number;

}

export interface PostalAddress {

	readonly name?: Text;

	readonly addressCountry?: Text;
	readonly addressRegion?: Text;
	readonly addressLocality?: Text;

	readonly postalCode?: Text;
	readonly streetAddress?: Text;

	readonly email?: Text;
	readonly telephone?: Text;

}

export interface VirtualLocation {

	readonly url: IRI;

}
