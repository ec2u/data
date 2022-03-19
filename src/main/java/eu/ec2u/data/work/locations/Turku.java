package eu.ec2u.data.work.locations;

import org.eclipse.rdf4j.model.IRI;

import java.time.ZoneId;

import static com.metreeca.open.actions.Wikidata.wd;


public final class Turku {

    public static final IRI City=wd("Q38511");
    public static final IRI Country=wd("Q33");
    public static final String Language="fi";
    public static final ZoneId TimeZone=ZoneId.of("EET");


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Turku() { }

}
