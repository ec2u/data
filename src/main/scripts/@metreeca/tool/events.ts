/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */


import { EventHandler, SyntheticEvent, useCallback } from "react";

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a trapping event listener.
 *
 * @param handler the delegate event handler
 *
 * @returns a listener delegating to [[handler]] all events whose default action was not prevented by a previous handler;
 * the default action of delegated events is prevented and their propagation stopped
 */
export function trapping<E extends SyntheticEvent>(handler: EventHandler<E>): EventHandler<E> {
	return function (this: E["currentTarget"], event: E) {
		if ( !event.defaultPrevented ) {

			event.preventDefault();
			event.stopPropagation();

			handler.call(event.currentTarget, event);

		}
	};
}

/**
 * Creates a trailing event listener.
 *
 * @param period the length of the observation period in ms; ignored if equal to `0`
 * @param handler the delegate event handler
 *
 * @returns a listener delegating to [[handler]] only those events that were not followed by other events
 * within [[`period`]]
 *
 * @throws [[`RangeError`]] if [[`period`]] is less than 0
 */
export function trailing<E extends SyntheticEvent>(period: number, handler: EventHandler<E>): EventHandler<E> {

	if ( period < 0 ) {
		throw new RangeError(`negative period {${period}}`);
	}

	if ( period === 0 ) { return handler; } else {

		let last: number;

		return useCallback(e => {

			const memo: any={};

			for (let p in e) { memo[p]=e[p]; } // memoize event with non-enumerable properties

			last=e.timeStamp;

			setTimeout((function (this: E["currentTarget"], event: E) {

				if ( last === memo.timeStamp ) { handler.call(this, event); }

			}).bind(memo.currentTarget), period, memo);

		}, [period]);
	}
}

/**
 * Creates a throttling event listener.
 *
 * @param period the length of the observation period in ms; ignored if equal to `0`
 * @param handler the delegate event handler
 *
 * @returns a listener delegating to [[`handler`]] only the first event within each [[`period`]]
 *
 * @throws [[`RangeError`]] if [[`period`]] is less than 0
 */
export function throttling<E extends SyntheticEvent>(period: number, handler: EventHandler<E>): EventHandler<E> {

	if ( period < 0 ) {
		throw new RangeError(`negative period {${period}}`);
	}

	if ( period === 0 ) { return (handler); } else {

		let last: number;

		return function (this: E["currentTarget"], event: E) {

			if ( !last || last+period <= event.timeStamp ) {

				handler.call(this, event);

				last=event.timeStamp;

			}

		};

	}
}
