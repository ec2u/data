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

package eu.ec2u.data.resources.courses;

import com.metreeca.core.Xtream;
import com.metreeca.core.services.Vault;
import com.metreeca.core.toolkits.Resources;
import com.metreeca.json.JSONPath;
import com.metreeca.json.codecs.JSON;
import com.metreeca.link.Frame;

import eu.ec2u.data._ontologies.EC2U;
import eu.ec2u.data._ontologies.Schema;
import eu.ec2u.data.resources.concepts.ISCED2011;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.model.vocabulary.RDF;

import java.io.*;
import java.time.Instant;
import java.util.*;

import static com.metreeca.core.Locator.service;
import static com.metreeca.core.services.Vault.vault;
import static com.metreeca.link.Frame.frame;
import static com.metreeca.link.Values.iri;
import static com.metreeca.link.Values.literal;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data._delta.Uploads.upload;
import static eu.ec2u.data._ontologies.EC2U.Universities.Poitiers;
import static eu.ec2u.data.resources.courses.Courses.Course;
import static eu.ec2u.data.utilities.validation.Validators.validate;

import static java.util.Map.entry;

public final class CoursesPoitiers implements Runnable {

    private static final IRI Context=iri(Courses.Context, "/poitiers/");

    private static final String APIUrl="courses-poitiers-url";
    private static final String APIId="courses-poitiers-id";
    private static final String APIToken="courses-poitiers-token";


    private static final Map<String, IRI> TypesToISCEDLevel=Map.ofEntries(

            entry("L1", ISCED2011.Level6),
            entry("L2", ISCED2011.Level6),
            entry("L3", ISCED2011.Level6),

            entry("M1", ISCED2011.Level7),
            entry("M2", ISCED2011.Level7),

            entry("D", ISCED2011.Level8),

            entry("X0", ISCED2011.Level9),
            entry("X1", ISCED2011.Level9)

    );


    public static void main(final String... args) {
        exec(() -> new CoursesPoitiers().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Vault vault=service(vault());


    @Override public void run() {
        Xtream.of(Instant.EPOCH)

                .flatMap(this::courses)
                .optMap(this::course)

                .sink(courses -> upload(Context,
                        validate(Course(), Set.of(Courses.Course), courses)
                ));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Xtream<JSONPath> courses(final Instant synced) {

        //final String url=vault
        //        .get(APIUrl)
        //        .orElseThrow(() -> new IllegalStateException(format(
        //                "undefined API URL <%s>", APIUrl
        //        )));
        //
        //final String id=vault
        //        .get(APIId)
        //        .orElseThrow(() -> new IllegalStateException(format(
        //                "undefined API ID <%s>", APIId
        //        )));
        //
        //final String token=service(vault())
        //        .get(APIToken)
        //        .orElseThrow(() -> new IllegalStateException(format(
        //                "undefined API key <%s>", APIToken
        //        )));

        try ( final Reader reader=Resources.reader(this, ".json") ) {

            return new JSONPath(JSON.json(reader)).paths("*");

        } catch ( final IOException e ) {

            throw new UncheckedIOException(e);

        }

        //return Xtream.of(synced)
        //
        //        .flatMap(new Fill<>()
        //                .model(url+"/obtemCursosBloco")
        //        )
        //
        //        .optMap(new Query(request -> request
        //                .method(POST)
        //                .header("Content-Type", "application/x-www-form-urlencoded")
        //                .header("Accept", JSON.MIME)
        //                .input(() -> new ByteArrayInputStream(query(Map.ofEntries(
        //                        entry("applicationId", List.of(id)),
        //                        entry("accessToken", List.of(token)),
        //                        entry("anoLectivo", List.of("2022/2023")) // !!! dynamic
        //                )).getBytes(StandardCharsets.UTF_8)))
        //        ))
        //
        //        .optMap(new Fetch())
        //        .optMap(new Parse<>(new JSON()))
        //
        //        .optMap(json -> {
        //
        //            if ( "SUCCESS".equals(json.asJsonObject().getString("status")) ) {
        //
        //                return Optional.of(json);
        //
        //            } else {
        //
        //                service(logger()).warning(this, json.toString());
        //
        //                return Optional.empty();
        //
        //            }
        //        })
        //
        //        .map(JSONPath::new)
        //        .flatMap(json -> json.paths("listaResultados.*"));
    }

    private Optional<Frame> course(final JSONPath json) {
        return json.string("codeEtape").map(id -> {

            final Optional<Literal> label=json.string("nom")
                    .map(v -> literal(v, Poitiers.Language));


            return frame(EC2U.item(Courses.Context, Poitiers.Id, String.valueOf(id)))

                    .values(RDF.TYPE, Courses.Course)
                    .value(eu.ec2u.data.resources.Resources.university, Poitiers.Id)

                    .value(DCTERMS.TITLE, label)

                    .value(Schema.name, label)
                    .values(Schema.courseCode, literal(id.toString()))

                    .value(Schema.educationalLevel, json.string("niveau").map(TypesToISCEDLevel::get));

        });
    }

}
