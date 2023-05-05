/*
 * Copyright © 2020-2023 EC2U Alliance
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

import com.metreeca.link.jsonld.Namespace;
import com.metreeca.link.jsonld.Property;

import java.net.URI;
import java.util.Set;


@Namespace("http://xmlns.com/foaf/0.1/")
public interface FOAFAgent {

    @Property("homepage")
    public Set<URI> getHomepages();

    @Property("mbox")
    public Set<URI> getMboxes();

}
