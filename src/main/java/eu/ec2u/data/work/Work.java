package eu.ec2u.data.work;

import com.metreeca.json.Frame;
import com.metreeca.text.actions.Normalize;
import com.metreeca.xml.actions.Untag;

import eu.ec2u.data.terms.EC2U;
import eu.ec2u.data.terms.Schema;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.vocabulary.*;

import java.io.ByteArrayInputStream;
import java.util.Optional;
import java.util.function.UnaryOperator;

import static com.metreeca.json.Frame.frame;
import static com.metreeca.json.Values.*;
import static com.metreeca.xml.formats.HTMLFormat.html;

import static eu.ec2u.data.work.RSS.*;

import static java.nio.charset.StandardCharsets.UTF_8;

public final class Work {

    private static final int TextSize=320;

    private static final Normalize Normalizer=new Normalize()
            .space(true)
            .smart(true)
            .marks(true);


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static Frame wordpress(final Frame frame, final String lang) {

        final Optional<Value> label=frame.string(Title)
                .map(text -> text.length() > TextSize ? text.substring(0, TextSize-2)+" …" : text)
                .map(text -> literal(text, lang));

        final Optional<Value> brief=frame.string(Encoded)
                .map(text -> text.length() > TextSize ? text.substring(0, TextSize-2)+" …" : text)
                .map(text -> literal(text, lang));

        return frame(iri(EC2U.events, frame.skolemize(Link)))

                .values(RDF.TYPE, EC2U.Event, Schema.Event)
                .value(RDFS.LABEL, label)
                .value(RDFS.COMMENT, brief)

                .value(DCTERMS.ISSUED, frame.value(PubDate))
                .value(DCTERMS.SOURCE, frame.value(Link))

                .frames(DCTERMS.SUBJECT, frame.strings(Category)
                        .map(category -> frame(iri(EC2U.concepts, md5(category)))
                                .value(RDFS.LABEL, literal(category, lang))
                                .value(SKOS.PREF_LABEL, literal(category, lang))
                        )
                )

                .value(Schema.name, label)
                .value(Schema.disambiguatingDescription, brief)
                .value(Schema.description, frame.value(Encoded).map(value -> localize(value, lang)))
                .value(Schema.url, frame.value(Link));
    }


    public static Value localize(final Value value, final String lang) {
        return literal(value)

                .filter(object -> object.getDatatype().equals(XSD.STRING))

                .map(Value::stringValue)
                .map(text -> literal(text, lang))
                .map(Value.class::cast)

                .orElse(value);
    }

    public static Literal normalize(final Literal literal) {
        return normalize(literal, Normalizer);
    }

    public static Literal untag(final Literal literal) {
        return normalize(literal, Work::untag);
    }

    public static Literal normalize(final Literal literal, final UnaryOperator<String> normalizer) {
        return literal.getLanguage()
                .map(lang -> literal(normalizer.apply(literal.stringValue()), lang))
                .orElseGet(() -> literal(normalizer.apply(literal.stringValue()), literal.getDatatype()));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static String normalize(final String text) {
        return Normalizer.apply(text);
    }

    public static String untag(final String text) {
        return html(new ByteArrayInputStream(text.getBytes(UTF_8)), UTF_8.name(), "").fold(

                error -> text, value -> new Untag().apply(value)

        );
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Work() { }

}
