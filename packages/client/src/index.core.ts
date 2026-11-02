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
const CourseTerms: Readonly<Record<string, string>> = {
	Annual: "Annual",
	First: "First Semester",
	Second: "Second Semester",
	Summer: "Summer",
	Open: "Open"
};

const CourseModes: Readonly<Record<string, string>> = {
	OfflineEventAttendanceMode: "Presence",
	OnlineEventAttendanceMode: "Online",
	MixedEventAttendanceMode: "Hybrid"
};

const EventStatuses: Readonly<Record<string, string>> = {
	EventCancelled: "Cancelled",
	EventMovedOnline: "Moved Online",
	EventPostponed: "Postponed",
	EventRescheduled: "Rescheduled",
	EventScheduled: "Scheduled"
};

const EventAttendanceModes: Readonly<Record<string, string>> = {
	MixedEventAttendanceMode: "Mixed",
	OfflineEventAttendanceMode: "Offline",
	OnlineEventAttendanceMode: "Online"
};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Names a language for the reader.
 *
 * @param tag The language tag to be named
 *
 * @returns The name of the language `tag` identifies, in the runtime locale, or `tag` itself if it names none
 */
export function toLanguage(tag: string): string {
	try {
		return new Intl.DisplayNames(undefined, { type: "language" }).of(tag) ?? tag;
	} catch {
		return tag; // a malformed tag is shown as stated
	}
}

/**
 * Names the term a course is taught in.
 *
 * @param term The term code, as stated by the course
 *
 * @returns The term label, or `term` itself if it is not a known term
 */
export function toCourseTerm(term: string): string {
	return CourseTerms[term] ?? term;
}

/**
 * Names the way a course is attended.
 *
 * @param mode The attendance mode code, as stated by the course
 *
 * @returns The attendance label, or `mode` itself if it is not a known mode
 */
export function toCourseMode(mode: string): string {
	return CourseModes[mode] ?? mode;
}

/**
 * Names the status of an event.
 *
 * @param status The status code, as stated by the event
 *
 * @returns The status label, or `status` itself if it is not a known status
 */
export function toEventStatus(status: string): string {
	return EventStatuses[status] ?? status;
}

/**
 * Names the way an event is attended.
 *
 * @param mode The attendance mode code, as stated by the event
 *
 * @returns The attendance label, or `mode` itself if it is not a known mode
 */
export function toEventAttendanceMode(mode: string): string {
	return EventAttendanceModes[mode] ?? mode;
}


/**
 * Removes the leading alliance name from a label.
 *
 * @param label The label to be shortened
 *
 * @returns The label without its leading `EC2U` prefix, or the label unchanged if it carries none
 */
export function ec2u(label: string): string {
	return label.replace(/^EC2U\s+/, "");
}

/**
 * Shortens a web address to a compact label.
 *
 * @param url The absolute URL to be shortened
 *
 * @returns The host of `url`, followed by the bracketed language tag its path or query names, if any (`www.uc.pt (en)`)
 */
export function site(url: string): string {

	const { host, pathname, search } = new URL(url);

	const lang = (pathname.match(/\b[a-z]{2}\b(?!-)/i) ?? search.match(/\b[a-z]{2}\b(?!-)/i))?.[0];

	return lang ? `${host} (${lang.toLowerCase()})` : host;

}
