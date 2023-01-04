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

package eu.ec2u.data._;

import com.metreeca.core.Xtream;
import com.metreeca.link.Frame;

import eu.ec2u.data._cities.Pavia;
import eu.ec2u.data._terms.EC2U;
import eu.ec2u.data._terms.Schema;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.vocabulary.RDF;

import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import static com.metreeca.core.toolkits.Identifiers.md5;
import static com.metreeca.link.Frame.frame;
import static com.metreeca.link.Values.iri;
import static com.metreeca.link.Values.literal;
import static com.metreeca.link.shifts.Seq.seq;

import static java.lang.String.format;
import static java.util.function.Predicate.not;

public final class Work {

    public static Stream<Literal> localized(final Stream<Value> values) {
        return Xtream.from(values).optMap(Work::localized);
    }

    public static Optional<Literal> localized(final Optional<Value> value) {
        return value.flatMap(Work::localized);
    }

    public static Optional<Literal> localized(final Value value) {

        final String text=literal(value)
                .map(Value::stringValue)
                .filter(not(String::isEmpty))
                .orElse("");

        final String lang=literal(value)
                .flatMap(Literal::getLanguage)
                .orElse(Pavia.Language);

        return text.isEmpty() ? Optional.empty() : Optional.of(literal(text, lang));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private static final Pattern FuzzyIRIPattern=Pattern.compile("\\bhttps?:\\S+|\\bwww\\.\\S+");

    public static Optional<String> url(final String text) {

        if ( text == null ) {
            throw new NullPointerException("null text");
        }

        return Optional.of(text)
                .map(FuzzyIRIPattern::matcher)
                .filter(Matcher::find)
                .map(Matcher::group)
                .map(url -> url.replace("[", "%5B")) // !!! generalize
                .map(url -> url.replace("]", "%5D"))
                .map(url -> url.startsWith("http") ? url : format("https://%s", url));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static Frame organizer(final Frame frame, final String lang) {

        final Optional<Value> name=frame.string(Schema.name).map(value -> literal(value, lang));
        final Optional<Value> legalName=frame.string(Schema.legalName).map(value -> literal(value, lang));

        return frame(iri(EC2U.organizations, md5(frame.skolemize(
                seq(Schema.name),
                seq(Schema.legalName)
        ))))

                .value(RDF.TYPE, Schema.Organization)

                .value(Schema.name, name)
                .value(Schema.legalName, legalName)
                .value(Schema.email, frame.value(Schema.email));
    }

    public static Frame location(final Frame frame, final Frame defaults) {
        return frame(iri(EC2U.locations, md5(frame.skolemize(
                seq(Schema.name),
                seq(Schema.address, Schema.addressLocality),
                seq(Schema.address, Schema.streetAddress)
        ))))

                .values(RDF.TYPE, frame.values(RDF.TYPE))

                .value(Schema.name, frame.value(Schema.name))
                .value(Schema.url, frame.value(Schema.url))
                .frame(Schema.address, frame.frame(Schema.address).map(address -> address(address, defaults)));
    }

    public static Frame address(final Frame frame, final Frame defaults) {

        return frame(iri(EC2U.locations, frame.skolemize(Schema.addressLocality, Schema.streetAddress)))

                .values(RDF.TYPE, frame.values(RDF.TYPE))

                .value(Schema.addressCountry, frame.value(Schema.addressCountry)
                        .or(() -> defaults.value(Schema.addressCountry))
                )

                .value(Schema.addressRegion, frame.value(Schema.addressRegion)) // !!! default (sync from Wikidata)

                .value(Schema.addressLocality, frame.value(Schema.addressLocality)
                        .or(() -> defaults.value(Schema.addressLocality))
                )

                .value(Schema.postalCode, frame.value(Schema.postalCode)
                        .or(() -> defaults.value(Schema.postalCode))
                )

                .value(Schema.email, frame.value(Schema.email))
                .value(Schema.telephone, frame.value(Schema.telephone))
                .value(Schema.faxNumber, frame.value(Schema.faxNumber))
                .value(Schema.streetAddress, frame.value(Schema.streetAddress));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Work() { }

}
