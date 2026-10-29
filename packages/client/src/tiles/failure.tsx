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

import type { Problem } from "@metreeca/http/success";
import { useBoard } from "@metreeca/tile-data/board";
import { type ComponentChildren } from "preact";
import { useEffect } from "preact/hooks";


/**
 * Tells of a failed operation on the shared status board.
 *
 * Puts the problem up as a `failure` post for as long as the failure is shown, clearing it once the view moves on,
 * and renders its children in place of the content the operation failed to deliver.
 */
export function Failure({

	problem,

	children

}: {

	problem: Problem

	children?: ComponentChildren

}) {

	const board = useBoard();

	useEffect(() => {

		const post = board.post({
			status: "failure",
			message: problem.detail ?? problem.title ?? "Unexpected error",
			problem
		});

		return () => board.clear(post);

	}, [board, problem]);

	return <>{children}</>;

}
