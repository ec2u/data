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
	public static final String Name=Base+"terms/";


	public static final Set<String> langs=Set.of(
			"en", "pt", "ro", "de", "it", "fr", "es", "fi"
	);


	public static Shape multilingual() {
		return localized(langs);
	}


	//// Contexts //////////////////////////////////////////////////////////////////////////////////////////////////////

	public static final IRI ontologies=iri(Base, "/ontologies/");
	public static final IRI concepts=iri(Base, "/concepts/");
	public static final IRI wikidata=iri(Base, "/wikidata");
	public static final IRI inferences=iri(Base, "/inferences");

	public static final IRI events=iri(Base, "/events/");
	public static final IRI locations=iri(Base, "/locations/");


	//// Resources /////////////////////////////////////////////////////////////////////////////////////////////////////

	public static final IRI Resource=iri(Name, "Resource");

	public static final IRI university=iri(Name, "university");
	public static final IRI updated=iri(Name, "updated");


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
				field(DCTERMS.CREATED, optional(), datatype(XSD.DATETIME)),
				field(DCTERMS.MODIFIED, optional(), datatype(XSD.DATETIME))

		);
	}


	//// Universities //////////////////////////////////////////////////////////////////////////////////////////////////

	public static final IRI University=iri(Name, "University");

	public static final IRI schac=iri(Name, "schac");
	public static final IRI country=iri(Name, "country");
	public static final IRI location=iri(Name, "location");
	public static final IRI image=iri(Name, "image");
	public static final IRI inception=iri(Name, "inception");
	public static final IRI students=iri(Name, "students");


	//// Events ////////////////////////////////////////////////////////////////////////////////////////////////////////

	public static final IRI Event=iri(Name, "Event");


	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	public static final IRI Theme=iri(Name, "Theme");


	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	private EC2U() { }

}
