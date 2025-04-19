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

package eu.ec2u.data._assets;

import com.metreeca.mesh.meta.jsonld.Class;
import com.metreeca.mesh.meta.jsonld.Frame;
import com.metreeca.mesh.meta.jsonld.Namespace;
import com.metreeca.mesh.meta.shacl.Required;

import eu.ec2u.data._concepts.SKOSConcept;
import eu.ec2u.data._organizations.OrgOrganization;
import eu.ec2u.data._resources.Localized;
import eu.ec2u.data._resources.Reference;
import eu.ec2u.data._resources.ReferenceFrame;
import eu.ec2u.data._resources.Resource;

import java.net.URI;
import java.time.LocalDate;
import java.util.Locale;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;
import java.util.stream.Stream;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.flow.toolkits.Strings.clip;
import static com.metreeca.mesh.tools.Store.Options.FORCE;

import static eu.ec2u.data.Data.exec;
import static java.util.Locale.ROOT;
import static java.util.stream.Collectors.toMap;

@Frame
@Class("ec2u:")
@Namespace(prefix="[dct]", value="http://purl.org/dc/terms/")
public interface Asset extends Resource {

    ReferenceFrame CCBYNCND40=new ReferenceFrame()
            .id(URI.create("https://creativecommons.org/licenses/by-nc-nd/4.0/"))
            .label(Map.of(ROOT, "CC BY-NC-ND 4.0"))
            .comment(Map.of(ROOT, "Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International"));


    static void main(final String... args) {
        exec(() -> service(store()).update(CCBYNCND40, FORCE));
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override
    default Map<Locale, String> label() {
        return title(); // !!! merge alternative / clip
    }

    @Override
    default Map<Locale, String> comment() {
        return Stream.ofNullable(description())
                .flatMap(description -> description.entrySet().stream())
                .collect(toMap(Entry::getKey, entry -> clip(entry.getValue())));
    }


    @Required
    @Localized
    Map<Locale, String> title();

    @Localized
    Map<Locale, String> alternative();

    @Localized
    Map<Locale, String> description();


    LocalDate created();

    LocalDate issued();

    LocalDate modified();


    String rights();

    Entry<Locale, String> accessRights();


    OrgOrganization publisher();

    Reference source();

    Set<Reference> license();

    Set<SKOSConcept> subject();

}
