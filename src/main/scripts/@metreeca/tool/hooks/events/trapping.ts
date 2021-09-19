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

import { EventHandler, SyntheticEvent } from "react";


/**
 * Creates a trapping event listener.
 *
 * @param handler the delegate event handler
 *
 * @returns a listener delegating to [[handler]] all events whose default action was not prevented by a previous handler;
 * the default action of delegated events is prevented and their propagation stopped
 */
export function useTrapping<E extends SyntheticEvent>(handler: EventHandler<E>): EventHandler<E> {

	return function (this: E["currentTarget"], event: E) {
		if ( !event.defaultPrevented ) {

			event.preventDefault();
			event.stopPropagation();

			handler.call(event.currentTarget, event);

		}
	};

}