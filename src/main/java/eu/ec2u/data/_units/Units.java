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

package eu.ec2u.data._units;

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
import eu.ec2u.data._datasets.Datasets;
import eu.ec2u.data._datasets.DatasetsFrame;
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
import static eu.ec2u.data._EC2U.EC2U;
import static eu.ec2u.data._resources.Localized.EN;
import static eu.ec2u.data._units.UnitFrame.Unit;
import static eu.ec2u.data._units.UnitFrame.model;
import static eu.ec2u.data._units.UnitsFrame.Units;
import static eu.ec2u.data._units.UnitsFrame.model;

@Frame
@Virtual
@Namespace("[ec2u]")
public interface Units extends Dataset, Catalog<Unit> {

    static void main(final String... args) {
        exec(() -> {

            final Value update=array(list(Xtream.of(Units())

                    .map(UnitsFrame::value)
                    .optMap(new Validate())

            ));

            service(store()).update(update, FORCE);

        });
    }

    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // </concepts/research-topics> a skos:ConceptScheme ;
    //     dct:issued "2024-01-01"^^xsd:date ;
    //     dct:title "EC2U Research Unit Topics"@en ;
    //     dct:description "> [!WARNING]\n> To be migrated to [EuroSCiVoc](euroscivoc)"@en ;
    //     dct:rights "Copyright © 2022‑2025 EC2U Alliance" .


    URI ID=uri("/units/");


    @Override
    default URI id() {
        return ID;
    }


    @Override
    default Map<Locale, String> title() {
        return map(entry(EN, "EC2U Research Units and Facilities"));
    }

    @Override
    default Map<Locale, String> alternative() {
        return map(entry(EN, "EC2U Units"));
    }

    @Override
    default Map<Locale, String> description() {
        return map(entry(EN, """
                Identifying and background information about research and innovation units and supporting structures
                at EC2U allied universities."""
        ));
    }

    @Override
    default URI isDefinedBy() {
        return Datasets.ID.resolve("units");
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


    @Override
    default Dataset dataset() { return DatasetsFrame.Datasets(); }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    final class Handler extends Delegator {

        public Handler() {
            delegate(new Router()

                    .path("/", new Worker().get(new Relator(model(Units()

                            .id(uri())
                            .label(map(entry(ANY, "")))

                            .members(stash(query()

                                    .model(model(Unit()

                                            .id(uri())
                                            .label(map(entry(ANY, "")))

                                    ))

                            ))

                    ))))

                    .path("/{code}", new Unit.Handler())
            );
        }

    }

}
