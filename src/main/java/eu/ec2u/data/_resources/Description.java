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
import com.metreeca.mesh.meta.shacl.Required;

import eu.ec2u.data._concepts.SKOSConcept;
import eu.ec2u.data._organizations.OrgOrganization;

import java.net.URI;
import java.time.LocalDate;
import java.util.Locale;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;

import static eu.ec2u.data._resources.ReferenceFrame.Reference;
import static java.util.Locale.ROOT;

@Frame
@Namespace(prefix="[dct]", value="http://purl.org/dc/terms/")
public interface Description {

    Reference CCBYNCND40=Reference()
            .id(URI.create("https://creativecommons.org/licenses/by-nc-nd/4.0/"))
            .label(Map.of(ROOT, "CC BY-NC-ND 4.0"))
            .comment(Map.of(ROOT, "Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International"));


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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
