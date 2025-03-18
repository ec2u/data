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

package eu.ec2u.data.events;

import com.metreeca.flow.actions.GET;
import com.metreeca.flow.work.Xtream;
import com.metreeca.flow.xml.XPath;
import com.metreeca.flow.xml.formats.HTML;

import eu.ec2u.data.concepts.OrganizationTypes;
import eu.ec2u.data.things.Schema;
import eu.ec2u.work._junk.Frame;
import org.eclipse.rdf4j.model.IRI;

import static com.metreeca.flow.rdf.Values.iri;
import static com.metreeca.flow.rdf.Values.literal;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.update;
import static eu.ec2u.data.resources.Resources.university;
import static eu.ec2u.data.universities.University.Linz;
import static eu.ec2u.work._junk.Frame.field;
import static eu.ec2u.work._junk.Frame.frame;
import static java.util.Map.entry;
import static org.eclipse.rdf4j.model.vocabulary.RDF.TYPE;
import static org.eclipse.rdf4j.model.vocabulary.XSD.ID;

public final class EventsLinzUniversity implements Runnable {

    private static final IRI Context=iri(Events.Context, "/linz/university");

    private static final Frame Publisher=frame(

            field(ID, iri("https://www.jku.at/news-events/events/")),
            field(TYPE, Schema.Organization),

            field(university, Linz.id),

            field(Schema.name,
                    literal("University of Linz / News & Events", "en"),
                    literal("Universität Linz / Nachrichten & Veranstaltungen", Linz.language)
            ),

            field(Schema.about, OrganizationTypes.University)

    );


    public static void main(final String... args) {
        exec(() -> new EventsLinzUniversity().run());
    }


    //̸////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override public void run() {
        update(connection -> Xtream.of("https://www.jku.at/news-events/events/")

                .crawl(url -> Xtream.of(url)

                        .optMap(new GET<>(new HTML()))

                        .map(XPath::new).map(path -> entry(
                                path.links("//*[contains(@class,'f3-widget-paginator')]/li/a/@href"),
                                path.links("//*[contains(@class,'news_list_item')]/a/@href")
                        ))
                )

                .optMap(new Events_.Scanner(Linz))

                .map(event -> frame(event,
                        field(Events.publisher, Publisher)
                ))

                .filter(frame -> frame.value(Events.startDate).isPresent()) // !!! factor

                .flatMap(Frame::stream)
                .batch(0)

                .forEach(new Events_.Loader(Context))

        );
    }

}
