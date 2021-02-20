/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

package eu.ec2u.data.schemas;

import org.eclipse.rdf4j.model.IRI;

import java.util.Map;

import static com.metreeca.json.Values.iri;
import static com.metreeca.rest.Xtream.entry;
import static com.metreeca.rest.Xtream.map;
import static java.lang.String.format;
import static java.util.Collections.unmodifiableMap;

public final class EC2U {

	public static final Map<String, String> Universities=unmodifiableMap(map(
			entry("uc.pt", "University of Coimbra"),
			entry("uaic.ro", "University of Iasi"),
			entry("uni-jena.de", "University of Jena"),
			entry("unipv.it", "University of Pavia"),
			entry("univ-poitiers.fr", "University of Poitiers"),
			entry("usal.es", "University of Salamanca"),
			entry("utu.fi", "University of Turku")
	));


	public static final String Base="https://data.ec2u.eu/";
	public static final String Name=Base+"terms#";


	//// Contexts //////////////////////////////////////////////////////////////////////////////////////////////////////

	public static final IRI ontologies=iri(Base, "/ontologies/");
	public static final IRI universities=iri(Base, "/universities/");


	//// Vocabulary ////////////////////////////////////////////////////////////////////////////////////////////////////

	public static final IRI University=iri(Name, "University");

	public static final IRI university=iri(Name, "university");
	public static final IRI shac=iri(Name, "shac");


	public static IRI university(final String shac) {
		return iri(format("https://%s/", shac));
	}


	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	private EC2U() {}

}
