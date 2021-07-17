/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

package eu.ec2u.data.schemas;

import org.eclipse.rdf4j.model.IRI;

import static com.metreeca.json.Values.iri;

public final class Schema {

	public static final String Name="https://schema.org/";


	//// Thing /////////////////////////////////////////////////////////////////////////////////////////////////////////

	public static final IRI name=iri(Name, "name");
	public static final IRI description=iri(Name, "description");


	//// Event /////////////////////////////////////////////////////////////////////////////////////////////////////////

	public static final IRI Event=iri(Name, "Event");

	public static final IRI startDate=iri(Name, "startDate");
	public static final IRI endDate=iri(Name, "endDate");

}
