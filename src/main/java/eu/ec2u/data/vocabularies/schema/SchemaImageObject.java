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
import com.metreeca.mesh.meta.shacl.MaxCount;
import com.metreeca.mesh.meta.shacl.MinCount;

import java.net.URI;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Frame
@Class("schema:ImageObject")
public interface SchemaImageObject extends SchemaThing {

    @Override
    @MinCount(1)
    @MaxCount(1)
    Set<URI> url();


    Map<Locale, String> caption();

    String author();

    String copyrightNotice();

}
