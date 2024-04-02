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

import eu.ec2u.data.concepts.ESCO;
import eu.ec2u.data.concepts.EuroSciVoc;
import eu.ec2u.data.concepts.ISCED2011;
import org.eclipse.rdf4j.model.IRI;

import java.util.stream.Stream;

import static com.metreeca.http.rdf.Values.iri;
import static com.metreeca.http.rdf.formats.RDF.rdf;
import static com.metreeca.http.toolkits.Resources.resource;
import static com.metreeca.link.Frame.reverse;
import static com.metreeca.link.Shape.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.BASE;
import static eu.ec2u.data.EC2U.item;
import static eu.ec2u.data.concepts.Concepts.Concept;
import static eu.ec2u.data.resources.Resources.Resource;
import static eu.ec2u.data.resources.Resources.localized;

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

    private static final IRI Context=item("/things/");


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
        return shape(Thing, Resource(),

                property(url, multiple(id())),
                property(identifier, optional(string())),
                property(name, required(localized())),
                property(image, optional(id())),
                property(description, required(localized())),
                property(disambiguatingDescription, optional(localized()))

        );
    }


    //// Shared ////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static final IRI about=term("about");
    public static final IRI inLanguage=term("inLanguage");
    public static final IRI email=term("email");
    public static final IRI telephone=term("telephone");


    //// Organizations /////////////////////////////////////////////////////////////////////////////////////////////////

    public static final IRI Organization=term("Organization");

    public static final IRI legalName=term("legalName");


    public static Shape Organization() {
        return shape(Organization, Thing(),

                property(legalName, optional(localized())),
                property(email, optional(string())),
                property(telephone, optional(string()))

        );
    }


    //// Creative Work /////////////////////////////////////////////////////////////////////////////////////////////////

    public static final IRI provider=term("provider");
    public static final IRI dateCreated=term("dateCreated");
    public static final IRI dateModified=term("dateModified");
    public static final IRI timeRequired=term("timeRequired");


    //// Learning Resource /////////////////////////////////////////////////////////////////////////////////////////////

    public static final IRI LearningResource=term("LearningResource");

    public static final IRI assesses=term("assesses");
    public static final IRI competencyRequired=term("competencyRequired");
    public static final IRI learningResourceType=term("learningResourceType");
    public static final IRI teaches=term("teaches");


    //// Offerings /////////////////////////////////////////////////////////////////////////////////////////////////////

    public static final IRI numberOfCredits=term("numberOfCredits");
    public static final IRI educationalCredentialAwarded=term("educationalCredentialAwarded");
    public static final IRI occupationalCredentialAwarded=term("occupationalCredentialAwarded");
    public static final IRI educationalLevel=term("educationalLevel");


    public static Shape Offering() {
        return shape(Thing(),

                property(numberOfCredits, optional(decimal(), minInclusive(0))),
                property(educationalCredentialAwarded, optional(localized())),
                property(occupationalCredentialAwarded, optional(localized())),

                property(provider, optional(Organization())),

                property(educationalLevel, optional(Concept(), scheme(ISCED2011.Scheme))),
                property(about, multiple(Concept(), scheme(EuroSciVoc.Scheme)))

        );
    }


    //// Programs //////////////////////////////////////////////////////////////////////////////////////////////////////

    public static final IRI EducationalOccupationalProgram=term("EducationalOccupationalProgram");

    public static final IRI programType=term("programType");
    public static final IRI occupationalCategory=term("occupationalCategory");
    public static final IRI timeToComplete=term("timeToComplete");
    public static final IRI programPrerequisites=term("programPrerequisites");
    public static final IRI hasCourse=term("hasCourse");


    public static Shape EducationalOccupationalProgram() {
        return shape(EducationalOccupationalProgram, Offering(),

                property(timeToComplete, optional(duration())),
                property(programPrerequisites, optional(localized())),

                property(hasCourse, () -> multiple(Course())),

                property(programType, optional(Concept())), // !!! scheme?
                property(occupationalCategory, multiple(Concept(), scheme(ESCO.Scheme)))

        );
    }


    //// Courses ///////////////////////////////////////////////////////////////////////////////////////////////////////

    public static final IRI Course=term("Course");

    public static final IRI courseCode=term("courseCode");
    public static final IRI coursePrerequisites=term("coursePrerequisites");


    public static Shape Course() {
        return shape(Course, Offering(),

                property(courseCode, optional(string())),
                property(inLanguage, multiple(string(), pattern("[a-z]{2}"))),
                property(timeRequired, optional(duration())),

                property(learningResourceType, optional(localized())),
                property(teaches, optional(localized())),
                property(assesses, optional(localized())),
                property(coursePrerequisites, optional(localized())),
                property(competencyRequired, optional(localized())),

                property("inProgram", reverse(hasCourse), () -> multiple(EducationalOccupationalProgram()))

        );
    }



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
        return shape(Event, Thing(),

                property(eventStatus, optional(id())),

                property(startDate, optional(dateTime())),
                property(endDate, optional(dateTime())),

                property(inLanguage, multiple(string())),
                property(isAccessibleForFree, optional(bool())),
                property(eventAttendanceMode, multiple(id())),

                property(location, multiple(Location())),
                property(organizer, multiple(Organization()))

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
        return shape(Place, Thing(),

                property(address, optional(PostalAddress())),

                property(latitude, optional(decimal())),
                property(longitude, optional(decimal()))

        );
    }

    public static Shape PostalAddress() {
        return shape(PostalAddress, ContactPoint(),

                property(addressCountry, optional(or(Resource(), string()))),
                property(addressRegion, optional(or(Resource(), string()))),
                property(addressLocality, optional(or(Resource(), string()))),
                property(postalCode, optional(string())),
                property(streetAddress, optional(string()))

        );
    }

    public static Shape VirtualLocation() {
        return shape(VirtualLocation, Thing());
    }


    //// ContactPoints /////////////////////////////////////////////////////////////////////////////////////////////////

    public static final IRI ContactPoint=term("ContactPoint");


    public static Shape ContactPoint() {
        return shape(ContactPoint, Thing(),

                property(email, optional(string())),
                property(telephone, optional(string()))

        );
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Schema() { }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static void main(final String... args) {
        exec(() -> Stream

                .of(rdf(resource(Schema.class, ".ttl"), BASE))

                .forEach(new Upload()
                        .contexts(Context)
                        .clear(true)
                )
        );
    }

}
