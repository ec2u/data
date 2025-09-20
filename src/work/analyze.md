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
	links: Link[];          // page links (including links from site navigation or other boilerplate)

}

interface Link {

	href: string            // URL of the linked page
	text?: string           // linking text

}
```

Reply with a JSON object structured according to the following typescript interface:

```typescript
interface Output {

	// page analysis
	// generate only if the current page is VERY likely to belong to the website of the unit

	page?: {

		role: // page role in the context of the website of the unit 

			"description"       // general description of the unit
			| "topics"          // description of the research topics of the unit
			| "members"         // directory of the members the unit
			| "facilities"      // cataogue of the research facilities / instruments available to the unit
			| "publications"    // catalogue of the research publications by members of the unit
			| "parent"          // homepage of the website for the parent unit (for instance, the dept of the lab)
			| "child"           // homepage of the website for a child unit (for instance, tone of the labs of the dept)

		summary: string // page summary of about 500 chars

	};

	// URLs of linked pages VERY likely to belong to the website of the unit or one of its parent/children units
	// generate only if not empty

	next?: string[];

}
```

Take ALWAYS into account the following CRITICAL issues:

- **layout variability** / unit websites may be structured in different ways:
    - **single-page**: all information contained on homepage
    - **multi-page**: landing page with dedicated subpages for specific information,
      with relevant content potentially distributed across multiple interconnected pages
- **embedding** / unit websites could be embedded within a larger site (for instance, multiple pages describing a
  laboratory and its facilities in the context of a department website)
- **unstructured URLs** / URLs are not required to have a hierarchical structure ( for instance, CMS-generated URLs like
  `https://example.edu/page=123`)
- **mixed navigation links** / linked pages could include relevant subpages mixed with external resources and parent
  institution links included in page templates
