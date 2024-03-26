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

import eu.ec2u.data.datasets.Datasets;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.ORG;
import org.eclipse.rdf4j.model.vocabulary.SKOS;

import static com.metreeca.link.Frame.LITERAL;
import static com.metreeca.link.Frame.reverse;
import static com.metreeca.link.Shape.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.item;
import static eu.ec2u.data.EC2U.term;
import static eu.ec2u.data.agents.Agents.FOAFAgent;
import static eu.ec2u.data.concepts.Concepts.SKOSConcept;
import static eu.ec2u.data.persons.Persons.FOAFPerson;
import static eu.ec2u.data.resources.Resources.localized;

public final class Organizations {

    public static final IRI Context=item("/organizations/");

    public static final IRI Organization=term("Organization");


    public static Shape OrgOrganization() {
        return shape(ORG.ORGANIZATION, FOAFAgent(),

                property(ORG.IDENTIFIER, optional(datatype(LITERAL))),

                property(SKOS.PREF_LABEL, required(localized())),
                property(SKOS.ALT_LABEL, optional(localized())),
                property(SKOS.DEFINITION, optional(localized())),

                property(ORG.HAS_SUB_ORGANIZATION, () -> multiple(OrgOrganization())),
                property(ORG.SUB_ORGANIZATION_OF, () -> multiple(OrgOrganization())),

                property(ORG.HAS_UNIT, () -> multiple(OrgOrganizationalUnit())),
                property(ORG.CLASSIFICATION, optional(SKOSConcept()))

        );
    }

    public static Shape OrgFormalOrganization() {
        return shape(ORG.FORMAL_ORGANIZATION, OrgOrganization());
    }

    public static Shape OrgOrganizationalCollaboration() {
        return shape(ORG.ORGANIZATIONAL_COLLABORATION, OrgOrganization());
    }

    public static Shape OrgOrganizationalUnit() {
        return shape(ORG.ORGANIZATIONAL_UNIT, OrgOrganization(),

                property(ORG.UNIT_OF, repeatable(OrgOrganization())),

                property("hasHead", reverse(ORG.HEAD_OF), multiple(FOAFPerson())),
                property(ORG.HAS_MEMBER, multiple(FOAFPerson()))

        );
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Organizations() { }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static void main(final String... args) {
        exec(Organizations::create);
    }


    public static void create() {
        Datasets.create(Organizations.class, Context);
    }

}
