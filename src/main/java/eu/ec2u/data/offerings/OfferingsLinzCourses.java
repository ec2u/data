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

package eu.ec2u.data.offerings;

import com.metreeca.flow.actions.Fill;
import com.metreeca.flow.actions.GET;
import com.metreeca.flow.json.formats.JSON;
import com.metreeca.flow.rdf.Values;
import com.metreeca.flow.rdf4j.actions.Upload;
import com.metreeca.flow.services.Vault;
import com.metreeca.flow.work.Xtream;

import eu.ec2u.data.courses.Courses;
import eu.ec2u.data.programs.Programs;
import eu.ec2u.data.resources.Resources;
import eu.ec2u.data.things.Schema;
import eu.ec2u.work._junk.Frame;
import eu.ec2u.work._junk.JSONPath;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.RDF;

import java.time.Instant;
import java.util.Optional;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.rdf.Values.*;
import static com.metreeca.flow.services.Vault.vault;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.item;
import static eu.ec2u.data.EC2U.update;
import static eu.ec2u.data.courses.Courses.Course;
import static eu.ec2u.data.universities.University.Linz;
import static eu.ec2u.work._junk.Frame.field;
import static eu.ec2u.work._junk.Frame.frame;
import static eu.ec2u.work.xlations.Xlations.translate;
import static org.eclipse.rdf4j.model.vocabulary.XSD.ID;

public final class OfferingsLinzCourses implements Runnable {

    private static final IRI Context=iri(Offerings.Context, "/linz/courses");

    private static final String APIUrl="courses-linz-url";


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static void main(final String... args) {
        exec(() -> new OfferingsLinzCourses().run());
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Vault vault=service(vault());


    @Override public void run() {
        update(connection -> Xtream

                .of(Instant.EPOCH)

                .flatMap(this::courses)
                .optMap(this::course)

                .flatMap(Frame::stream)
                .batch(0)

                .map(model -> translate("en", model))

                .forEach(new Upload()
                        .contexts(Context)
                        .clear(true)
                )

        );
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Xtream<JSONPath> courses(final Instant updated) {

        final String url=vault.get(APIUrl);

        return Xtream.of(updated)

                .flatMap(new Fill<>()
                        .model(url)
                )

                .optMap(new GET<>(new JSON()))

                .map(JSONPath::new)
                .flatMap(json -> json.paths("*"));
    }

    private Optional<Frame> course(final JSONPath json) {
        return json.string("courseCode")

                .map(code -> frame(

                        field(ID, item(Courses.Context, Linz, code)),

                        field(RDF.TYPE, Course),
                        field(Resources.university, Linz.id),

                        field(Schema.url, json.strings("url.*").map(Values::iri)),
                        field(Courses.courseCode, json.string("courseCode").map(Values::literal)),

                        field(Schema.name, json.entries("name").flatMap(e ->
                                e.getValue().string("").map(v -> literal(v, e.getKey())).stream()
                        )),

                        field(Schema.description, json.entries("description").flatMap(e ->
                                e.getValue().string("").map(v -> literal(v, e.getKey())).stream()
                        )),

                        field(Offerings.numberOfCredits, json.decimal("numberOfCredits").map(Values::literal)),

                        field(reverse(Programs.hasCourse), json.strings("inProgram.*.identifier.*").map(v ->
                                item(Programs.Context, Linz, v)
                        ))

                ));
    }

}
