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

package eu.ec2u.data.resources;

import com.metreeca.mesh.meta.jsonld.Frame;
import com.metreeca.mesh.meta.jsonld.Id;
import com.metreeca.mesh.meta.jsonld.Namespace;
import com.metreeca.mesh.meta.jsonld.Type;
import com.metreeca.mesh.meta.shacl.MaxLength;
import com.metreeca.mesh.meta.shacl.Required;

import java.net.URI;
import java.util.Locale;
import java.util.Map;

@Frame
@Namespace(prefix="[rdfs]", value="http://www.w3.org/2000/01/rdf-schema#")
public interface Reference {

    int LABEL_LENGTH=100;
    int COMMENT_LENGTH=1000;


    @Id
    URI id();

    @Type
    String type();


    @Required
    @Localized
    @MaxLength(LABEL_LENGTH)
    Map<Locale, String> label();

    @Localized
    @MaxLength(COMMENT_LENGTH)
    Map<Locale, String> comment();

}
