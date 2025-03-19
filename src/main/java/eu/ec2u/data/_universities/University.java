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

package eu.ec2u.data._universities;

import com.metreeca.mesh.mint.jsonld.Frame;
import com.metreeca.mesh.mint.jsonld.Namespace;
import com.metreeca.mesh.mint.jsonld.Type;
import com.metreeca.mesh.mint.shacl.Required;

import eu.ec2u.data._organizations.FormalOrganization;
import eu.ec2u.data._resources.GeoReference;

import java.net.URI;

import static eu.ec2u.data._universities.UniversityFrame.University;

@Frame
@Namespace("ec2u:")
@Type
public interface University extends FormalOrganization {

    University Pavia=University()
            .id(URI.create("")) // !!! string
            // .locale(Locale.ITALIAN)
            // .zone(ZoneId.of("Europe/Rome"))
            ;


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Required
    GeoReference city();

    @Required
    GeoReference country();


    // Locale locale(); // !!! don't map to value

    // ZoneId zone();  // !!! don't map to value

}
