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

package eu.ec2u.data.things;

import com.metreeca.mesh.meta.jsonld.Frame;
import com.metreeca.mesh.meta.jsonld.Namespace;
import com.metreeca.mesh.meta.shacl.MaxLength;

import eu.ec2u.data.resources.Localized;
import eu.ec2u.data.resources.Reference;
import eu.ec2u.data.taxonomies.Topic;

import java.net.URI;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Frame
@Namespace(prefix="[schema]", value="https://schema.org/")
public interface SchemaThing extends Reference {

    int NAME_LENGTH=100;
    int DESCRIPTION_LENGTH=10_000;
    int DISAMBIGUATING_DESCRIPTION_LENGTH=500;


    Set<URI> url();

    String identifier(); // single strinug value for compatibility with org:Organization


    @Localized
    @MaxLength(NAME_LENGTH)
    Map<Locale, String> name();

    @Localized
    @MaxLength(DESCRIPTION_LENGTH)
    Map<Locale, String> description();

    @Localized
    @MaxLength(DISAMBIGUATING_DESCRIPTION_LENGTH)
    Map<Locale, String> disambiguatingDescription();


    Set<Topic> about();

    SchemaImageObject image();

}
