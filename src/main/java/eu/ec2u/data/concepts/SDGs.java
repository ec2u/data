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

import com.metreeca.http.rdf4j.actions.Upload;
import com.metreeca.http.work.Xtream;
import com.metreeca.link.Frame;

import eu.ec2u.work.feeds.CSVProcessor;
import org.apache.commons.csv.CSVRecord;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.SKOS;

import java.util.Collection;
import java.util.Optional;

import static com.metreeca.http.rdf.formats.RDF.rdf;
import static com.metreeca.http.toolkits.Resources.resource;
import static com.metreeca.link.Frame.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.BASE;
import static eu.ec2u.data.EC2U.update;
import static eu.ec2u.data.resources.Resources.locales;


/**
 * United Nations Sustainable Development Goals (SDGS)
 *
 * @see <a href="https://sdgs.un.org/goals">United Nations - Department of Economic and Social Affairs- Sustainable
 * Development Goals</a>
 * @see <a href="https://metadata.un.org/sdg/">Sustainable Development Goals Taxonomy</a>
 */
public final class SDGs implements Runnable {

    public static final IRI Scheme=iri(Concepts.Context, "/sdgs");

    public static IRI goal(final Number number) {

        if ( number == null ) {
            throw new NullPointerException("null number");
        }

        return iri(Scheme+"/"+number.intValue());
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static void main(final String... args) {
        exec(() -> new SDGs().run());
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override public void run() {
        update(connection -> Xtream

                .from(

                        Xtream.of(rdf(resource(this, ".ttl"), BASE)),

                        Xtream.of(resource(this, ".csv").toString())

                                .flatMap(new FrameCSVProcessor())

                                .flatMap(Frame::stream)
                                .batch(0)


                )

                .forEach(new Upload()
                        .contexts(Scheme)
                        .langs(locales())
                        .clear(true)
                )

        );
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private static class FrameCSVProcessor extends CSVProcessor<Frame> {

        @Override protected Optional<Frame> process(final CSVRecord record, final Collection<CSVRecord> records) {
            return value(record, "Goal Number").map(number -> {

                return frame(

                        field(ID, iri(Scheme, "/"+number)),
                        field(TYPE, SKOS.CONCEPT),

                        field(SKOS.NOTATION, literal(number)),

                        field(SKOS.PREF_LABEL, value(record, "Short Label")
                                .map(v -> literal(v, "en"))
                        ),

                        field(SKOS.DEFINITION, value(record, "Long Label")
                                .map(v -> literal(v+".", "en"))
                        ),

                        field(SKOS.TOP_CONCEPT_OF, Scheme)

                );

            });
        }

    }

}
