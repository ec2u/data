package eu.ec2u.data.cities;

import org.eclipse.rdf4j.model.IRI;

import static com.metreeca.open.actions.Wikidata.wd;

import static eu.ec2u.data.terms.EC2U.item;

public final class Poitiers {

    public static final IRI University=item("/universities/poitiers");
    public static final IRI City=wd("Q6616");
    public static final IRI Country=wd("Q142");
    public static final String Language="fr";


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Poitiers() { }

}
