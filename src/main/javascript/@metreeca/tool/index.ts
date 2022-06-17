/*
 * Copyright © 2020-2022 Metreeca srl
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

import { resolve } from "@metreeca/tool/nests/fetcher";


/**
 * The absolute root URL with trailing slash.
 */
export const root: string=resolve("/");

/**
 * The absolute base URL with trailing slash.
 */
export const base: string=resolve((
    document.querySelector("base")?.href || import.meta.env.BASE_URL || "/"
).replace(/\/*$/, "/"), root);


/**
 * The app name as read from the `<title>` HTM head tag.
 */
export const name: string=document.title;

/**
 * The URL of the app icon as read from the `<link rel="icon">` HTML head tag.
 */
export const icon: string=(document.querySelector("link[rel=icon]") as HTMLLinkElement)?.href || "";


/**
 * The app copyright as read from the `<meta name="copyright">` HTML head tag.
 */
export const copy=(document.querySelector("meta[name=copyright]") as HTMLMetaElement)?.content || "";


/**
 * Creates a conditional `class` attribute.
 */
export function classes(classes: { [name: string]: undefined | boolean }): undefined | string {
    return Object.entries(classes)
        .filter(([, state]) => state)
        .map(([label]) => label)
        .join(" ") || undefined;
}