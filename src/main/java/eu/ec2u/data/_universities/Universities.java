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

package eu.ec2u.data._universities;

import com.metreeca.flow.Handler;
import com.metreeca.flow.handlers.Router;
import com.metreeca.flow.handlers.Worker;
import com.metreeca.flow.json.handlers.Relator;
import com.metreeca.mesh.meta.jsonld.Frame;
import com.metreeca.mesh.meta.jsonld.Namespace;
import com.metreeca.mesh.meta.jsonld.Virtual;

import eu.ec2u.data._datasets.Dataset;

import java.net.URI;
import java.util.Locale;
import java.util.Map;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.mesh.meta.Record.model;
import static com.metreeca.mesh.meta.Record.value;
import static com.metreeca.mesh.queries.Query.query;
import static com.metreeca.mesh.util.Collections.*;
import static com.metreeca.mesh.util.Locales.ANY;
import static com.metreeca.mesh.util.URIs.uri;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data._resources.Localized.EN;
import static eu.ec2u.data._universities.UniversitiesRecord.Universities;
import static eu.ec2u.data._universities.University.university;
import static eu.ec2u.data._universities.UniversityRecord.University;

@Frame
@Virtual
@Namespace("[ec2u]")
public interface Universities extends Dataset<University> {

    // !!! public static final IRI Context=item("/universities/");

    URI ID=uri("/universities/");


    @Override
    default URI id() {
        return ID;
    }


    @Override
    default Map<Locale, String> title() {
        return map(entry(EN, "EC2U Allied Universities"));
    }

    @Override
    default Map<Locale, String> alternative() {
        return map(entry(EN, "EC2U Universities"));
    }

    @Override
    default Map<Locale, String> description() {
        return map(entry(EN, "Background information about EC2U allied universities."));
    }


    // !!! dct:publisher <https://ec2u.eu/> ;
    // !!! dct:license <http://creativecommons.org/licenses/by-nc-nd/4.0/> ;
    // !!! dct:rights "Copyright © 2022-2025 EC2U Alliance" ;
    // !!! dct:issued "2022-01-01"^^xsd:date ;
    // !!! void:rootResource ec2u:University ;
    // !!! rdfs:isDefinedBy </datasets/universities> .


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    static void main(final String... args) {
        exec(() -> service(store()).update(value(Universities()), true));
    }

    static Handler universities() {
        return new Router()

                .path("/", new Worker().get(new Relator(model(Universities()

                        .id(uri())
                        .label(map(entry(ANY, "")))

                        .members(stash(query()

                                .model(model(University()

                                        .id(uri())
                                        .label(map(entry(ANY, "")))

                                ))

                        ))

                ))))

                .path("/{code}", university());
    }

}
