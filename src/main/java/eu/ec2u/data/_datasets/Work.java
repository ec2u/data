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

package eu.ec2u.data._datasets;

import com.metreeca.mesh.Frame;

import eu.ec2u.data._assets.License;

import static com.metreeca.mesh.Text.text;
import static com.metreeca.mesh.Values.set;
import static com.metreeca.mesh.Values.uri;
import static com.metreeca.mesh.bean.Beans.bean;
import static com.metreeca.mesh.bean.Beans.frame;

public final class Work {

    public static void main(final String... args) {

        // </> a void:Dataset ;
        //     void:rootResource void:Dataset ;

        final Dataset catalog=bean(Dataset.class)

                .setPath(uri("/"))

                .setTitle(set(
                        text("EC2U Dataset Catalog", "en")
                ))

                .setAlternative(set(
                        text("EC2U Datasets", "en")
                ))

                .setDescription(set(
                        text("Datasets published on the EC2U Knowledge Hub.", "en")
                ))

                .setRights("Copyright © 2022-2024 EC2U Alliance")

                .setIsDefinedBy(uri("/datasets/"))

                .setLicenses(set(
                        License.CCBYNCND40()
                ));

        final Frame frame=frame(catalog);

        frame.validate(true)
                .ifPresent(trace -> System.out.println(trace));

        System.out.println(catalog);

    }

}
