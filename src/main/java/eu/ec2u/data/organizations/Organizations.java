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

package eu.ec2u.data.organizations;

import com.metreeca.link.Shape;

import eu.ec2u.data.concepts.OrganizationTypes;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.ORG;
import org.eclipse.rdf4j.model.vocabulary.SKOS;

import static com.metreeca.link.Frame.LITERAL;
import static com.metreeca.link.Frame.reverse;
import static com.metreeca.link.Shape.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.*;
import static eu.ec2u.data.agents.Agents.Agent;
import static eu.ec2u.data.concepts.Concepts.Concept;
import static eu.ec2u.data.persons.Persons.Person;
import static eu.ec2u.data.resources.Resources.locales;

public final class Organizations {

    public static final IRI Context=item("/organizations/");

    public static final IRI Organization=term("Organization");


    public static Shape Organization() {
        return shape(ORG.ORGANIZATION, Agent(),

                property(ORG.IDENTIFIER, multiple(datatype(LITERAL))),

                property(SKOS.PREF_LABEL, required(text(locales()))),
                property(SKOS.ALT_LABEL, optional(text(locales()))),
                property(SKOS.DEFINITION, optional(text(locales()))),

                property(ORG.CLASSIFICATION, () -> multiple(Concept(), scheme(OrganizationTypes.OrganizationTypes))),

                property(ORG.SUB_ORGANIZATION_OF, () -> multiple(Organization())),
                property(ORG.HAS_SUB_ORGANIZATION, () -> multiple(Organization())),

                property(ORG.HAS_UNIT, () -> multiple(OrganizationalUnit())),

                property("hasHead", reverse(ORG.HEAD_OF), multiple(Person())),
                property(ORG.HAS_MEMBER, multiple(Person()))

        );
    }

    public static Shape FormalOrganization() {
        return shape(ORG.FORMAL_ORGANIZATION, Organization());
    }

    public static Shape OrganizationalCollaboration() {
        return shape(ORG.ORGANIZATIONAL_COLLABORATION, Organization());
    }

    public static Shape OrganizationalUnit() {
        return shape(ORG.ORGANIZATIONAL_UNIT, Organization(),

                property(ORG.UNIT_OF, repeatable(Organization()))

        );
    }


    public static void main(final String... args) {
        exec(() -> create(Context, Organizations.class,
                Organization(),
                FormalOrganization(),
                OrganizationalCollaboration(),
                OrganizationalUnit()
        ));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Organizations() { }

}
