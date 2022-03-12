package eu.ec2u.data.tasks.events;

import com.metreeca.json.Frame;

import eu.ec2u.data.terms.Schema;
import org.eclipse.rdf4j.model.IRI;

import static com.metreeca.json.Frame.frame;
import static com.metreeca.json.Values.bnode;
import static com.metreeca.json.Values.literal;
import static com.metreeca.open.actions.Wikidata.wd;


final class EventsCoimbra {

    public static final IRI Portugal=wd("Q45");
    public static final IRI Coimbra=wd("Q45412");

    public static final Frame Defaults=frame(bnode())
            .value(Schema.addressCountry, Portugal)
            .value(Schema.addressLocality, Coimbra)
            .value(Schema.postalCode, literal("3000"));


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private EventsCoimbra() { }

}
