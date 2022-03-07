package eu.ec2u.data.tasks.events.jena;

import com.metreeca.json.Frame;

import eu.ec2u.data.terms.Schema;
import org.eclipse.rdf4j.model.IRI;

import static com.metreeca.json.Frame.frame;
import static com.metreeca.json.Values.bnode;
import static com.metreeca.json.Values.literal;
import static com.metreeca.open.actions.Wikidata.wd;


final class EventsJena {

    private static final IRI Germany=wd("Q183");
    private static final IRI Jena=wd("Q3150");

    static final Frame Defaults=frame(bnode())
            .value(Schema.addressCountry, Germany)
            .value(Schema.addressLocality, Jena)
            .value(Schema.postalCode, literal("7745"));


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private EventsJena() { }

}
