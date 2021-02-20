/*
 * Copyright © 2021 EC2U Consortium
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
