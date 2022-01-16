/*
 * Copyright © 2022 EC2U Consortium. All rights reserved.
 */

package eu.ec2u.data.terms;

import com.metreeca.json.Shape;

import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.RDFS;
import org.eclipse.rdf4j.model.vocabulary.XSD;

import static com.metreeca.json.Shape.multiple;
import static com.metreeca.json.Shape.optional;
import static com.metreeca.json.Values.IRIType;
import static com.metreeca.json.Values.iri;
import static com.metreeca.json.shapes.And.and;
import static com.metreeca.json.shapes.Datatype.datatype;
import static com.metreeca.json.shapes.Field.field;
import static com.metreeca.json.shapes.Or.or;

import static eu.ec2u.data.terms.EC2U.multilingual;

/**
 * Schema.org RDF vocabulary.
 *
 * @see <a href="https://schema.org/">Schema.org</a>
 */
public final class Schema {

	public static final String Namespace="https://schema.org/";


	/**
	 * Creates a term in the schema.org namespace.
	 *
	 * @param id the identifer of the term to be created
	 *
	 * @return the schema.org term identified by {@code id}
	 *
	 * @throws NullPointerException if {@code id} is null
	 */
	public static IRI term(final String id) {

		if ( id == null ) {
			throw new NullPointerException("null id");
		}

		return iri(Namespace, id);
	}


	//// Things ////////////////////////////////////////////////////////////////////////////////////////////////////////

	public static final IRI Thing=term("Thing");

	public static final IRI url=term("url");
	public static final IRI name=term("name");
	public static final IRI image=term("image");
	public static final IRI description=term("description");
	public static final IRI disambiguatingDescription=term("disambiguatingDescription");


	/**
	 * Creates a thing shape.
	 *
	 * @return a thing shape including {@code labels} constraints for textual labels
	 *
	 * @throws NullPointerException if {@code labels} is nul or contains null elements
	 */
	public static Shape Thing() {
		return and(

				field(url, optional(), datatype(IRIType)),
				field(name, multilingual()),
				field(image, multiple(), datatype(IRIType)),
				field(description, multilingual()),
				field(disambiguatingDescription, multilingual())

		);
	}


	//// Events ////////////////////////////////////////////////////////////////////////////////////////////////////////

	public enum EventStatus {EventScheduled, EventMovedOnline, EventPostponed, EventRescheduled, EventCancelled}

	public static final IRI Event=term("Event");

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


	public static Shape Event() {
		return and(Thing(),

				field(organizer, optional(),
						field(RDFS.LABEL, multilingual())
				),

				field(isAccessibleForFree, optional(), datatype(XSD.BOOLEAN)),
				field(eventStatus, optional(), datatype(IRIType)),

				field(location, optional(), Location()),

				field(eventAttendanceMode, multiple(), datatype(IRIType)),

				field(audience, multiple(),
						field(RDFS.LABEL, multilingual())
				),

				field(inLanguage, multiple(), datatype(XSD.STRING)),
				field(typicalAgeRange, multiple(), datatype(XSD.STRING)),

				field(startDate, optional(), datatype(XSD.DATETIME)),
				field(endDate, optional(), datatype(XSD.DATETIME)));
	}


	//// Places ////////////////////////////////////////////////////////////////////////////////////////////////////////

	public static final IRI Place=term("Place");
	public static final IRI PostalAddress=term("PostalAddress");
	public static final IRI VirtualLocation=term("VirtualLocation");


	public static IRI address=term("address");

	public static IRI latitude=term("latitude");
	public static IRI longitude=term("longitude");

	public static IRI addressCountry=term("addressCountry");
	public static IRI addressRegion=term("addressRegion");
	public static IRI addressLocality=term("addressLocality");

	public static IRI postalCode=term("postalCode");
	public static IRI streetAddress=term("streetAddress");


	public static Shape Location() {

		return or(

				Place(),
				PostalAddress(),
				VirtualLocation()

		);
	}

	public static Shape Place() {
		return and(Thing(),

				field(address, optional(), PostalAddress()),

				field(latitude, optional(), datatype(XSD.DECIMAL)),
				field(longitude, optional(), datatype(XSD.DECIMAL))

		);
	}

	public static Shape PostalAddress() {
		return and(Thing(),

				field(addressCountry, optional(), datatype(XSD.DECIMAL)),
				field(addressRegion, optional(), datatype(XSD.STRING)),
				field(addressLocality, optional(), datatype(XSD.STRING)),
				field(postalCode, optional(), datatype(XSD.STRING)),
				field(streetAddress, optional(), datatype(XSD.STRING))

		);
	}

	public static Shape VirtualLocation() {
		return and(Thing());
	}


	//// ContactPoints /////////////////////////////////////////////////////////////////////////////////////////////////

	public static final IRI ContactPoint=term("ContactPoint");


	public static IRI email=term("email");
	public static IRI telephone=term("telephone");
	public static IRI faxNumber=term("faxNumber");


	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	private Schema() { }

}
