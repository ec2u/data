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

package eu.ec2u.data.concepts;

import com.metreeca.http.rdf4j.actions.GraphQuery;
import com.metreeca.http.rdf4j.actions.Update;
import com.metreeca.http.rdf4j.actions.Upload;
import com.metreeca.http.rdf4j.services.Graph;
import com.metreeca.http.services.Logger;
import com.metreeca.http.work.Xtream;

import eu.ec2u.data.universities.University;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.rio.RDFParser;
import org.eclipse.rdf4j.rio.helpers.AbstractRDFHandler;
import org.eclipse.rdf4j.rio.turtle.TurtleParser;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Collection;
import java.util.stream.Stream;

import static com.metreeca.http.Locator.service;
import static com.metreeca.http.rdf.formats.RDF.rdf;
import static com.metreeca.http.services.Logger.logger;
import static com.metreeca.http.toolkits.Resources.resource;
import static com.metreeca.http.toolkits.Resources.text;
import static com.metreeca.link.Frame.iri;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.Data.repository;
import static eu.ec2u.data.EC2U.BASE;
import static eu.ec2u.data.EC2U.update;
import static java.lang.String.format;
import static java.util.stream.Collectors.toList;


public final class ESCO implements Runnable {

    public static final IRI Context=iri(Concepts.Context, "/esco");

    public static final IRI Occupations=iri(Concepts.Context, "/esco-occupations");
    public static final IRI Skills=iri(Concepts.Context, "/esco-skils");
    public static final IRI Qualifications=iri(Concepts.Context, "/esco-qualifications");

    private static final String External="http://data.europa.eu/esco/";
    private static final String Internal=Context+"/";


    private static final int BatchSize=1_000_000;


    public static void main(final String... args) {
        exec(() -> new ESCO().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Graph esco=new Graph(repository("esco"));
    private final Logger logger=service(logger());


    @Override public void run() {

        // spool(service(path()).resolve("esco.ttl"));

        update(connection -> {

            Stream

                    .of(
                            rdf(resource(this, ".ttl"), BASE),

                            Xtream.of(text(resource(this, ".ql")))

                                    .flatMap(new GraphQuery()
                                            .graph(esco)
                                    )

                                    .filter(this::included)

                                    .collect(toList())
                    )

                    .forEach(new Upload()
                            .contexts(Context)
                            .clear(true)
                    );

            Stream.of(text(resource(this, ".ul")))

                    .forEach(new Update()
                            .dflt(Context)
                            .insert(Context)
                            .remove(Context)
                            .clear(false)
                    );

        });
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


    private void spool(final Path path) {

        Xtream.of(path.toFile())

                .map(file -> {

                    try ( final InputStream input=new FileInputStream(path.toFile()) ) {

                        final RDFParser parser=new TurtleParser();
                        final Collection<Statement> model=new ArrayList<>();

                        logger.info(ESCO.class, format("parsing <%s>", path));

                        parser.setRDFHandler(new AbstractRDFHandler() {

                            @Override public void handleStatement(final Statement statement) {

                                if ( model.add(statement) && model.size()%BatchSize == 0 ) {
                                    logger.info(ESCO.class, format("parsed <%,d> statements", model.size()));
                                }

                            }

                        });

                        parser.parse(input);

                        logger.info(ESCO.class, format("parsed <%,d> statements", model.size()));

                        return model;

                    } catch ( final IOException e ) {
                        throw new UncheckedIOException(e);
                    }

                })

                .flatMap(Collection::stream)
                .batch(BatchSize)

                .forEach(new Upload()
                        .graph(esco)
                        .clear(true)
                );
    }


    private boolean included(final Statement statement) {

        final Value object=statement.getObject();

        if ( object.isLiteral() ) {

            final String lang=((Literal)object).getLanguage().orElse("");

            return lang.isEmpty() || University.Languages.contains(lang);

        } else {

            return true;

        }
    }

}
