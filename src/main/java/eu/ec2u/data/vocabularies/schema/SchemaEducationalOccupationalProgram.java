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

package eu.ec2u.data.vocabularies.schema;

import com.metreeca.mesh.meta.jsonld.Foreign;
import com.metreeca.mesh.meta.jsonld.Frame;

import eu.ec2u.data.datasets.Localized;
import eu.ec2u.data.datasets.courses.Course;

import java.time.Period;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Frame
@SuppressWarnings("NonBooleanMethodNameMayNotStartWithQuestion")
public interface SchemaEducationalOccupationalProgram extends SchemaLearningResource {

    Period timeToComplete();

    @Localized
    Map<Locale, String> programPrerequisites();

    @Foreign
    Set<Course> hasCourse();

}