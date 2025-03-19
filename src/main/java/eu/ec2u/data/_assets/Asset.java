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

import com.metreeca.mesh.mint.jsonld.Frame;
import com.metreeca.mesh.mint.jsonld.Namespace;
import com.metreeca.mesh.mint.jsonld.Property;
import com.metreeca.mesh.mint.jsonld.Type;
import com.metreeca.mesh.mint.shacl.Required;

import eu.ec2u.data._resources.Localized;
import eu.ec2u.data._resources.Resource;

import java.time.LocalDate;
import java.util.Locale;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;
import java.util.stream.Stream;

import static com.metreeca.flow.toolkits.Strings.clip;

import static java.util.stream.Collectors.toMap;

@Frame
@Type("ec2u:")
@Namespace("http://purl.org/dc/terms/")
public interface Asset extends Resource {

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

    @Property("license")
    Set<License> licenses();

}
