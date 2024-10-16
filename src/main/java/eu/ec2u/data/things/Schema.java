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

import com.metreeca.http.handlers.Delegator;
import com.metreeca.http.handlers.Worker;
import com.metreeca.http.jsonld.handlers.Driver;
import com.metreeca.http.jsonld.handlers.Relator;
import com.metreeca.link.Shape;

import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.RDFS;
import org.eclipse.rdf4j.model.vocabulary.XSD;

import static com.metreeca.http.Handler.handler;
import static com.metreeca.link.Frame.*;
import static com.metreeca.link.Query.query;
import static com.metreeca.link.Shape.decimal;
import static com.metreeca.link.Shape.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.create;
import static eu.ec2u.data.EC2U.item;
import static eu.ec2u.data.datasets.Datasets.Dataset;
import static eu.ec2u.data.resources.Resources.Resource;
import static eu.ec2u.data.resources.Resources.locales;

/**
 * Schema.org RDF vocabulary.
 *
 * @see <a href="https://schema.org/">Schema.org</a>
 */
public final class Schema extends Delegator {

    private static final String Namespace="https://schema.org/";
    private static final IRI Context=item("/things/");


    /**
     * Creates a term in the schema.org namespace.
     *
     * @param id the identifier of the term to be created
     *
     * @return the schema.org term identified by {@code id}
     *
     * @throws NullPointerException if {@code id} is null
     */
    public static IRI schema(final String id) {

        if ( id == null ) {
            throw new NullPointerException("null id");
        }

        return iri(Namespace, id);
    }


    //// Shared ////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static final IRI about=schema("about");
    public static final IRI inLanguage=schema("inLanguage");
    public static final IRI email=schema("email");
    public static final IRI telephone=schema("telephone");
    public static final IRI location=schema("location");


    //// Things ////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static final IRI Thing=schema("Thing");

    public static final IRI identifier=schema("identifier");
    public static final IRI url=schema("url");
    public static final IRI name=schema("name");
    public static final IRI image=schema("image");
    public static final IRI description=schema("description");
    public static final IRI disambiguatingDescription=schema("disambiguatingDescription");


    /**
     * Creates a thing shape.
     *
     * @return a thing shape including {@code labels} constraints for textual labels
     *
     * @throws NullPointerException if {@code labels} is nul or contains null elements
     */
    public static Shape Thing() {
        return shape(Thing, Resource(),

                property(url, multiple(id())),
                property(identifier, multiple(string())),
                property(name, optional(text(locales()))),
                property(image, optional(Resource())),
                property(description, optional(text(locales()))),
                property(disambiguatingDescription, optional(text(locales())))

        );
    }


    //// CreativeWork //////////////////////////////////////////////////////////////////////////////////////////////////

    public static final IRI isAccessibleForFree=schema("isAccessibleForFree");


    //// Organizations /////////////////////////////////////////////////////////////////////////////////////////////////

    public static final IRI Organization=schema("Organization");

    public static final IRI legalName=schema("legalName");


    public static Shape Organization() {
        return shape(Organization, Thing(),

                property(legalName, optional(text(locales()))),
                property(email, multiple(string())),
                property(telephone, multiple(string())),

                property(location, composite(optional(Location())))

        );
    }


    //// Locations /////////////////////////////////////////////////////////////////////////////////////////////////////

    public static final IRI Place=schema("Place");
    public static final IRI PostalAddress=schema("PostalAddress");
    public static final IRI VirtualLocation=schema("VirtualLocation");


    public static final IRI address=schema("address");
    public static final IRI latitude=schema("latitude");
    public static final IRI longitude=schema("longitude");

    public static final IRI addressCountry=schema("addressCountry");
    public static final IRI addressRegion=schema("addressRegion");
    public static final IRI addressLocality=schema("addressLocality");
    public static final IRI postalCode=schema("postalCode");
    public static final IRI streetAddress=schema("streetAddress");


    public static Shape Location() {
        return shape(

                property("Text", XSD.STRING, optional(string())),

                property(Place, optional(Place())),
                property(PostalAddress, optional(PostalAddress())),
                property(VirtualLocation, optional(VirtualLocation()))

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
        return shape(PostalAddress, Thing(),

                property(addressCountry, optional(Resource())),
                property(addressRegion, optional(Resource())),
                property(addressLocality, optional(Resource())),

                property(postalCode, optional(string())),
                property(streetAddress, optional(string())),

                property(email, optional(string())),
                property(telephone, optional(string()))

        );
    }

    public static Shape VirtualLocation() {
        return shape(VirtualLocation, Thing(),

                property(url, required())

        );
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static void main(final String... args) {
        exec(() -> create(Context, Schema.class,
                Thing(),
                Organization(),
                Location(),
                Place(),
                PostalAddress(),
                VirtualLocation()
        ));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public Schema() {
        delegate(handler(new Driver(Dataset(Thing())), new Worker()

                .get(new Relator(frame(

                        field(ID, iri()),
                        field(RDFS.LABEL, literal("Schema Things", "en")),

                        field(RDFS.MEMBER, query(

                                frame(

                                        field(ID, iri()),
                                        field(RDFS.LABEL, literal("", ANY_LOCALE))

                                )

                        ))

                )))

        ));
    }
}
