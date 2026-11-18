/*
 * Copyright © 2020-2026 EC2U Alliance
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

import { LabelLength } from "@ec2u/data-shared";
import { Button } from "@metreeca/clay-widgets/button";
import { Form } from "@metreeca/clay-widgets/form";
import { Icon } from "@metreeca/clay-widgets/icon";
import { Infobox } from "@metreeca/clay-widgets/infobox";
import { Input } from "@metreeca/clay-widgets/input";
import { Label } from "@metreeca/clay-widgets/label";
import { Note } from "@metreeca/clay-widgets/note";
import { Select } from "@metreeca/clay-widgets/select";
import { Stack } from "@metreeca/clay-widgets/stack";
import { Strip } from "@metreeca/clay-widgets/strip";
import { Textarea } from "@metreeca/clay-widgets/textarea";
import { useRouter } from "@metreeca/clay/router";
import { opt } from "@metreeca/core";
import { clip } from "@metreeca/core/strings";
import { immutable } from "@metreeca/core/values";
import { useEffect, useState } from "preact/hooks";
import { Page } from "../../widgets/page.js";
import { datasets } from "../index.js";


export const feedback = immutable({

	route: "/about/feedback",
	label: "Feedback",
	glyph: Icon.MessageSquare

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * The parts of the feedback address: the mailbox first, then the labels of the domain. The address is an alias of the
 * alliance domain, forwarding feedback to the hub team. It is assembled only on submission, so it never stands whole in
 * the page or in its scripts, which keeps it out of reach of the harvesters that collect addresses for spam.
 */
const Recipient: readonly string[] = ["hub", "ec2u", "cc"];


/**
 * The kinds of feedback a reader can give. Each kind has a label, a prompt for its message and its own detail fields;
 * the reader must fill in every required detail field before submitting the feedback, while the others stay optional.
 */
const Types = {

	general: {
		label: "General",
		prompt: "What would you like to share about the hub?",
		fields: []
	},

	ai: {
		label: "AI Content",
		prompt: "What is wrong or misleading in the AI-generated content?",
		fields: [
			{
				key: "wrong",
				label: "Wrong Content",
				required: false,
				placeholder: "Which content is wrong, as the page shows it?"
			},
			{
				key: "correct",
				label: "Expected Content",
				required: false,
				placeholder: "What should the content say instead?"
			}
		]
	},

	data: {
		label: "Data Error",
		prompt: "What is wrong or outdated in the content?",
		fields: []
	},

	bug: {
		label: "Bug",
		prompt: "What is the problem?",
		fields: [
			{
				key: "steps",
				label: "Steps to Reproduce",
				required: true,
				placeholder: "What did you do before the problem appeared?"
			},
			{
				key: "expected",
				label: "Expected Behaviour",
				required: true,
				placeholder: "What should the hub show or do?"
			},
			{
				key: "actual",
				label: "Actual Behaviour",
				required: true,
				placeholder: "What does the hub show or do instead?"
			},
			{
				key: "notes",
				label: "Notes",
				required: false,
				placeholder: "What else could help track the problem down?"
			}
		]
	},

	suggestion: {
		label: "Suggestion",
		prompt: "What would you like the hub to offer?",
		fields: []
	},

	question: {
		label: "Question",
		prompt: "What would you like to know about the hub or its data?",
		fields: []
	}

};

/**
 * The browser and operating system the page is shown on, stated in bug reports to help track the problem down.
 */
const Environment = {
	Browser: detect([
		["Edge", /Edg\/([\d.]+)/],
		["Opera", /OPR\/([\d.]+)/],
		["Firefox", /Firefox\/([\d.]+)/],
		["Chrome", /Chrome\/([\d.]+)/],
		["Safari", /Version\/([\d.]+).*Safari/]
	]),
	System: detect([
		["Windows", /Windows NT ([\d.]+)/],
		["Android", /Android ([\d.]+)/],
		["iOS", /OS ([\d_]+) like Mac OS X/],
		["macOS", /Mac OS X ([\d_]+)/],
		["Linux", /Linux/]
	])
};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates the feedback page.
 *
 * Lets the reader report a problem, ask a question or make a suggestion, either about the page they came from, named
 * by the `source` and `title` query parameters, or about the hub as a whole where the page was opened without them.
 * The `type` query parameter preselects the kind of feedback, such as `ai` for AI-generated content.
 */
export function Feedback() {

	const query = new URLSearchParams(location.search);
	const preset = query.get("type");

	const page = opt(query.get("source") || undefined, source => ({ source, title: query.get("title") || source }));

	const router = useRouter();

	const [type, setType] = useState<keyof typeof Types>(isType(preset) ? preset : "general");
	const [subject, setSubject] = useState(page?.title ?? "");
	const [message, setMessage] = useState("");
	const [details, setDetails] = useState<Readonly<Record<string, string>>>({});
	const [valid, setValid] = useState(false);
	const [sent, setSent] = useState(false);

	const { label: kind, prompt, fields } = Types[type];

	// the form validates a field only once the reader edits it: the detail fields shown after switching the type are
	// still untouched, so their required values are checked here as well, ahead of submission

	const complete = fields.every(({ key, required }) => !required || details[key]?.trim());

	const environment = type === "bug" ? Environment : {};

	useEffect(() => router({ title: feedback.label }), []);

	return <Page

		head={<Strip align={"center"} space={"spacing050"}>
			{!sent && <Button icon={<Icon.Send/>} title={"Submit"} disabled={!valid || !complete} onClick={submit}/>}
		</Strip>}

		tray={!sent && <Stack space={"spacing075"}>

            <p style={{

				whiteSpace: "pre-line"

			}}>

                Submitting opens your email{"\n"}
                client with the feedback ready to{"\n"}
                send to the hub team. Feedback{"\n"}
                is accepted only from EC2U{"\n"}
                partner university accounts.

            </p>

            <Infobox>{[environment]}</Infobox>

        </Stack>}

		menu={<Button icon={<Icon.Dismiss/>} title={"Dismiss"} onClick={leave}/>}

		more={null}

	>{sent

		? <Note level={"positive"} text={"Feedback Ready to Send"}>
			<div style={{ whiteSpace: "normal", width: "min-content" }}> {/* ;(hack) as wide as its longest clause */}
				Thank you for your feedback.<br/>
				<span style={{ whiteSpace: "nowrap" }}>Please send the email that just opened,</span>{" "}
				<span style={{ whiteSpace: "nowrap" }}>using your EC2U university account.</span><br/>
				<span style={{ whiteSpace: "nowrap" }}>We will contact you if we need more details.</span>
			</div>
		</Note>

		: <Form grow onValidate={setValid}>

			<Stack grow space={"spacing100"}>

				<Strip align={"end"} space={"spacing075"}>

					<Label>
						Type
						<Select
							options={Object.fromEntries(Object.entries(Types).map(([type, { label }]) =>
								[type, label]
							)) as Record<keyof typeof Types, string>} // ;(cast) entries keep the keys of Types
							value={type}
							onChange={setType}
						/>
					</Label>

					<Label grow>
						Subject
						<Input
							readonly={page !== undefined}
							required
							placeholder={"What is your feedback about?"}
							value={subject}
							onChange={setSubject}
						/>
					</Label>

				</Strip>

				<Label grow>
					Message
					<Textarea
						required
						rows={5}
						placeholder={prompt}
						value={message}
						onChange={setMessage}
					/>
				</Label>

				{fields.map(({ key, label, required, placeholder }) =>
					<Label key={key}>
						{label}
						<Textarea
							required={required}
							rows={5}
							placeholder={placeholder}
							value={details[key] ?? ""}
							onChange={value => setDetails(details => ({ ...details, [key]: value }))}
						/>
					</Label>
				)}

			</Stack>

		</Form>

	}</Page>;


	/**
	 * Hands the feedback over to the email client of the reader, addressed to the {@link Recipient}.
	 */
	function submit() {

		const facts = Object.entries({
			Type: kind,
			Page: page && `${page.title} <${page.source}>`,
			...environment
		}).flatMap(([name, value]) => value ? [`${name}: ${value}`] : []);

		const sections = [
			message.trim(),
			...fields.flatMap(({ key, label }) =>
				opt(details[key]?.trim() || undefined, text => [`${label}\n\n${text}`]) ?? []
			)
		];

		const topic = subject.trim();
		const title = `EC2U / KH / ${kind} feedback${topic ? ` / ${clip(topic, LabelLength)}` : ""}`;
		const body = [facts.join("\n"), ...sections].join("\n\n");

		const [mailbox, ...domain] = Recipient;

		const query = `subject=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;

		location.href = `mailto:${mailbox}@${domain.join(".")}?${query}`;

		setSent(true);

	}

	/**
	 * Closes the feedback tab once the reader dismisses it.
	 *
	 * Browsers keep open a tab that no script opened, such as one reached by typing the address of the feedback page.
	 * In that case the tab moves on to the page the feedback is about, or to the home page if there is none.
	 */
	function leave() {

		window.close();

		router({ route: page?.source ?? datasets.route, replace: true });

	}

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Checks whether a value names one of the kinds of feedback the page offers.
 */
function isType(value: unknown): value is (keyof typeof Types) {
	return typeof value === "string" && Object.hasOwn(Types, value);
}

/**
 * Names the first product whose pattern matches the user agent string, along with the version the pattern captures.
 */
function detect(products: readonly (readonly [string, RegExp])[]): string {
	return products.reduce<string | undefined>((found, [name, pattern]) => found ?? opt(
		navigator.userAgent.match(pattern) ?? undefined,
		([, version = ""]) => `${name} ${version.replaceAll("_", ".")}`.trim()
	), undefined) ?? "Unknown";
}
