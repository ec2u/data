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

package eu.ec2u.data.courses;

import com.metreeca.mesh.meta.jsonld.Frame;

import eu.ec2u.data.events.SchemaEvent.EventAttendanceModeEnumeration;
import eu.ec2u.data.persons.Person;
import eu.ec2u.data.taxonomies.Topic;
import eu.ec2u.data.things.SchemaThing;

import java.time.Duration;
import java.util.Set;

@Frame
public interface SchemaCourseInstance extends SchemaThing {

    boolean isAccessibleForFree();

    Duration courseWorkload();

    EventAttendanceModeEnumeration courseMode();


    Person instructor();


    Set<Topic> audience(); // !!! EC2U Stakeholders

}