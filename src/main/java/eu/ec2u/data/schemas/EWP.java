/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

package eu.ec2u.data.schemas;

import org.eclipse.rdf4j.model.IRI;

import static org.eclipse.rdf4j.model.util.Values.iri;

public final class EWP {

	public static final String Name="https://github.com/erasmus-without-paper/ewp-specs-api-registry/tree/stable-v1#";

	public static final IRI Host=iri(Name, "Host");
	public static final IRI API=iri(Name, "API");

	public static final IRI network=iri(Name, "network");

	public static final IRI url=iri(Name, "url");
	public static final IRI api=iri(Name, "api");


	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	private EWP() {}

}
