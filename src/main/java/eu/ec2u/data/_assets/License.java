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

import eu.ec2u.data._resources.Resource;

import java.beans.JavaBean;

@JavaBean
public interface License extends Resource {

    License CCBYNCND40=null; // !!!

    // License CCBYNCND40=new License() {
    //
    //     @Override
    //     public URI getId() {
    //         return uri("https://creativecommons.org/licenses/by-nc-nd/4.0/");
    //     }
    //
    //     @Override
    //     public Set<Text> getLabel() {
    //         return set(text("CC BY-NC-ND 4.0"));
    //     }
    //
    //     @Override
    //     public Set<Text> getComment() {
    //         return set(text("Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International", "en"));
    //     }
    //
    // };

}
