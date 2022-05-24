/*
 * Copyright © 2021-2022 EC2U Consortium
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package eu.ec2u.data.terms;

import com.metreeca.json.Shape;
import com.metreeca.json.Values;

import eu.ec2u.data.cities.*;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.*;

import java.util.Map;
import java.util.Set;

import static com.metreeca.json.Shape.*;
import static com.metreeca.json.Values.iri;
import static com.metreeca.json.shapes.And.and;
import static com.metreeca.json.shapes.Datatype.datatype;
import static com.metreeca.json.shapes.Field.field;
import static com.metreeca.json.shapes.Localized.localized;
import static com.metreeca.json.shapes.Range.range;

import static java.util.Map.entry;

public final class EC2U {

	public static final String Base="https://data.ec2u.eu/";


	public static final Set<String> Languages=Set.of(
			"en",
			Coimbra.Language,
			Iasi.Language,
			Jena.Language,
			Pavia.Language,
			Poitiers.Language,
			Salamanca.Language,
			Turku.Language
	);

	public static final Map<String, String> Keywords=Map.ofEntries(
			entry("@id", "id"),
			entry("@type", "type")
	);


	public static IRI item(final String name) {
		return iri(Base, name);
	}

	public static IRI term(final String name) {
		return iri(item("/terms/"), name);
	}


	public static Shape multilingual() {
		return localized(Languages);
	}


	//// Contexts //////////////////////////////////////////////////////////////////////////////////////////////////////

	public static final IRI ontologies=item("/ontologies/");

	public static final IRI concepts=item("/concepts/");
	public static final IRI wikidata=item("/wikidata");
	public static final IRI inferences=item("/inferences");

	public static final IRI events=item("/events/");
	public static final IRI locations=item("/locations/");
	public static final IRI organizations=item("/organizations/");


	//// Resources /////////////////////////////////////////////////////////////////////////////////////////////////////

	public static final IRI Resource=term("Resource");

	public static final IRI university=term("university");


	public static Shape Reference() {
		return and(
				field(RDFS.LABEL, multilingual()),
				field(RDFS.COMMENT, multilingual())
		);
	}

	public static Shape Resource() {
		return and(Reference(),

				field(university, required(),
						field(RDFS.LABEL, multilingual())
				),

				field(DCTERMS.TITLE, multilingual()),
				field(DCTERMS.DESCRIPTION, multilingual()),

				field(DCTERMS.PUBLISHER, required(), Publisher()),
				field(DCTERMS.SOURCE, optional(), datatype(Values.IRIType)),

				field(DCTERMS.ISSUED, optional(), datatype(XSD.DATETIME)),
				field(DCTERMS.CREATED, optional(), datatype(XSD.DATETIME)),
				field(DCTERMS.MODIFIED, optional(), datatype(XSD.DATETIME)),

				field(DCTERMS.SUBJECT, multiple(), Concept())

		);
	}

	public static Shape Concept() {
		return and(Reference(),

				field(SKOS.PREF_LABEL, multilingual()),
				field(SKOS.ALT_LABEL, multilingual()),
				field(SKOS.DEFINITION, multilingual()),

				field(SKOS.BROADER, datatype(Values.IRIType)),
				field(SKOS.NARROWER, datatype(Values.IRIType))

		);
	}


	public static final IRI College=term("College");
	public static final IRI Association=term("Association");
	public static final IRI City=term("City");
	public static final IRI NGO=term("City");


	//// Publishers ////////////////////////////////////////////////////////////////////////////////////////////////////

	public static final IRI Publisher=term("Publisher");


	public static Shape Publisher() {
		return and(Reference(),

				field(DCTERMS.COVERAGE, optional(), range(University, College, Association, City, NGO))

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
