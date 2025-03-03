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

import com.metreeca.mesh.bean.jsonld.Namespace;
import com.metreeca.mesh.bean.jsonld.Property;
import com.metreeca.mesh.bean.jsonld.Type;
import com.metreeca.mesh.bean.shacl.Required;

import eu.ec2u.data._resources.Localized;
import eu.ec2u.data._resources.Resource;

import java.beans.JavaBean;
import java.net.URI;
import java.time.LocalDate;
import java.util.Locale;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;
import java.util.stream.Stream;

import static com.metreeca.flow.toolkits.Strings.clip;

import static java.util.stream.Collectors.toMap;

@JavaBean
@Type("ec2u:")
@Namespace("http://purl.org/dc/terms/")
public interface Asset<T extends Asset<T>> extends Resource<T> {

    T setId(URI id);


    @Override
    default Map<Locale, String> getLabel() {
        return getTitle(); // !!! merge alternative / clip
    }

    @Override
    default Map<Locale, String> getComment() {
        return Stream.ofNullable(getDescription())
                .flatMap(description -> description.entrySet().stream())
                .collect(toMap(Entry::getKey, entry -> clip(entry.getValue())));
    }


    @Required
    @Localized
    Map<Locale, String> getTitle();

    T setTitle(Map<Locale, String> title);


    @Localized
    Map<Locale, String> getAlternative();

    T setAlternative(Map<Locale, String> alternative);


    @Localized
    Map<Locale, String> getDescription();

    T setDescription(Map<Locale, String> description);


    LocalDate getCreated();

    T setCreated(LocalDate created);


    LocalDate getIssued();

    T setIssued(LocalDate issued);


    LocalDate getModified();

    T setModified(LocalDate modified);


    String getRights();

    T setRights(String rights);


    Entry<Locale, String> getAccessRights();

    T setAccessRights(Entry<Locale, String> accessRights);


    @Property("license")
    Set<License> getLicenses();

    T setLicenses(Set<License> licenses);

}
