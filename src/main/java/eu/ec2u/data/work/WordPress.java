package eu.ec2u.data.work;

import com.metreeca.json.Frame;

import eu.ec2u.data.terms.EC2U;
import eu.ec2u.data.terms.Schema;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.vocabulary.*;

import java.util.Optional;

import static com.metreeca.json.Frame.frame;
import static com.metreeca.json.Values.*;

import static eu.ec2u.data.work.RSS.*;

public final class WordPress {

    public static Frame RSS(final Frame frame, final String lang) {

        final Optional<Value> label=frame.string(Title)
                .map(text -> Work.clip(text, Work.TextSize))
                .map(text -> literal(text, lang));

        final Optional<Value> brief=frame.string(Encoded)
                .map(text -> Work.clip(text, Work.TextSize))
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
                .value(Schema.description, frame.value(Encoded).map(value -> Work.localize(value, lang)))
                .value(Schema.url, frame.value(Link));
    }

}
