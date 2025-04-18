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

import com.metreeca.flow.handlers.Delegator;
import com.metreeca.flow.handlers.Router;
import com.metreeca.flow.handlers.Worker;
import com.metreeca.flow.json.actions.Validate;
import com.metreeca.flow.json.handlers.Relator;
import com.metreeca.flow.work.Xtream;
import com.metreeca.mesh.Value;
import com.metreeca.mesh.meta.jsonld.Frame;
import com.metreeca.mesh.meta.jsonld.Namespace;
import com.metreeca.mesh.meta.jsonld.Virtual;

import eu.ec2u.data._datasets.Dataset;
import eu.ec2u.data._datasets.DatasetFrame;
import eu.ec2u.data._organizations.OrgOrganization;
import eu.ec2u.data._resources.Catalog;
import eu.ec2u.data._resources.Reference;

import java.net.URI;
import java.time.LocalDate;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.mesh.Value.array;
import static com.metreeca.mesh.queries.Query.query;
import static com.metreeca.mesh.tools.Store.Options.FORCE;
import static com.metreeca.mesh.util.Collections.*;
import static com.metreeca.mesh.util.Locales.ANY;
import static com.metreeca.mesh.util.URIs.uri;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.__._EC2U.DATA;
import static eu.ec2u.data.__._EC2U.EC2U;
import static eu.ec2u.data._datasets.Datasets.DATASETS;
import static eu.ec2u.data._resources.Localized.EN;
import static eu.ec2u.data._universities.UniversitiesFrame.model;

@Frame
@Virtual
@Namespace("[ec2u]")
public interface Universities extends Dataset, Catalog<University> {

    URI UNIVERSITIES=DATA.resolve("/universities/");


    static void main(final String... args) {
        exec(() -> {

            final Value update=array(list(Xtream.of(new UniversitiesFrame())

                    .map(UniversitiesFrame::value)
                    .optMap(new Validate())

            ));

            service(store()).partition(UNIVERSITIES).update(update, FORCE);

        });
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////


    @Override
    default URI id() {
        return UNIVERSITIES;
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

    @Override
    default URI isDefinedBy() {
        return DATASETS.resolve("universities");
    }


    @Override
    default LocalDate issued() {
        return LocalDate.parse("2022-01-01");
    }

    @Override
    default String rights() {
        return "Copyright © 2022‑2025 EC2U Alliance";
    }

    @Override
    default OrgOrganization publisher() {
        return EC2U;
    }

    @Override
    default Set<Reference> license() {
        return set(CCBYNCND40);
    }


    @Override // !!! remove
    default Dataset dataset() { return new DatasetFrame(); }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    final class Handler extends Delegator {

        public Handler() {
            delegate(new Router()

                    .path("/", new Worker().get(new Relator(model(new UniversitiesFrame()

                            .id(uri())
                            .label(map(entry(ANY, "")))

                            .members(stash(query()

                                    .model(UniversityFrame.model(new UniversityFrame()

                                            .id(uri())
                                            .label(map(entry(ANY, "")))

                                    ))

                            ))

                    ))))

                    .path("/{code}", new University.Handler())

            );
        }

    }

}
