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

package eu.ec2u.data._resources;

import com.metreeca.mesh.meta.jsonld.Frame;
import com.metreeca.mesh.meta.jsonld.Namespace;
import com.metreeca.mesh.meta.jsonld.Property;
import com.metreeca.mesh.meta.shacl.Required;

import eu.ec2u.data._assets.License;

import java.time.LocalDate;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Frame
@Namespace(prefix="[dct]", value="http://purl.org/dc/terms/")
public interface DCDescription {

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

    Map.Entry<Locale, String> accessRights();

    @Property("license")
    Set<License> licenses();

}
