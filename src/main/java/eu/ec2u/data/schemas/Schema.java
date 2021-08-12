/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

package eu.ec2u.data.schemas;

import com.metreeca.json.Values;

import org.eclipse.rdf4j.model.*;

import java.util.stream.Stream;

import static com.metreeca.json.Values.iri;

public final class Schema {

	public static final String Name="https://schema.org/";
	public static final String NameLegacy="http://schema.org/";


	public static IRI term(final String id) {
		return iri(Name, id);
	}


	//// Thing /////////////////////////////////////////////////////////////////////////////////////////////////////////

	public static final IRI name=term("name");

	public static final IRI description=term("description");


	//// Event /////////////////////////////////////////////////////////////////////////////////////////////////////////

	public static final IRI Event=term("Event");

	public static final IRI startDate=term("startDate");
	public static final IRI endDate=term("endDate");


	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * Upgrades unsecure {@value #NameLegacy} references.
	 *
	 * @param model
	 *
	 * @return
	 */
	public static Stream<Statement> normalize(final Stream<Statement> model) {
		return model.map(Schema::normalize);
	}

	public static Statement normalize(final Statement statement) {
		return Values.statement(
				normalize(statement.getSubject()),
				normalize(statement.getPredicate()),
				normalize(statement.getObject()),
				statement.getContext()
		);
	}

	public static Value normalize(final Value value) {
		return value.isIRI() ? normalize((IRI)value) : value;
	}

	public static Resource normalize(final Resource resource) {
		return resource.isIRI() ? normalize((IRI)resource) : resource;
	}

	public static IRI normalize(final IRI iri) {
		return iri.stringValue().startsWith(NameLegacy) ? iri(Name, iri.getLocalName()) : iri;
	}


}
