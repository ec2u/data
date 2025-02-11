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

import com.metreeca.mesh.Text;
import com.metreeca.mesh.bean.jsonld.Base;
import com.metreeca.mesh.bean.jsonld.Id;
import com.metreeca.mesh.bean.jsonld.Namespace;
import com.metreeca.mesh.bean.jsonld.Property;
import com.metreeca.mesh.bean.shacl.MaxLength;
import com.metreeca.mesh.bean.shacl.Optional;
import com.metreeca.mesh.bean.shacl.Required;

import java.beans.JavaBean;
import java.net.URI;
import java.util.Set;

@JavaBean
@Base("https://data.ec2u.eu/")
@Namespace(prefix="ec2u", value="/terms/")
@Namespace(prefix="rdfs", value="http://www.w3.org/2000/01/rdf-schema#")
public interface Resource<T extends Resource<T>> {

    @Id
    URI getId();


    @Required
    @Label
    @MaxLength(100)
    @Property("rdfs:")
    Set<Text> getLabel();

    @Optional
    @Localized
    @MaxLength(1000)
    @Property("rdfs:")
    Set<Text> getComment();


    @Property("rdfs:")
    URI getIsDefinedBy();

    T setIsDefinedBy(URI isDefinedBy);


    @Property("rdfs:")
    Set<URI> getSeeAlso();

    T setSeeAlso(Set<URI> seeAlso);


    @Property("ec2u:generated")
    default boolean isGenerated() { return false; }

}
