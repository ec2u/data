/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

package eu.ec2u.data.schemas;

import org.eclipse.rdf4j.model.IRI;

import java.util.Map;

import static com.metreeca.json.Values.iri;
import static com.metreeca.rest.Xtream.entry;
import static com.metreeca.rest.Xtream.map;
import static java.util.Collections.unmodifiableMap;

public final class EC2U {

	public static final Map<String, IRI> Universities=unmodifiableMap(map(
			entry("uc.pt", iri("https://data.ec2u.eu/universities/1")),
			entry("uaic.ro", iri("https://data.ec2u.eu/universities/2")),
			entry("uni-jena.de", iri("https://data.ec2u.eu/universities/3")),
			entry("unipv.it", iri("https://data.ec2u.eu/universities/4")),
			entry("univ-poitiers.fr", iri("https://data.ec2u.eu/universities/5")),
			entry("usal.es", iri("https://data.ec2u.eu/universities/6")),
			entry("utu.fi", iri("https://data.ec2u.eu/universities/7"))
	));


	public static final String Base="https://data.ec2u.eu/";
	public static final String Name=Base+"terms#";


	//// Contexts //////////////////////////////////////////////////////////////////////////////////////////////////////

	public static final IRI ontologies=iri(Base, "/ontologies/");
	public static final IRI universities=iri(Base, "/universities/");


	//// Vocabulary ////////////////////////////////////////////////////////////////////////////////////////////////////

	public static final IRI Resource=iri(Name, "Resource");
	public static final IRI University=iri(Name, "University");

	public static final IRI university=iri(Name, "university");
	public static final IRI schac=iri(Name, "schac");


	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	private EC2U() {}

}
