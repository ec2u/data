/*
 * Copyright © 2020-2022 EC2U Alliance
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

import com.metreeca.link.Shape;
import com.metreeca.link.Values;

import eu.ec2u.data.cities.*;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.*;

import java.util.Map;
import java.util.Set;

import static com.metreeca.link.Shape.multiple;
import static com.metreeca.link.Shape.optional;
import static com.metreeca.link.Values.iri;
import static com.metreeca.link.shapes.All.all;
import static com.metreeca.link.shapes.And.and;
import static com.metreeca.link.shapes.Datatype.datatype;
import static com.metreeca.link.shapes.Field.field;
import static com.metreeca.link.shapes.Guard.hidden;
import static com.metreeca.link.shapes.Localized.localized;
import static com.metreeca.link.shapes.Range.range;

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
            entry("@id", "id")
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

    public static final IRI units=item("/units/");
    public static final IRI courses=item("/courses/");
    public static final IRI persons=item("/persons/");

    public static final IRI events=item("/events/");
    public static final IRI locations=item("/locations/");
    public static final IRI organizations=item("/organizations/");


    //// Resources /////////////////////////////////////////////////////////////////////////////////////////////////////

    public static final IRI Resource=term("Resource");

    public static final IRI university=term("university");


    public static Shape Reference() {
        return and(

                datatype(Values.IRIType),

                field(RDFS.LABEL, multilingual()),
                field(RDFS.COMMENT, multilingual())

        );
    }

    public static Shape Resource() {
        return and(Reference(),

                hidden(field(RDF.TYPE, all(Resource))),

                field(university, optional(),
                        field(RDFS.LABEL, multilingual())
                ),

                field(DCTERMS.TITLE, multilingual()),
                field(DCTERMS.DESCRIPTION, multilingual()),

                field(DCTERMS.PUBLISHER, optional(), Publisher()),
                field(DCTERMS.SOURCE, optional(), datatype(Values.IRIType)),

                field(DCTERMS.ISSUED, optional(), datatype(XSD.DATETIME)),
                field(DCTERMS.CREATED, optional(), datatype(XSD.DATETIME)),
                field(DCTERMS.MODIFIED, optional(), datatype(XSD.DATETIME)),

                field(DCTERMS.TYPE, multiple(), Reference()),
                field(DCTERMS.SUBJECT, multiple(), Reference())

        );
    }


    public static final IRI College=term("College");
    public static final IRI Association=term("Association");
    public static final IRI City=term("City");
    public static final IRI Other=term("Other");


    //// Datasets /////////////////////////////////////////////////////////////////////////////////////////////////////

    public static final IRI Dataset=term("Dataset");


    //// Publishers ////////////////////////////////////////////////////////////////////////////////////////////////////

    public static final IRI Publisher=term("Publisher");


    public static Shape Publisher() {
        return and(Reference(),

                field(DCTERMS.COVERAGE, optional(), range(University, College, Association, City, Other))

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


    //// Units ////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static final IRI Unit=term("Unit");


    //// Courses ////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static final IRI Course=term("Course");


    //// Persons ////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static final IRI Person=term("Person");


    //// Events ////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static final IRI Event=term("Event");


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private EC2U() { }

}
