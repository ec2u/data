/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

package eu.ec2u.work.link;

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
	public static final IRI image=term("image");
	public static final IRI description=term("description");
	public static final IRI disambiguatingDescription=term("disambiguatingDescription");


	//// Event /////////////////////////////////////////////////////////////////////////////////////////////////////////

	public static final IRI Event=term("Event");

	public static final IRI url=term("url");
	public static final IRI organizer=term("organizer");
	public static final IRI isAccessibleForFree=term("isAccessibleForFree");
	public static final IRI eventStatus=term("eventStatus");
	public static final IRI location=term("location");
	public static final IRI eventAttendanceMode=term("eventAttendanceMode");
	public static final IRI inLanguage=term("inLanguage");
	public static final IRI audience=term("audience");
	public static final IRI typicalAgeRange=term("typicalAgeRange");
	public static final IRI startDate=term("startDate");
	public static final IRI endDate=term("endDate");


	public enum EventStatus {EventCancelled, EventMovedOnline, EventPostponed, EventRescheduled, EventScheduled}


	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * Upgrades legacy {@value #NameLegacy} references.
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
