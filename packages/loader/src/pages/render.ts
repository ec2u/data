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

/**
 * The longest `data:` target, in characters, that the page renderings handed to the model keep as stated.
 *
 * Meant as the `embedded` option of `untag()` wherever a rendering is extracted or digested: small inline assets such
 * as icons and spacers stay as they are, while larger ones are reduced to a placeholder, as their payload is unreadable
 * to the model and costs tokens on every extraction, and a picture pasted into a page, megabytes in size, would exhaust
 * the memory of the loader on its own while the page is being rendered for the model.
 */
export const Embedded = 2048;
