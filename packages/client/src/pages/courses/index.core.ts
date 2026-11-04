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


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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
