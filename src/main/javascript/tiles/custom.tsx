/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

import { ComponentChildren, h, JSX } from "preact";


export function Custom({ tag, children }: { tag: string, children: ComponentChildren }) {

	const Tag=tag as keyof JSX.IntrinsicElements;

	return <Tag>{children}</Tag>;

}
