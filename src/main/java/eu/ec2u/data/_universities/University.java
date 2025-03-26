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
import com.metreeca.flow.handlers.Worker;
import com.metreeca.flow.json.handlers.Relator;
import com.metreeca.mesh.meta.jsonld.Frame;
import com.metreeca.mesh.meta.jsonld.Internal;
import com.metreeca.mesh.meta.jsonld.Namespace;
import com.metreeca.mesh.meta.shacl.Required;

import eu.ec2u.data._organizations.OrgFormalOrganization;
import eu.ec2u.data._resources.GeoReference;
import eu.ec2u.data._resources.Resource;

import java.time.ZoneId;
import java.util.Locale;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.mesh.Value.array;
import static com.metreeca.mesh.meta.Values.model;
import static com.metreeca.mesh.meta.Values.value;
import static com.metreeca.mesh.util.Collections.map;
import static com.metreeca.mesh.util.Locales.ANY_LOCALE;
import static com.metreeca.mesh.util.URIs.uri;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data._resources.Localized.EN;
import static eu.ec2u.data._resources.Localized.IT;
import static eu.ec2u.data._universities.UniversityFrame.University;
import static java.util.Map.entry;

@Frame
@Namespace("[ec2u]")
public interface University extends Resource, OrgFormalOrganization {

    University Pavia=University()
            .id(Universities.ID.resolve("pavia"))
            .prefLabel(map(
                    entry(EN, "University of Pavia"),
                    entry(IT, "Università di Pavia")
            ))
            .locale(IT)
            .zone(ZoneId.of("Europe/Rome"));


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Required
    GeoReference city();

    @Required
    GeoReference country();


    @Internal
    Locale locale();

    @Internal
    ZoneId zone();


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    static void main(final String... args) {
        exec(() -> service(store()).update((array(
                value(Pavia)
        )), true));
    }

    static Handler handler() {
        return new Worker().get(new Relator(model(University()

                .id(uri())
                .label(map(entry(ANY_LOCALE, "")))

        )));
    }

}
