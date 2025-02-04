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

package eu.ec2u.data.persons;

import com.metreeca.flow.handlers.Delegator;
import com.metreeca.link.Shape;

import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.FOAF;
import org.eclipse.rdf4j.model.vocabulary.ORG;

import static com.metreeca.link.Shape.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.create;
import static eu.ec2u.data.EC2U.item;
import static eu.ec2u.data.agents.Agents.Agent;
import static eu.ec2u.data.organizations.Organizations.Organization;

public final class Persons extends Delegator {

    public static final IRI Context=item("/persons/");


    public static Shape Person() {
        return shape(FOAF.PERSON, Agent(),

                property(FOAF.TITLE, optional(string())), // !!! pattern
                property(FOAF.GIVEN_NAME, required(string())), // !!! pattern
                property(FOAF.FAMILY_NAME, required(string())), // !!! pattern

                property(ORG.HEAD_OF, () -> multiple(Organization())),
                property(ORG.MEMBER_OF, () -> multiple(Organization()))

        );
    }


    public static void main(final String... args) {
        exec(() -> create(Context, Persons.class));
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Persons() { }

}