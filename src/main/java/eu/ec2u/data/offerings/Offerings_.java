/*
 * Copyright © 2020-2024 EC2U Alliance
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

package eu.ec2u.data.offerings;

import java.math.BigDecimal;
import java.math.RoundingMode;

final class Offerings_ {

    static BigDecimal ects(final String ects) { return ects(new BigDecimal(ects)); }

    static BigDecimal ects(final Number ects) {
        return ects(ects instanceof BigDecimal ? ((BigDecimal)ects) : BigDecimal.valueOf(ects.doubleValue()));
    }

    static BigDecimal ects(final BigDecimal ects) {
        return ects.setScale(1, RoundingMode.UP);
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Offerings_() { }

}
