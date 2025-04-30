/*
 * Copyright © 2020-2025 EC2U Alliance
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

package eu.ec2u.work.ai;

import com.metreeca.flow.toolkits.Strings;

final class _Texts {

    private static final int CLIP_LIMIT=25;


    static String clip(final String text) {
        return Strings.clip(text.replace('\n', ' '), CLIP_LIMIT);
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private _Texts() { }

}
