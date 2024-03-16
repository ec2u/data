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
import com.metreeca.http.rdf4j.actions.Upload;
import com.metreeca.http.toolkits.Strings;
import com.metreeca.link.Frame;
import com.metreeca.link.Shape;

import eu.ec2u.data._EC2U;
import eu.ec2u.data.universities._Universities;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.FOAF;
import org.eclipse.rdf4j.model.vocabulary.ORG;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.model.vocabulary.RDFS;

import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import static com.metreeca.http.rdf.formats.RDF.rdf;
import static com.metreeca.http.toolkits.Strings.normalize;
import static com.metreeca.link.Frame.*;
import static com.metreeca.link.Shape.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data._EC2U.item;
import static eu.ec2u.data._EC2U.term;
import static eu.ec2u.data.agents.Agents.FOAFAgent;
import static eu.ec2u.data.resources.Resource.Resource;
import static eu.ec2u.data.resources.Resource.university;
import static eu.ec2u.data.resources.Resources.Reference;
import static java.lang.String.format;

public final class Persons extends Delegator {

    public static final IRI Context=item("/persons/");

    public static final IRI Person=term("Person");


    public static Shape Person() {
        return shape(Resource(), FOAFPerson(),

                property(RDF.TYPE, hasValue(Person))

        );
    }


    public static Shape FOAFPerson() {
        return shape(FOAFAgent(),

                // !!! property(FOAF.TITLE, optional(), string()), // !!! pattern
                property(FOAF.GIVEN_NAME, required(), string()), // !!! pattern
                property(FOAF.FAMILY_NAME, required(), string()), // !!! pattern

                property(ORG.HEAD_OF, multiple(), Reference()),
                property(ORG.MEMBER_OF, multiple(), Reference())

        );
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private static final Pattern PersonPattern=Pattern.compile("([^,]+),([^(]+)(?:\\(([^)]+)\\))?");


    public static Optional<Frame> person(final String string, final _Universities _university) {
        return Optional.of(string)

                .map(PersonPattern::matcher)
                .filter(Matcher::matches)
                .map(matcher -> {

                    final Optional<String> title=Optional.ofNullable(matcher.group(3)).map(Strings::normalize);
                    final String familyName=normalize(matcher.group(1));
                    final String givenName=normalize(matcher.group(2));

                    final String fullName=format("%s %s", givenName, familyName);

                    return frame(

                            field(ID, item(Context, _university, fullName)),

                            field(RDFS.LABEL, literal(fullName)),
                            field(university, _university.Id),

                            field(FOAF.TITLE, title.map(Frame::literal)),
                            field(FOAF.GIVEN_NAME, literal(givenName)),
                            field(FOAF.FAMILY_NAME, literal(familyName))

                    );

                });
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Persons() { }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static final class Loader implements Runnable {

        public static void main(final String... args) {
            exec(() -> new Loader().run());
        }

        @Override public void run() {
            Stream

                    .of(rdf(Persons.class, ".ttl", _EC2U.Base))

                    .forEach(new Upload()
                            .contexts(Context)
                            .clear(true)
                    );
        }

    }

}