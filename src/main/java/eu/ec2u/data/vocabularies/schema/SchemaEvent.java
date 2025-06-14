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

import com.metreeca.mesh.meta.jsonld.Embedded;
import com.metreeca.mesh.meta.jsonld.Frame;
import com.metreeca.mesh.meta.shacl.Pattern;
import com.metreeca.mesh.meta.shacl.Required;

import eu.ec2u.data.vocabularies.skos.SKOSConcept;

import java.net.URI;
import java.time.Duration;
import java.time.ZonedDateTime;
import java.util.Set;

import static eu.ec2u.data.datasets.Reference.LANGUAGE_PATTERN;

@Frame
public interface SchemaEvent extends SchemaThing {

    enum EventStatusType {

        EventCancelled,
        EventMovedOnline,
        EventPostponed,
        EventRescheduled,
        EventScheduled

    }

    enum EventAttendanceModeEnumeration {

        OfflineEventAttendanceMode,
        OnlineEventAttendanceMode,
        MixedEventAttendanceMode

    }



    @Override
    @Required
    Set<URI> url();

    @Required
    ZonedDateTime startDate();

    ZonedDateTime endDate();

    default Duration duration() {
        return startDate() == null || endDate() == null || startDate().compareTo(endDate()) >= 0 ?
                null : Duration.between(startDate(), endDate());
    }


    @Pattern(LANGUAGE_PATTERN)
    String inLanguage();

    boolean isAccessibleForFree();

    EventStatusType eventStatus();

    EventAttendanceModeEnumeration eventAttendanceMode();


    @Override
    @Embedded
    SchemaImageObject image();

    @Embedded
    SchemaLocation location();


    SchemaOrganization publisher();


    Set<? extends SKOSConcept> about();

    Set<? extends SKOSConcept> audience();

}
