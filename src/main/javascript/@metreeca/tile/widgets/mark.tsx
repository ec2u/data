/*
 * Copyright © 2020-2023 Metreeca srl
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

import { NodeSpin } from "@metreeca/tile/widgets/spin";
import "highlight.js/styles/github.css";
import React, { useEffect, useState } from "react";
import ReactMarkdown, { uriTransformer } from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import deflist from "remark-deflist";
import remarkFrontmatter from "remark-frontmatter";
import remarkGemoji from "remark-gemoji";
import remarkGfm from "remark-gfm";


/**
 * Creates a Markdown rendering component.
 *
 * @param children either markdown content or an absolute or root-relative URL the Markdown content is to be retrieved from
 */
export function NodeMark({

    children

}: {

    children: string

}) {

    const [status, setStatus]=useState<number>();
    const [content, setContent]=useState<string>();

    useEffect(() => {

        const match=children.match(/^((?:\w+:|\/)[^#\s]+)(?:#([^\s]*))?$/); // absolute or root-relative URL

        if ( match ) {

            setStatus(undefined);
            setContent(undefined);

            const path=match[1];
            const hash=match[2];

            const url=path.endsWith(".md") ? path
                : path.endsWith("/") ? `${path}index.md`
                    : `${path}.md`;

            const controller=new AbortController();

            fetch(url, { signal: controller.signal })

                .then(response => response.text().then(content => {

                    setStatus(response.status);
                    setContent(response.ok ? content : undefined);

                }))

                .then(() => {

                    if ( hash ) {
                        document.getElementById(hash)?.scrollIntoView(); // scroll to anchor
                    }

                })

                .catch(() => {});

            return () => controller.abort(); // cancel pending fetch request on component unmount

        } else {

            setStatus(200);
            setContent(children);

            return () => {};

        }

    }, [children]);

    return content ? <ReactMarkdown

            remarkPlugins={[remarkFrontmatter, remarkGfm, remarkGemoji, deflist]}
            rehypePlugins={[rehypeSlug, rehypeHighlight]}

            transformLinkUri={href => [uriTransformer(href)]
                .map(value => value.endsWith("/index.md") ? value.substring(0, value.length-"/index.md".length) : value)
                .map(value => value.endsWith(".md") ? value.substring(0, value.length-".md".length) : value)
                [0]
            }

        >{

            content

        }</ReactMarkdown>

        : status === 404 ? <span>:-( Page Not Found</span>
            : status !== undefined ? <span>{`:-( The Server Says ${status}…`}</span>
                : <NodeSpin/>;


}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// function toc() {
//
//     function rehypeTOC() {
//         return (root: Root) => {
//
//             const slugs=new Slugger();
//
//             slugs.reset();
//
//             return {
//
//                 ...root, children: (root.children).filter((node) => headingRank(node)).map(node => ({
//                     ...node, children: [{
//                         ...node,
//                         type: "element",
//                         tagName: "a",
//                         properties: { href: `#${slugs.slug(toString(node))}` }
//                     }]
//                 }))
//
//             };
//
//         };
//     }
//
//
//     <ReactMarkdown
//
//         remarkPlugins={[remarkFrontmatter]}
//         rehypePlugins={[rehypeTOC]}
//
//     >{
//
//         content
//
//     }</ReactMarkdown>;
//
// }


