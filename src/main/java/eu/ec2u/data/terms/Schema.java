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

import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.RDFS;
import org.eclipse.rdf4j.model.vocabulary.XSD;

import static com.metreeca.link.Shape.multiple;
import static com.metreeca.link.Shape.optional;
import static com.metreeca.link.Values.IRIType;
import static com.metreeca.link.Values.iri;
import static com.metreeca.link.shapes.And.and;
import static com.metreeca.link.shapes.Datatype.datatype;
import static com.metreeca.link.shapes.Field.field;
import static com.metreeca.link.shapes.Or.or;

import static eu.ec2u.data.terms.EC2U.Reference;
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
        return and(Reference(),

                field(url, multiple(), datatype(IRIType)),
                field(name, multilingual()),
                field(image, multiple(), datatype(IRIType)),
                field(description, multilingual()),
                field(disambiguatingDescription, multilingual())

        );
    }


    //// Creative Work /////////////////////////////////////////////////////////////////////////////////////////////////

    public static final IRI dateCreated=term("dateCreated");
    public static final IRI dateModified=term("dateModified");


    //// Organizations /////////////////////////////////////////////////////////////////////////////////////////////////

    public static final IRI Organization=term("Organization");

    public static final IRI legalName=term("legalName");


    public static Shape Organization() {
        return and(Thing(),

                field(RDFS.LABEL, multilingual()),

                field(Schema.legalName, multilingual()),
                field(Schema.email, datatype(XSD.STRING)),
                field(Schema.telephone, datatype(XSD.STRING))
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
    public static final IRI startDate=term("startDate");
    public static final IRI endDate=term("endDate");


    public static Shape Event() {
        return and(Thing(),

                field(eventStatus, optional(), datatype(IRIType)),

                field(startDate, optional(), datatype(XSD.DATETIME)),
                field(endDate, optional(), datatype(XSD.DATETIME)),

                field(inLanguage, multiple(), datatype(XSD.STRING)),
                field(isAccessibleForFree, optional(), datatype(XSD.BOOLEAN)),
                field(eventAttendanceMode, multiple(), datatype(IRIType)),

                field(location, multiple(), Location()),
                field(audience, multiple(), field(RDFS.LABEL, multilingual())),
                field(organizer, multiple(), Organization())

        );
    }


    //// Places ////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static final IRI Place=term("Place");
    public static final IRI PostalAddress=term("PostalAddress");
    public static final IRI VirtualLocation=term("VirtualLocation");


    public static final IRI address=term("address");

    public static final IRI latitude=term("latitude");
    public static final IRI longitude=term("longitude");

    public static final IRI addressCountry=term("addressCountry");
    public static final IRI addressRegion=term("addressRegion");
    public static final IRI addressLocality=term("addressLocality");

    public static final IRI postalCode=term("postalCode");
    public static final IRI streetAddress=term("streetAddress");


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
        return and(ContactPoint(),

                field(addressCountry, optional(), or(and(Reference(), datatype(IRIType)), datatype(XSD.STRING))),
                field(addressRegion, optional(), or(and(Reference(), datatype(IRIType)), datatype(XSD.STRING))),
                field(addressLocality, optional(), or(and(Reference(), datatype(IRIType)), datatype(XSD.STRING))),
                field(postalCode, optional(), datatype(XSD.STRING)),
                field(streetAddress, optional(), datatype(XSD.STRING))

        );
    }

    public static Shape VirtualLocation() {
        return and(Thing());
    }


    //// ContactPoints /////////////////////////////////////////////////////////////////////////////////////////////////

    public static final IRI ContactPoint=term("ContactPoint");


    public static final IRI email=term("email");
    public static final IRI telephone=term("telephone");
    public static final IRI faxNumber=term("faxNumber");


    public static Shape ContactPoint() {
        return and(Thing(),

                field(email, optional(), datatype(XSD.STRING)),
                field(telephone, optional(), datatype(XSD.STRING))


        );
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Schema() { }

}
