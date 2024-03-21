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

import com.metreeca.http.rdf4j.actions.Upload;
import com.metreeca.link.Shape;

import eu.ec2u.data.resources.Resources;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.ORG;
import org.eclipse.rdf4j.model.vocabulary.RDFS;
import org.eclipse.rdf4j.model.vocabulary.SKOS;

import java.util.stream.Stream;

import static com.metreeca.http.rdf.Values.pattern;
import static com.metreeca.http.rdf.formats.RDF.rdf;
import static com.metreeca.http.toolkits.Resources.resource;
import static com.metreeca.link.Frame.reverse;
import static com.metreeca.link.Shape.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.*;
import static eu.ec2u.data.agents.Agents.FOAFAgent;
import static eu.ec2u.data.concepts.Concepts.SKOSConcept;
import static eu.ec2u.data.persons.Persons.FOAFPerson;
import static eu.ec2u.data.resources.Resources.localized;
import static java.util.function.Predicate.not;
import static java.util.stream.Collectors.toList;

public final class Organizations {

    public static final IRI Context=item("/organizations/");

    public static final IRI Organization=term("Organization");


    public static Shape OrgOrganization() {
        return shape(ORG.ORGANIZATION, FOAFAgent(),

                property(ORG.IDENTIFIER, optional(string())), // !!! datatype?

                property(SKOS.PREF_LABEL, required(localized())), // !!! languages?
                property(SKOS.ALT_LABEL, optional(localized())), // !!! languages?
                property(SKOS.DEFINITION, optional(localized())), // !!! languages?

                property("units", ORG.HAS_UNIT, () -> multiple(OrgOrganizationalUnit()))

        );
    }

    public static Shape OrgFormalOrganization() {
        return shape(ORG.FORMAL_ORGANIZATION, OrgOrganization());
    }

    public static Shape OrgOrganizationalUnit() {
        return shape(ORG.ORGANIZATIONAL_UNIT, OrgOrganization(),

                property(ORG.CLASSIFICATION, optional(SKOSConcept())),

                property("organization", ORG.UNIT_OF, repeatable(OrgOrganization())),

                property("head", reverse(ORG.HEAD_OF), multiple(FOAFPerson())),
                property("members", ORG.HAS_MEMBER, multiple(FOAFPerson()))

        );
    }


    public static void main(final String... args) {
        exec(() -> Stream

                .of(
                        rdf(resource(Organizations.class, ".ttl"), Base),

                        rdf(resource("https://www.w3.org/ns/org"), Base).stream()
                                .filter(not(pattern(null, RDFS.SUBCLASSOF, SKOS.CONCEPT)))
                                .collect(toList())

                )

                .forEach(new Upload()
                        .contexts(Context)
                        .langs(Resources.Languages)
                        .clear(true)
                )
        );
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Organizations() { }

}
