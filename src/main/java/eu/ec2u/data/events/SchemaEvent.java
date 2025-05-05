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

package eu.ec2u.data.events;

import com.metreeca.mesh.meta.jsonld.Frame;
import com.metreeca.mesh.meta.shacl.Required;

import eu.ec2u.data.taxonomies.Topic;
import eu.ec2u.data.things.SchemaLocation;
import eu.ec2u.data.things.SchemaOrganization;
import eu.ec2u.data.things.SchemaThing;

import java.net.URI;
import java.time.Duration;
import java.time.ZonedDateTime;
import java.util.Set;

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

        MixedEventAttendanceMode,
        OfflineEventAttendanceMode,
        OnlineEventAttendanceMode

    }


    @Required
    @Override
    Set<URI> url();

    @Required
    ZonedDateTime startDate();

    ZonedDateTime endDate();

    default Duration duration() {
        return startDate() == null || endDate() == null || startDate().compareTo(endDate()) >= 0 ?
                null : Duration.between(startDate(), endDate());
    }


    String inLanguage();

    boolean isAccessibleForFree();


    SchemaOrganization publisher();

    Set<SchemaOrganization> organizer();


    Set<SchemaLocation> location();


    Set<Topic> audience();


    EventStatusType eventStatus();

    EventAttendanceModeEnumeration eventAttendanceMode();

}
