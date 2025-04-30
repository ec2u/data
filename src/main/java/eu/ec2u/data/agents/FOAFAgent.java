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

package eu.ec2u.data.agents;

import com.metreeca.mesh.meta.jsonld.Class;
import com.metreeca.mesh.meta.jsonld.Frame;
import com.metreeca.mesh.meta.jsonld.Namespace;
import com.metreeca.mesh.meta.shacl.Pattern;

import eu.ec2u.data.resources.Reference;

import java.net.URI;
import java.util.Set;

@Frame
@Class("foaf:Agent")
@Namespace(prefix="[foaf]", value="http://xmlns.com/foaf/0.1/")
public interface FOAFAgent extends Reference {

    @Pattern("^https?://\\S+$")
    Set<URI> depiction();

    @Pattern("^https?://\\S+$")
    Set<URI> homepage();


    @Pattern("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")
    Set<String> mbox();

    @Pattern("^\\+?[1-9]\\d{1,14}$")
    Set<String> phone();

}
