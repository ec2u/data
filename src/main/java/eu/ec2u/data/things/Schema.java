/*
 * Copyright © 2020-2024 EC2U Alliance
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

package eu.ec2u.data.things;

import com.metreeca.http.rdf4j.actions.Upload;
import com.metreeca.link.Shape;

import eu.ec2u.data._EC2U;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.RDF;

import java.util.stream.Stream;

import static com.metreeca.http.rdf.Values.iri;
import static com.metreeca.http.rdf.formats.RDF.rdf;
import static com.metreeca.link.Shape.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data._EC2U.item;
import static eu.ec2u.data.resources.Resources.Reference;

/**
 * Schema.org RDF vocabulary.
 *
 * @see <a href="https://schema.org/">Schema.org</a>
 */
public final class Schema {

    //// !!! ///////////////////////////////////////////////////////////////////////////////////////////////////////////

    private static Shape or(final Shape... shapes) {
        return shape(); // !!!
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static final String Namespace="https://schema.org/";

    private static final IRI Context=item("/things");


    /**
     * Creates a term in the schema.org namespace.
     *
     * @param id the identifier of the term to be created
     * @return the schema.org term identified by {@code id}
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

    public static final IRI identifier=term("identifier");
    public static final IRI url=term("url");
    public static final IRI name=term("name");
    public static final IRI image=term("image");
    public static final IRI description=term("description");
    public static final IRI disambiguatingDescription=term("disambiguatingDescription");


    /**
     * Creates a thing shape.
     *
     * @return a thing shape including {@code labels} constraints for textual labels
     * @throws NullPointerException if {@code labels} is nul or contains null elements
     */
    public static Shape Thing() {
        return shape(Reference(),

                property(RDF.TYPE, hasValue(Thing)),

                property(identifier, optional(), string()),
                property(url, multiple(), id()),
                property(name, required(), local()),
                property("fullDescription", description, required(), local()), // ;( clash with dct:description
                property(disambiguatingDescription, optional(), local()),
                property(image, optional(), id()),
                property(about, multiple(), Reference())

        );
    }


    //// Organizations /////////////////////////////////////////////////////////////////////////////////////////////////

    public static final IRI Organization=term("Organization");

    public static final IRI legalName=term("legalName");


    public static Shape Organization() {
        return shape(Thing(),

                property(RDF.TYPE, hasValue(Organization)),

                property(legalName, local()),
                property(Schema.email, string()),
                property(Schema.telephone, string())

        );
    }


    //// Shared ////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static final IRI inLanguage=term("inLanguage");
    public static final IRI numberOfCredits=term("numberOfCredits");
    public static final IRI educationalCredentialAwarded=term("educationalCredentialAwarded");
    public static final IRI occupationalCredentialAwarded=term("occupationalCredentialAwarded");
    public static final IRI educationalLevel=term("educationalLevel");


    //// Programs //////////////////////////////////////////////////////////////////////////////////////////////////////

    public static final IRI EducationalOccupationalProgram=term("EducationalOccupationalProgram");

    public static final IRI programType=term("programType");
    public static final IRI occupationalCategory=term("occupationalCategory");
    public static final IRI timeToComplete=term("timeToComplete");
    public static final IRI programPrerequisites=term("programPrerequisites");
    public static final IRI hasCourse=term("hasCourse");


    //// Courses ///////////////////////////////////////////////////////////////////////////////////////////////////////

    public static final IRI Course=term("Course");

    public static final IRI courseCode=term("courseCode");
    public static final IRI coursePrerequisites=term("coursePrerequisites");


    //// Learning Resource /////////////////////////////////////////////////////////////////////////////////////////////

    public static final IRI LearningResource=term("LearningResource");

    public static final IRI assesses=term("assesses");
    public static final IRI competencyRequired=term("competencyRequired");
    public static final IRI learningResourceType=term("learningResourceType");
    public static final IRI teaches=term("teaches");


    //// Creative Work /////////////////////////////////////////////////////////////////////////////////////////////////

    public static final IRI provider=term("provider");
    public static final IRI dateCreated=term("dateCreated");
    public static final IRI dateModified=term("dateModified");
    public static final IRI about=term("about");
    public static final IRI timeRequired=term("timeRequired");


    //// Events ////////////////////////////////////////////////////////////////////////////////////////////////////////

    public enum EventStatus { EventScheduled, EventMovedOnline, EventPostponed, EventRescheduled, EventCancelled }

    public static final IRI Event=term("Event");

    public static final IRI organizer=term("organizer");
    public static final IRI isAccessibleForFree=term("isAccessibleForFree");
    public static final IRI eventStatus=term("eventStatus");
    public static final IRI location=term("location");
    public static final IRI eventAttendanceMode=term("eventAttendanceMode");
    public static final IRI startDate=term("startDate");
    public static final IRI endDate=term("endDate");


    public static Shape Event() {
        return shape(Thing(),

                property(RDF.TYPE, hasValue(Event)),

                property(eventStatus, optional(), id()),

                property(startDate, optional(), dateTime()),
                property(endDate, optional(), dateTime()),

                property(inLanguage, multiple(), string()),
                property(isAccessibleForFree, optional(), bool()),
                property(eventAttendanceMode, multiple(), id()),

                property(location, multiple(), Location()),
                property(organizer, multiple(), Organization())

        );
    }


    //// Locations /////////////////////////////////////////////////////////////////////////////////////////////////////

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
        return shape(Thing(),

                property(RDF.TYPE, hasValue(Place)),

                property(address, optional(), PostalAddress()),

                property(latitude, optional(), decimal()),
                property(longitude, optional(), decimal())

        );
    }

    public static Shape PostalAddress() {
        return shape(ContactPoint(),

                property(RDF.TYPE, hasValue(PostalAddress)),

                property(addressCountry, optional(), or(Reference(), string())),
                property(addressRegion, optional(), or(Reference(), string())),
                property(addressLocality, optional(), or(Reference(), string())),
                property(postalCode, optional(), string()),
                property(streetAddress, optional(), string())

        );
    }

    public static Shape VirtualLocation() {
        return shape(Thing(),

                property(RDF.TYPE, hasValue(VirtualLocation))

        );
    }


    //// ContactPoints /////////////////////////////////////////////////////////////////////////////////////////////////

    public static final IRI ContactPoint=term("ContactPoint");


    public static final IRI email=term("email");
    public static final IRI telephone=term("telephone");
    public static final IRI faxNumber=term("faxNumber");


    public static Shape ContactPoint() {
        return shape(Thing(),

                property(RDF.TYPE, hasValue(ContactPoint)),

                property(email, optional(), string()),
                property(telephone, optional(), string())

        );
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Schema() { }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static final class Loader implements Runnable {

        public static void main(final String... args) {
            exec(() -> new Loader().run());
        }

        @Override public void run() {
            Stream

                    .of(rdf(Schema.class, ".ttl", _EC2U.Base))

                    .forEach(new Upload()
                            .contexts(Context)
                            .clear(true)
                    );
        }
    }

}
