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

package eu.ec2u.data.datasets.universities;

import com.metreeca.flow.http.handlers.Delegator;
import com.metreeca.flow.http.handlers.Router;
import com.metreeca.flow.http.handlers.Worker;
import com.metreeca.flow.json.handlers.Driver;
import com.metreeca.flow.lod.Wikidata;
import com.metreeca.flow.rdf.Rover;
import com.metreeca.flow.rdf4j.actions.GraphQuery;
import com.metreeca.mesh.meta.jsonld.Frame;
import com.metreeca.mesh.meta.jsonld.Namespace;
import com.metreeca.shim.Locales;

import eu.ec2u.data.Data;
import eu.ec2u.data.datasets.Datasets;
import eu.ec2u.data.datasets.GeoReferenceFrame;
import eu.ec2u.data.datasets.Reference;
import eu.ec2u.data.datasets.organizations.Organizations;
import org.eclipse.rdf4j.model.Value;

import java.time.LocalDate;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Stream;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.flow.rdf.Rover.rover;
import static com.metreeca.mesh.Value.array;
import static com.metreeca.mesh.Value.value;
import static com.metreeca.mesh.queries.Query.query;
import static com.metreeca.shim.Collections.*;
import static com.metreeca.shim.Resources.resource;
import static com.metreeca.shim.Resources.text;
import static com.metreeca.shim.Streams.concat;
import static com.metreeca.shim.Strings.fill;
import static com.metreeca.shim.URIs.term;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.datasets.Datasets.DATASETS;
import static eu.ec2u.data.datasets.Localized.EN;
import static eu.ec2u.data.datasets.Localized.LOCALES;
import static eu.ec2u.data.datasets.universities.University.PARTNERS;
import static eu.ec2u.data.datasets.universities.University.review;
import static java.util.stream.Collectors.joining;

@Frame
@Namespace("[ec2u]")
public interface Universities extends Organizations {

    UniversitiesFrame UNIVERSITIES=new UniversitiesFrame()
            .id(Data.DATA.resolve("universities/"))
            .isDefinedBy(Data.DATA.resolve("datasets/universities"))
            .title(map(entry(EN, "EC2U Partner Universities")))
            .alternative(map(entry(EN, "EC2U Universities")))
            .description(map(entry(EN, """
                    Background, historical context and statistical data about EC2U partner universities.
                    """)))
            .publisher(Organizations.EC2U)
            .rights(Datasets.COPYRIGHT)
            .license(set(Datasets.CCBYNCND40))
            .issued(LocalDate.parse("2022-01-01"));


    static void main(final String... args) {
        exec(() -> exec(() -> {

            final Rover wikidata=rover(Stream.of(text(resource(Universities.class, ".qlt")))

                    .map(query -> fill(query, map(

                            entry("universities", PARTNERS.stream()
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
                            .repository(Wikidata.repository())
                    )

                    .toList()
            );

            service(store()).modify(

                    array(list(Stream.concat(

                            Stream.of(UNIVERSITIES),

                            PARTNERS.stream().flatMap(university -> {

                                final Rover focus=wikidata.focus(university.seeAlso().stream().findFirst().orElseThrow());
                                final Rover city=focus.traverse(term("city"));
                                final Rover country=focus.traverse(term("country"));

                                final Optional<Wikidata.Point> coordinates=focus
                                        .traverse(term("coordinates"))
                                        .value(Value::stringValue)
                                        .flatMap(Wikidata::point);

                                final Optional<Wikidata.Point> cityCoordinates=city
                                        .traverse(term("coordinates"))
                                        .value(Value::stringValue)
                                        .flatMap(Wikidata::point);

                                final Optional<Wikidata.Point> countyCoordinates=country
                                        .traverse(term("coordinates"))
                                        .value(Value::stringValue)
                                        .flatMap(Wikidata::point);

                                final GeoReferenceFrame cityFrame=new GeoReferenceFrame()
                                        .id(city.uri().orElse(null))
                                        .label(map(city.traverse(term("name")).texts().filter(Reference::local)))
                                        .longitude(cityCoordinates.map(Wikidata.Point::longitude).orElse(0.0D))
                                        .latitude(cityCoordinates.map(Wikidata.Point::latitude).orElse(0.0D));

                                final GeoReferenceFrame countryFrame=new GeoReferenceFrame()
                                        .id(country.uri().orElse(null))
                                        .label(map(country.traverse(term("name")).texts().filter(Reference::local)))
                                        .longitude(countyCoordinates.map(Wikidata.Point::longitude).orElse(0.0D))
                                        .latitude(coordinates.map(Wikidata.Point::latitude).orElse(0.0D));

                                final Optional<UniversityFrame> universityFrame=review(university
                                        .students(focus.traverse(term("students")).number(Number::intValue).orElse(0))
                                        .inception(focus.traverse(term("inception")).year().orElse(null))
                                        .longitude(coordinates.map(Wikidata.Point::longitude).orElse(0.0D))
                                        .latitude(coordinates.map(Wikidata.Point::latitude).orElse(0.0D))
                                        .city(cityFrame)
                                        .country(countryFrame)
                                );

                                return concat(
                                        universityFrame.stream(),
                                        Stream.of(cityFrame),
                                        Stream.of(countryFrame)
                                );
                            })

                    ))),

                    value(query(new UniversityFrame(true)))

            );

        }));
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override
    default Datasets dataset() {
        return DATASETS;
    }

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
