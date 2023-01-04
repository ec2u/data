/*
 * Copyright © 2020-2023 EC2U Alliance
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

package eu.ec2u.data.work;

import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static eu.ec2u.data.work.Work.url;
import static org.assertj.core.api.Assertions.assertThat;

final class WorkTest {

    @Nested final class URLNormalizer {

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

        @Test void none() {
            assertThat(url("none"))
                    .isEmpty();
        }

    }

}