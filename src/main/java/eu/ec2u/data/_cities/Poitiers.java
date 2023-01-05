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

package eu.ec2u.data._cities;

import org.eclipse.rdf4j.model.IRI;

import java.time.ZoneId;

import static com.metreeca.open.actions.Wikidata.wd;

import static eu.ec2u.data.ontologies.EC2U.item;

public final class Poitiers {

    public static final IRI University=item("/universities/poitiers");
    public static final IRI City=wd("Q6616");
    public static final IRI Country=wd("Q142");
    public static final String Language="fr";
    public static final ZoneId TimeZone=ZoneId.of("Europe/Paris");


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Poitiers() { }

}
