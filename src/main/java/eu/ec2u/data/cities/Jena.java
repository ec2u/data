package eu.ec2u.data.cities;

import org.eclipse.rdf4j.model.IRI;

import static com.metreeca.open.actions.Wikidata.wd;

import static eu.ec2u.data.terms.EC2U.item;


public final class Jena {

    public static final IRI University=item("/universities/jena");
    public static final IRI City=wd("Q3150");
    public static final IRI Country=wd("Q183");
    public static final String Language="de";


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Jena() { }

}
