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

package eu.ec2u.data.persons;

import com.metreeca.http.handlers.Delegator;
import com.metreeca.link.Shape;

import eu.ec2u.data.datasets.Datasets;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.FOAF;
import org.eclipse.rdf4j.model.vocabulary.ORG;
import org.eclipse.rdf4j.model.vocabulary.RDF;

import static com.metreeca.link.Shape.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.item;
import static eu.ec2u.data.EC2U.term;
import static eu.ec2u.data.agents.Agents.FOAFAgent;
import static eu.ec2u.data.organizations.Organizations.OrgOrganization;
import static eu.ec2u.data.resources.Resources.Resource;

public final class Persons extends Delegator {

    public static final IRI Context=item("/persons/");

    public static final IRI Person=term("Person");


    public static Shape Person() {
        return shape(Person, Resource(), FOAFPerson(),

                property(RDF.TYPE, hasValue(Person))

        );
    }

    public static Shape FOAFPerson() {
        return shape(FOAF.PERSON, FOAFAgent(),

                property(FOAF.TITLE, optional(string())), // !!! pattern
                property(FOAF.GIVEN_NAME, required(string())), // !!! pattern
                property(FOAF.FAMILY_NAME, required(string())), // !!! pattern

                property(ORG.HEAD_OF, multiple(OrgOrganization())),
                property(ORG.MEMBER_OF, multiple(OrgOrganization()))

        );
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Persons() { }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static void main(final String... args) {
        exec(Persons::create);
    }


    public static void create() {
        Datasets.create(Persons.class, Context);
    }

}