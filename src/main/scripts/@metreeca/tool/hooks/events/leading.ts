/*
 * Copyright © 2020-2021 Metreeca srl
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
import { EventHandler, SyntheticEvent, useCallback } from "react";

/**
 * Creates a leading event listener.
 *
 * @param period the length of the observation period in ms; ignored if equal to `0`
 * @param handler the delegate event handler
 *
 * @returns a listener delegating to [[`handler`]]only those events that were not preceded by other events
 * within [[`period`]]
 *
 * @throws [[`RangeError`]] if [[`period`]] is less than 0
 */
export function useLeading<E extends SyntheticEvent>(period: number, handler: EventHandler<E>): EventHandler<E> {

	if ( period < 0 ) {
		throw new RangeError(`negative period {${period}}`);
	}

	return useCallback(period === 0 ? handler : (function () {

		let last: number;

		return function (this: E["currentTarget"], event: E) {

			if ( !last || last+period <= event.timeStamp ) {
				handler.call(this, event);
			}

			last=event.timeStamp;

		};

	})(), [period]);

}