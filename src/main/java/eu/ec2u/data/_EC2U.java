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

package eu.ec2u.data;

import com.metreeca.flow.handlers.Delegator;
import com.metreeca.flow.handlers.Router;

import eu.ec2u.data._universities.Universities;
import eu.ec2u.data._universities.University;
import eu.ec2u.data.actors.Actors;
import eu.ec2u.data.agents.Agents;
import eu.ec2u.data.concepts.Concepts;
import eu.ec2u.data.courses.Courses;
import eu.ec2u.data.datasets.Datasets;
import eu.ec2u.data.documents.Documents;
import eu.ec2u.data.events.Events;
import eu.ec2u.data.offerings.Offerings;
import eu.ec2u.data.programs.Programs;
import eu.ec2u.data.resources.Resources;
import eu.ec2u.data.things.Schema;
import eu.ec2u.data.units.Units;


public final class _EC2U extends Delegator {

    public static final String BASE="https://data.ec2u.eu/";


    public _EC2U() {
        delegate(new Router()

                .path("/", new Datasets())

                .path("/resources/*", new Resources())

                .path("/assets/*", new Resources())

                .path("/concepts/*", new Concepts())

                .path("/agents/*", new Agents())

                .path("/universities/", Universities.handler())
                .path("/universities/{code}", University.handler())

                .path("/units/*", new Units())

                .path("/documents/*", new Documents())

                .path("/actors/*", new Actors())

                .path("/things/*", new Schema())

                .path("/events/*", new Events())

                .path("/offerings/*", new Offerings())

                .path("/programs/*", new Programs())

                .path("/courses/*", new Courses())

        );
    }

}
