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


export const events = `${ec2u}/events`;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Structured information about an academic event.
 *
 * Dates and times are stated as the source states them, with no timezone attached: a time is read in the local
 * timezone of the venue.
 */
export interface Event {

	/** The title. */
	readonly title: string;

	/** A plain text summary of less than 500 characters. */
	readonly summary?: string;

	/** A detailed description in markdown format. */
	readonly description: string;


	/** The start date, as an ISO calendar date (`yyyy-mm-dd`). */
	readonly startDate: string;

	/** The start time, as an ISO wall clock time without seconds (`hh:mm`). */
	readonly startTime?: string;

	/**
	 * The end date, as an ISO calendar date (`yyyy-mm-dd`).
	 *
	 * Undefined for an event ending on the day it starts.
	 */
	readonly endDate?: string;

	/** The end time, as an ISO wall clock time without seconds (`hh:mm`). */
	readonly endTime?: string;


	/** The entry cost. */
	readonly entryFees?: "free" | "paid";

	/** The way the event is attended. */
	readonly attendanceMode?: "offline" | "online" | "mixed";

	/**
	 * The URL for attending remotely.
	 *
	 * Defined only for `online` and `mixed` events.
	 */
	readonly attendanceURL?: string;


	/** The name of the venue. */
	readonly venueName?: string;

	/** The street address of the venue. */
	readonly venueAddress?: string;

	/** The city the venue is located in. */
	readonly venueCity?: string;


	/** The URL of the illustrative image, query component included. */
	readonly imageURL?: string;

	/** The credits or the copyright notice for the illustrative image. */
	readonly imageCredits?: string;


	/** The major topic. */
	readonly topic?: string;

	/** The intended audience. */
	readonly audience?: string;

	/**
	 * The BCP 47 language tag identifying the language the event is held in.
	 *
	 * Names the language of the event itself, not of the text describing it: a description rendered into a common
	 * language for publication leaves this property untouched, so it is read from the source page rather than from
	 * the description carried here.
	 */
	readonly language: Tag;

}
