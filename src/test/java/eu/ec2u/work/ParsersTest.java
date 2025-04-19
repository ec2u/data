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

package eu.ec2u.work;

import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.math.BigInteger;

import static eu.ec2u.work.Parsers.decimal;
import static eu.ec2u.work.Parsers.url;
import static org.assertj.core.api.Assertions.assertThat;

final class ParsersTest {

    @Nested
    final class URLs {

        @Test void absolute() {
            assertThat(url("http://example.com/"))
                    .contains("http://example.com/");
        }

        @Test void relative() {
            assertThat(url("www.example.com"))
                    .contains("https://www.example.com");
        }

        @Test void garbage() {
            assertThat(url("https://utu.zoom.us/j/69048613177 Joachim Schlabach"))
                    .contains("https://utu.zoom.us/j/69048613177");
        }

        @Test void malformedEscape() {
            assertThat(url("https://example.com/%2"))
                    .isEmpty();
        }

        @Test void none() {
            assertThat(url("none"))
                    .isEmpty();
        }

    }


    @Nested
    class Integers {

        @Test void integer() {
            assertThat(Parsers.integer("\t36 (lecture and tutorial recordings)/"))
                    .contains(BigInteger.valueOf(36));
        }

        @Test void fractional() {
            assertThat(Parsers.integer("\t36.5 (lecture and tutorial recordings)/"))
                    .isEmpty();
        }

    }

    @Nested
    class Decimals {

        @Test void integer() {
            assertThat(decimal("\t36 (lecture and tutorial recordings)/"))
                    .contains(new BigDecimal("36"));
        }

        @Test void fractional() {
            assertThat(decimal("\t36.5 (lecture and tutorial recordings)/"))
                    .contains(new BigDecimal("36.5"));
        }

    }

}