/***********************************************************************************************************************
 * Copyright © 2020-2022 EC2U Alliance
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
 **********************************************************************************************************************/

package eu.ec2u.data.work;

import com.metreeca.json.Frame;
import com.metreeca.json.Values;
import com.metreeca.rest.Xtream;
import com.metreeca.xml.actions.Untag;
import com.metreeca.xml.actions.XPath;

import org.eclipse.rdf4j.model.IRI;
import org.w3c.dom.Document;

import java.time.ZonedDateTime;
import java.util.function.Function;

import static com.metreeca.json.Frame.frame;
import static com.metreeca.json.Values.*;

import static java.time.format.DateTimeFormatter.RFC_1123_DATE_TIME;

public final class RSS implements Function<Document, Xtream<Frame>> {

    public static final IRI Title=term("title");
    public static final IRI Link=term("link");
    public static final IRI Category=term("category");
    public static final IRI PubDate=term("pubDate");
    public static final IRI Description=term("description");
    public static final IRI Encoded=iri("http://purl.org/rss/1.0/modules/content/", "encoded");


    @Override public Xtream<Frame> apply(final Document document) {

        if ( document == null ) {
            throw new NullPointerException("null document");
        }

        return Xtream.of(document)

                .flatMap(new XPath<>(xpath -> xpath.elements("/rss/channel/item")))

                .map(new XPath<>(item -> frame(bnode())

                        .string(Title, item.string("title"))
                        .value(Link, item.link("link").map(Values::iri))
                        .strings(Category, item.strings("category"))

                        .value(PubDate, item.string("pubDate")
                                .map(RFC_1123_DATE_TIME::parse)
                                .map(ZonedDateTime::from)
                                .map(Values::literal)
                        )

                        .string(Description, item.string("description"))
                        .string(Encoded, item.string("content:encoded").map(Untag::untag))

                ));

    }

}
