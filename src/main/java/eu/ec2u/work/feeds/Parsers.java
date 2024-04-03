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

package eu.ec2u.work.feeds;

import com.metreeca.http.rdf.Values;

import org.eclipse.rdf4j.model.IRI;

import java.net.URI;
import java.time.LocalDate;
import java.util.Optional;
import java.util.regex.Pattern;

import static com.metreeca.http.rdf.Values.guarded;

public final class Parsers {

    private static final Pattern URIPattern=Pattern.compile("^https?://\\S+$");
    private static final Pattern EmailPattern=Pattern.compile("^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+$");


    private Parsers() { }


    public static Optional<IRI> iri(final String iri) {
        return Optional.of(iri)
                .filter(URIPattern.asMatchPredicate())
                .map(Values::iri);
    }

    public static Optional<URI> uri(final String uri) {
        return Optional.of(uri)
                .filter(URIPattern.asMatchPredicate())
                .map(URI::create);
    }

    public static Optional<String> email(final String email) {
        return Optional.of(email)
                .filter(EmailPattern.asMatchPredicate());
    }

    public static Optional<LocalDate> localDate(final String value) {
        return Optional.of(value)
                .map(guarded(LocalDate::parse));
    }

}
