package eu.ec2u.data.cities;

import org.eclipse.rdf4j.model.IRI;

import static com.metreeca.open.actions.Wikidata.wd;

import static eu.ec2u.data.terms.EC2U.item;


public final class Iasi {

    public static final IRI University=item("/universities/iasi");
    public static final IRI City=wd("Q46852");
    public static final IRI Country=wd("Q218");
    public static final String Language="ro";


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Iasi() { }

}
