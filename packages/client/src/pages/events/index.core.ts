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
