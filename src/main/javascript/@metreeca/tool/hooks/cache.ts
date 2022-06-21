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

import { Setter } from "@metreeca/tool/hooks/index";
import { useEffect, useState } from "react";


export function useCache<V, D>([value, setValue]: [V, Setter<D>]): [typeof value, typeof setValue] {

    const [cache, setCache]=useState<V>(value);

    useEffect(() => { setCache(value ?? cache); }, [JSON.stringify(value ?? cache)]);

    return [cache, setValue];

}