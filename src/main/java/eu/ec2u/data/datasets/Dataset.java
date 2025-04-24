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

package eu.ec2u.data.datasets;

import com.metreeca.mesh.meta.jsonld.*;
import com.metreeca.mesh.meta.jsonld.Class;

import eu.ec2u.data.assets.Asset;
import eu.ec2u.data.organizations.OrgOrganization;
import eu.ec2u.data.resources.Reference;
import eu.ec2u.data.resources.Resource;

import java.util.Set;

import static com.metreeca.mesh.util.Collections.set;

import static eu.ec2u.data.EC2U.COPYRIGHT;
import static eu.ec2u.data.EC2U.EC2U;

@Frame
@Class
@Namespace("[ec2u]")
public interface Dataset extends Asset, VOIDDataset {

    @Override
    default Dataset dataset() { return new DatasetsFrame(); }


    @Override
    default String rights() {
        return COPYRIGHT;
    }

    @Override
    default OrgOrganization publisher() {
        return EC2U;
    }

    @Override
    default Set<Reference> license() {
        return set(CCBYNCND40);
    }


    @Hidden
    @Foreign
    @Reverse("ec2u:dataset")
    Set<Resource> resources();

}
