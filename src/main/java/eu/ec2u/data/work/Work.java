package eu.ec2u.data.work;

import com.metreeca.core.Strings;
import com.metreeca.json.Frame;
import com.metreeca.xml.actions.Untag;

import eu.ec2u.data.terms.EC2U;
import eu.ec2u.data.terms.Schema;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.vocabulary.*;

import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.util.Optional;
import java.util.function.Function;
import java.util.function.UnaryOperator;

import static com.metreeca.core.Formats.SQL_TIMESTAMP;
import static com.metreeca.core.Identifiers.md5;
import static com.metreeca.json.Frame.frame;
import static com.metreeca.json.Values.iri;
import static com.metreeca.json.Values.literal;
import static com.metreeca.json.shifts.Seq.seq;

import static java.time.ZoneOffset.UTC;
import static java.util.function.Predicate.not;

public final class Work {

    public static Literal timestamp(final String timestamp) {
        return literal(ZonedDateTime.of(LocalDateTime.parse(timestamp, SQL_TIMESTAMP), UTC));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static Value localize(final Value value, final String lang) {
        return literal(value)

                .filter(object -> object.getDatatype().equals(XSD.STRING))

                .map(Value::stringValue)
                .map(text -> literal(text, lang))
                .map(Value.class::cast)

                .orElse(value);
    }

    public static Function<String, Literal> localize(final String lang) {
        return v -> localize(v, lang);
    }

    public static Literal localize(final String v, final String lang) {
        return literal(v, lang);
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static Optional<String> url(final String url) {

        if ( url == null ) {
            throw new NullPointerException("null url");
        }

        return Optional.of(url)
                .map(String::trim)
                .filter(not(String::isEmpty))
                .filter(x -> x.matches("^\\w+:.*$"))
                .or(() -> Optional.of(url)
                        .filter(x -> x.matches("^www\\..*$")) // !!! well-formed url
                        .map(x -> String.format("https://%s", x))
                );
    }


    public static Literal normalize(final Literal literal) {
        return normalize(literal, Strings::normalize);
    }

    public static Literal untag(final Literal literal) {
        return normalize(literal, Untag::untag);
    }

    public static Literal normalize(final Literal literal, final UnaryOperator<String> normalizer) {
        return literal.getLanguage()
                .map(lang -> literal(normalizer.apply(literal.stringValue()), lang))
                .orElseGet(() -> literal(normalizer.apply(literal.stringValue()), literal.getDatatype()));
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
                .value(RDFS.LABEL, name.or(() -> legalName))

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
                .values(RDFS.LABEL, frame.values(Schema.name))

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
