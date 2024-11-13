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

package eu.ec2u.data.events;

import com.metreeca.http.actions.GET;
import com.metreeca.http.work.Xtream;
import com.metreeca.http.xml.XPath;
import com.metreeca.http.xml.formats.HTML;
import com.metreeca.link.Frame;

import eu.ec2u.data.concepts.OrganizationTypes;
import eu.ec2u.data.things.Schema;
import org.eclipse.rdf4j.model.IRI;

import static com.metreeca.link.Frame.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.update;
import static eu.ec2u.data.resources.Resources.university;
import static eu.ec2u.data.universities.University.Pavia;
import static java.util.Map.entry;

public final class EventsPaviaUniversity implements Runnable {

    private static final IRI Context=iri(Events.Context, "/pavia/university");

    private static final Frame Publisher=frame(

            field(ID, iri("https://www.unipv.news/eventi")),
            field(TYPE, Schema.Organization),

            field(university, Pavia.id),

            field(Schema.name,
                    literal("University of Pavia / Events", "en"),
                    literal("Università di Pavia / Eventi", Pavia.language)
            ),

            field(Schema.about, OrganizationTypes.University)

    );


    public static void main(final String... args) {
        exec(() -> new EventsPaviaUniversity().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override public void run() {
        update(connection -> Xtream.of("https://www.unipv.news/eventi")

                .crawl(url -> Xtream.of(url)

                        .optMap(new GET<>(new HTML()))

                        .map(XPath::new).map(path -> entry(
                                path.links("//a[contains(concat(' ', normalize-space(@class), ' '), ' page-link ')]/@href"),
                                path.links("//*[contains(concat(' ', normalize-space(@class), ' '), ' eventi-card ')]//a//@href")
                        ))
                )

                .optMap(new Events_.Scanner(Pavia))

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
