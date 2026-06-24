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

package eu.ec2u.data.datasets.offerings;


import com.metreeca.flow.http.FormatException;
import com.metreeca.flow.http.actions.GET;
import com.metreeca.flow.lod.Schema;
import com.metreeca.flow.rdf.Rover;
import com.metreeca.flow.services.Logger;
import com.metreeca.flow.xml.XPath;
import com.metreeca.flow.xml.formats.HTML;
import com.metreeca.mesh.pipe.Store;

import eu.ec2u.data.datasets.programs.ProgramFrame;
import eu.ec2u.data.datasets.taxonomies.Topic;
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
import java.util.regex.Pattern;
import java.util.stream.Stream;

import static com.metreeca.flow.Locator.async;
import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.flow.rdf.Rover.reverse;
import static com.metreeca.flow.rdf.formats.RDF.rdf;
import static com.metreeca.flow.services.Logger.logger;
import static com.metreeca.mesh.Value.array;
import static com.metreeca.mesh.Value.value;
import static com.metreeca.mesh.queries.Criterion.criterion;
import static com.metreeca.mesh.queries.Query.query;
import static com.metreeca.shim.Collections.*;
import static com.metreeca.shim.Futures.joining;
import static com.metreeca.shim.Loggers.time;
import static com.metreeca.shim.Streams.optional;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.datasets.Localized.DE;
import static eu.ec2u.data.datasets.programs.Program.review;
import static eu.ec2u.data.datasets.programs.Programs.PROGRAMS;
import static eu.ec2u.data.datasets.taxonomies.TopicsISCED2011.*;
import static eu.ec2u.data.datasets.universities.University.JENA;
import static eu.ec2u.data.datasets.universities.University.uuid;
import static java.lang.String.format;
import static java.util.Comparator.comparingInt;

public final class OfferingsJenaPrograms implements Runnable {

    private static final String SITE_URL="https://www.uni-jena.de/3860/studienangebot";

    private static final IRI ABOUT_PAGE=Schema.term("AboutPage");
    private static final IRI HEADLINE=Schema.term("headline");
    private static final IRI ABSTRACT=Schema.term("abstract");

    private static final Pattern DIGITS=Pattern.compile("\\d+");

    private static final Map<String, String> DEGREES=Map.ofEntries( // detail-URL slug prefix → degree label
            entry("erweiterung-g", "Erweiterungsprüfung Lehramt Gymnasium"),
            entry("erweiterung-r", "Erweiterungsprüfung Lehramt Regelschule"),
            entry("gymnasium", "Staatsexamen Lehramt Gymnasium"),
            entry("regelschule", "Staatsexamen Lehramt Regelschule"),
            entry("staatsexamen", "Staatsexamen"),
            entry("zertifikat", "Zertifikat"),
            entry("diplom", "Diplom"),
            entry("llm-oec", "LL.M. oec."),
            entry("mba", "MBA"),
            entry("m-ed", "M.Ed."),
            entry("m-sc", "M.Sc."),
            entry("m-a", "M.A."),
            entry("b-sc", "B.Sc."),
            entry("b-a", "B.A.")
    );

    private static final Map<String, String> ROLES=Map.ofEntries( // multi-subject role token → label
            entry("kf", "Kernfach"),
            entry("ef", "Ergänzungsfach")
    );

    private static final Map<String, Topic> DEGREE_LEVELS=Map.ofEntries( // degree slug prefix → ISCED 2011 level
            entry("b-a", LEVEL_6),
            entry("b-sc", LEVEL_6),
            entry("m-a", LEVEL_7),
            entry("m-sc", LEVEL_7),
            entry("m-ed", LEVEL_7),
            entry("mba", LEVEL_7),
            entry("llm-oec", LEVEL_7),
            entry("staatsexamen", LEVEL_7),
            entry("gymnasium", LEVEL_7),
            entry("regelschule", LEVEL_7),
            entry("diplom", LEVEL_7)
    );


    public static void main(final String... args) {
        exec(() -> new OfferingsJenaPrograms().run());
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Store store=service(store());
    private final Logger logger=service(logger());


    @Override
    public void run() {
        time(() -> store.modify(

                array(programs()),

                value(query(new ProgramFrame(true))
                        .where("university", criterion().any(JENA))
                )

        )).apply((elapsed, resources) -> logger.info(this, format(
                "synced <%,d> resources in <%,d> ms", resources, elapsed
        )));
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Stream<ProgramFrame> programs() {
        return Stream

                .of(SITE_URL)

                // extract detail links

                .flatMap(optional(new GET<>(new HTML())))

                .map(XPath::new)

                .flatMap(xpath -> xpath
                        .links("//li[@data-filter]/a/@href")
                )

                .map(page -> async(() -> Optional.of(page)

                        // extract JSON-LD

                        .flatMap(new GET<>(new HTML()))

                        .map(XPath::new).flatMap(xpath -> xpath
                                .string("//script[@type='application/ld+json']")
                        )

                        .flatMap(json -> {

                            try ( final StringReader reader=new StringReader(json) ) {

                                final RDFParser parser=new JSONLDParser();

                                parser.set(JSONLDSettings.SECURE_MODE, false); // ;( load external resources

                                final Collection<Statement> model=Schema.normalize(rdf(reader, SITE_URL, parser));

                                return Optional.of(Rover.rover(model).focus(ABOUT_PAGE).traverse(reverse(RDF.TYPE)));

                            } catch ( final FormatException e ) {

                                logger.warning(this, e.getMessage());

                                return Optional.empty();

                            }

                        })

                        .flatMap(this::program)

                ))

                .collect(joining())
                .flatMap(Optional::stream);

    }

    private Optional<ProgramFrame> program(final Rover rover) {
        return rover.traverse(Schema.term("url")).uri().flatMap(url -> {

            final String slug=slug(url.toString());

            final Optional<String> key=degreeKey(slug);
            final Optional<String> degree=key.map(value -> degree(slug, value));

            return review(new ProgramFrame()

                    .id(PROGRAMS.id().resolve(uuid(JENA, code(url.toString()))))
                    .university(JENA)

                    .url(set(url))

                    .name(name(rover, degree).orElse(null))
                    .description(description(rover).orElse(null))

                    .educationalLevel(key.map(DEGREE_LEVELS::get).orElse(null))
                    .educationalCredentialAwarded(degree.map(value -> map(entry(DE, value))).orElse(null))

            );
        });
    }


    private static String slug(final String url) {
        return url.substring(url.lastIndexOf('/')+1);
    }

    private static String code(final String url) {
        return Stream.of(url.split("/"))
                .filter(segment -> DIGITS.matcher(segment).matches())
                .findFirst()
                .orElse(url);
    }

    private static Optional<Map<Locale, String>> name(final Rover rover, final Optional<String> degree) {
        return rover.traverse(HEADLINE).string()
                .map(subject -> degree.map(value -> subject+" – "+value).orElse(subject))
                .map(qualified -> map(entry(DE, qualified)));
    }

    private static Optional<Map<Locale, String>> description(final Rover rover) {
        return rover.traverse(ABSTRACT).string().map(v -> map(entry(DE, v)));
    }

    private static String degree(final String slug, final String key) {

        final String rest=slug.substring(key.length());

        return ROLES.entrySet().stream()
                .filter(fach -> rest.startsWith("-"+fach.getKey()+"-") || rest.equals("-"+fach.getKey()))
                .findFirst()
                .map(fach -> DEGREES.get(key)+", "+fach.getValue())
                .orElseGet(() -> DEGREES.get(key));
    }

    private static Optional<String> degreeKey(final String slug) {
        return DEGREES.keySet().stream()
                .filter(key -> slug.equals(key) || slug.startsWith(key+"-"))
                .max(comparingInt(String::length));
    }

}
