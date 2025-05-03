/*
 * Copyright © 2020-2025 EC2U Alliance
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

package eu.ec2u.data.universities;

import com.metreeca.flow.http.handlers.Delegator;
import com.metreeca.flow.http.handlers.Router;
import com.metreeca.flow.http.handlers.Worker;
import com.metreeca.flow.json.handlers.Driver;
import com.metreeca.flow.lod.actions.Wikidata;
import com.metreeca.flow.rdf4j.actions.GraphQuery;
import com.metreeca.flow.rdf4j.services.Graph;
import com.metreeca.mesh.meta.jsonld.Frame;
import com.metreeca.mesh.meta.jsonld.Namespace;
import com.metreeca.mesh.util.Locales;

import eu.ec2u.data.datasets.Dataset;
import eu.ec2u.data.resources.GeoReferenceFrame;
import eu.ec2u.work.Rover;
import org.eclipse.rdf4j.repository.sparql.SPARQLRepository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Stream;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.flow.toolkits.Resources.resource;
import static com.metreeca.flow.toolkits.Resources.text;
import static com.metreeca.mesh.Value.array;
import static com.metreeca.mesh.queries.Query.query;
import static com.metreeca.mesh.util.Collections.*;
import static com.metreeca.mesh.util.Strings.fill;
import static com.metreeca.mesh.util.URIs.term;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.*;
import static eu.ec2u.data.resources.Localized.EN;
import static eu.ec2u.data.resources.Localized.LOCALES;
import static eu.ec2u.data.universities.University.*;
import static eu.ec2u.work.Rover.rover;
import static java.util.stream.Collectors.joining;

@Frame
@Namespace("[ec2u]")
public interface Universities extends Dataset {

    UniversitiesFrame UNIVERSITIES=new UniversitiesFrame()
            .id(DATA.resolve("universities/"))
            .isDefinedBy(DATA.resolve("datasets/universities"))
            .title(map(entry(EN, "EC2U Allied Universities")))
            .alternative(map(entry(EN, "EC2U Universities")))
            .description(map(entry(EN, "Background information about EC2U allied universities.")))
            .publisher(EC2U)
            .rights(COPYRIGHT)
            .license(set(LICENSE))
            .issued(LocalDate.parse("2022-01-01"));

    static void main(final String... args) {
        exec(() -> exec(() -> {

            final Set<UniversityFrame> universities=set(
                    Coimbra(),
                    Iasi(),
                    Jena(),
                    Linz(),
                    Pavia(),
                    Poitiers(),
                    Salamanca(),
                    Turku()
            );

            final Rover wikidata=rover(Stream.of(text(resource(University.class, ".qlt")))

                    .map(query -> fill(query, map(

                            entry("universities", universities.stream()
                                    .map(u -> u.seeAlso().stream().findFirst().orElseThrow())
                                    .map("<%s>"::formatted)
                                    .collect(joining("\n"))
                            ),

                            entry("languages", LOCALES.stream()
                                    .map(Locales::locale)
                                    .map("\"%s\""::formatted)
                                    .collect(joining(", "))
                            )

                    )))

                    .flatMap(new GraphQuery()
                            .graph(new Graph(new SPARQLRepository("https://query.wikidata.org/sparql")))
                    )

                    .toList()
            );

            service(store()).partition(UNIVERSITIES.id()).clear().insert(array(list(Stream.concat(

                    Stream.of(UNIVERSITIES),

                    universities.stream().flatMap(university -> {

                        final Rover focus=wikidata.focus(university.seeAlso().stream().findFirst().orElseThrow());
                        final Rover city=focus.forward(term("city"));
                        final Rover country=focus.forward(term("country"));

                        final Optional<Wikidata.Point> coordinates=focus
                                .forward(term("coordinates"))
                                .lexical()
                                .flatMap(Wikidata::point);

                        final Optional<Wikidata.Point> cityCoordinates=city
                                .forward(term("coordinates"))
                                .lexical()
                                .flatMap(Wikidata::point);

                        final Optional<Wikidata.Point> countyCoordinates=country
                                .forward(term("coordinates"))
                                .lexical()
                                .flatMap(Wikidata::point);

                        final GeoReferenceFrame cityFrame=new GeoReferenceFrame()
                                .id(city.uri().orElse(null))
                                .label(city.forward(term("name")).texts().orElse(null))
                                .longitude(cityCoordinates.map(Wikidata.Point::longitude).orElse(0.0D))
                                .latitude(cityCoordinates.map(Wikidata.Point::latitude).orElse(0.0D));

                        final GeoReferenceFrame countryFrame=new GeoReferenceFrame()
                                .id(country.uri().orElse(null))
                                .label(country.forward(term("name")).texts().orElse(null))
                                .longitude(countyCoordinates.map(Wikidata.Point::longitude).orElse(0.0D))
                                .latitude(coordinates.map(Wikidata.Point::latitude).orElse(0.0D));

                        final UniversityFrame universityFrame=university
                                .students(focus.forward(term("students")).integral().map(Long::intValue).orElse(0))
                                .inception(focus.forward(term("inception")).year().orElse(null))
                                .longitude(coordinates.map(Wikidata.Point::longitude).orElse(0.0D))
                                .latitude(coordinates.map(Wikidata.Point::latitude).orElse(0.0D))
                                .city(cityFrame)
                                .country(countryFrame);

                        return Stream.of(
                                universityFrame,
                                cityFrame,
                                countryFrame
                        );
                    })

            ))));

        }));
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override
    Set<University> members();


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    final class Handler extends Delegator {

        public Handler() {
            delegate(new Router()

                    .path("/", new Worker().get(new Driver(new UniversitiesFrame(true)
                            .members(stash(query(new UniversityFrame(true))))
                    )))

                    .path("/{code}", new Worker().get(new Driver(new UniversityFrame(true))))

            );
        }

    }

}
