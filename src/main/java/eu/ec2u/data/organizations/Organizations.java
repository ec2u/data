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
import org.eclipse.rdf4j.model.vocabulary.SKOS;

import java.util.stream.Stream;

import static com.metreeca.http.rdf.formats.RDF.rdf;
import static com.metreeca.link.Frame.reverse;
import static com.metreeca.link.Shape.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data._EC2U.*;
import static eu.ec2u.data.agents.Agents.FOAFAgent;
import static eu.ec2u.data.concepts.Concepts.SKOSConcept;
import static eu.ec2u.data.persons.Persons.FOAFPerson;

public final class Organizations {

    public static final IRI Context=item("/organizations/");

    public static final IRI Organization=term("Organization");


    public static Shape OrgOrganization() {
        return shape(FOAFAgent(),

                property(ORG.IDENTIFIER, optional(string())), // !!! datatype?

                property(SKOS.PREF_LABEL, required(Resources.localized())), // !!! languages?
                property(SKOS.ALT_LABEL, required(Resources.localized())), // !!! languages?
                property(SKOS.DEFINITION, required(Resources.localized())), // !!! languages?

                property("units", ORG.HAS_UNIT, () -> multiple(OrgOrganizationalUnit()))

        );
    }

    public static Shape OrgFormalOrganization() {
        return shape(OrgOrganization());
    }

    public static Shape OrgOrganizationalUnit() {
        return shape(OrgOrganization(),

                property(ORG.CLASSIFICATION, optional(SKOSConcept())),

                property("organization", ORG.UNIT_OF, repeatable(OrgOrganization())),

                property("head", reverse(ORG.HEAD_OF), multiple(FOAFPerson())),
                property("members", ORG.HAS_MEMBER, multiple(FOAFPerson()))

        );
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Organizations() { }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static final class Loader implements Runnable {

        public static void main(final String... args) {
            exec(() -> new Loader().run());
        }

        @Override public void run() {
            Stream

                    .of(
                            rdf(Organizations.class, ".ttl", Base),

                            rdf("https://www.w3.org/ns/org")

                    )

                    .forEach(new Upload()
                            .contexts(Context)
                            .langs(Resources.Languages)
                            .clear(true)
                    );
        }
    }

}
