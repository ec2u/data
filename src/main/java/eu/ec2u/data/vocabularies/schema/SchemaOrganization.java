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

package eu.ec2u.data.vocabularies.schema;

import com.metreeca.mesh.meta.jsonld.Class;
import com.metreeca.mesh.meta.jsonld.Frame;
import com.metreeca.mesh.meta.shacl.Pattern;

import java.util.Locale;
import java.util.Map;
import java.util.Set;

import static eu.ec2u.data.datasets.Reference.EMAIL_PATTERN;
import static eu.ec2u.data.datasets.Reference.PHONE_PATTERN;

@Frame
@Class("schema:Organization")
public interface SchemaOrganization extends SchemaThing {

    Map<Locale, String> legalName();

    @Pattern(EMAIL_PATTERN)
    Set<String> email();

    @Pattern(PHONE_PATTERN)
    Set<String> telephone();


    SchemaLocation location();

}
