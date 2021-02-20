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
