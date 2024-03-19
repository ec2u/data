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

package eu.ec2u.data;

import com.metreeca.http.handlers.Delegator;
import com.metreeca.http.handlers.Router;

import eu.ec2u.data.concepts.Concepts;
import eu.ec2u.data.datasets.Datasets;
import eu.ec2u.data.documents.Documents;
import eu.ec2u.data.events.Events;
import eu.ec2u.data.offers.courses.Courses;
import eu.ec2u.data.offers.programs.Programs;
import eu.ec2u.data.resources.Resources;
import eu.ec2u.data.units.Units;
import eu.ec2u.data.universities.Universities;
import eu.ec2u.data.universities._Universities;
import org.eclipse.rdf4j.model.IRI;

import java.util.regex.Pattern;

import static com.metreeca.http.Locator.service;
import static com.metreeca.http.jsonld.formats.JSONLD.store;
import static com.metreeca.http.rdf.Values.iri;
import static com.metreeca.http.toolkits.Identifiers.md5;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.datasets.Datasets.Dataset;


public final class EC2U extends Delegator {

    public static final String Base="https://data.ec2u.eu/";
    public static final String Terms=Base+"terms/";

    private static final Pattern MD5Pattern=Pattern.compile("[a-f0-9]{32}");


    public static IRI item(final String name) {
        return iri(Base, name);
    }

    public static IRI term(final String name) {
        return iri(Terms, name);
    }


    public static IRI item(final IRI dataset, final String name) {
        return iri(dataset, "/"+(MD5Pattern.matcher(name).matches() ? name : md5(name)));
    }

    public static IRI item(final IRI dataset, final _Universities university, final String name) {
        return iri(dataset, "/"+(MD5Pattern.matcher(name).matches() ? name : md5(university.Id+"@"+name)));
    }


    public static void main(final String... args) {

        // Actors.main();
        // Agents.main();
        // Concepts.main();
        Datasets.main();
        // Documents.main();
        // Events.main();
        // Locations.main();
        // Offers.main();
        // Courses.main();
        // Programs.main();
        // Organizations.main();
        // Persons.main();
        // Resources.main();
        // Schema.main();
        // Units.main();
        // Universities.main();

        // EuroSciVoc.main();
        // ISCED2011.main();
        // ISCEDF2013.main();
        // UnitTypes.main();

        exec(() -> service(store()).validate(

                // FOAFAgent(),
                //
                // ConceptScheme(),
                // Concept(),
                // SKOSConceptScheme(),
                // SKOSConcept(),

                Dataset()

                // Document(),
                //
                // Event(),
                //
                // Program(),
                // Course(),
                //
                // OrgOrganization(),
                // OrgFormalOrganization(),
                // OrgOrganizationalUnit(),
                //
                // Person(),
                // FOAFPerson(),
                //
                // Resource(),
                // Publisher(),
                //
                // Schema.Thing(),
                // Schema.Organization(),
                // Schema.Event(),
                // Schema.Place(),
                // Schema.PostalAddress(),
                // Schema.VirtualLocation(),
                // Schema.ContactPoint(),
                //
                // Unit(),

                // University()

        ));

    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public EC2U() {
        delegate(new Router()

                .path("/", new Datasets())
                .path("/resources/", new Resources())

                .path("/universities/*", new Universities())

                .path("/units/*", new Units())
                .path("/programs/*", new Programs())
                .path("/courses/*", new Courses())
                .path("/documents/*", new Documents())

                .path("/events/*", new Events())

                .path("/concepts/*", new Concepts())
        );
    }

}
