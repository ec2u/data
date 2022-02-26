/*
 * Copyright © 2022 EC2U Consortium. All rights reserved.
 */

package eu.ec2u.data.terms;

import com.metreeca.json.Shape;
import com.metreeca.json.Values;

import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.*;

import java.util.Set;

import static com.metreeca.json.Shape.optional;
import static com.metreeca.json.Shape.required;
import static com.metreeca.json.Values.iri;
import static com.metreeca.json.shapes.And.and;
import static com.metreeca.json.shapes.Datatype.datatype;
import static com.metreeca.json.shapes.Field.field;
import static com.metreeca.json.shapes.Localized.localized;

public final class EC2U {

	public static final String Base="https://data.ec2u.eu/";


	public static final Set<String> langs=Set.of(
			"en", "pt", "ro", "de", "it", "fr", "es", "fi"
	);


	public static IRI item(final String name) {
		return iri(Base, name);
	}

	public static IRI term(final String name) {
		return iri(item("/terms/"), name);
	}


	public static Shape multilingual() {
		return localized(langs);
	}


	//// Contexts //////////////////////////////////////////////////////////////////////////////////////////////////////

	public static final IRI ontologies=item("/ontologies/");

	public static final IRI concepts=item("/concepts/");
	public static final IRI wikidata=item("/wikidata");
	public static final IRI inferences=item("/inferences");

	public static final IRI events=item("/events/");
	public static final IRI locations=item("/locations/");


	//// Resources /////////////////////////////////////////////////////////////////////////////////////////////////////

	public static final IRI Resource=term("Resource");

	public static final IRI university=term("university");
	public static final IRI updated=term("updated");


	public static Shape Resource() {
		return and(

				field(RDFS.LABEL, multilingual()),
				field(RDFS.COMMENT, multilingual()),

				field(university, required(),
						field(RDFS.LABEL, multilingual())
				),

				field(updated, optional(), datatype(XSD.DATETIME)),


				field(DCTERMS.PUBLISHER, optional(),
						field(RDFS.LABEL, multilingual())
				),

				field(DCTERMS.SOURCE, optional(), datatype(Values.IRIType)),
				field(DCTERMS.ISSUED, optional(), datatype(XSD.DATETIME)),
				field(DCTERMS.CREATED, optional(), datatype(XSD.DATETIME)),
				field(DCTERMS.MODIFIED, optional(), datatype(XSD.DATETIME))

		);
	}


	//// Universities //////////////////////////////////////////////////////////////////////////////////////////////////

	public static final IRI University=term("University");

	public static final IRI schac=term("schac");
	public static final IRI country=term("country");
	public static final IRI location=term("location");
	public static final IRI image=term("image");
	public static final IRI inception=term("inception");
	public static final IRI students=term("students");


	//// Events ////////////////////////////////////////////////////////////////////////////////////////////////////////

	public static final IRI Event=term("Event");


	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	public static final IRI Theme=term("Theme");


	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	private EC2U() { }

}
