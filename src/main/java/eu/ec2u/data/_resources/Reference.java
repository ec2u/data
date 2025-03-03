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

import com.metreeca.mesh.bean.jsonld.Id;
import com.metreeca.mesh.bean.jsonld.Namespace;
import com.metreeca.mesh.bean.jsonld.Property;
import com.metreeca.mesh.bean.shacl.MaxLength;
import com.metreeca.mesh.bean.shacl.Required;

import java.beans.JavaBean;
import java.net.URI;
import java.util.Locale;
import java.util.Map;

@JavaBean
@Namespace(prefix="rdfs", value="http://www.w3.org/2000/01/rdf-schema#")
public interface Reference {

    int LabelLength=100;
    int CommentLength=1000;


    @Id
    URI getId();


    @Required
    @Localized
    @MaxLength(LabelLength)
    @Property("rdfs:")
    Map<Locale, String> getLabel();

    @Localized
    @MaxLength(CommentLength)
    @Property("rdfs:")
    Map<Locale, String> getComment();

}
