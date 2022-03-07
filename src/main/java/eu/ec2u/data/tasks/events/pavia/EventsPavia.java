package eu.ec2u.data.tasks.events.pavia;

import com.metreeca.json.Frame;

import eu.ec2u.data.terms.Schema;
import org.eclipse.rdf4j.model.IRI;

import static com.metreeca.json.Frame.frame;
import static com.metreeca.json.Values.bnode;
import static com.metreeca.json.Values.literal;
import static com.metreeca.open.actions.Wikidata.wd;


final class EventsPavia {

    private static final IRI Italy=wd("Q48");
    private static final IRI Pavia=wd("Q6259");

    static final Frame Defaults=frame(bnode())
            .value(Schema.addressCountry, Italy)
            .value(Schema.addressLocality, Pavia)
            .value(Schema.postalCode, literal("27100"));


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private EventsPavia() { }

}
