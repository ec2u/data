package eu.ec2u.data.cities;

import org.eclipse.rdf4j.model.IRI;

import static com.metreeca.open.actions.Wikidata.wd;

import static eu.ec2u.data.terms.EC2U.item;


public final class Coimbra {

    public static final IRI University=item("/universities/coimbra");
    public static final IRI City=wd("Q45412");
    public static final IRI Country=wd("Q45");
    public static final String Language="pt";


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Coimbra() { }

}
