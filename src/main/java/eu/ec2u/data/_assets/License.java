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

package eu.ec2u.data._assets;

import com.metreeca.mesh.Text;

import eu.ec2u.data._resources.Reference;

import java.beans.JavaBean;
import java.net.URI;
import java.util.Set;

import static com.metreeca.mesh.Text.text;
import static com.metreeca.mesh.Values.set;
import static com.metreeca.mesh.Values.uri;
import static com.metreeca.mesh.bean.Beans.bean;

@JavaBean
public interface License extends Reference {

    static License CCBYNCND40() {

        return bean(License.class)
                .setId(uri("https://creativecommons.org/licenses/by-nc-nd/4.0/"))
                .setLabel(set(text("CC BY-NC-ND 4.0")))
                .setComment(set(text("Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International", "en")));

    }

    ;


    License setId(URI id);

    License setLabel(Set<Text> label);

    License setComment(Set<Text> comment);

}
