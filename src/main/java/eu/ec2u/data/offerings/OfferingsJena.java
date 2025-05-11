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


import com.metreeca.flow.Xtream;
import com.metreeca.flow.http.FormatException;
import com.metreeca.flow.http.actions.GET;
import com.metreeca.flow.lod.Schema;
import com.metreeca.flow.services.Logger;
import com.metreeca.flow.xml.XPath;
import com.metreeca.flow.xml.formats.HTML;
import com.metreeca.mesh.tools.Store;

import eu.ec2u.data.programs.Program;
import eu.ec2u.data.programs.ProgramFrame;
import eu.ec2u.data.taxonomies.Topic;
import eu.ec2u.work.Rover;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.rio.RDFParser;
import org.eclipse.rdf4j.rio.jsonld.JSONLDParser;
import org.eclipse.rdf4j.rio.jsonld.JSONLDSettings;

import java.io.StringReader;
import java.util.Collection;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Stream;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.flow.rdf.formats.RDF.rdf;
import static com.metreeca.flow.services.Logger.logger;
import static com.metreeca.mesh.Value.array;
import static com.metreeca.mesh.Value.value;
import static com.metreeca.mesh.queries.Criterion.criterion;
import static com.metreeca.mesh.queries.Query.query;
import static com.metreeca.shim.Collections.*;
import static com.metreeca.shim.Strings.clip;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.programs.Programs.PROGRAMS;
import static eu.ec2u.data.resources.Localized.EN;
import static eu.ec2u.data.taxonomies.ISCED2011.*;
import static eu.ec2u.data.things.SchemaThing.DESCRIPTION_LENGTH;
import static eu.ec2u.data.things.SchemaThing.NAME_LENGTH;
import static eu.ec2u.data.universities.University.JENA;
import static eu.ec2u.data.universities.University.uuid;
import static eu.ec2u.work.Rover.rover;

public final class OfferingsJena implements Runnable {

    private static final String SITE_URL="https://www.uni-jena.de/en/study-programme";

    private static final IRI ABOUT_PAGE=Schema.term("AboutPage");
    private static final IRI HEADLINE=Schema.term("headline");
    private static final IRI ABSTRACT=Schema.term("abstract");
    private static final IRI EDUCATIONAL_LEVEL=Schema.term("educationalLevel");

    private static final Map<String, Topic> LEVELS=Map.ofEntries(
            entry("Bachelor of Arts", LEVEL_6),
            entry("Bachelor of Science", LEVEL_6),
            entry("Master of Arts", LEVEL_7),
            entry("Master of Education", LEVEL_7),
            entry("Master of Science", LEVEL_7),
            entry("state examination", LEVEL_9),
            entry("Diploma/church board examination", LEVEL_9)
    );


    public static void main(final String... args) {
        exec(() -> new OfferingsJena().run());
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Store store=service(store());
    private final Logger logger=service(logger());


    @Override public void run() {
        store.modify(

                array(Xtream.of(SITE_URL)
                        .flatMap(this::programs)
                        .optMap(this::program)
                ),

                value(query(new ProgramFrame(true))
                        .where("university", criterion().any(JENA))
                )

        );
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Xtream<Rover> programs(final String url) {
        return Xtream

                .of(url)

                // extract detail links

                .optMap(new GET<>(new HTML()))

                .map(XPath::new)

                .flatMap(xpath -> xpath
                        .links("//li[@data-filter]/a/@href")
                )

                // extract JSON-LD

                .optMap(new GET<>(new HTML()))

                .map(XPath::new).optMap(xpath -> xpath
                        .string("//script[@type='application/ld+json']")
                )

                .flatMap(json -> {

                    try ( final StringReader reader=new StringReader(json) ) {

                        final RDFParser parser=new JSONLDParser();

                        parser.set(JSONLDSettings.SECURE_MODE, false); // ;( load external resources

                        final Collection<Statement> model=Schema.normalize(rdf(reader, SITE_URL, parser));

                        return rover(model).focus(ABOUT_PAGE)
                                .reverse(RDF.TYPE)
                                .split();

                    } catch ( final FormatException e ) {

                        logger.warning(this, e.getMessage());

                        return Stream.empty();

                    }

                });

    }

    private Optional<ProgramFrame> program(final Rover rover) {
        return rover.forward(Schema.term("url")).uri()

                .map(url -> new ProgramFrame()

                        .id(PROGRAMS.id().resolve(uuid(JENA, url.toString())))
                        .university(JENA)

                        .url(set(url))

                        .name(name(rover).orElse(null))
                        .description(description(rover).orElse(null))

                        .educationalLevel(educationalLevel(rover).orElse(null))
                        .educationalCredentialAwarded(educationalCredentialAwarded(rover).orElse(null))

                )

                .flatMap(v -> Program.review(v, JENA.locale()));
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private static Optional<Map<Locale, String>> name(final Rover rover) {
        return rover.forward(HEADLINE).string().map(v -> map(entry(EN, clip(v, NAME_LENGTH))));
    }

    private static Optional<Map<Locale, String>> description(final Rover rover) {
        return rover.forward(ABSTRACT).string().map(v -> map(entry(EN, clip(v, DESCRIPTION_LENGTH))));
    }

    private static Optional<Topic> educationalLevel(final Rover rover) {
        return rover.forward(EDUCATIONAL_LEVEL).string().map(LEVELS::get);
    }

    private static Optional<Map<Locale, String>> educationalCredentialAwarded(final Rover rover) {
        return rover.forward(EDUCATIONAL_LEVEL).string().map(v -> map(entry(EN, v)));
    }

}
