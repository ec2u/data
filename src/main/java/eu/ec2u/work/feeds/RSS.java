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

package eu.ec2u.work.feeds;

import com.metreeca.flow.work.Xtream;
import com.metreeca.flow.xml.XPath;
import com.metreeca.flow.xml.actions.Untag;
import com.metreeca.link.Frame;

import org.eclipse.rdf4j.model.IRI;
import org.w3c.dom.Document;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.function.Function;

import static com.metreeca.link.Frame.*;

import static eu.ec2u.data.EC2U.term;
import static java.time.ZoneOffset.UTC;
import static java.time.format.DateTimeFormatter.RFC_1123_DATE_TIME;

public final class RSS implements Function<Document, Xtream<Frame>> {

    // !!! namespace

    public static final IRI Title=term("title");
    public static final IRI Link=term("link");
    public static final IRI Category=term("category");
    public static final IRI PubDate=term("pubDate");
    public static final IRI Description=term("description");
    public static final IRI Encoded=iri("http://purl.org/rss/1.0/modules/content/", "encoded");


    public static Optional<OffsetDateTime> pubDate(final XPath item) {
        return item.string("pubDate")
                .map(RFC_1123_DATE_TIME::parse)
                .map(OffsetDateTime::from)
                .map(timestamp -> timestamp.withOffsetSameInstant(UTC))
                .map(timestamp -> timestamp.truncatedTo(ChronoUnit.SECONDS));
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override public Xtream<Frame> apply(final Document document) {

        if ( document == null ) {
            throw new NullPointerException("null document");
        }

        return Xtream.of(document)

                .map(XPath::new)
                .flatMap(xpath -> xpath.paths("/rss/channel/item"))

                .map(item -> frame(

                        field(Title, item.string("title").map(Frame::literal)),

                        field(Link, item.link("link").map(Frame::iri)),
                        field(Category, item.strings("category").map(Frame::literal)),

                        field(PubDate, item.string("pubDate")
                                .map(RFC_1123_DATE_TIME::parse)
                                .map(OffsetDateTime::from)
                                .map(timestamp -> timestamp.withOffsetSameInstant(ZoneOffset.UTC))
                                .map(Frame::literal)
                        ),

                        field(Description, item.string("description").map(Frame::literal)),
                        field(Encoded, item.string("content:encoded").map(Untag::untag).map(Frame::literal))
                ));

    }

}
