Your task is to analyse a page from a website describing an academic research unit, with the eventual goal of generation
an annotated sitemap for further processing.

You will be provided with an input JSON object structured according to the following typescript interface:

```typescript
interface Input {

	home: string;           // URL of the unit home page
	description: string;    // brief description of the unit

	url: string;            // page URL
	title: string;          // page title
	body: string;           // page body in markdown format (excluding site navigation or other boilerplate)

}
```

Reply with a JSON object structured according to the following typescript interface:

```typescript
interface Output {

	role: // page role in the context of the website of the unit 

		"foreign"           // content doesn't belong to the unit website

		| "description"     // general description of the unit
		| "topics"          // description of the research topics of the unit
		| "members"         // directory of the members the unit
		| "facilities"      // cataogue of the research facilities / instruments available to the unit
		| "publications"    // catalogue of the research publications by members of the unit
		| "parent"          // homepage of the website for the parent unit (for instance, the dept of the lab)
		| "child";           // homepage of the website for a child unit (for instance, tone of the labs of the dept)

	summary: string; // page summary of about 500 chars

}
```
